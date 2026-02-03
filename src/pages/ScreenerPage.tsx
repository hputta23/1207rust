import { useState, useMemo } from 'react';
import { ScreenerFilters } from '../components/Screener/ScreenerFilters';
import { ScreenerResults } from '../components/Screener/ScreenerResults';
import { screenerService, type ScreenerFilters as FilterType } from '../services/screener-service';

export function ScreenerPage() {
    const [filters, setFilters] = useState<FilterType>({});

    const filteredStocks = useMemo(() => {
        return screenerService.getStocks(filters);
    }, [filters]);

    return (
        <div style={{
            display: 'flex',
            height: '100vh', // Full height
            overflow: 'hidden', // Prevent body scroll
        }}>
            {/* Filter Sidebar */}
            <ScreenerFilters filters={filters} onFilterChange={setFilters} />

            {/* Main Content */}
            <ScreenerResults stocks={filteredStocks} />
        </div>
    );
}
