/* Maison Han - shared i18n for success.html, cancel.html, account.html
 * Same localStorage key as index: han_lang (en | zh-CN | zh-TW | ja)
 */
(function (global) {
  "use strict";

  var DICT = {
  "en": {
    "ok.eyebrow": "Reservation confirmed",
    "ok.title": "Thank you",
    "ok.sub": "Your bottles have been set aside.",
    "ok.lead": "We have received your order and a confirmation has been sent to your inbox. A member of our cellar team will write personally within one business day to confirm provenance, schedule insured shipment, and arrange the recipient identity check.",
    "ok.orderRef": "ORDER REF",
    "ok.cta": "Return to the cellar",
    "foot.house": "A House of Rare Pours",
    "cancel.eyebrow": "No charge made",
    "cancel.title1": "Your cellar ",
    "cancel.titleEm": "waits",
    "cancel.sub": "The bottles remain in your cart.",
    "cancel.lead": "No payment was processed. Your selections are preserved - return whenever you wish to complete the reservation.",
    "cancel.cta": "Back to the shelves",
    "acc.apiBase": "API base",
    "acc.loading": "Loading...",
    "acc.nick": "Nickname",
    "acc.save": "Save profile",
    "acc.resend": "Resend verification email",
    "acc.logout": "Sign out",
    "acc.home": "Home",
    "acc.verified": "verified",
    "acc.yes": "yes",
    "acc.no": "no",
    "acc.points": "USD points balance",
    "acc.notSignedIn": "Not signed in.",
    "acc.sessionExpired": "Session expired. Sign in again.",
    "acc.saved": "Saved",
    "acc.resendOk": "If not yet verified, a new email was sent."
  },
  "zh-CN": {
    "ok.eyebrow": "\u9884\u8ba2\u5df2\u786e\u8ba4",
    "ok.title": "\u611f\u8c22\u60e0\u987e",
    "ok.sub": "\u60a8\u9009\u4e2d\u7684\u9152\u6b3e\u5df2\u4e3a\u60a8\u9884\u7559\u3002",
    "ok.lead": "\u6211\u4eec\u5df2\u6536\u5230\u8ba2\u5355\uff0c\u786e\u8ba4\u90ae\u4ef6\u5df2\u53d1\u9001\u81f3\u60a8\u7684\u90ae\u7bb1\u3002\u9152\u7a96\u540c\u4e8b\u5c06\u5728\u4e00\u4e2a\u5de5\u4f5c\u65e5\u5185\u4eb2\u81ea\u56de\u4fe1\uff0c\u6838\u5bf9\u6eaf\u6e90\u4fe1\u606f\u3001\u5b89\u6392\u627f\u4fdd\u7269\u6d41\uff0c\u5e76\u534f\u8c03\u6536\u4ef6\u4eba\u8eab\u4efd\u6838\u9a8c\u3002",
    "ok.orderRef": "\u8ba2\u5355\u7f16\u53f7",
    "ok.cta": "\u8fd4\u56de\u9152\u7a96\u9996\u9875",
    "foot.house": "\u7a00\u4e16\u73cd\u9009\u4e4b\u9986",
    "cancel.eyebrow": "\u672a\u6263\u6b3e",
    "cancel.title1": "\u9152\u7a96\u4ecd\u5728 ",
    "cancel.titleEm": "\u7b49\u5019",
    "cancel.sub": "\u9152\u6b3e\u4ecd\u4fdd\u7559\u5728\u9152\u7bee\u4e2d\u3002",
    "cancel.lead": "\u672a\u5b8c\u6210\u652f\u4ed8\uff0c\u60a8\u7684\u9009\u62e9\u5747\u5df2\u4fdd\u7559\u2014\u2014\u968f\u65f6\u56de\u6765\u7ee7\u7eed\u5b8c\u6210\u9884\u8ba2\u5373\u53ef\u3002",
    "cancel.cta": "\u56de\u5230\u8d27\u67b6",
    "acc.apiBase": "API \u5730\u5740",
    "acc.loading": "\u52a0\u8f7d\u4e2d\u2026",
    "acc.nick": "\u6635\u79f0",
    "acc.save": "\u4fdd\u5b58\u8d44\u6599",
    "acc.resend": "\u91cd\u53d1\u9a8c\u8bc1\u90ae\u4ef6",
    "acc.logout": "\u9000\u51fa\u767b\u5f55",
    "acc.home": "\u9996\u9875",
    "acc.verified": "\u90ae\u7bb1\u5df2\u9a8c\u8bc1",
    "acc.yes": "\u662f",
    "acc.no": "\u5426",
    "acc.points": "USD \u79ef\u5206\u4f59\u989d",
    "acc.notSignedIn": "\u5c1a\u672a\u767b\u5f55\u3002",
    "acc.sessionExpired": "\u4f1a\u8bdd\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002",
    "acc.saved": "\u5df2\u4fdd\u5b58",
    "acc.resendOk": "\u82e5\u5c1a\u672a\u9a8c\u8bc1\uff0c\u6211\u4eec\u5df2\u91cd\u65b0\u53d1\u9001\u4e00\u5c01\u90ae\u4ef6\u3002"
  },
  "zh-TW": {
    "ok.eyebrow": "\u9810\u8a02\u5df2\u78ba\u8a8d",
    "ok.title": "\u611f\u8b1d\u60e0\u9867",
    "ok.sub": "\u60a8\u9078\u4e2d\u7684\u9152\u6b3e\u5df2\u70ba\u60a8\u9810\u7559\u3002",
    "ok.lead": "\u6211\u5011\u5df2\u6536\u5230\u8a02\u55ae\uff0c\u78ba\u8a8d\u90f5\u4ef6\u5df2\u5bc4\u81f3\u60a8\u7684\u4fe1\u7bb1\u3002\u9152\u7a96\u540c\u4e8b\u5c07\u5728\u4e00\u500b\u5de5\u4f5c\u65e5\u5167\u89aa\u81ea\u56de\u4fe1\uff0c\u6838\u5c0d\u6eaf\u6e90\u8cc7\u8a0a\u3001\u5b89\u6392\u627f\u4fdd\u7269\u6d41\uff0c\u4e26\u5354\u8abf\u6536\u4ef6\u4eba\u8eab\u5206\u6838\u9a57\u3002",
    "ok.orderRef": "\u8a02\u55ae\u7de8\u865f",
    "ok.cta": "\u8fd4\u56de\u9152\u7a96\u9996\u9801",
    "foot.house": "\u7a00\u4e16\u73cd\u9078\u4e4b\u9928",
    "cancel.eyebrow": "\u672a\u6263\u6b3e",
    "cancel.title1": "\u9152\u7a96\u4ecd\u5728 ",
    "cancel.titleEm": "\u7b49\u5019",
    "cancel.sub": "\u9152\u6b3e\u4ecd\u4fdd\u7559\u5728\u9152\u7c43\u4e2d\u3002",
    "cancel.lead": "\u672a\u5b8c\u6210\u4ed8\u6b3e\uff0c\u60a8\u7684\u9078\u64c7\u5747\u5df2\u4fdd\u7559\u2014\u2014\u96a8\u6642\u56de\u4f86\u7e7c\u7e8c\u5b8c\u6210\u9810\u8a02\u5373\u53ef\u3002",
    "cancel.cta": "\u56de\u5230\u8ca8\u67b6",
    "acc.apiBase": "API \u4f4d\u5740",
    "acc.loading": "\u8f09\u5165\u4e2d\u2026",
    "acc.nick": "\u66b1\u7a31",
    "acc.save": "\u5132\u5b58\u8cc7\u6599",
    "acc.resend": "\u91cd\u5bc4\u9a57\u8b49\u90f5\u4ef6",
    "acc.logout": "\u767b\u51fa",
    "acc.home": "\u9996\u9801",
    "acc.verified": "\u4fe1\u7bb1\u5df2\u9a57\u8b49",
    "acc.yes": "\u662f",
    "acc.no": "\u5426",
    "acc.points": "USD\u7a4d\u5206\u9918\u984d",
    "acc.notSignedIn": "\u5c1a\u672a\u767b\u5165\u3002",
    "acc.sessionExpired": "\u9023\u7dda\u968e\u6bb5\u5df2\u904e\u671f\uff0c\u8acb\u91cd\u65b0\u767b\u5165\u3002",
    "acc.saved": "\u5df2\u5132\u5b58",
    "acc.resendOk": "\u82e5\u5c1a\u672a\u9a57\u8b49\uff0c\u6211\u5011\u5df2\u91cd\u65b0\u5bc4\u51fa\u4e00\u5c01\u4fe1\u3002"
  },
  "ja": {
    "ok.eyebrow": "\u3054\u4e88\u7d04\u78ba\u5b9a",
    "ok.title": "\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059",
    "ok.sub": "\u3054\u9078\u5b9a\u306e\u30dc\u30c8\u30eb\u306f\u304a\u53d6\u308a\u7f6e\u304d\u6e08\u307f\u3067\u3059\u3002",
    "ok.lead": "\u3054\u6ce8\u6587\u3092\u627f\u308a\u3001\u78ba\u8a8d\u30e1\u30fc\u30eb\u3092\u304a\u9001\u308a\u3057\u307e\u3057\u305f\u3002\u9152\u8535\u30c1\u30fc\u30e0\u304c\u4e00\u55b6\u696d\u65e5\u4ee5\u5185\u306b\u76f4\u63a5\u3054\u9023\u7d61\u3057\u3001\u6765\u6b74\u306e\u78ba\u8a8d\u30fb\u4fdd\u9670\u4ed8\u304d\u767a\u9001\u306e\u624b\u914d\u30fb\u53d7\u53d6\u4eba\u306e\u672c\u4eba\u78ba\u8a8d\u3092\u8abf\u6574\u3044\u305f\u3057\u307e\u3059\u3002",
    "ok.orderRef": "\u6ce8\u6587\u756a\u53f7",
    "ok.cta": "\u30bb\u30e9\u30fc\u3078\u623b\u308b",
    "foot.house": "\u5e0c\u5c11\u306a\u4e00\u676f\u306e\u9928",
    "cancel.eyebrow": "\u6c7a\u6e08\u306a\u3057",
    "cancel.title1": "\u30bb\u30e9\u30fc\u306f ",
    "cancel.titleEm": "\u304a\u5f85\u3061\u3057\u3066\u3044\u307e\u3059",
    "cancel.sub": "\u30ab\u30fc\u30c8\u5185\u306e\u30dc\u30c8\u30eb\u306f\u305d\u306e\u307e\u307e\u3067\u3059\u3002",
    "cancel.lead": "\u304a\u652f\u6255\u3044\u306f\u884c\u308f\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3054\u9078\u629e\u306f\u4fdd\u6301\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u3044\u3064\u3067\u3082\u3054\u4e88\u7d04\u3092\u5b8c\u4e86\u3067\u304d\u307e\u3059\u3002",
    "cancel.cta": "\u68da\u3078\u623b\u308b",
    "acc.apiBase": "API \u30d9\u30fc\u30b9 URL",
    "acc.loading": "\u8aad\u307f\u8fbc\u307f\u4e2d\u2026",
    "acc.nick": "\u30cb\u30c3\u30af\u30cd\u30fc\u30e0",
    "acc.save": "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u4fdd\u5b58",
    "acc.resend": "\u78ba\u8a8d\u30e1\u30fc\u30eb\u3092\u518d\u9001",
    "acc.logout": "\u30b5\u30a4\u30f3\u30a2\u30a6\u30c8",
    "acc.home": "\u30db\u30fc\u30e0",
    "acc.verified": "\u78ba\u8a8d\u6e08\u307f",
    "acc.yes": "\u306f\u3044",
    "acc.no": "\u3044\u3044\u3048",
    "acc.points": "USD \u30dd\u30a4\u30f3\u30c8\u6b8b\u9ad8",
    "acc.notSignedIn": "\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u3044\u307e\u305b\u3093\u3002",
    "acc.sessionExpired": "\u30bb\u30c3\u30b7\u30e7\u30f3\u306e\u6709\u52b9\u671f\u9650\u304c\u5207\u308c\u307e\u3057\u305f\u3002\u518d\u5ea6\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    "acc.saved": "\u4fdd\u5b58\u3057\u307e\u3057\u305f",
    "acc.resendOk": "\u672a\u78ba\u8a8d\u306e\u5834\u5408\u3001\u65b0\u3057\u3044\u30e1\u30fc\u30eb\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002"
  }
};
  var SUPPORTED = new Set(["en", "zh-CN", "zh-TW", "ja"]);

  function readLang() {
    try {
      var s = localStorage.getItem("han_lang");
      if (s && SUPPORTED.has(s)) return s;
    } catch (e) {}
    var nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("zh-cn") || nav.startsWith("zh-hans")) return "zh-CN";
    if (nav.startsWith("zh-tw") || nav.startsWith("zh-hant")) return "zh-TW";
    if (nav.startsWith("ja")) return "ja";
    return "en";
  }

  var _lang = readLang();

  function dict() {
    return DICT[_lang] || DICT.en;
  }

  function t(key) {
    var d = dict();
    var v = d[key];
    if (v !== undefined) return v;
    return DICT.en[key] !== undefined ? DICT.en[key] : key;
  }

  function apply() {
    document.documentElement.lang = _lang;
    document.documentElement.setAttribute("data-lang", _lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = t(key);
      if (val !== undefined) el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      var val = t(key);
      if (val !== undefined) el.setAttribute("placeholder", val);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (!key) return;
      var val = t(key);
      if (val !== undefined) el.setAttribute("title", val);
    });
    var titleEl = document.querySelector("[data-i18n-document-title]");
    if (titleEl) {
      var tk = titleEl.getAttribute("data-i18n-document-title");
      if (tk) document.title = t(tk);
    }
  }

  function setLang(lang) {
    if (!SUPPORTED.has(lang)) lang = "en";
    _lang = lang;
    try {
      localStorage.setItem("han_lang", lang);
    } catch (e) {}
    apply();
  }

  var HanI18N = {
    t: t,
    apply: apply,
    setLang: setLang,
    get lang() {
      return _lang;
    },
  };

  global.HanI18N = HanI18N;

  function boot() {
    HanI18N.apply();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : this);
