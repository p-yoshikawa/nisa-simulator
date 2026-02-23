import React, { useState, useMemo } from 'react';
import '../lib/chart';
import { calcTsumitate, calcWithdraw, calcTaxCompare } from '../lib/calc';
import AssetChart from './AssetChart';

function trackEvent(name: string, params: Record<string, any> = {}) {
    try {
        const gtag = (globalThis as any).gtag;
        if (typeof gtag === "function") gtag("event", name, params);
    } catch (e) { }
}

interface CalculatorFormProps {
    mode: 'tsumitate' | 'withdraw' | 'tax-compare';
}

export default function CalculatorForm({ mode }: CalculatorFormProps) {
    // 共通または個別のステート
    const [amount, setAmount] = useState<string>(mode === 'withdraw' ? '20000000' : '30000'); // 毎月積立額 or 初期資産
    const [returnRate, setReturnRate] = useState<string>('5.0'); // 年利
    const [years, setYears] = useState<string>('20'); // 期間
    const [monthlyWithdraw, setMonthlyWithdraw] = useState<string>('100000'); // 毎月の取り崩し額

    // 計算処理
    const results = useMemo(() => {
        const numAmount = Number(amount) || 0;
        const numReturnRate = Number(returnRate) || 0;
        const numYears = Number(years) || 0;
        const numMonthlyWithdraw = Number(monthlyWithdraw) || 0;

        switch (mode) {
            case 'tsumitate':
                return calcTsumitate(numAmount, numReturnRate, numYears);
            case 'withdraw':
                return calcWithdraw(numAmount, numMonthlyWithdraw, numReturnRate, numYears);
            case 'tax-compare':
                return calcTaxCompare(numAmount, numReturnRate, numYears);
            default:
                return [];
        }
    }, [mode, amount, returnRate, years, monthlyWithdraw]);

    // グラフ用データ成形
    const chartData = useMemo(() => {
        if (results.length === 0) return { labels: [], datasets: [] };

        const labels = results.map((r: any) => `${r.year}年目`);

        if (mode === 'tsumitate') {
            return {
                labels,
                datasets: [
                    {
                        type: 'line' as const,
                        label: '総資産額',
                        data: results.map((r: any) => r.total),
                        borderColor: 'rgba(16, 185, 129, 1)', // Emerald green
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        type: 'line' as const,
                        label: '元本累計',
                        data: results.map((r: any) => r.principal),
                        borderColor: 'rgba(59, 130, 246, 1)', // Primary blue
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }
                ]
            };
        } else if (mode === 'withdraw') {
            return {
                labels,
                datasets: [
                    {
                        type: 'line' as const,
                        label: '資産残高',
                        data: results.map((r: any) => r.balance),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        type: 'bar' as const,
                        label: '累計取り崩し額',
                        data: results.map((r: any) => r.withdrawn),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)', // Amber
                    }
                ]
            };
        } else {
            // tax-compare
            return {
                labels,
                datasets: [
                    {
                        type: 'line' as const,
                        label: 'NISA口座での評価額',
                        data: results.map((r: any) => r.nisaTotal),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    },
                    {
                        type: 'line' as const,
                        label: '課税口座での手取り額',
                        data: results.map((r: any) => r.taxableTotal),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    },
                    {
                        type: 'bar' as const,
                        label: '投資元本',
                        data: results.map((r: any) => r.principal),
                        backgroundColor: 'rgba(148, 163, 184, 0.5)', // Slate
                    }
                ]
            };
        }
    }, [results, mode]);

    // 結果のサマリー取得
    const finalResult = results[results.length - 1] as any;

    return (
        <div>
            <div className="calculator-grid">
                {/* 入力フォーム */}
                <div className="card">
                    <h2>シミュレーション条件</h2>

                    {mode === 'withdraw' ? (
                        <>
                            <div className="form-group">
                                <label>初期資産額 (円)</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="10000" min="0" placeholder="20000000" />
                            </div>
                            <div className="form-group">
                                <label>毎月の取り崩し額 (円)</label>
                                <input type="number" value={monthlyWithdraw} onChange={e => setMonthlyWithdraw(e.target.value)} step="1000" min="0" placeholder="100000" />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <label>毎月の積立額 (円)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="1000" min="0" placeholder="30000" />
                        </div>
                    )}

                    <div className="form-group">
                        <label>想定年利 (%)</label>
                        <input type="number" value={returnRate} onChange={e => setReturnRate(e.target.value)} step="0.1" placeholder="5.0" />
                    </div>

                    <div className="form-group">
                        <label>期間 (年)</label>
                        <input type="number" value={years} onChange={e => setYears(e.target.value)} min="1" max="50" placeholder="20" />
                    </div>
                </div>

                {/* 結果ハイライト */}
                <div className="card">
                    <h2>計算結果サマリー</h2>
                    {finalResult && mode === 'tsumitate' && (
                        <>
                            <div className="result-box">
                                <div className="result-label">最終積立金額</div>
                                <div className="result-value">
                                    {new Intl.NumberFormat('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(finalResult.total / 10000)} 万円
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div className="result-box" style={{ flex: 1 }}>
                                    <div className="result-label">元本</div>
                                    <div className="result-value" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                                        {Math.round(finalResult.principal / 10000).toLocaleString('ja-JP')} 万円
                                    </div>
                                </div>
                                <div className="result-box" style={{ flex: 1 }}>
                                    <div className="result-label">運用益</div>
                                    <div className="result-value" style={{ fontSize: '1.2rem', color: '#10b981' }}>
                                        +{Math.round(finalResult.interest / 10000).toLocaleString('ja-JP')} 万円
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {finalResult && mode === 'withdraw' && (
                        <>
                            <div className="result-box">
                                <div className="result-label">資産残高 ({years}年後)</div>
                                <div className="result-value">
                                    {new Intl.NumberFormat('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(finalResult.balance / 10000)} 万円
                                </div>
                            </div>
                            <div className="result-box">
                                <div className="result-label">累計取り崩し額</div>
                                <div className="result-value" style={{ fontSize: '1.2rem', color: '#f59e0b' }}>
                                    {Math.round(finalResult.withdrawn / 10000).toLocaleString('ja-JP')} 万円
                                </div>
                            </div>
                        </>
                    )}

                    {finalResult && mode === 'tax-compare' && (
                        <>
                            <div className="result-box">
                                <div className="result-label">NISA口座での評価額</div>
                                <div className="result-value" style={{ color: '#10b981' }}>
                                    {new Intl.NumberFormat('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(finalResult.nisaTotal / 10000)} 万円
                                </div>
                            </div>
                            <div className="result-box">
                                <div className="result-label">課税口座での手取り</div>
                                <div className="result-value" style={{ fontSize: '1.2rem', color: '#ef4444' }}>
                                    {new Intl.NumberFormat('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(finalResult.taxableTotal / 10000)} 万円
                                </div>
                            </div>
                            <div className="help-text" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                NISA口座の方が <strong style={{ color: '#10b981' }}>{Math.round((finalResult.nisaTotal - finalResult.taxableTotal) / 10000).toLocaleString('ja-JP')}万円</strong> お得です！
                            </div>
                            <div className="help-text" style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                ※課税口座は、最終売却時に利益部分へ税率20.315％が課税される前提で試算しています。
                            </div>
                        </>
                    )}
                </div>
            </div>

            {Number(years) > 1 && (
                <div className="card">
                    <h2>資産推移グラフ</h2>
                    <AssetChart labels={chartData.labels} datasets={chartData.datasets} />
                </div>
            )}

            {finalResult && (() => {
                // 将来提携URLが発行されたら、ここにURLを設定するだけで直接遷移に切り替わります
                const affiliateUrl = "";
                const ctaLink = affiliateUrl ? affiliateUrl : "/account-compare";

                return (
                    <div className="card" style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'linear-gradient(to right bottom, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>次の一歩：新NISAを始めましょう</h2>

                        {mode === 'tsumitate' && (
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                                このまま積立を始めれば、<br />あなたは{Math.round(finalResult.total / 10000).toLocaleString('ja-JP')}万円を目指せます。
                            </p>
                        )}
                        {mode === 'withdraw' && (
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                                このまま運用を継続すれば、<br />{years}年後でも{Math.round(finalResult.balance / 10000).toLocaleString('ja-JP')}万円の残高維持を目指せます。
                            </p>
                        )}
                        {mode === 'tax-compare' && (
                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                                新NISAを活用して積立を始めれば、<br />あなたは{Math.round(finalResult.nisaTotal / 10000).toLocaleString('ja-JP')}万円を目指せます。
                            </p>
                        )}

                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            シミュレーション結果を踏まえ、<br />
                            実際に新NISAを始めるには証券口座の開設が必要です。<br />
                            手数料や特徴を比較して、自分に合った証券会社を選びましょう。
                        </p>

                        <a
                            href={ctaLink}
                            className="cta-button"
                            target={affiliateUrl ? "_blank" : undefined}
                            rel={affiliateUrl ? "noopener noreferrer" : undefined}
                            onClick={() => trackEvent('cta_primary_click', { page: mode, target: 'account-compare' })}
                        >
                            今すぐ新NISAを始める
                        </a>
                    </div>
                );
            })()}
        </div>
    );
}
