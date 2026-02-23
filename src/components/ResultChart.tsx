import React from 'react';
import { Chart as ChartJS } from 'chart.js';
import { Chart } from 'react-chartjs-2';

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
    }[];
    title?: string;
}

export default function ResultChart({ labels, datasets, title }: ResultChartProps) {
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
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value: any) {
                        if (value >= 10000) {
                            return (value / 10000) + '万円';
                        }
                        return value;
                    }
                }
            }
        }
    };

    return (
        <div className="chart-container">
            <Chart type='line' options={options} data={{ labels, datasets: datasets as any }} />
        </div>
    );
}
