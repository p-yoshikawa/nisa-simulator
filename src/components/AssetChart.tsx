import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

type Props = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
        type?: 'line' | 'bar';
        fill?: boolean;
        borderDash?: number[];
        tension?: number;
    }[];
    title?: string;
};

export default function AssetChart({ labels, datasets, title = "" }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;

            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }

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

            chartRef.current = new Chart(canvas, {
                type: "line",
                data: {
                    labels,
                    datasets: datasets as any,
                },
                options: options as any,
            });
        } catch (e) {
            console.error("AssetChart init failed", e);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [labels, datasets, title]);

    return (
        <div className="chart-container" style={{ position: 'relative', height: '400px', width: '100%' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
