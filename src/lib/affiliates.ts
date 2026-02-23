// src/lib/affiliates.ts

export type AffiliateStatus = "pending" | "active";

export interface Affiliate {
    id: string;
    name: string;
    features: string[]; // changed to array for flexibility, but can be joined if needed
    recommendedFor: string[];
    status: AffiliateStatus;
    applyUrl?: string;
}

export const affiliates: Affiliate[] = [
    {
        id: "sbi-neotrade",
        name: "SBIネオトレード証券",
        features: ["低コストで取引可能"],
        recommendedFor: ["これから投資を始める方向け"],
        status: "pending",
        // applyUrl: "https://example.com/sbi", // 審査通過後にURLを設定し、statusを"active"に変更する
    },
    {
        id: "matsui",
        name: "松井証券",
        features: ["iDeCoや長期投資向けサービスが充実"],
        recommendedFor: ["積立・老後資産形成向け"],
        status: "pending",
        // applyUrl: "https://example.com/matsui",
    }
];
