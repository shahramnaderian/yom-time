(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const cap = () => g.Capacitor;
  const native = () => {
    try {
      return !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
    } catch (e) {
      return false;
    }
  };
  let LN = null, onOpen = null, perm = "unknown";
  function plugin() {
    if (!LN) LN = SE.native.plugin("LocalNotifications");
    return LN;
  }
  async function ensurePermission() {
    try {
      if (native()) {
        const p = plugin();
        if (!p) return perm = "unsupported";
        let r = await p.checkPermissions();
        if (r.display !== "granted") r = await p.requestPermissions();
        return perm = r.display === "granted" ? "granted" : "denied";
      }
      if (typeof Notification === "undefined") return perm = "unsupported";
      if (Notification.permission === "default") await Notification.requestPermission();
      return perm = Notification.permission === "granted" ? "granted" : "denied";
    } catch (e) {
      return perm = "unsupported";
    }
  }
  const appHidden = () => !!(g.document && document.visibilityState === "hidden");
  async function show(title, body, recId, force) {
    if (!force && !appHidden()) return false;
    try {
      if (native()) {
        const p = plugin();
        if (!p || perm === "denied") return false;
        await p.schedule({ notifications: [{ id: Math.floor(Math.random() * 2e9), title, body, extra: { recId } }] });
        return true;
      }
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
      const opts = { body, tag: recId, lang: "fa", dir: "rtl", icon: "icons/icon-192.png" };
      let n;
      try {
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, Object.assign({ data: { recId } }, opts));
          return true;
        }
      } catch (e) {}
      n = new Notification(title, opts);
      n.onclick = () => {
        try { g.focus(); } catch (e) {}
        if (onOpen) onOpen(recId);
        n.close();
      };
      return true;
    } catch (e) {
      return false;
    }
  }
  function init(onOpenRecord) {
    onOpen = onOpenRecord;
    const p = plugin();
    if (p && p.addListener) {
      p.addListener("localNotificationActionPerformed", (ev) => {
        const id = ev && ev.notification && ev.notification.extra && ev.notification.extra.recId;
        if (id && onOpen) onOpen(id);
      });
    }
    if (g.navigator && navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data && e.data.recId && onOpen) onOpen(e.data.recId);
      });
    }
  }
  const ready = (title, rec, force) => show(SE.i18n ? SE.i18n.t("notif_ready") : "جدول آماده شد", title, rec.id, force);
  const failed = (title, rec, force) => show(SE.i18n ? SE.i18n.t("notif_failed") : "ساخت جدول ناموفق بود", title, rec.id, force);
  SE.notify = { init, ensurePermission, show, ready, failed, status: () => perm };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.notify;
})(typeof globalThis !== "undefined" ? globalThis : this);
