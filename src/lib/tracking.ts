export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  // GA4等が未導入でも落ちないように no-op
  // 本番で gtag があれば送る（速度優先：同期処理なし、例外握り潰し）
  try {
    const gtag = (globalThis as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", eventName, params);
    }
  } catch {
    // no-op
  }
}
