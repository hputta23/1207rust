use rand::prelude::*;
use rand_distr::{Normal, Distribution};
use serde::{Deserialize, Serialize};
use std::f64;

#[derive(Serialize, Deserialize)]
pub struct SimulationResult {
    pub dates: Vec<String>,
    pub mean_path: Vec<f64>,
    pub paths: Vec<Vec<f64>>, // limit to 100 for visual
    pub distribution: DistributionResult,
    pub var_95: f64,
    pub expected_return: f64,
}

#[derive(Serialize, Deserialize)]
pub struct DistributionResult {
    pub bins: Vec<f64>,
    pub counts: Vec<usize>,
}

pub struct MonteCarloEngine;

impl MonteCarloEngine {
    pub fn run(
        prices: &[f64],
        days: usize,
        iterations: usize,
        drift_adj: f64,
        vol_adj: f64,
    ) -> (Vec<f64>, Vec<Vec<f64>>, Vec<f64>) {
        // 1. Calculate Statistics from Historical Data
        let mut log_returns = Vec::with_capacity(prices.len() - 1);
        for i in 1..prices.len() {
            log_returns.push((prices[i] / prices[i - 1]).ln());
        }

        let u = mean(&log_returns);
        let var = variance(&log_returns, u);
        let stdev = var.sqrt();

        // 2. Adjust Parameters
        let drift = u - (0.5 * var);
        let adj_drift = drift + drift_adj;
        let adj_stdev = stdev * (1.0 + vol_adj);
        let adj_stdev = f64::max(0.001, adj_stdev);

        // 3. Simulation Loop
        let last_price = *prices.last().unwrap_or(&100.0);
        let mut rng = rand::thread_rng();
        let normal = Normal::new(0.0, 1.0).unwrap();

        let mut all_final_prices = Vec::with_capacity(iterations);
        let mut paths = Vec::with_capacity(iterations); // Store full paths
        let mut sum_paths = vec![0.0; days];
        
        // Parallelization note: calculating 5000 paths is trivial for Rust, serial is fine for now.
        for _ in 0..iterations {
            let mut path = Vec::with_capacity(days);
            let mut current_price = last_price;

            // First point is usually simpler to not include or include as day 0?
            // Python: mean_path has 'days' elements.
            
            for _ in 0..days {
                // GBM Formula: S_t = S_{t-1} * exp(drift + shock)
                // We assume dt = 1 day
                let shock = adj_stdev * normal.sample(&mut rng);
                let ret = (adj_drift) + shock; // dt=1 implies *1 and sqrt(1)
                
                current_price *= ret.exp();
                path.push(current_price);
            }
            
            all_final_prices.push(current_price);
            paths.push(path);
        }

        // 4. Calculate Mean Path
        for i in 0..days {
            let mut sum = 0.0;
            for path in &paths {
                sum += path[i];
            }
            sum_paths[i] = sum / iterations as f64;
        }

        // limit paths for return (optimization)
        let visual_paths = paths.iter().take(100).cloned().collect();

        (sum_paths, visual_paths, all_final_prices)
    }
}

pub fn calculate_metrics(
    current_price: f64,
    final_prices: &[f64],
) -> (f64, f64, DistributionResult) {
    // Expected Return
    let mean_final = mean(final_prices);
    let expected_return = (mean_final - current_price) / current_price;

    // VaR 95 (Percentile 5)
    let mut sorted = final_prices.to_vec();
    // sort_by needs handling for NaN but we assume no NaNs
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let index_5 = (sorted.len() as f64 * 0.05) as usize;
    let var_95 = sorted[index_5] - current_price;

    // Distribution (Histogram)
    // 20 bins
    let min = sorted.first().unwrap();
    let max = sorted.last().unwrap();
    let range = max - min;
    let bin_width = range / 20.0;
    
    let mut bins = Vec::new();
    let mut counts = vec![0; 20];
    
    for i in 0..20 {
        bins.push(min + (i as f64 * bin_width));
    }
    
    for &price in final_prices {
        let mut bin = ((price - min) / bin_width) as usize;
        if bin >= 20 { bin = 19; } // catch max value
        counts[bin] += 1;
    }

    (expected_return, var_95, DistributionResult { bins, counts })
}

fn mean(data: &[f64]) -> f64 {
    let sum: f64 = data.iter().sum();
    sum / data.len() as f64
}

fn variance(data: &[f64], mean: f64) -> f64 {
    let sum_sq_diff: f64 = data.iter().map(|x| (x - mean).powi(2)).sum();
    sum_sq_diff / (data.len() - 1) as f64
}


// --- Backtesting & Technical Analysis ---

#[derive(Serialize, Deserialize)]
pub struct BacktestResult {
    pub ticker: String,
    pub strategy: String,
    pub total_return: f64,
    pub final_value: f64,
    pub sharpe_ratio: f64,
    pub max_drawdown: f64,
    pub dates: Vec<String>,
    pub equity_curve: Vec<f64>,
}

pub struct TechnicalIndicators {
    pub sma_20: Vec<f64>,
    pub sma_50: Vec<f64>,
    pub rsi: Vec<f64>,
    pub macd: Vec<f64>,
    pub signal: Vec<f64>,
}

pub fn calculate_indicators(prices: &[f64]) -> TechnicalIndicators {
    let sma_20 = calculate_sma(prices, 20);
    let sma_50 = calculate_sma(prices, 50);
    let rsi = calculate_rsi(prices, 14);
    let (macd, signal) = calculate_macd(prices);

    TechnicalIndicators {
        sma_20,
        sma_50,
        rsi,
        macd,
        signal,
    }
}

pub fn run_strategy_backtest(
    ticker: &str,
    prices: &[f64],
    dates: &[String],
    strategy: &str,
    initial_capital: f64
) -> BacktestResult {
    let indicators = calculate_indicators(prices);
    let mut equity_curve = Vec::with_capacity(prices.len());
    let mut cash = initial_capital;
    let mut position = 0.0;
    let commission = 0.001; // 0.1%

    let mut signals = vec![0; prices.len()];

    // Generate Signals
    for i in 1..prices.len() {
        let sig = match strategy {
            "SMA_Crossover" => {
                if indicators.sma_20[i] > indicators.sma_50[i] { 1 } else { 0 }
            },
            "RSI_Strategy" => {
                if indicators.rsi[i] < 30.0 { 1 } 
                else if indicators.rsi[i] > 70.0 { 0 }
                else { signals[i-1] } // Hold previous signal
            },
            "Macd_Strategy" => {
                if indicators.macd[i] > indicators.signal[i] { 1 } else { 0 }
            },
            _ => 0
        };
        signals[i] = sig;
    }

    // Execution Loop (Shifted by 1 day: Signal today -> Trade tomorrow open/close)
    // We assume trading at CLOSE of the signal day for simplicity of this port
    // (Or matches Python logic: signals shifted 1)
    
    // Python Logic: signals = signals.shift(1).
    // So Signal at index `i` is used to trade at index `i`.
    // Meaning the decision made at `i-1` executes at `i`.
    
    for i in 0..prices.len() {
        let price = prices[i];
        
        if i == 0 {
            equity_curve.push(initial_capital);
            continue;
        }

        // Signal from yesterday determines holding today
        let signal = signals[i-1]; 

        if signal == 1 {
            // Enter/Hold Long
            if position == 0.0 {
                // Buy
                let cost = cash * commission;
                let cash_after_comm = cash - cost;
                position = cash_after_comm / price;
                cash = 0.0;
            }
        } else {
            // Exit/Neutral
            if position > 0.0 {
                // Sell
                let sale_val = position * price;
                let cost = sale_val * commission;
                cash = sale_val - cost;
                position = 0.0;
            }
        }

        let current_equity = cash + (position * price);
        equity_curve.push(current_equity);
    }

    // Metrics
    let final_value = *equity_curve.last().unwrap_or(&initial_capital);
    let total_return = (final_value - initial_capital) / initial_capital * 100.0;
    
    // Max Drawdown
    let mut peak = -f64::INFINITY;
    let mut max_dd = 0.0;
    for &val in &equity_curve {
        if val > peak { peak = val; }
        let dd = (val - peak) / peak;
        if dd < max_dd { max_dd = dd; }
    }

    // Sharpe
    // Calculate returns %
    let mut returns = Vec::new();
    for i in 1..equity_curve.len() {
        let ret = (equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1];
        returns.push(ret);
    }
    let mean_ret = mean(&returns);
    let std_ret = variance(&returns, mean_ret).sqrt();
    let sharpe = if std_ret > 0.0 { (mean_ret / std_ret) * (252.0f64).sqrt() } else { 0.0 };

    BacktestResult {
        ticker: ticker.to_string(),
        strategy: strategy.to_string(),
        total_return,
        final_value,
        sharpe_ratio: sharpe,
        max_drawdown: max_dd * 100.0,
        dates: dates.to_vec(),
        equity_curve,
    }
}

// --- Helpers ---

fn calculate_sma(data: &[f64], window: usize) -> Vec<f64> {
    let mut sma = vec![0.0; data.len()];
    for i in 0..data.len() {
        if i < window - 1 {
            sma[i] = data[i]; // Not enough data, just use price or NaN (using price to avoid NaN issues downstream)
            continue;
        }
        let sum: f64 = data[i - (window - 1)..=i].iter().sum();
        sma[i] = sum / window as f64;
    }
    sma
}

fn calculate_ema(data: &[f64], window: usize) -> Vec<f64> {
    let mut ema = vec![0.0; data.len()];
    let k = 2.0 / (window as f64 + 1.0);
    
    // Initialize with SMA
    if data.len() < window { return ema; }
    let first_sma: f64 = data[0..window].iter().sum();
    ema[window-1] = first_sma / window as f64;
    
    for i in window..data.len() {
        ema[i] = (data[i] * k) + (ema[i-1] * (1.0 - k));
    }
    
    // Fill leading zeros
    for i in 0..window-1 {
        ema[i] = data[i];
    }
    ema
}

fn calculate_rsi(data: &[f64], window: usize) -> Vec<f64> {
    let mut rsi = vec![0.0; data.len()];
    if data.len() <= window { return rsi; }
    
    // First avg gain/loss
    // Using simple moving average for first point to match Pandas EWM somewhat? 
    // Pandas EWM usually needs a seed. Standard RSI is Smoothed Moving Average (SMMA) or Wilder's Smoothing.
    // Let's stick to standard Wilder's implementation.
    
    let mut gain_sum = 0.0;
    let mut loss_sum = 0.0;
    
    for i in 1..=window {
        let change = data[i] - data[i-1];
        if change > 0.0 { gain_sum += change; } else { loss_sum += change.abs(); }
    }
    
    let mut avg_gain = gain_sum / window as f64;
    let mut avg_loss = loss_sum / window as f64;
    
    rsi[window] = 100.0 - (100.0 / (1.0 + (avg_gain / avg_loss)));
    
    for i in window+1..data.len() {
        let change = data[i] - data[i-1];
        let gain = if change > 0.0 { change } else { 0.0 };
        let loss = if change < 0.0 { change.abs() } else { 0.0 };
        
        avg_gain = ((avg_gain * (window as f64 - 1.0)) + gain) / window as f64;
        avg_loss = ((avg_loss * (window as f64 - 1.0)) + loss) / window as f64;
        
        if avg_loss == 0.0 {
            rsi[i] = 100.0;
        } else {
            let rs = avg_gain / avg_loss;
            rsi[i] = 100.0 - (100.0 / (1.0 + rs));
        }
    }
    
    // Fill beginning
    for i in 0..window { rsi[i] = 50.0; }
    rsi
}

fn calculate_macd(data: &[f64]) -> (Vec<f64>, Vec<f64>) {
    let ema_12 = calculate_ema(data, 12);
    let ema_26 = calculate_ema(data, 26);
    
    let mut macd_line = vec![0.0; data.len()];
    for i in 0..data.len() {
        macd_line[i] = ema_12[i] - ema_26[i];
    }
    
    let signal_line = calculate_ema(&macd_line, 9);
    (macd_line, signal_line)
}

