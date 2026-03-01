export interface TsumitateResultRow {
    year: number;
    principal: number;
    interest: number;
    total: number;
}

/**
 * つみたてNISAの複利計算を行います
 * @param monthlyAmount 毎月の積立額(円)
 * @param annualReturn 年利(%)
 * @param years 積立期間(年)
 * @returns 各年ごとの残高推移データ
 */
export function calcTsumitate(monthlyAmount: number, annualReturn: number, years: number): TsumitateResultRow[] {
    const results: TsumitateResultRow[] = [];
    const monthlyRate = annualReturn / 100 / 12;
    let total = 0;
    let principal = 0;

    for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
            total = total * (1 + monthlyRate) + monthlyAmount;
            principal += monthlyAmount;
        }
        results.push({
            year: y,
            principal: Math.round(principal),
            interest: Math.round(total - principal),
            total: Math.round(total)
        });
    }

    return results;
}

export interface WithdrawResultRow {
    year: number;
    balance: number;
    withdrawn: number;
}

/**
 * 資産の取り崩し計算を行います
 * @param initialAmount 初期資産額(円)
 * @param monthlyWithdraw 毎月の取り崩し額(円)
 * @param annualReturn 運用利回り(%)
 * @param years テスト期間(年)
 * @returns 各年ごとの残高推移データ
 */
export function calcWithdraw(initialAmount: number, monthlyWithdraw: number, annualReturn: number, years: number): WithdrawResultRow[] {
    const results: WithdrawResultRow[] = [];
    const monthlyRate = annualReturn / 100 / 12;
    let balance = initialAmount;
    let totalWithdrawn = 0;

    for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
            if (balance > 0) {
                // 月初に取り崩し
                const actualWithdraw = Math.min(balance, monthlyWithdraw);
                balance -= actualWithdraw;
                totalWithdrawn += actualWithdraw;
                // 月末までに運用益加算
                if (balance > 0) {
                    balance = balance * (1 + monthlyRate);
                }
            }
        }
        results.push({
            year: y,
            balance: Math.max(0, Math.round(balance)),
            withdrawn: totalWithdrawn
        });
    }

    return results;
}

export interface TaxCompareResultRow {
    year: number;
    principal: number;
    nisaTotal: number;
    taxableTotal: number;
}

/**
 * NISA口座と課税口座（特定口座）の比較計算
 * @param monthlyAmount 毎月の積立額(円)
 * @param annualReturn 年利(%)
 * @param years 積立期間(年)
 * @param taxRate 税率(%) 通常20.315%
 */
export function calcTaxCompare(monthlyAmount: number, annualReturn: number, years: number, taxRate: number = 20.315): TaxCompareResultRow[] {
    const results: TaxCompareResultRow[] = [];
    const monthlyRate = annualReturn / 100 / 12;

    let nisaTotal = 0;
    let taxableTotal = 0; // 途中売却しない前提での含み益を含む総額（税引前評価額）
    let principal = 0;

    for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
            nisaTotal = nisaTotal * (1 + monthlyRate) + monthlyAmount;
            taxableTotal = taxableTotal * (1 + monthlyRate) + monthlyAmount;
            principal += monthlyAmount;
        }

        // 課税口座は年単位での売却時税金控除後の実質手取りを計算（シミュレーション用）
        const taxableGain = taxableTotal - principal;
        const netTaxableTotal = principal + (taxableGain * (1 - taxRate / 100));

        results.push({
            year: y,
            principal: Math.round(principal),
            nisaTotal: Math.round(nisaTotal),
            taxableTotal: Math.round(netTaxableTotal)
        });
    }

    return results;
}

export interface GoalResultRow {
    year: number;
    principal: number;
    interest: number;
    total: number;
}

export interface GoalCalculationResult {
    requiredMonthly: number;
    totalPrincipal: number;
    totalInterest: number;
    schedule: GoalResultRow[];
}

/**
 * 目標金額から必要な毎月の積立額を逆算します
 * @param targetAmount 目標金額(円)
 * @param annualReturn 想定利回り(%)
 * @param years 運用期間(年)
 * @returns 必要な毎月積立額、元本・運用益の合計、および各年ごとの推移データ
 */
export function calculateRequiredMonthly(targetAmount: number, annualReturn: number, years: number): GoalCalculationResult {
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;
    let requiredMonthly = 0;

    if (monthlyRate === 0) {
        requiredMonthly = targetAmount / months;
    } else {
        // FV = PMT * (((1 + r)^n - 1) / r)
        // PMT = FV / (((1 + r)^n - 1) / r)
        // 数学的には期末・期初支払いなどの差異がありますが、
        // 既存のつみたてロジック（月初積立・月末利息）に一致するように調整します。
        // FV = PMT * ( (1+r)^n - 1 ) / r * (1+r)  <-- 月初振込FV
        const fvFactor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
        requiredMonthly = targetAmount / fvFactor;
    }

    // 毎月の要求額を1円単位で切り上げ（安全に目標を上回るため）
    requiredMonthly = Math.ceil(requiredMonthly);

    // 既存の計算ロジックを使ってスケジュールを生成
    // ただしMath.roundの誤差で最終年が微妙にズレる可能性があるため、専用に出力
    const schedule: GoalResultRow[] = [];
    let total = 0;
    let principal = 0;

    for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
            total = total * (1 + monthlyRate) + requiredMonthly;
            principal += requiredMonthly;
        }
        schedule.push({
            year: y,
            principal: Math.round(principal),
            interest: Math.round(total - principal),
            total: Math.round(total)
        });
    }

    const finalTotal = schedule.length > 0 ? schedule[schedule.length - 1].total : 0;
    const finalPrincipal = schedule.length > 0 ? schedule[schedule.length - 1].principal : 0;
    const finalInterest = schedule.length > 0 ? schedule[schedule.length - 1].interest : 0;

    return {
        requiredMonthly,
        totalPrincipal: finalPrincipal,
        totalInterest: finalInterest,
        schedule
    };
}
