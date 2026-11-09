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
    if (!LN) LN = SE.native && SE.native.plugin ? SE.native.plugin("LocalNotifications") : null;
    return LN;
  }


  async function ensureChannels() {
    if (!native()) return true;
    const p = plugin();
    if (!p || !p.createChannel) return false;
    const channels = [
      { id: "prayer-adhan", name: "اذان", description: "صدای اذان برای اوقات نماز", importance: 5, sound: "adhan.mp3", vibration: true },
      { id: "prayer-adhan-fajr", name: "اذان صبح", description: "صدای اذان صبح", importance: 5, sound: "adhan_fajr.mp3", vibration: true },
      { id: "prayer-silent", name: "آلارم بی‌صدا", description: "اعلان بدون صدا برای اوقات نماز", importance: 3, vibration: false },
      { id: "night-adhan", name: "اذان رویدادهای شب", description: "پخش اذان برای پایان شب و یک‌سوم و دوسوم شب", importance: 5, sound: "adhan.mp3", vibration: true },
      { id: "night-ringtone", name: "زنگ رویدادهای شب", description: "صدای زنگ پیش‌فرض گوشی برای رویدادهای شب", importance: 5, vibration: true },
      { id: "custom-reminder-adhan", name: "اذان یادآوری دلخواه", description: "پخش اذان برای یادآوری روزانه دلخواه", importance: 5, sound: "adhan.mp3", vibration: true },
      { id: "custom-reminder-ringtone", name: "زنگ یادآوری دلخواه", description: "صدای پیش‌فرض گوشی برای یادآوری روزانه دلخواه", importance: 5, vibration: true },
      { id: "home-event-adhan", name: "اذان اوقات شرعی", description: "اذان برای هشدارهای انتخابی نماز و رویدادهای شب", importance: 5, sound: "adhan.mp3", vibration: true },
      { id: "home-event-ringtone", name: "زنگ اوقات شرعی", description: "زنگ پیش‌فرض گوشی برای هشدارهای انتخابی نماز و رویدادهای شب", importance: 5, vibration: true }
    ];
    try {
      for (const channel of channels) await p.createChannel(channel);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function ensurePermission() {
    try {
      if (native()) {
        const p = plugin();
        if (!p) return perm = "unsupported";
        let r = await p.checkPermissions();
        if (r.display !== "granted") r = await p.requestPermissions();
        if (r.display === "granted") await ensureChannels();
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
        await p.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 2e9),
            title,
            body,
            extra: { recId }
          }]
        });
        return true;
      }
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
      const opts = { body, tag: String(recId || ""), lang: "fa", dir: "rtl", icon: "icons/icon-192.png" };
      try {
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, Object.assign({ data: { recId } }, opts));
          return true;
        }
      } catch (e) {}
      const n = new Notification(title, opts);
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
        const id = ev && ev.notification && ev.notification.extra && (ev.notification.extra.recId || ev.notification.extra.type);
        if (id && onOpen) onOpen(id);
      });
    }
    if (g.navigator && navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data && e.data.recId && onOpen) onOpen(e.data.recId);
      });
    }
  }

  const ready = (title, rec, force) => show(SE.i18n ? SE.i18n.t("notif_ready") : "جدول آماده شد", title, rec && rec.id, force);
  const failed = (title, rec, force) => show(SE.i18n ? SE.i18n.t("notif_failed") : "ساخت جدول ناموفق بود", title, rec && rec.id, force);

  SE.notify = {
    init,
    ensurePermission,
    show,
    ready,
    failed,
    plugin,
    status: () => perm
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.notify;
})(typeof globalThis !== "undefined" ? globalThis : this);
