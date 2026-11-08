(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const STORAGE_KEY = "weeklySessions";
  const IDS_KEY = "weeklySessionNotificationIds";
  const DAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const $ = (s, root) => (root || document).querySelector(s);

  function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
  }

  function nextOccurrence(day, time, fromDate, leadMinutes) {
    if (!Number.isInteger(day) || day < 0 || day > 6 || !validTime(time)) return null;
    const parts = time.split(":").map(Number);
    const base = new Date(fromDate.getTime());
    base.setHours(0, 0, 0, 0);
    for (let offset = 0; offset <= 7; offset++) {
      const meeting = new Date(base.getTime());
      meeting.setDate(meeting.getDate() + offset);
      if (meeting.getDay() !== day) continue;
      meeting.setHours(parts[0], parts[1], 0, 0);
      const alarm = new Date(meeting.getTime() - Math.max(0, Number(leadMinutes) || 0) * 60000);
      if (alarm.getTime() > fromDate.getTime() + 1000) return { meeting, alarm };
    }
    return null;
  }

  function load() {
    try {
      const value = SE.store.prefs.get(STORAGE_KEY, []);
      return Array.isArray(value) ? value.filter(x => x && x.id && x.title && validTime(x.time) && Number.isInteger(x.day) && x.day >= 0 && x.day <= 6) : [];
    } catch (e) { return []; }
  }
  function save(items) { SE.store.prefs.set(STORAGE_KEY, items); }
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function hash(value) {
    let n = 2166136261;
    for (let i = 0; i < value.length; i++) n = Math.imul(n ^ value.charCodeAt(i), 16777619);
    return (n >>> 0) % 2000000000 || 1;
  }

  async function reschedule() {
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    if (!(SE.platform && SE.platform.isNative && SE.platform.isNative() && p && p.schedule)) return { ok: false, reason: "native-required" };
    const permission = await SE.notify.ensurePermission();
    if (permission !== "granted") return { ok: false, reason: permission };
    const prefs = SE.store.prefs;
    const oldIds = prefs.get(IDS_KEY, []);
    if (oldIds.length && p.cancel) {
      try { await p.cancel({ notifications: oldIds.map(id => ({ id })) }); } catch (e) {}
    }
    const now = new Date();
    const notifications = [];
    load().filter(item => item.enabled !== false).forEach(item => {
      for (let offset = 0; offset < 56; offset++) {
        const meeting = new Date(now.getTime());
        meeting.setHours(0, 0, 0, 0);
        meeting.setDate(meeting.getDate() + offset);
        if (meeting.getDay() !== item.day) continue;
        const [hour, minute] = item.time.split(":").map(Number);
        meeting.setHours(hour, minute, 0, 0);
        const lead = Math.max(0, Number(item.reminder) || 0);
        const alarm = new Date(meeting.getTime() - lead * 60000);
        if (alarm.getTime() <= now.getTime() + 1000) continue;
        const dateKey = [meeting.getFullYear(), meeting.getMonth() + 1, meeting.getDate()].join("-");
        const body = lead ? (item.location ? item.location + " · " : "") + lead + " دقیقه تا شروع جلسه" : (item.location || "زمان شروع جلسه");
        notifications.push({
          id: hash(item.id + ":" + dateKey),
          title: "یادآوری جلسه: " + item.title,
          body,
          schedule: { at: alarm },
          extra: { type: "weekly-session", sessionId: item.id, meetingDate: dateKey }
        });
      }
    });
    if (notifications.length) await p.schedule({ notifications });
    prefs.set(IDS_KEY, notifications.map(n => n.id));
    return { ok: true, count: notifications.length };
  }

  function init(options) {
    options = options || {};
    const root = $("#view-weekly");
    if (!root || root.dataset.initialized) return;
    root.dataset.initialized = "true";
    const form = $("#weekly-form"), list = $("#weekly-list"), status = $("#weekly-status");
    const editId = $("#weekly-edit-id"), title = $("#weekly-title"), day = $("#weekly-day");
    const time = $("#weekly-time"), reminder = $("#weekly-reminder"), location = $("#weekly-location");
    const cancel = $("#weekly-cancel");
    const lang = () => (SE.i18n && SE.i18n.lang) || document.documentElement.lang || "fa";
    const days = () => lang() === "en" ? DAYS_EN : DAYS_FA;
    const say = msg => { if (options.toast) options.toast(msg); else if (status) status.textContent = msg; };

    function render() {
      const items = load().sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
      if (!items.length) { list.innerHTML = '<div class="empty">هنوز جلسه‌ای ثبت نشده است.</div>'; return; }
      list.innerHTML = items.map(item => {
        const lead = Number(item.reminder) || 0;
        return '<article class="weekly-session"><div class="weekly-session-main"><strong>' + escapeHTML(item.title) + '</strong>' +
          '<span>' + escapeHTML(days()[item.day]) + ' · ' + escapeHTML(item.time) + '</span>' +
          (item.location ? '<small>' + escapeHTML(item.location) + '</small>' : '') +
          '<small>' + (lead ? 'یادآوری ' + lead + ' دقیقه قبل' : 'یادآوری در زمان شروع') + '</small></div>' +
          '<div class="weekly-session-actions"><button type="button" data-edit="' + escapeHTML(item.id) + '">ویرایش</button>' +
          '<button type="button" data-delete="' + escapeHTML(item.id) + '">حذف</button></div></article>';
      }).join("");
    }
    function resetForm() {
      form.reset(); editId.value = ""; reminder.value = "10"; time.value = "09:00"; cancel.hidden = true;
    }
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const name = title.value.trim();
      if (!name || !validTime(time.value)) { say("عنوان و ساعت معتبر وارد کنید."); return; }
      const items = load();
      const id = editId.value || ("meeting-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8));
      const record = { id, title: name, day: Number(day.value), time: time.value, reminder: Number(reminder.value), location: location.value.trim(), enabled: true };
      const index = items.findIndex(x => x.id === id);
      if (index >= 0) items[index] = record; else items.push(record);
      save(items); resetForm(); render();
      const result = await reschedule();
      say(result.ok ? "جلسه ذخیره شد؛ یادآورها برای ۸ هفتهٔ آینده تنظیم شدند." : "جلسه ذخیره شد. برای آلارم هنگام بسته بودن برنامه، نسخهٔ اندروید لازم است.");
    });
    list.addEventListener("click", async event => {
      const edit = event.target.closest("[data-edit]"), del = event.target.closest("[data-delete]");
      const items = load();
      if (edit) {
        const item = items.find(x => x.id === edit.getAttribute("data-edit"));
        if (!item) return;
        editId.value = item.id; title.value = item.title; day.value = String(item.day);
        time.value = item.time; reminder.value = String(item.reminder || 0);
        location.value = item.location || ""; cancel.hidden = false; title.focus();
      } else if (del) {
        const id = del.getAttribute("data-delete");
        save(items.filter(x => x.id !== id)); render();
        const result = await reschedule();
        say(result.ok ? "جلسه حذف شد و آلارم‌ها به‌روزرسانی شدند." : "جلسه حذف شد.");
      }
    });
    cancel.addEventListener("click", resetForm);
    render();
    reschedule().catch(() => {});
    g.document.addEventListener("visibilitychange", () => {
      if (g.document.visibilityState === "visible") reschedule().catch(() => {});
    });
  }

  SE.weeklySessions = { init, load, save, validTime, nextOccurrence, reschedule };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.weeklySessions;
})(typeof globalThis !== "undefined" ? globalThis : this);
