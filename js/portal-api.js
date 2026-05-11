/**
 * Maison Han storefront ? TaTa /portal REST.
 * Requires: localStorage "han_maison_api_base" = same value as Pages env MAISON_HAN_API_BASE (e.g. https://domain/prod-api ¡ª no trailing slash).
 */
window.HanPortal = (function () {
  var TOKEN_KEY = 'han_portal_token';
  var API_KEY = 'han_maison_api_base';

  function baseUrl() {
    if (typeof window.__MAISON_API_BASE === 'string' && window.__MAISON_API_BASE.trim()) {
      return window.__MAISON_API_BASE.replace(/\/+$/, '');
    }
    try {
      var u = localStorage.getItem(API_KEY);
      return u ? u.replace(/\/+$/, '') : '';
    } catch (e) {
      return '';
    }
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function request(path, options) {
    options = options || {};
    var method = options.method || 'GET';
    var b = baseUrl();
    if (!b) {
      return Promise.reject(new Error('Missing API base: set localStorage han_maison_api_base (your TaTa /prod-api root).'));
    }
    var url = b + path;
    var headers = { Accept: 'application/json' };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (!options.skipAuth) {
      var tok = getToken();
      if (tok) headers['Authorization'] = 'Bearer ' + tok;
    }
    return fetch(url, {
      method: method,
      headers: headers,
      body:
        options.body && !(options.body instanceof FormData)
          ? typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body)
          : options.body,
    }).then(function (res) {
      return res.text().then(function (text) {
        var json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (_) {
          json = null;
        }
        if (!res.ok) {
          var msg = json && json.msg ? json.msg : text || res.statusText;
          var err = new Error(msg || 'HTTP ' + res.status);
          err.detail = json;
          throw err;
        }
        if (!json) return {};
        var code = json.code;
        if (code !== undefined && Number(code) !== 200 && Number(code) !== 0) {
          var e2 = new Error(json.msg || 'Request rejected');
          e2.detail = json;
          throw e2;
        }
        /** RuoYi: 0 sometimes used; we accept 200 only above; if missing code, treat ok */
        if (json.token) setToken(json.token);
        return json;
      });
    });
  }

  return {
    TOKEN_KEY: TOKEN_KEY,
    API_KEY: API_KEY,
    baseUrl: baseUrl,
    getToken: getToken,
    setToken: setToken,
    logout: function () {
      return request('/portal/auth/logout', { method: 'POST', skipAuth: false }).finally(function () {
        setToken('');
      });
    },
    register: function (payload) {
      return request('/portal/auth/register', { method: 'POST', body: payload });
    },
    login: function (payload) {
      return request('/portal/auth/login', { method: 'POST', body: payload });
    },
    me: function () {
      return request('/portal/me', { method: 'GET' });
    },
    updateMe: function (payload) {
      return request('/portal/me', { method: 'PUT', body: payload });
    },
    verifyEmailToken: function (token) {
      return request('/portal/auth/verify-email?token=' + encodeURIComponent(token), { method: 'GET', skipAuth: true });
    },
    forgot: function (email) {
      return request('/portal/auth/forgot-password', { method: 'POST', body: { email: email }, skipAuth: true });
    },
    resetPwd: function (token, newPassword) {
      return request('/portal/auth/reset-password', {
        method: 'POST',
        body: { token: token, newPassword: newPassword },
        skipAuth: true,
      });
    },
    resendVerify: function () {
      return request('/portal/auth/resend-verify', { method: 'POST' });
    },
  };
})();
