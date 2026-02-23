// src/lib/affiliates.ts

export type AffiliateStatus = "pending" | "active";

export interface Affiliate {
    id: string;
    name: string;
    features: string[];
    recommendedFor: string[];
    status: AffiliateStatus;
    applyUrl?: string; // 提携審査通過後の専用URL
    officialUrl: string; // 審査中の遷移先（公式サイト）
}

export const affiliates: Affiliate[] = [
    {
        id: "sbi-neotrade",
        name: "SBIネオトレード証券",
        features: ["低コストで取引可能"],
        recommendedFor: ["これから投資を始める方向け", "手数料を重視する方"],
        status: "pending",
        // applyUrl: "https://www.sbisec.co.jp/", // 審査通過後に専用URLを設定し、statusを"active"に変更する
        officialUrl: "https://www.sbineotrade.jp/", // TODO: 正確な公式サイトURLに差し替え
    },
    {
        id: "matsui",
        name: "松井証券",
        features: ["iDeCoや長期投資向けサービスが充実", "手厚いサポート体制"],
        recommendedFor: ["積立・老後資産形成向け", "サポート・使いやすさ重視の方"],
        status: "pending",
        // applyUrl: "https://www.matsui.co.jp/",
        officialUrl: "https://www.matsui.co.jp/", // TODO: 正確な公式サイトURLに差し替え
    }
];
