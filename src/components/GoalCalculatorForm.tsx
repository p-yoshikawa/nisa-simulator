import React, { useState, useEffect } from 'react';
import { calculateRequiredMonthly, type GoalCalculationResult, type GoalResultRow } from '../lib/calc';
import AssetChart from './AssetChart';

// window.gtag の型定義を追加
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export default function GoalCalculatorForm() {
    // 状態管理（初期化時はnullにして、ハイドレーション後に初期値を設定する）
    const [targetAmount, setTargetAmount] = useState<number | null>(null);
    const [years, setYears] = useState<number | null>(null);
    const [annualReturn, setAnnualReturn] = useState<number | null>(null);

    const [result, setResult] = useState<GoalCalculationResult | null>(null);
    const [chartData, setChartData] = useState<any>({});

    // アフィリエイトモードかどうかの判定（Layout等でwindowに定義させている想定）
    const [isAffiliateMode, setIsAffiliateMode] = useState(false);

    // 初期化（クエリパラメータからの値取得を含む）
    useEffect(() => {
        // Affiliate判定
        if (typeof window !== 'undefined' && (window as any).PUBLIC_AFFILIATE_MODE === "true") {
            setIsAffiliateMode(true);
        }

        // URLパラメータからの初期値設定
        const urlParams = new URLSearchParams(window.location.search);
        const urlTarget = urlParams.get('target');
        const urlYears = urlParams.get('years');
        const urlReturn = urlParams.get('return');

        setTargetAmount(urlTarget ? parseInt(urlTarget, 10) : 2000); // デフォルト2000万
        setYears(urlYears ? parseInt(urlYears, 10) : 20); // デフォルト20年
        setAnnualReturn(urlReturn ? parseFloat(urlReturn) : 5.0); // デフォルト5%
    }, []);

    // 入力値が変わるたびに再計算
    useEffect(() => {
        if (targetAmount === null || years === null || annualReturn === null) return;
        if (targetAmount > 0 && years > 0 && annualReturn >= 0) {

            // 目標金額は「万円」入力なので円に変換
            const targetAmountYen = targetAmount * 10000;

            const newResult = calculateRequiredMonthly(targetAmountYen, annualReturn, years);
            setResult(newResult);

            // グラフ用データーへの変換 (AssetChartのProps型に合わせる)
            const labels = ['現在', ...newResult.schedule.map(row => `第${row.year}年`)];
            const principalData = [0, ...newResult.schedule.map(row => row.principal)];
            const interestData = [0, ...newResult.schedule.map(row => row.interest)];

            const datasets = [
                {
                    type: 'line' as const,
                    label: '運用益',
                    data: interestData,
                    borderColor: 'rgba(52, 211, 153, 1)',
                    backgroundColor: 'rgba(52, 211, 153, 0.5)',
                    fill: true,
                    tension: 0.4
                },
                {
                    type: 'bar' as const,
                    label: '投資元本',
                    data: principalData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }
            ];

            setChartData({ labels, datasets });

            // GA4イベントの送信（変更後1秒待ってから送信するデバウンス処理が理想ですが、簡易的に直接コール）
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'calculate_goal', {
                    'target_amount': targetAmount,
                    'years': years,
                    'annual_return': annualReturn
                });
            }
        }
    }, [targetAmount, years, annualReturn]);

    // ハイドレーション前はプレースホルダー（または何も）表示しない
    if (targetAmount === null || years === null || annualReturn === null) {
        return <div style={{ minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>シミュレーターを読み込み中...</p>
        </div>;
    }

    return (
        <div className="calculator-wrapper">
            {/* シミュレーション結果表示エリア */}
            {result && (
                <div className="result-card" style={{
                    background: 'linear-gradient(135deg, var(--bg-body) 0%, #ffffff 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2.5rem',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                        目標達成に必要な毎月積立額
                    </h2>

                    <div className="result-highlight" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginRight: '0.5rem' }}>毎月 約</span>
                        <span className="number-animate" style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px' }}>
                            {result.requiredMonthly.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginLeft: '0.5rem' }}>円</span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>最終予測資産額</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {Math.round(result.totalPrincipal + result.totalInterest).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>円</span>
                            </p>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px dashed var(--border-color)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>うち運用益</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                +{result.totalInterest.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>円</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 入力フォームエリア */}
            <div className="card input-card" style={{ marginBottom: '2.5rem', background: 'white' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '24px', height: '24px', background: 'var(--primary)', color: 'white', borderRadius: '50%', textAlign: 'center', lineHeight: '24px', fontSize: '0.9rem', marginRight: '0.5rem' }}>📝</span>
                    シミュレーション条件
                </h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* 目標金額 */}
                    <div className="input-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>目標金額</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="100"
                                    max="10000"
                                    value={targetAmount}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value, 10);
                                        if (isNaN(val)) val = 100;
                                        setTargetAmount(val);
                                    }}
                                    onBlur={() => {
                                        if (targetAmount < 100) setTargetAmount(100);
                                        if (targetAmount > 10000) setTargetAmount(10000);
                                    }}
                                    style={{
                                        width: '100px', padding: '0.5rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', textAlign: 'right',
                                        fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)',
                                    }}
                                />
                                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>万円</span>
                            </div>
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="10000"
                            step="100" // 100万円単位
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(Number(e.target.value))}
                            className="slider"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>下限：100万円</span>
                            <span>上限：1億円</span>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            （範囲：100万円〜1億円）
                        </div>
                    </div>

                    {/* 運用年数 */}
                    <div className="input-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>運用期間</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    max="50"
                                    value={years}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value, 10);
                                        if (isNaN(val)) val = 1;
                                        setYears(val);
                                    }}
                                    onBlur={() => {
                                        if (years < 1) setYears(1);
                                        if (years > 50) setYears(50);
                                    }}
                                    style={{
                                        width: '80px', padding: '0.5rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', textAlign: 'right',
                                        fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)',
                                    }}
                                />
                                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>年</span>
                            </div>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="slider"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>下限：1年</span>
                            <span>上限：50年</span>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            （範囲：1年〜50年）
                        </div>
                    </div>

                    {/* 想定利回り */}
                    <div className="input-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>想定利回り（年率）</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    max="20"
                                    step="0.1"
                                    value={annualReturn}
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value);
                                        if (isNaN(val)) val = 0;
                                        setAnnualReturn(val);
                                    }}
                                    onBlur={() => {
                                        if (annualReturn < 0) setAnnualReturn(0);
                                        if (annualReturn > 20) setAnnualReturn(20);
                                    }}
                                    style={{
                                        width: '80px', padding: '0.5rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', textAlign: 'right',
                                        fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)',
                                    }}
                                />
                                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>%</span>
                            </div>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.1"
                            value={annualReturn}
                            onChange={(e) => setAnnualReturn(Number(e.target.value))}
                            className="slider"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>下限：0%</span>
                            <span>上限：20%</span>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            （範囲：0%〜20%）
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            ※参考: 全世界株式の過去の平均利回りは約5〜7%程度と言われています。
                        </p>
                    </div>

                </div>
            </div>

            {/* グラフ描画エリア */}
            {chartData && chartData.labels && chartData.labels.length > 0 && result && (
                <div className="card chart-card" style={{ marginBottom: '2.5rem', background: 'white' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)', textAlign: 'center' }}>
                        資産推移グラフ（目標達成までの道筋）
                    </h3>
                    <div className="chart-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
                        <AssetChart labels={chartData.labels} datasets={chartData.datasets} />
                    </div>
                </div>
            )}

            {/* CTAブロック */}
            <div style={{ background: 'var(--bg-body)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    今回の試算はあくまで「毎月同じ金額を積み立てて、ずっと同じ利回りで運用できた場合」のシミュレーション予想であり、将来の投資成果を保証するものではありません。<br />
                    実際の運用では、証券会社ごとの手数料や商品ラインナップも重要になります。
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <a
                        href="/account-compare"
                        className="track-nav"
                        data-nav="goal_calc_to_compare"
                        style={{
                            display: 'inline-block',
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '1rem 2.5rem',
                            borderRadius: '30px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s',
                            width: '100%',
                            maxWidth: '400px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                        新NISA対応の証券口座を比較する（PR）
                    </a>
                </div>
            </div>

        </div>
    );
}
