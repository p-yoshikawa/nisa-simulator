// src/lib/tracking.ts

/**
 * Event tracking utility for analytics.
 * Currently uses console.log, but can easily be extended to GA4 (gtag) or other services.
 */

interface TrackingParams {
    broker?: string;
    path?: string;
    [key: string]: any;
}

export const trackEvent = (eventName: string, params?: TrackingParams) => {
    // 開発用コンソールログ
    console.log(`[Tracking Event]: ${eventName}`, params || {});

    // GA4 (gtag) の連携例：
    // if (typeof window !== 'undefined' && (window as any).gtag) {
    //     (window as any).gtag('event', eventName, params);
    // }
};
