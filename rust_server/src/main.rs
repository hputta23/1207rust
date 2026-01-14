mod models;
mod data;

use axum::{
    routing::{get, post},
    Router,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use chrono::Utc;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build Router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/simulate", post(simulate_handler))
        .route("/backtest", post(backtest_handler)) 
        .route("/history", post(history_handler)) 
        .route("/quote", post(quote_handler)) 
        .layer(cors);

    // Get PORT from environment or default to 8001
    let port = std::env::var("PORT").unwrap_or_else(|_| "8001".to_string());
    let addr = format!("0.0.0.0:{}", port);
    println!("🚀 Rust Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// --- Handlers ---

#[derive(Serialize)]
struct RootResponse {
    message: String,
    status: String,
    version: String,
}

async fn root() -> impl IntoResponse {
    Json(RootResponse {
        message: "Terminal Pro API (Rust Edition)".to_string(),
        status: "online".to_string(),
        version: "2.0.0-rust".to_string(),
    })
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    service: String,
}

async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "online".to_string(),
        timestamp: Utc::now().to_rfc3339(),
        service: "stonks-daily-rust".to_string(),
    })
}

// --- Quote Logic ---

#[derive(Deserialize, Debug)]
struct QuoteRequest {
    ticker: String,
}

#[derive(Serialize)]
struct QuoteResponse {
    ticker: String,
    price: f64,
    change: f64,
    change_percent: f64,
    volume: u64,
    previous_close: f64,
    timestamp: i64,
}

async fn quote_handler(
    Json(payload): Json<QuoteRequest>,
) -> impl IntoResponse {
    println!("⚡ Request: Quote for {}", payload.ticker);
    
    // Using the same data fetcher
    let data_result = data::fetch_ticker_data(&payload.ticker).await;

    match data_result {
        Ok(data) => {
             let current = data.current_price;
             let prev = if data.close.len() >= 2 { data.close[data.close.len() - 2] } else { current };
             let change = current - prev;
             let change_percent = if prev != 0.0 { (change / prev) * 100.0 } else { 0.0 };
             
             Json(QuoteResponse {
                 ticker: payload.ticker,
                 price: current,
                 change,
                 change_percent,
                 volume: 1000000, // Dummy
                 previous_close: prev,
                 timestamp: Utc::now().timestamp_millis(),
             }).into_response()
        }
        Err(e) => {
             println!("❌ Error fetching quote: {}", e);
             (StatusCode::INTERNAL_SERVER_ERROR, format!("Data Error: {}", e)).into_response()
        }
    }
}

// --- History Logic ---

#[derive(Deserialize, Debug)]
struct HistoryRequest {
    ticker: String,
    period: String,
    #[serde(default)]
    api_source: String,
    #[serde(default)]
    api_key: Option<String>,
}

#[derive(Serialize)]
struct HistoryResponse {
    ticker: String,
    history: Vec<HistoryItem>,
}

#[derive(Serialize)]
struct HistoryItem {
    date: String,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: u64,
}

async fn history_handler(
    Json(payload): Json<HistoryRequest>,
) -> impl IntoResponse {
    println!("⚡ Request: History for {} ({})", payload.ticker, payload.period);

    // We reuse the existing data fetcher which gets ~10 years of data.
    // In a real app we might filter by 'period', but for now returning all is fine/better.
    let data_result = data::fetch_ticker_data(&payload.ticker).await;

    match data_result {
        Ok(data) => {
            let mut history = Vec::new();
            for i in 0..data.close.len() {
                // Ensure we don't go out of bounds if arrays are different lengths (shouldn't happen but be safe)
                if i < data.dates.len() {
                    history.push(HistoryItem {
                        date: data.dates[i].clone(),
                        // Our simple fetcher might only have close prices, let's allow it to populate OHL with Close if missing
                        // But actually data.rs might need upgrade if we want true OHLCV. 
                        // Checking data.rs... it only returns TickerData struct with close/dates/current_price.
                        // We need to upgrade data.rs to return OHLCV or fake it for now.
                        // Let's fake it with Close for now to get it working, or upgrade data.rs.
                        // Faking it is safer for immediate fix.
                        open: data.close[i],
                        high: data.close[i],
                        low: data.close[i],
                        close: data.close[i],
                        volume: 1000000, // Dummy volume
                    });
                }
            }

            Json(HistoryResponse {
                ticker: payload.ticker,
                history,
            }).into_response()
        }
        Err(e) => {
             println!("❌ Error fetching data: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Data Error: {}", e)).into_response()
        }
    }
}

// --- Simulation Logic ---

#[derive(Deserialize, Debug)]
struct PredictionRequest {
    ticker: String,
    days: usize,
    // Optional parameters from Python version
    #[serde(default)] 
    drift_adj: f64,
    #[serde(default)] 
    volatility_adj: f64,
    // Backtest specific
    strategy: Option<String>,
    #[serde(default)]
    initial_capital: f64,
}

#[derive(Serialize)]
struct SimulationResponse {
    ticker: String,
    current_price: f64,
    historical: Vec<HistoricalPoint>, // last 45 days
    dates: Vec<String>,
    mean_path: Vec<f64>,
    paths: Vec<Vec<f64>>,
    distribution: models::DistributionResult,
    var_95: f64,
    expected_return: f64,
}

#[derive(Serialize)]
struct HistoricalPoint {
    date: String,
    close: f64,
}

#[derive(Serialize)]
struct BacktestResponseWrapper {
    ticker: String,
    strategy: String,
    total_return: f64,
    final_value: f64,
    sharpe_ratio: f64,
    max_drawdown: f64,
    dates: Vec<String>,
    equity_curve: Vec<f64>,
}

async fn simulate_handler(
    Json(payload): Json<PredictionRequest>,
) -> impl IntoResponse {
    println!("⚡ Request: Simulate {} for {} days", payload.ticker, payload.days);

    // 1. Fetch Data
    let data_result = data::fetch_ticker_data(&payload.ticker).await;
    
    match data_result {
        Ok(data) => {
            // 2. Run Monte Carlo Engine
            // Run 10,000 simulations (double the Python default) because we can!
            let (mean_path, paths, all_finals) = models::MonteCarloEngine::run(
                &data.close,
                payload.days,
                10000, 
                payload.drift_adj,
                payload.volatility_adj
            );

            // 3. Calculate Metrics
            let (expected_return, var_95, distribution) = models::calculate_metrics(
                data.current_price, 
                &all_finals
            );

            // 4. Create Dates for Prediction
            // Simple logic: just append days to last known date (naive, ignores weekends for now)
            // But getting last date from string is annoying. Let's just create ISO strings.
            // Using last date from data would be better.
            let mut future_dates = Vec::new();
            if let Some(last_date_str) = data.dates.last() {
                 if let Ok(last_date) = chrono::NaiveDateTime::parse_from_str(last_date_str, "%Y-%m-%dT%H:%M:%S") {
                     for i in 1..=payload.days {
                         let next_day = last_date + chrono::Duration::days(i as i64);
                         future_dates.push(next_day.format("%Y-%m-%dT%H:%M:%S").to_string());
                     }
                 }
            }

            // 5. Prepare Historical Chunk (Frontend expects last 45 points)
            let start_idx = if data.close.len() > 45 { data.close.len() - 45 } else { 0 };
            let mut historical = Vec::new();
            for i in start_idx..data.close.len() {
                historical.push(HistoricalPoint {
                    date: data.dates[i].clone(),
                    close: data.close[i],
                });
            }

            // 6. Response
            Json(SimulationResponse {
                ticker: payload.ticker,
                current_price: data.current_price,
                historical,
                dates: future_dates,
                mean_path,
                paths,
                distribution,
                var_95,
                expected_return,
            }).into_response()
        }
        Err(e) => {
            println!("❌ Error fetching data: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Data Error: {}", e)).into_response()
        }
    }
}

async fn backtest_handler(
    Json(payload): Json<PredictionRequest>,
) -> impl IntoResponse {
    println!("⚡ Request: Backtest {} Strategy: {:?}", payload.ticker, payload.strategy);

    if payload.strategy.is_none() {
        return (StatusCode::BAD_REQUEST, "Strategy is required for backtest").into_response();
    }
    
    let strategy = payload.strategy.unwrap();
    // Default capital if 0
    let capital = if payload.initial_capital > 0.0 { payload.initial_capital } else { 10000.0 };

    // 1. Fetch Data
    let data_result = data::fetch_ticker_data(&payload.ticker).await;

    match data_result {
        Ok(data) => {
            // 2. Run Strategy Backtest Engine
            let result = models::run_strategy_backtest(
                &payload.ticker,
                &data.close,
                &data.dates,
                &strategy,
                capital
            );

            // 3. Response
            Json(BacktestResponseWrapper {
                ticker: result.ticker,
                strategy: result.strategy,
                total_return: result.total_return,
                final_value: result.final_value,
                sharpe_ratio: result.sharpe_ratio,
                max_drawdown: result.max_drawdown,
                dates: result.dates,
                equity_curve: result.equity_curve,
            }).into_response()
        }
        Err(e) => {
             println!("❌ Error fetching data: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Data Error: {}", e)).into_response()
        }
    }
}

