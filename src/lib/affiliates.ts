// src/lib/affiliates.ts

export interface Affiliate {
    id: string;
    name: string;
    features: string[];
    recommendedFor: string[];
    affiliateUrl: string; // 提携審査通過後の専用アフィリエイトURL
    officialUrl: string; // 審査中の遷移先（公式サイト）
    customCtaLabel?: string; // カスタムCTAボタンラベル（任意）
}

export const affiliates: Affiliate[] = [
    {
        id: "sbi-neotrade",
        name: "SBIネオトレード証券",
        features: ["低コストで取引可能"],
        recommendedFor: ["これから投資を始める方向け", "手数料を重視する方"],
        affiliateUrl: "https://www.sbisec.co.jp/", // TODO: 正確なアフィリエイトURLに差し替え
        officialUrl: "https://www.sbineotrade.jp/",
    },
    {
        id: "matsui",
        name: "松井証券",
        features: ["新NISAに対応", "長期積立に向いたシンプル設計", "初心者でも始めやすいサポート体制"],
        recommendedFor: ["新NISAで積立投資を始めたい方", "投資初心者の方"],
        affiliateUrl: "https://px.a8.net/svt/ejp?a8mat=4AXI0D+EEKKOI+3XCC+BXQOI",
        officialUrl: "https://www.matsui.co.jp/",
        customCtaLabel: "松井証券で新NISAを始める",
    }
];

export function getBrokerUrl(brokerId: string): string {
    const broker = affiliates.find(a => a.id === brokerId);
    if (!broker) return "#"; // fallback

    // PUBLIC_AFFILIATE_MODE=on なら affiliateUrl を優先
    const isAffiliateMode = import.meta.env.PUBLIC_AFFILIATE_MODE === 'on';
    return isAffiliateMode ? broker.affiliateUrl : broker.officialUrl;
}
