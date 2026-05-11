(function (global) {
  var STR = {
    en: {
      'title.account': 'Maison Han - My account',
      'title.login': 'Maison Han - Sign in',
      'title.register': 'Maison Han - Register',
      'title.forgot': 'Maison Han - Forgot password',
      'title.reset': 'Maison Han - Reset password',
      'title.verify': 'Maison Han - Verify email',
      'acct.lang': 'Language',
      'api.label': 'API base',
      'api.placeholder': 'https://your-host/prod-api',
      'api.hint':
        'Same root as Pages MAISON_HAN_API_BASE (includes /prod-api when used).',
      'meta.loading': 'Loading\u2026',
      'meta.not_signed_in': 'Not signed in.',
      'meta.session_expired': 'Session expired. Sign in again.',
      'meta.confirming': 'Confirming\u2026',
      'meta.verified_ok': 'Email verified. You can sign in.',
      'meta.verify_fail': 'Verification failed',
      'meta.line': '{email} \u00b7 Verified: {verified} \u00b7 Points (USD): {points}',
      'verified.yes': 'yes',
      'verified.no': 'no',
      'nick.label': 'Nickname',
      'email.label': 'Email',
      'password.label': 'Password',
      'password_new.label': 'New password',
      'password_hint.register': 'Password (8\u201372 characters)',
      'nick.optional': 'Nickname (optional)',
      'btn.save_profile': 'Save profile',
      'btn.resend': 'Resend verification email',
      'btn.signout': 'Sign out',
      'btn.signin': 'Sign in',
      'btn.to_login': 'Go to sign in',
      'btn.create': 'Create account',
      'btn.send_reset': 'Send reset link',
      'btn.update_password': 'Update password',
      'btn.login_submit': 'Sign in',
      'link.home': 'Home',
      'link.register': 'Register',
      'link.forgot': 'Forgot password',
      'link.signin': 'Sign in',
      'alert.saved': 'Saved',
      'alert.resend':
        'If your email is not verified yet, a new message was sent.',
      'alert.register_ok':
        'Please check your email for the verification link. Checkout is charged in USD.',
      'alert.pwd_updated': 'Password updated. You can sign in.',
      'alert.forgot_default':
        'If this email is registered, you will receive instructions.',
      'err.login_failed': 'Sign-in failed',
      'err.register_failed': 'Registration failed',
      'err.missing_reset_token': 'Missing reset token.',
      'err.missing_verify_token': 'Missing token in the link.',
      'err.generic': 'Something went wrong',
    },
    'zh-CN': {
      'title.account': '\u6f22\u820d \u00b7 \u6211\u7684\u8d26\u6237',
      'title.login': '\u6f22\u820d \u00b7 \u767b\u5f55',
      'title.register': '\u6f22\u820d \u00b7 \u6ce8\u518c',
      'title.forgot': '\u6f22\u820d \u00b7 \u5fd8\u8bb0\u5bc6\u7801',
      'title.reset': '\u6f22\u820d \u00b7 \u91cd\u7f6e\u5bc6\u7801',
      'title.verify': '\u6f22\u820d \u00b7 \u9a8c\u8bc1\u90ae\u7bb1',
      'acct.lang': '\u8bed\u8a00',
      'api.label': '\u63a5\u53e3\u5730\u5740',
      'api.placeholder': 'https://your-host/prod-api',
      'api.hint':
        '\u4e0e Pages \u73af\u5883\u53d8\u91cf MAISON_HAN_API_BASE \u4e00\u81f4\uff08\u4f7f\u7528\u65f6\u901a\u5e38\u542b /prod-api\uff09\u3002',
      'meta.loading': '\u52a0\u8f7d\u4e2d\u2026',
      'meta.not_signed_in': '\u60a8\u5c1a\u672a\u767b\u5f55\u3002',
      'meta.session_expired': '\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002',
      'meta.confirming': '\u6b63\u5728\u786e\u8ba4\u2026',
      'meta.verified_ok': '\u90ae\u7bb1\u5df2\u9a8c\u8bc1\uff0c\u53ef\u4ee5\u767b\u5f55\u3002',
      'meta.verify_fail': '\u9a8c\u8bc1\u5931\u8d25',
      'meta.line':
        '{email} \u00b7 \u9a8c\u8bc1\uff1a{verified} \u00b7 \u79ef\u5206\uff08USD\uff09\uff1a{points}',
      'verified.yes': '\u662f',
      'verified.no': '\u5426',
      'nick.label': '\u6635\u79f0',
      'email.label': '\u90ae\u7bb1',
      'password.label': '\u5bc6\u7801',
      'password_new.label': '\u65b0\u5bc6\u7801',
      'password_hint.register': '\u5bc6\u7801\uff088\u201372 \u4f4d\uff09',
      'nick.optional': '\u6635\u79f0\uff08\u9009\u586b\uff09',
      'btn.save_profile': '\u4fdd\u5b58\u8d44\u6599',
      'btn.resend': '\u91cd\u53d1\u9a8c\u8bc1\u90ae\u4ef6',
      'btn.signout': '\u9000\u51fa\u767b\u5f55',
      'btn.signin': '\u767b\u5f55',
      'btn.to_login': '\u524d\u5f80\u767b\u5f55',
      'btn.create': '\u521b\u5efa\u8d26\u6237',
      'btn.send_reset': '\u53d1\u9001\u91cd\u7f6e\u94fe\u63a5',
      'btn.update_password': '\u66f4\u65b0\u5bc6\u7801',
      'btn.login_submit': '\u767b\u5f55',
      'link.home': '\u9996\u9875',
      'link.register': '\u6ce8\u518c',
      'link.forgot': '\u5fd8\u8bb0\u5bc6\u7801',
      'link.signin': '\u767b\u5f55',
      'alert.saved': '\u5df2\u4fdd\u5b58',
      'alert.resend':
        '\u82e5\u90ae\u7bb1\u5c1a\u672a\u9a8c\u8bc1\uff0c\u6211\u4eec\u5df2\u91cd\u65b0\u53d1\u9001\u90ae\u4ef6\u3002',
      'alert.register_ok':
        '\u8bf7\u67e5\u6536\u90ae\u4ef6\u5b8c\u6210\u9a8c\u8bc1\u3002\u7ed3\u8d26\u5c06\u4ee5\u7f8e\u5143\u7ed3\u7b97\u3002',
      'alert.pwd_updated': '\u5bc6\u7801\u5df2\u66f4\u65b0\uff0c\u8bf7\u767b\u5f55\u3002',
      'alert.forgot_default':
        '\u82e5\u8be5\u90ae\u7bb1\u5df2\u6ce8\u518c\uff0c\u60a8\u5c06\u6536\u5230\u91cd\u7f6e\u8bf4\u660e\u3002',
      'err.login_failed': '\u767b\u5f55\u5931\u8d25',
      'err.register_failed': '\u6ce8\u518c\u5931\u8d25',
      'err.missing_reset_token': '\u7f3a\u5c11\u91cd\u7f6e\u4ee4\u724c\u3002',
      'err.missing_verify_token': '\u94fe\u63a5\u4e2d\u7f3a\u5c11\u9a8c\u8bc1\u53c2\u6570\u3002',
      'err.generic': '\u51fa\u9519\u4e86',
    },
    'zh-TW': {
      'title.account': '\u6f22\u820d \u00b7 \u6211\u7684\u5e33\u6236',
      'title.login': '\u6f22\u820d \u00b7 \u767b\u5165',
      'title.register': '\u6f22\u820d \u00b7 \u8a3b\u518a',
      'title.forgot': '\u6f22\u820d \u00b7 \u5fd8\u8a18\u5bc6\u78bc',
      'title.reset': '\u6f22\u820d \u00b7 \u91cd\u8a2d\u5bc6\u78bc',
      'title.verify': '\u6f22\u820d \u00b7 \u9a57\u8b49\u4fe1\u7bb1',
      'acct.lang': '\u8a9e\u8a00',
      'api.label': '\u4ecb\u9762\u7db2\u5740',
      'api.placeholder': 'https://your-host/prod-api',
      'api.hint':
        '\u8207 Pages \u74b0\u5883\u8b8a\u6578 MAISON_HAN_API_BASE \u76f8\u540c\uff08\u4f7f\u7528\u6642\u901a\u5e38\u542b /prod-api\uff09\u3002',
      'meta.loading': '\u8f09\u5165\u4e2d\u2026',
      'meta.not_signed_in': '\u60a8\u5c1a\u672a\u767b\u5165\u3002',
      'meta.session_expired': '\u767b\u5165\u5df2\u904e\u671f\uff0c\u8acb\u91cd\u65b0\u767b\u5165\u3002',
      'meta.confirming': '\u78ba\u8a8d\u4e2d\u2026',
      'meta.verified_ok': '\u4fe1\u7bb1\u5df2\u9a57\u8b49\uff0c\u53ef\u4ee5\u767b\u5165\u3002',
      'meta.verify_fail': '\u9a57\u8b49\u5931\u6557',
      'meta.line':
        '{email} \u00b7 \u9a57\u8b49\uff1a{verified} \u00b7 \u7a4d\u5206\uff08USD\uff09\uff1a{points}',
      'verified.yes': '\u662f',
      'verified.no': '\u5426',
      'nick.label': '\u66b1\u7a31',
      'email.label': '\u4fe1\u7bb1',
      'password.label': '\u5bc6\u78bc',
      'password_new.label': '\u65b0\u5bc6\u78bc',
      'password_hint.register': '\u5bc6\u78bc\uff088\u201372 \u5b57\u5143\uff09',
      'nick.optional': '\u66b1\u7a31\uff08\u9078\u586b\uff09',
      'btn.save_profile': '\u5132\u5b58\u8cc7\u6599',
      'btn.resend': '\u91cd\u5bc4\u9a57\u8b49\u4fe1',
      'btn.signout': '\u767b\u51fa',
      'btn.signin': '\u767b\u5165',
      'btn.to_login': '\u524d\u5f80\u767b\u5165',
      'btn.create': '\u5efa\u7acb\u5e33\u6236',
      'btn.send_reset': '\u5bc4\u51fa\u91cd\u8a2d\u9023\u7d50',
      'btn.update_password': '\u66f4\u65b0\u5bc6\u78bc',
      'btn.login_submit': '\u767b\u5165',
      'link.home': '\u9996\u9801',
      'link.register': '\u8a3b\u518a',
      'link.forgot': '\u5fd8\u8a18\u5bc6\u78bc',
      'link.signin': '\u767b\u5165',
      'alert.saved': '\u5df2\u5132\u5b58',
      'alert.resend':
        '\u82e5\u4fe1\u7bb1\u5c1a\u672a\u9a57\u8b49\uff0c\u6211\u5011\u5df2\u91cd\u65b0\u5bc4\u51fa\u90f5\u4ef6\u3002',
      'alert.register_ok':
        '\u8acb\u6536\u4fe1\u5b8c\u6210\u9a57\u8b49\u3002\u7d50\u5e33\u5c07\u4ee5\u7f8e\u5143\u8a08\u50f9\u3002',
      'alert.pwd_updated': '\u5bc6\u78bc\u5df2\u66f4\u65b0\uff0c\u8acb\u767b\u5165\u3002',
      'alert.forgot_default':
        '\u82e5\u8a72\u4fe1\u7bb1\u5df2\u8a3b\u518a\uff0c\u60a8\u5c07\u6536\u5230\u91cd\u8a2d\u8aaa\u660e\u3002',
      'err.login_failed': '\u767b\u5165\u5931\u6557',
      'err.register_failed': '\u8a3b\u518a\u5931\u6557',
      'err.missing_reset_token': '\u7f3a\u5c11\u91cd\u8a2d\u6b0a\u6756\u3002',
      'err.missing_verify_token': '\u9023\u7d50\u7f3a\u5c11\u9a57\u8b49\u53c3\u6578\u3002',
      'err.generic': '\u767c\u751f\u932f\u8aa4',
    },
  };

  function normalizeLang(code) {
    if (!code) return 'en';
    if (STR[code]) return code;
    var base = String(code).split('-')[0];
    if (base === 'zh') return 'zh-CN';
    return 'en';
  }

  function getLang() {
    try {
      var s = localStorage.getItem('han_lang');
      if (s) return normalizeLang(s);
    } catch (e) {}
    var h = document.documentElement.getAttribute('lang');
    return normalizeLang(h || 'en');
  }

  function setLang(code) {
    var lang = normalizeLang(code);
    try {
      localStorage.setItem('han_lang', lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    return lang;
  }

  function t(key, vars) {
    var lang = getLang();
    var table = STR[lang] || STR.en;
    var s =
      table[key] !== undefined ? table[key] : STR.en[key] !== undefined ? STR.en[key] : key;
    if (vars && typeof s === 'string') {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-acct-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-acct-i18n');
      if (key) el.textContent = t(key);
    });
    root.querySelectorAll('[data-acct-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-acct-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    var tk = document.querySelector('meta[name="acct-title-key"]');
    if (tk) {
      var k = tk.getAttribute('content');
      if (k) document.title = t(k);
    }
    var sel = document.getElementById('acctLang');
    if (sel) sel.value = getLang();
  }

  function bindLangSelect() {
    var sel = document.getElementById('acctLang');
    if (!sel) return;
    sel.addEventListener('change', function () {
      setLang(sel.value);
      apply(document);
      try {
        if (typeof globalThis.__hanAcctLangChange === 'function') {
          globalThis.__hanAcctLangChange();
        }
      } catch (e) {}
    });
  }

  function init(root) {
    setLang(getLang());
    bindLangSelect();
    apply(root || document);
  }

  global.HanAccountI18n = {
    STR: STR,
    t: t,
    apply: apply,
    getLang: getLang,
    setLang: setLang,
    normalizeLang: normalizeLang,
    init: init,
  };
})(typeof window !== 'undefined' ? window : this);
