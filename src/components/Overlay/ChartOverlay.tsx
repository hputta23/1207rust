import React from 'react';
import type { CrosshairState } from '../../core/interaction/crosshair-manager';

interface ChartOverlayProps {
    width: number;
    height: number;
    crosshair: CrosshairState | null;
    currentPrice?: number;
    currentPriceY?: number;
}

export const ChartOverlay: React.FC<ChartOverlayProps> = ({ width, height, crosshair, currentPrice, currentPriceY }) => {
    // ... visible check can remain or be slightly adjusted to allow price line even if no crosshair?
    // User probably always wants price line.

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: width,
            height: height,
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            {/* Current Price Line */}
            {currentPrice !== undefined && currentPriceY !== undefined && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: currentPriceY,
                        left: 0,
                        width: '100%',
                        height: 1,
                        background: 'rgba(34, 197, 94, 0.8)', // Green
                        zIndex: 10,
                        borderBottom: '1px dashed rgba(34, 197, 94, 0.5)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: currentPriceY - 10,
                        right: 0,
                        background: '#22c55e',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '2px 0 0 2px',
                        zIndex: 11,
                        fontFamily: 'monospace'
                    }}>
                        {currentPrice.toFixed(2)}
                    </div>
                </>
            )}

            {/* Crosshair Elements - only if visible */}
            {crosshair && crosshair.visible && (
                <>
                    {/* Vertical Line */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: crosshair.x,
                        width: 1,
                        height: height,
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRight: '1px dashed rgba(255, 255, 255, 0.4)'
                    }} />

                    {/* Horizontal Line */}
                    <div style={{
                        position: 'absolute',
                        top: crosshair.y,
                        left: 0,
                        width: width,
                        height: 1,
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderBottom: '1px dashed rgba(255, 255, 255, 0.4)'
                    }} />
                </>
            )}

            {/* Legend / Tooltip */}
            {crosshair && crosshair.visible && crosshair.candle && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: '#ddd',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    display: 'flex',
                    gap: '12px',
                    border: '1px solid #444'
                }}>
                    <>
                        <span style={{ color: crosshair.candle.close >= crosshair.candle.open ? '#4caf50' : '#ff5252' }}>
                            O: {crosshair.candle.open.toFixed(2)}
                        </span>
                        <span style={{ color: crosshair.candle.close >= crosshair.candle.open ? '#4caf50' : '#ff5252' }}>
                            H: {crosshair.candle.high.toFixed(2)}
                        </span>
                        <span style={{ color: crosshair.candle.close >= crosshair.candle.open ? '#4caf50' : '#ff5252' }}>
                            L: {crosshair.candle.low.toFixed(2)}
                        </span>
                        <span style={{ color: crosshair.candle.close >= crosshair.candle.open ? '#4caf50' : '#ff5252' }}>
                            C: {crosshair.candle.close.toFixed(2)}
                        </span>
                        <span>V: {crosshair.candle.volume}</span>
                    </>
                </div>
            )}
        </div>
    );
};
