import { useState, useEffect } from 'react';
import { screenerService, type ScreenerFilters as FilterType } from '../../services/screener-service';

interface Props {
    filters: FilterType;
    onFilterChange: (filters: FilterType) => void;
}

export function ScreenerFilters({ filters, onFilterChange }: Props) {
    const sectors = screenerService.getSectors();

    const handleSectorToggle = (sector: string) => {
        const current = filters.sector || [];
        const updated = current.includes(sector)
            ? current.filter(s => s !== sector)
            : [...current, sector];
        onFilterChange({ ...filters, sector: updated.length ? updated : undefined });
    };

    return (
        <div style={{
            width: '300px',
            background: '#1a1a2e',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: '100%',
        }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Filters</h2>

            {/* Market Cap */}
            <FilterSection title="Market Cap">
                <select
                    value={filters.marketCap || ''}
                    onChange={(e) => onFilterChange({ ...filters, marketCap: e.target.value as any || undefined })}
                    style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        padding: '8px',
                        borderRadius: '6px',
                        outline: 'none',
                    }}
                >
                    <option value="">All Caps</option>
                    <option value="mega">Mega Cap ($200B+)</option>
                    <option value="large">Large Cap ($10B-$200B)</option>
                    <option value="mid">Mid Cap ($2B-$10B)</option>
                    <option value="small">Small Cap ($300M-$2B)</option>
                    <option value="micro">Micro Cap (&lt;$300M)</option>
                </select>
            </FilterSection>

            {/* Sector */}
            <FilterSection title="Sector">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sectors.map(sector => (
                        <label key={sector} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={filters.sector?.includes(sector) || false}
                                onChange={() => handleSectorToggle(sector)}
                                style={{ accentColor: '#3b82f6' }}
                            />
                            {sector}
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="number"
                        placeholder="Min"
                        value={filters.priceMin || ''}
                        onChange={(e) => onFilterChange({ ...filters, priceMin: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                    />
                    <span style={{ color: '#666' }}>-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.priceMax || ''}
                        onChange={(e) => onFilterChange({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                    />
                </div>
            </FilterSection>

            {/* Valuation */}
            <FilterSection title="Valuation (P/E)">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="number"
                        placeholder="Min P/E"
                        value={filters.peMin || ''}
                        onChange={(e) => onFilterChange({ ...filters, peMin: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                    />
                    <input
                        type="number"
                        placeholder="Max P/E"
                        value={filters.peMax || ''}
                        onChange={(e) => onFilterChange({ ...filters, peMax: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                    />
                </div>
            </FilterSection>

            {/* Dividend Yield */}
            <FilterSection title="Dividend Yield %">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>&gt;</span>
                    <input
                        type="number"
                        placeholder="Min Yield"
                        value={filters.divYieldMin || ''}
                        onChange={(e) => onFilterChange({ ...filters, divYieldMin: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                    />
                </div>
            </FilterSection>

            {/* Reset Button */}
            <button
                onClick={() => onFilterChange({})}
                style={{
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    marginTop: 'auto',
                }}
            >
                Reset Filters
            </button>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '8px',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '13px',
};

function FilterSection({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isOpen ? '12px' : '0',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{title}</h3>
                <span style={{ fontSize: '12px', color: '#666' }}>{isOpen ? '▼' : '▶'}</span>
            </div>
            {isOpen && children}
        </div>
    );
}
