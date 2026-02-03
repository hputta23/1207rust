import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi, type Time, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { Theme, Candle } from '../../core/renderer/types';
import { TimeSyncManager } from '../../core/synchronization/time-sync-manager';

interface IndicatorDataItem {
    id: string;
    name: string;
    color: string;
    points: { x: number; y: number; defined: boolean }[];
}

interface ChartContainerProps {
    id: string;
    width: number;
    height: number;
    theme: Theme;
    syncManager?: TimeSyncManager;
    data: Candle[];
    indicatorData?: {
        indicatorList?: IndicatorDataItem[];
    };
    initialTransform?: any; // Add missing prop definition to avoid errors
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
    id,
    width,
    height,
    theme,
    syncManager,
    data,
    indicatorData
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

    const [error, setError] = React.useState<string | null>(null);

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        try {
            const chart = createChart(chartContainerRef.current, {
                width,
                height,
                layout: {
                    background: { type: ColorType.Solid, color: '#0b0e11' }, // Deep void
                    textColor: '#787b86',
                    attributionLogo: false, // REMOVE TRADINGVIEW SYMBOL
                    fontFamily: "'JetBrains Mono', 'Inter', 'Roboto', sans-serif",
                },
                grid: {
                    vertLines: { color: '#1e222d', style: 1 }, // Dotted
                    horzLines: { color: '#1e222d', style: 1 },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    borderColor: 'rgba(197, 203, 206, 0.1)', // Subtle border
                    barSpacing: 10,
                    minBarSpacing: 3,
                },
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.1)',
                },
                crosshair: {
                    mode: 1, // Magnet
                    vertLine: {
                        color: '#6A5ACD', // Slate Blue crosshair
                        width: 1,
                        style: 3, // Large Dashed
                        labelBackgroundColor: '#6A5ACD',
                    },
                    horzLine: {
                        color: '#6A5ACD',
                        width: 1,
                        style: 3,
                        labelBackgroundColor: '#6A5ACD',
                    },
                },
            });

            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#00E5FF',     // Neon Cyan
                downColor: '#FF2975',   // Neon Pink/Red
                borderVisible: false,
                wickUpColor: '#00E5FF',
                wickDownColor: '#FF2975',
            });

            chartRef.current = chart;
            candleSeriesRef.current = candleSeries;

            // Sync Manager (Time Scale)
            if (syncManager) {
                chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
                    // Determine scale/position manual sync if needed
                });
            }

            return () => {
                chart.remove();
                chartRef.current = null;
            };
        } catch (err) {
            console.error("Failed to initialize chart:", err);
            setError(err instanceof Error ? err.message : 'Unknown chart error');
        }
    }, []); // Run once on mount (or re-mount if container null)


    // 2. Handle Resizing & Theme options
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions({
            width,
            height,
            layout: {
                background: { type: ColorType.Solid, color: '#0b0e11' }, // Keep void theme consistent
                textColor: '#787b86',
            },
        });
    }, [width, height, theme]);


    // 3. Update Data
    useEffect(() => {
        if (!candleSeriesRef.current || data.length === 0) return;

        try {
            // Map Candle[] to Lightweight Charts format
            // timestamps in ms -> seconds (Unix)
            // Ensure data is sorted by time (required by lightweight-charts)
            const chartData = data
                .map(d => ({
                    time: Math.floor(d.timestamp / 1000) as Time,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }))
                .sort((a, b) => (a.time as number) - (b.time as number));

            // Filter out potential duplicates
            const uniqueChartData = [];
            let lastTime: number | null = null;
            for (const item of chartData) {
                if (lastTime !== (item.time as number)) {
                    uniqueChartData.push(item);
                    lastTime = item.time as number;
                }
            }

            // Debug log
            // console.log("Updating Candle Data", uniqueChartData.length);

            candleSeriesRef.current.setData(uniqueChartData);

            // Update Indicators
            if (chartRef.current && indicatorData?.indicatorList) {
                // Clean up existing line series
                indicatorSeriesRefs.current.forEach(series => {
                    try {
                        chartRef.current?.removeSeries(series);
                    } catch (e) {
                        console.warn("Failed to remove series", e);
                    }
                });
                indicatorSeriesRefs.current.clear();

                // Add new
                indicatorData.indicatorList.forEach(ind => {
                    if (!chartRef.current) return;

                    const lineSeries = chartRef.current.addSeries(LineSeries, {
                        color: ind.color,
                        lineWidth: 2,
                        priceLineVisible: false,
                        lastValueVisible: false,
                    });

                    // Map points (index based) to time
                    // Filter first for valid X index and Defined state
                    const validPoints = ind.points.filter(p =>
                        p.defined &&
                        p.x >= 0 &&
                        p.x < data.length &&
                        data[p.x] !== undefined
                    );

                    const lineData = validPoints
                        .map(p => ({
                            time: Math.floor(data[p.x].timestamp / 1000) as Time,
                            value: p.y
                        }))
                        .filter(item => item.value !== undefined && item.value !== null && !isNaN(item.value)) // Double check value
                        .sort((a, b) => (a.time as number) - (b.time as number));

                    // Filter duplicates for line data
                    const uniqueLineData = [];
                    let lastLineTime: number | null = null;
                    for (const item of lineData) {
                        if (lastLineTime !== (item.time as number)) {
                            uniqueLineData.push(item);
                            lastLineTime = item.time as number;
                        }
                    }

                    if (uniqueLineData.length > 0) {
                        lineSeries.setData(uniqueLineData);
                        indicatorSeriesRefs.current.set(ind.id, lineSeries);
                    }
                });
            }
        } catch (err) {
            console.error("Chart data update failed:", err);
            // Don't crash the component
        }

    }, [data, indicatorData]);

    if (error) {
        return <div style={{ color: 'red', padding: 20 }}>Chart Error: {error}</div>;
    }

    return (
        <div
            ref={chartContainerRef}
            style={{ width: '100%', height: '100%' }}
        />
    );
};
