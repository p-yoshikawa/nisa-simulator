import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

interface ResultChartProps {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
        type?: 'line' | 'bar';
        fill?: boolean;
        stack?: string;
        borderDash?: number[];
        tension?: number;
    }[];
    title?: string;
}

export default function ResultChart({ labels, datasets, title }: ResultChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<ChartJS | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !canvasRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index' as const,
                intersect: false,
            },
            plugins: {
                title: {
                    display: !!title,
                    text: title,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 16,
                        weight: 'bold' as const
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value: any) {
                            if (value >= 10000) return (value / 10000) + '万円';
                            return value;
                        }
                    }
                }
            }
        };

        chartInstance.current = new ChartJS(ctx, {
            type: 'line',
            data: { labels, datasets: datasets as any },
            options: options as any
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [labels, datasets, title]);

    return (
        <div className="chart-container" style={{ position: 'relative', height: '400px', width: '100%' }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}
