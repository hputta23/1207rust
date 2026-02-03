import { DataNormalizer } from '../core/data/normalizer';
import type { Candle } from '../core/renderer/types';
import type { DataSourceType } from './data-source-config';
import { BASE_URL } from './api-client';

type DataListener = (data: Candle[]) => void;

export interface DataServiceConfig {
    dataSource: DataSourceType;
    apiKey?: string;
}

export class DataService {
    private listeners = new Set<DataListener>();
    private intervalId: any = null;
    private currentCandles: Candle[] = [];
    private lastPrice = 1000;
    private lastFetchTime = 0;
    private fetchRetryCount = 0;
    private maxRetries = 3;

    // Config
    private updateRateMs = 100; // 100ms updates
    private candleIntervalMs = 1000; // 1s candles for testing

    private isStatic = false;
    private config: DataServiceConfig;

    private symbol = 'SPY';

    constructor(useStaticData = false, _symbol = 'SPY', config?: DataServiceConfig) {
        this.isStatic = useStaticData;
        this.symbol = _symbol;
        this.config = config || { dataSource: 'yahoo' };

        if (this.isStatic) {
            this.generateStaticFixture(this.symbol);
        } else {
            // Start with mock data, will be replaced by fetchHistory
            this.generateInitialHistory(this.symbol);
            this.startPolling(_symbol);
        }
    }

    private getBasePrice(symbol: string): number {
        switch (symbol) {
            case 'SPY': return 500.0;
            case 'QQQ': return 400.0;
            case 'NVDA': return 900.0;
            case 'AAPL': return 180.0;
            case 'TSLA': return 200.0;
            case 'AMD': return 160.0;
            case 'MSFT': return 420.0;
            case 'AMZN': return 180.0;
            case 'GOOGL': return 170.0;
            default: return 100.0;
        }
    }

    private getRangeForInterval(interval: string): string {
        switch (interval) {
            case '1m': return '1d';
            case '5m': return '5d'; // 5 days of 5m data is good context
            case '15m': return '5d';
            case '30m': return '1mo';
            case '1h': return '1y'; // Increased from 1mo
            case '1d': return '5y'; // Increased from 1y
            case '1wk': return 'max'; // Increased from 5y
            case '1mo': return 'max';
            default: return '1mo';
        }
    }

    public updateConfig(config: DataServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch historical data from selected data source
     * Falls back to mock data if API fails
     */
    public async fetchHistory(symbol: string, interval = '5m', range?: string): Promise<void> {
        this.symbol = symbol; // Update current symbol
        // ... rest of method
        const now = Date.now();

        // Prevent too frequent refetches (rate limiting)
        // Reduced to 2s to feel snappier when switching timeframes
        if (now - this.lastFetchTime < 2000) {
            // console.log('Skipping fetch - too soon after last fetch');
            // return;
        }

        // Auto-select range if not provided
        if (!range) {
            range = this.getRangeForInterval(interval);
        }

        try {
            this.lastFetchTime = now;
            let history: any[] = [];

            // Use backend for all data sources (since backend handles Yahoo proxying via /history)
            if (this.config.dataSource === 'yahoo') {
                // history = await this.fetchFromYahoo(symbol, interval, range!);
                // Use backend history endpoint instead which wraps Yahoo
                history = await this.fetchFromBackendWithInterval(symbol, interval, range!);
            }
            // Use backend for other data sources
            else {
                history = await this.fetchFromBackendWithInterval(symbol, interval, range!);
            }

            if (history.length === 0) {
                throw new Error('No valid candles in response');
            }

            // Stop simulation and replace with real data
            this.stop();
            this.currentCandles = DataNormalizer.normalizeArray(history);
            this.lastPrice = history[history.length - 1].c;
            this.fetchRetryCount = 0; // Reset retry count on success
            this.notifyListeners();

            console.log(`✅ Loaded ${history.length} candles for ${symbol} from ${this.config.dataSource}`);

            // Start live updates simulation (approximates real-time updates)
            this.startPolling(symbol);

        } catch (error) {
            console.error(`❌ Failed to fetch data for ${symbol} from ${this.config.dataSource}:`, error);

            // Retry logic
            if (this.fetchRetryCount < this.maxRetries) {
                this.fetchRetryCount++;
                const retryDelay = Math.pow(2, this.fetchRetryCount) * 1000; // Exponential backoff
                console.log(`Retrying in ${retryDelay}ms... (attempt ${this.fetchRetryCount}/${this.maxRetries})`);

                setTimeout(() => {
                    this.fetchHistory(symbol, interval, range);
                }, retryDelay);
            } else {
                console.log(`⚠️ Max retries reached. Falling back to mock data for ${symbol}`);
                this.fetchRetryCount = 0;

                // Fallback to mock data
                this.stop();
                this.generateStaticFixture(symbol);
            }
        }
    }
    /**
     * Get raw historical data without affecting internal state (Chart)
     */
    public async getHistoryData(symbol: string, interval = '1d', range = 'max'): Promise<any[]> {
        try {
            if (this.config.dataSource === 'yahoo') {
                return await this.fetchFromYahoo(symbol, interval, range);
            } else {
                return await this.fetchFromBackend(symbol, range);
            }
        } catch (error) {
            console.warn(`[DataService] Fetch failed for ${symbol}, falling back to mock data.`, error);
            return this.generateMockHistoryForSymbol(symbol);
        }
    }

    private generateMockHistoryForSymbol(symbol: string): any[] {
        const history: any[] = [];
        const now = Date.now();
        const days = 365 * 20; // 20 years of history (increased from 10)
        let price = this.getBasePrice(symbol);

        // Deterministic seed-ish based on symbol char codes
        let seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = days; i >= 0; i--) {
            const time = now - (i * 24 * 60 * 60 * 1000);

            // Add some trend and volatility
            const trend = (i > days / 2) ? 0.05 : -0.02; // Change trend halfway
            const volatility = price * 0.02;
            const change = (random() - 0.48) * volatility; // slight upward bias

            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + (random() * volatility * 0.5);
            const low = Math.min(open, close) - (random() * volatility * 0.5);

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: Math.floor(1000000 + random() * 500000)
            });

            price = close;
            if (price < 10) price = 10; // Prevent negative prices
        }

        return history;
    }

    private async fetchFromYahoo(symbol: string, interval: string, range: string): Promise<any[]> {
        // Use backend proxy to avoid CORS
        const url = `${BASE_URL}/api/yahoo/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Yahoo Finance API returned ${response.status}`);
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
            throw new Error('Invalid data structure from Yahoo Finance');
        }

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        const history: any[] = [];
        for (let i = 0; i < timestamps.length; i++) {
            // Skip incomplete candles
            if (!quote.open[i] || !quote.high[i] || !quote.low[i] || !quote.close[i]) {
                continue;
            }

            history.push({
                t: timestamps[i] * 1000, // Convert to milliseconds
                o: quote.open[i],
                h: quote.high[i],
                l: quote.low[i],
                c: quote.close[i],
                v: quote.volume?.[i] || 0,
            });
        }

        return history;
    }

    private async fetchFromBackend(symbol: string, range: string): Promise<any[]> {
        return this.fetchFromBackendWithInterval(symbol, '1d', range);
    }

    private async fetchFromBackendWithInterval(symbol: string, interval: string, range: string): Promise<any[]> {
        const response = await fetch(`${BASE_URL}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: symbol,
                period: range, // Backend expects 'period' as range
                interval: interval.toLowerCase(),
                api_source: this.config.dataSource,
                api_key: this.config.apiKey,
            }),
        });

        if (!response.ok) {
            throw new Error(`Backend API returned ${response.status}`);
        }

        const data = await response.json();
        const historyData = data?.history || [];

        return historyData.map((item: any) => ({
            t: new Date(item.date).getTime(), // Backend returns ISO string
            o: item.open,
            h: item.high,
            l: item.low,
            c: item.close,
            v: item.volume,
        }));
    }

    private generateStaticFixture(symbol: string = 'SPY') {
        const history: any[] = [];
        const now = Date.now();
        const count = 50;
        const baseTime = now - (count * this.updateRateMs); // Ends at roughly now
        let price = this.getBasePrice(symbol);

        for (let i = 0; i < count; i++) {
            const time = baseTime + i * this.candleIntervalMs;
            const open = price;
            // Deterministic pattern: Sine wave
            const close = price + Math.sin(i * 0.2) * 5;
            const high = Math.max(open, close) + 2;
            const low = Math.min(open, close) - 1;

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: 100 + i
            });
            price = close;
        }

        this.currentCandles = DataNormalizer.normalizeArray(history);
        this.lastPrice = price;
        this.notifyListeners();
    }

    public subscribe(listener: DataListener): () => void {
        this.listeners.add(listener);
        // Send current state immediately
        listener(this.currentCandles);
        return () => this.listeners.delete(listener);
    }

    private generateInitialHistory(symbol: string = 'SPY') {
        // Generate last 100 candles
        const history: any[] = [];
        const now = Date.now();
        let price = this.getBasePrice(symbol);

        for (let i = 100; i > 0; i--) {
            const time = now - i * this.candleIntervalMs;
            const volatility = price * 0.002; // 0.2% volatility relative to price
            const open = price;
            const close = price + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random();
            const low = Math.min(open, close) - Math.random();

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: Math.floor(Math.random() * 100)
            });
            price = close;
        }

        this.currentCandles = DataNormalizer.normalizeArray(history);
        this.lastPrice = price;
    }

    private startPolling(symbol: string) {
        if (this.intervalId || this.isStatic) return;

        console.log(`📡 Starting real-time polling for ${symbol}`);

        this.intervalId = setInterval(async () => {
            try {
                // Fetch real-time quote
                const quote = await this.fetchQuote(symbol);
                if (!quote) return;

                const now = Date.now();
                // Ensure we have candles to update
                if (this.currentCandles.length === 0) return;

                const currentCandle = this.currentCandles[this.currentCandles.length - 1];
                const newPrice = quote.price;

                // Check if we need a new candle or update existing
                const isNewCandle = now - currentCandle.timestamp > this.candleIntervalMs;

                if (isNewCandle) {
                    // Finalize old candle
                    currentCandle.complete = true;

                    // Create new candle
                    const newCandle: Candle = {
                        timestamp: now,
                        open: newPrice,
                        high: newPrice,
                        low: newPrice,
                        close: newPrice,
                        volume: 0,
                        complete: false
                    };
                    this.currentCandles = [...this.currentCandles, newCandle];
                    // Keep buffer size fixed
                    if (this.currentCandles.length > 500) {
                        this.currentCandles.shift();
                    }
                } else {
                    // Update existing candle
                    const update: Partial<Candle> = {
                        close: newPrice,
                        high: Math.max(currentCandle.high, newPrice),
                        low: Math.min(currentCandle.low, newPrice),
                        // Accumulate volume if available, else ignored
                        complete: false
                    };

                    const updatedCandle = DataNormalizer.mergeUpdate(currentCandle, update);
                    this.currentCandles[this.currentCandles.length - 1] = updatedCandle;
                }

                this.lastPrice = newPrice;
                this.notifyListeners();

            } catch (error) {
                console.warn('Polling failed:', error);
            }
        }, 10000); // Poll every 10 seconds to avoid rate limits
    }

    private async fetchQuote(symbol: string): Promise<any> {
        try {
            const response = await fetch(`${BASE_URL}/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: symbol })
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error('Quote fetch error:', e);
            return null;
        }
    }

    private notifyListeners() {
        // In a real app we might verify if listeners need full array or just updates
        // For React/Immutability, sending new array reference is easiest
        const dataSnapshot = [...this.currentCandles];
        this.listeners.forEach(l => l(dataSnapshot));
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
