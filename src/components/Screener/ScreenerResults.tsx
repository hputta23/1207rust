import { useState } from 'react';
import { type ScreenerTicker } from '../../services/screener-service';
import { useNavigate } from 'react-router-dom';

interface Props {
    stocks: ScreenerTicker[];
}

type SortField = 'symbol' | 'price' | 'changePercent' | 'marketCap' | 'peRatio' | 'volume';

export function ScreenerResults({ stocks }: Props) {
    const navigate = useNavigate();
    const [sortField, setSortField] = useState<SortField>('marketCap');
    const [sortDesc, setSortDesc] = useState(true);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortField(field);
            setSortDesc(true);
        }
    };

    const sortedStocks = [...stocks].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    });

    const formatNumber = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(2) + 'T';
        if (num >= 1) return num.toFixed(2) + 'B';
        return (num * 1000).toFixed(0) + 'M';
    };

    const formatVolume = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#0b0e11' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Stock Screener <span style={{ fontSize: '16px', color: '#666', fontWeight: 400 }}>({stocks.length} matches)</span>
                </h1>
            </div>

            <div style={{
                background: '#1a1a2e',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Th label="Symbol" field="symbol" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="left" />
                            <Th label="Name" align="left" />
                            <Th label="Sector" align="left" />
                            <Th label="Price" field="price" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="right" />
                            <Th label="Change %" field="changePercent" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="right" />
                            <Th label="Market Cap" field="marketCap" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="right" />
                            <Th label="P/E" field="peRatio" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="right" />
                            <Th label="Volume" field="volume" currentSort={sortField} sortDesc={sortDesc} onSort={handleSort} align="right" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStocks.map(stock => (
                            <tr
                                key={stock.symbol}
                                style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    transition: 'background 0.1s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/charts?symbol=${stock.symbol}`)}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{stock.symbol}</td>
                                <td style={{ padding: '12px 16px', color: '#aaa', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</td>
                                <td style={{ padding: '12px 16px', color: '#ccc' }}>
                                    <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        {stock.sector}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#fff', textAlign: 'right' }}>${stock.price.toFixed(2)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', color: stock.change >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                </td>
                                <td style={{ padding: '12px 16px', color: '#fff', textAlign: 'right' }}>${formatNumber(stock.marketCap)}</td>
                                <td style={{ padding: '12px 16px', color: '#ccc', textAlign: 'right' }}>{stock.peRatio.toFixed(1)}</td>
                                <td style={{ padding: '12px 16px', color: '#888', textAlign: 'right' }}>{formatVolume(stock.volume)}</td>
                            </tr>
                        ))}
                        {sortedStocks.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    No stocks match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Th({ label, field, currentSort, sortDesc, onSort, align = 'left' }: any) {
    return (
        <th
            onClick={() => field && onSort(field)}
            style={{
                padding: '12px 16px',
                textAlign: align as any,
                color: '#888',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                cursor: field ? 'pointer' : 'default',
                userSelect: 'none',
            }}
        >
            {label} {field && currentSort === field && (sortDesc ? '↓' : '↑')}
        </th>
    );
}
