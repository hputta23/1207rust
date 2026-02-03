
export interface ScreenerTicker {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number; // in billions
    peRatio: number;
    dividendYield: number;
    volume: number;
    beta: number;
    country: string;
}

export interface ScreenerFilters {
    sector?: string[];
    marketCap?: 'mega' | 'large' | 'mid' | 'small' | 'micro'; // Mega > 200B, Large > 10B, Mid > 2B, Small > 300M, Micro < 300M
    priceMin?: number;
    priceMax?: number;
    peMin?: number;
    peMax?: number;
    divYieldMin?: number;
    performance?: 'up' | 'down' | 'all';
}

class ScreenerService {
    private mockData: ScreenerTicker[] = [];
    private isInitialized = false;

    private sectors = [
        'Technology', 'Healthcare', 'Financial', 'Consumer Discretionary',
        'Communication Services', 'Industrials', 'Consumer Staples',
        'Energy', 'Utilities', 'Real Estate', 'Materials'
    ];

    private industries: Record<string, string[]> = {
        'Technology': ['Software - Infrastructure', 'Consumer Electronics', 'Semiconductors', 'Software - Application'],
        'Healthcare': ['Drug Manufacturers', 'Biotechnology', 'Medical Devices', 'Healthcare Plans'],
        'Financial': ['Banks - Diversified', 'Credit Services', 'Asset Management', 'Insurance'],
        'Consumer Discretionary': ['Internet Retail', 'Auto Manufacturers', 'Restaurants', 'Apparel'],
        'Energy': ['Oil & Gas Integrated', 'Oil & Gas E&P', 'Oil & Gas Midstream'],
        // ... simplistic mapping
    };

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (this.isInitialized) return;

        // 1. Add some real mega caps for realism
        this.addStock('AAPL', 'Apple Inc.', 'Technology', 180.50, 2800, 28.5, 0.55);
        this.addStock('MSFT', 'Microsoft Corp.', 'Technology', 420.00, 3100, 35.2, 0.71);
        this.addStock('NVDA', 'NVIDIA Corp.', 'Technology', 900.00, 2200, 75.5, 0.02);
        this.addStock('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 185.00, 1900, 60.1, 0);
        this.addStock('GOOGL', 'Alphabet Inc.', 'Communication Services', 170.00, 1750, 25.8, 0);
        this.addStock('META', 'Meta Platforms', 'Communication Services', 500.00, 1200, 30.1, 0.40);
        this.addStock('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 200.00, 650, 45.0, 0);
        this.addStock('JPM', 'JPMorgan Chase', 'Financial', 195.00, 560, 11.5, 2.3);
        this.addStock('XOM', 'Exxon Mobil', 'Energy', 115.00, 450, 12.8, 3.2);
        this.addStock('JNJ', 'Johnson & Johnson', 'Healthcare', 155.00, 370, 16.2, 2.9);

        // 2. Generate random stocks to fill 200+
        for (let i = 0; i < 200; i++) {
            this.generateRandomStock(i);
        }

        this.isInitialized = true;
    }

    private addStock(symbol: string, name: string, sector: string, price: number, mCap: number, pe: number, div: number) {
        const change = (Math.random() - 0.5) * (price * 0.05); // +/- 2.5% move
        const changeP = (change / price) * 100;

        this.mockData.push({
            symbol,
            name,
            sector,
            industry: this.getRandomIndustry(sector),
            price,
            change,
            changePercent: changeP,
            marketCap: mCap,
            peRatio: pe,
            dividendYield: div,
            volume: 1000000 + Math.random() * 50000000,
            beta: 0.5 + Math.random() * 1.5,
            country: 'USA'
        });
    }

    private generateRandomStock(index: number) {
        const sector = this.sectors[Math.floor(Math.random() * this.sectors.length)];
        const price = 5 + Math.random() * 500;
        const mCap = 0.3 + Math.random() * (Math.random() > 0.9 ? 200 : 50); // Skew towards smaller, occasional large

        // Generate a fake ticker
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let ticker = '';
        for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) ticker += chars.charAt(Math.floor(Math.random() * chars.length));

        // Ensure uniqueness (simple check)
        if (this.mockData.find(s => s.symbol === ticker)) return;

        this.addStock(
            ticker,
            `${ticker} Holdings`,
            sector,
            price,
            mCap,
            5 + Math.random() * 50, // PE 5-55
            Math.random() > 0.6 ? Math.random() * 5 : 0 // 40% chance of dividend
        );
    }

    private getRandomIndustry(sector: string): string {
        const inds = this.industries[sector] || ['General'];
        return inds[Math.floor(Math.random() * inds.length)];
    }

    public getStocks(filters: ScreenerFilters): ScreenerTicker[] {
        return this.mockData.filter(stock => {
            // Sector Filter
            if (filters.sector && filters.sector.length > 0 && !filters.sector.includes(stock.sector)) return false;

            // Market Cap Filter
            if (filters.marketCap) {
                switch (filters.marketCap) {
                    case 'mega': if (stock.marketCap < 200) return false; break;
                    case 'large': if (stock.marketCap < 10 || stock.marketCap >= 200) return false; break;
                    case 'mid': if (stock.marketCap < 2 || stock.marketCap >= 10) return false; break;
                    case 'small': if (stock.marketCap < 0.3 || stock.marketCap >= 2) return false; break;
                    case 'micro': if (stock.marketCap >= 0.3) return false; break;
                }
            }

            // Price Filter
            if (filters.priceMin !== undefined && stock.price < filters.priceMin) return false;
            if (filters.priceMax !== undefined && stock.price > filters.priceMax) return false;

            // PE Filter
            if (filters.peMin !== undefined && stock.peRatio < filters.peMin) return false;
            if (filters.peMax !== undefined && stock.peRatio > filters.peMax) return false;

            // Dividend Filter
            if (filters.divYieldMin !== undefined && stock.dividendYield < filters.divYieldMin) return false;

            // Performance Filter
            if (filters.performance === 'up' && stock.change < 0) return false;
            if (filters.performance === 'down' && stock.change > 0) return false;

            return true;
        });
    }

    public getSectors(): string[] {
        return this.sectors;
    }
}

export const screenerService = new ScreenerService();
