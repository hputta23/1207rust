use serde::Deserialize;
use std::error::Error;
use chrono::NaiveDateTime;

#[derive(Deserialize, Debug)]
pub struct YahooResponse {
    pub chart: Chart,
}

#[derive(Deserialize, Debug)]
pub struct Chart {
    pub result: Vec<ResultObj>,
}

#[derive(Deserialize, Debug)]
pub struct ResultObj {
    pub timestamp: Vec<i64>,
    pub indicators: Indicators,
    pub meta: Meta,
}

#[derive(Deserialize, Debug)]
pub struct Meta {
    pub regularMarketPrice: f64,
}

#[derive(Deserialize, Debug)]
pub struct Indicators {
    pub quote: Vec<Quote>,
}

#[derive(Deserialize, Debug)]
pub struct Quote {
    pub close: Vec<Option<f64>>, // Yahoo sometimes sends nulls
    pub open: Vec<Option<f64>>,
    pub high: Vec<Option<f64>>,
    pub low: Vec<Option<f64>>,
    pub volume: Vec<Option<u64>>,
}

// Simplified internal struct
pub struct HistoricalData {
    pub close: Vec<f64>,
    pub dates: Vec<String>,
    pub current_price: f64,
}

pub async fn fetch_ticker_data(ticker: &str) -> Result<HistoricalData, Box<dyn Error>> {
    let url = format!(
        "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=2y",
        ticker
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await?
        .json::<YahooResponse>()
        .await?;

    // Parse Response
    let result = &resp.chart.result[0];
    let timestamps = &result.timestamp;
    let quotes = &result.indicators.quote[0];
    let closes = &quotes.close;
    
    let mut clean_closes = Vec::new();
    let mut clean_dates = Vec::new();

    // Filter out nulls
    for (i, price_opt) in closes.iter().enumerate() {
        if let Some(price) = price_opt {
            clean_closes.push(*price);
            
            // Format Timestamp
            if let Some(ts) = timestamps.get(i) {
                if let Some(dt) = NaiveDateTime::from_timestamp_opt(*ts, 0) {
                     clean_dates.push(dt.format("%Y-%m-%dT%H:%M:%S").to_string());
                }
            }
        }
    }

    Ok(HistoricalData {
        close: clean_closes,
        dates: clean_dates,
        current_price: result.meta.regularMarketPrice,
    })
}
