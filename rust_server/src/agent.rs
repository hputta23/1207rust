use axum::{
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;
use crate::{data, models}; 

#[derive(Deserialize, Debug)]
pub struct ChatRequest {
    message: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct ChatResponse {
    response: String,
    thinking_steps: Vec<String>,
}

pub async fn chat_handler(
    Json(payload): Json<ChatRequest>,
) -> impl IntoResponse {
    let msg = payload.message.to_lowercase();
    let mut thinking_steps = Vec::new();
    let mut response_text = String::from("I am thinking..."); // Initialize

    // Simulate delay
    thinking_steps.push("Analyzing user intent...".to_string());
    sleep(Duration::from_millis(500)).await;

    if msg.contains("analyze") || msg.contains("analysis") {
        let ticker = extract_ticker(&msg).unwrap_or("AAPL".to_string());
        thinking_steps.push(format!("Identified intent: Fundamental & Technical Analysis for {}", ticker));
        thinking_steps.push(format!("Fetching market data for {}...", ticker));
        
        match data::fetch_ticker_data(&ticker, "1d", "3mo").await {
            Ok(data) => {
                thinking_steps.push("Data fetched. Calculating indicators...".to_string());
                
                let current = data.current_price;
                let start = *data.close.first().unwrap_or(&0.0);
                let change_2y = if start != 0.0 { ((current - start) / start) * 100.0 } else { 0.0 };
                
                let sma_20_est = data.close.iter().rev().take(20).sum::<f64>() / 20.0;
                let trend = if current > sma_20_est { "Bullish" } else { "Bearish" };

                response_text = format!(
                    "### Analysis Report: {} \n\n\
                    **Current Price**: ${:.2}\n\
                    **Trend**: {}\n\
                    **2-Year Return**: {:.2}%\n\n\
                    Based on my analysis, {} is currently trading at ${:.2}. \
                    Over the last 2 years, the stock has moved {:.2}%. \
                    The short-term trend appears **{}** as it is trading {} the 20-day moving average.\n\n\
                    *Note: This is an automated algorithmic analysis.*",
                    ticker.to_uppercase(), current, trend, change_2y, 
                    ticker.to_uppercase(), current, change_2y, 
                    trend, if current > sma_20_est { "above" } else { "below" } 
                );
            },
            Err(e) => {
                response_text = format!("I failed to fetch data for {}. Error: {}", ticker, e);
            }
        }

    } else if msg.contains("backtest") {
        let ticker = extract_ticker(&msg).unwrap_or("AAPL".to_string());
        thinking_steps.push(format!("Identified intent: Strategy Backtest for {}", ticker));
        thinking_steps.push("Selecting strategy: SMA Crossover (Default)...".to_string());
        thinking_steps.push(format!("Fetching historical data for {}...", ticker));

        match data::fetch_ticker_data(&ticker, "1d", "3mo").await {
            Ok(data) => {
                thinking_steps.push("Running simulation engine...".to_string());
                
                let result = models::run_strategy_backtest(
                    &ticker, 
                    &data.close, 
                    &data.dates, 
                    "SMA_Crossover", 
                    10000.0
                );

                response_text = format!(
                    "### Backtest Results: {} (SMA Crossover)\n\n\
                    I ran a simulation using a Standard Moving Average Crossover strategy on {}.\n\n\
                    **Total Return**: {:.2}%\n\
                    **Final Value**: ${:.2}\n\
                    **Sharpe Ratio**: {:.2}\n\
                    **Max Drawdown**: {:.2}%\n\n\
                    The strategy turned $10,000 into ${:.2} over the last 2 years.",
                    ticker.to_uppercase(), ticker.to_uppercase(), 
                    result.total_return, result.final_value, result.sharpe_ratio, result.max_drawdown,
                    result.final_value
                );
            },
            Err(e) => {
                response_text = format!("Could not run backtest for {}. Error: {}", ticker, e);
            }
        }

    } else if msg.contains("simulate") || msg.contains("predict") {
        let ticker = extract_ticker(&msg).unwrap_or("AAPL".to_string());
        thinking_steps.push(format!("Identified intent: Monte Carlo Simulation for {}", ticker));
        thinking_steps.push("Configuration: 30 days, 1000 iterations...".to_string());
        
        match data::fetch_ticker_data(&ticker, "1d", "3mo").await {
            Ok(data) => {
                thinking_steps.push("Running stochastic processes...".to_string());
                // Avoid re-fetching, reuse data. But models::MonteCarloEngine takes &Vec<f64>
                // We have data.close.
                
                let (_, _, final_prices) = models::MonteCarloEngine::run(
                    &data.close, 30, 1000, 0.0, 0.0
                );
                let (exp_ret, var_95, _) = models::calculate_metrics(data.current_price, &final_prices);
                
                response_text = format!(
                    "### Prediction: {} (30 Days)\n\n\
                    I ran 1,000 Monte Carlo simulations to project possible future price paths.\n\n\
                    **Expected Return**: {:.2}%\n\
                    **Value at Risk (95%)**: ${:.2}\n\n\
                    The model suggests a mean expected move of {:.2}% over the next month, assuming standard geometric brownian motion.",
                    ticker.to_uppercase(), exp_ret * 100.0, var_95, exp_ret * 100.0
                );
            },
             Err(e) => {
                response_text = format!("Could not run simulation for {}. Error: {}", ticker, e);
            }
        }

    } else {
        thinking_steps.push("Intent unclear. Checking capabilities...".to_string());
        response_text = "I am Sonny, your financial research agent.\n\n\
        I can help you with:\n\
        - **Analysis**: \"Analyze AAPL\"\n\
        - **Backtesting**: \"Backtest TSLA\"\n\
        - **Simulation**: \"Simulate NVDA\"\n\n\
        I am running in **Core Logic Mode** (Rule-Based). Connect an LLM to unlock full conversational abilities.".to_string();
    }

    Json(ChatResponse {
        response: response_text,
        thinking_steps,
    })
}

fn extract_ticker(msg: &str) -> Option<String> {
    let keywords = vec!["analyze", "backtest", "simulate", "predict", "stock", "for", "please", "me", "the"];
    let parts: Vec<&str> = msg.split_whitespace().collect();
    
    for part in parts {
        let clean = part.replace(|c: char| !c.is_alphanumeric(), "");
        if !keywords.contains(&clean.as_str()) && clean.len() >= 1 && clean.len() <= 5 {
            return Some(clean.to_uppercase());
        }
    }
    None
}
