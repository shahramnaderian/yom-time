(function() {
  "use strict";
  const SE = window.SE;

  function t(key, fallback) {
    try {
      if (SE.i18n && SE.i18n.t) {
        const v = SE.i18n.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback || key;
  }

  function lang() {
    return (SE.i18n && SE.i18n.lang) || document.documentElement.lang || "fa";
  }

  function renderSoundOptions() {
    const box = document.getElementById("sound-options");
    if (!box || !SE.sounds) return;

    const opts = SE.sounds.listOptions(lang());
    box.innerHTML = opts.map((o) => {
      const pressed = o.selected ? "true" : "false";
      const cls = o.selected ? "sound-opt selected" : "sound-opt";
      return (
        '<button type="button" class="' + cls + '" data-sound="' + o.id + '" role="radio" aria-checked="' + pressed + '">' +
          '<span class="sound-icon">' + o.icon + '</span>' +
          '<span class="sound-label">' + o.label + '</span>' +
          (o.selected ? '<span class="sound-check">✓</span>' : '') +
        '</button>'
      );
    }).join("");

    box.querySelectorAll("[data-sound]").forEach((btn) => {
      btn.addEventListener("click", () => {
        SE.sounds.setSoundPref(btn.getAttribute("data-sound"));
        renderSoundOptions();
        toast(t("sound_saved", lang() === "en" ? "Sound saved" : "صدا ذخیره شد"));
      });
    });
  }

  function renderAlarmToggles() {
    const box = document.getElementById("alarm-toggles");
    if (!box || !SE.alarms) return;

    const enabled = SE.alarms.getEnabled();
    const types = SE.alarms.ALARM_TYPES;
    const isFa = lang() !== "en";

    box.innerHTML = types.map((ty) => {
      const on = !!enabled[ty.key];
      return (
        '<label class="alarm-row">' +
          '<span class="alarm-name">' + (isFa ? ty.labelFa : ty.labelEn) + '</span>' +
          '<input type="checkbox" data-alarm="' + ty.key + '" ' + (on ? "checked" : "") + '>' +
          '<span class="switch"></span>' +
        '</label>'
      );
    }).join("");

    box.querySelectorAll("[data-alarm]").forEach((input) => {
      input.addEventListener("change", () => {
        SE.alarms.toggle(input.getAttribute("data-alarm"), input.checked);
        toast(t("alarms_saved", isFa ? "آلارم‌ها ذخیره شد" : "Alarms saved"));
      });
    });
  }


  function renderReminderControls() {
    const q = SE.quranReminder && SE.quranReminder.getSettings ? SE.quranReminder.getSettings() : null;
    const z = SE.zakatReminder && SE.zakatReminder.getSettings ? SE.zakatReminder.getSettings() : null;
    const sabt = SE.sabtReminder && SE.sabtReminder.getSettings ? SE.sabtReminder.getSettings() : null;
    if (q) {
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
      const enabled = document.getElementById("quran-enabled");
      if (enabled) enabled.checked = !!q.enabled;
      set("quran-hour", q.hour); set("quran-minute", q.minute); set("quran-pages", q.pages);
    }
    if (z) {
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
      const enabled = document.getElementById("zakat-enabled");
      if (enabled) enabled.checked = !!z.enabled;
      set("zakat-day", z.day); set("zakat-hour", z.hour); set("zakat-minute", z.minute);
    }
    if (sabt) {
      const enabled = document.getElementById("sabt-enabled");
      if (enabled) enabled.checked = !!sabt.enabled;
      const hour = document.getElementById("sabt-hour");
      const minute = document.getElementById("sabt-minute");
      if (hour) hour.value = sabt.hour;
      if (minute) minute.value = sabt.minute;
    }
  }

  function bindReminderControls() {
    const qEnabled = document.getElementById("quran-enabled");
    const zEnabled = document.getElementById("zakat-enabled");
    const sabtEnabled = document.getElementById("sabt-enabled");
    const qFields = ["quran-hour", "quran-minute", "quran-pages"];
    const zFields = ["zakat-day", "zakat-hour", "zakat-minute"];
    const sabtFields = ["sabt-hour", "sabt-minute"];

    if (qEnabled && !qEnabled.dataset.bound) {
      qEnabled.dataset.bound = "1";
      qEnabled.addEventListener("change", async () => {
        if (!SE.quranReminder) return;
        if (qEnabled.checked) await SE.quranReminder.enable();
        else await SE.quranReminder.disable();
        toast(lang() === "en" ? "Quran reminder updated" : "یادآوری قرآن به‌روزرسانی شد");
      });
    }
    if (sabtEnabled && !sabtEnabled.dataset.bound) {
      sabtEnabled.dataset.bound = "1";
      sabtEnabled.addEventListener("change", async () => {
        if (!SE.sabtReminder) return;
        if (sabtEnabled.checked) await SE.sabtReminder.enable({ lang: lang() });
        else await SE.sabtReminder.disable();
        toast(lang() === "en" ? "Saturday reminder updated" : "یادآوری یوم سبت به‌روزرسانی شد");
      });
    }
    if (zEnabled && !zEnabled.dataset.bound) {
      zEnabled.dataset.bound = "1";
      zEnabled.addEventListener("change", async () => {
        if (!SE.zakatReminder) return;
        if (zEnabled.checked) await SE.zakatReminder.enable();
        else await SE.zakatReminder.disable();
        toast(lang() === "en" ? "Zakat reminder updated" : "یادآوری زکات به‌روزرسانی شد");
      });
    }

    const saveFields = (ids, module, label) => ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("change", async () => {
        const values = {};
        ids.forEach((field) => {
          const input = document.getElementById(field);
          if (input) values[field.replace(label + "-", "")] = Number(input.value);
        });
        const cfg = module.getSettings();
        const map = label === "quran"
          ? { hour: values.hour, minute: values.minute, pages: values.pages }
          : { day: values.day, hour: values.hour, minute: values.minute };
        Object.keys(map).forEach((key) => {
          const n = map[key];
          const max = key === "hour" ? 23 : key === "minute" ? 59 : key === "day" ? 31 : 50;
          const min = key === "pages" || key === "day" ? 1 : 0;
          if (!Number.isInteger(n) || n < min || n > max) map[key] = cfg[key];
        });
        module.setSettings(map);
        if (cfg.enabled) await module.enable();
        toast(lang() === "en" ? label + " reminder saved" : "تنظیم یادآوری ذخیره شد");
      });
    });
    if (SE.quranReminder) saveFields(qFields, SE.quranReminder, "quran");
    if (SE.zakatReminder) saveFields(zFields, SE.zakatReminder, "zakat");
    sabtFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("change", async () => {
        const hour = Number(document.getElementById("sabt-hour").value);
        const minute = Number(document.getElementById("sabt-minute").value);
        const cfg = SE.sabtReminder.getSettings();
        SE.sabtReminder.setSettings({
          hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : cfg.hour,
          minute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : cfg.minute
        });
        if (cfg.enabled) await SE.sabtReminder.enable({ lang: lang() });
        toast(lang() === "en" ? "Saturday reminder saved" : "زمان یادآوری یوم سبت ذخیره شد");
      });
    });
    const sabtTest = document.getElementById("sabt-test");
    if (sabtTest && !sabtTest.dataset.bound) {
      sabtTest.dataset.bound = "1";
      sabtTest.addEventListener("click", async () => {
        const r = await SE.sabtReminder.testNow(lang());
        toast(r && r.ok ? (lang() === "en" ? "Test notification sent" : "اعلان آزمایشی ارسال شد") : (lang() === "en" ? "Notification permission required" : "اجازه اعلان لازم است"));
      });
    }

    const qTest = document.getElementById("quran-test");
    if (qTest && !qTest.dataset.bound) {
      qTest.dataset.bound = "1";
      qTest.addEventListener("click", async () => {
        const r = await SE.quranReminder.testNow(lang());
        toast(r && r.ok ? (lang() === "en" ? "Test notification sent" : "اعلان آزمایشی ارسال شد") : (lang() === "en" ? "Notification permission required" : "اجازه اعلان لازم است"));
      });
    }
    const zTest = document.getElementById("zakat-test");
    if (zTest && !zTest.dataset.bound) {
      zTest.dataset.bound = "1";
      zTest.addEventListener("click", async () => {
        const r = await SE.zakatReminder.testNow(lang());
        toast(r && r.ok ? (lang() === "en" ? "Test notification sent" : "اعلان آزمایشی ارسال شد") : (lang() === "en" ? "Notification permission required" : "اجازه اعلان لازم است"));
      });
    }
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach((v) => {
      v.hidden = v.id !== "view-" + name;
    });
    document.querySelectorAll(".tabbar a").forEach((a) => {
      const active = a.getAttribute("data-tab") === name;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (name === "settings") {
      renderSoundOptions();
      renderAlarmToggles();
      renderReminderControls();
      bindReminderControls();
    }
  }

  function bind() {
    const prev = document.getElementById("sound-preview");
    if (prev) {
      prev.addEventListener("click", async () => {
        if (!SE.sounds) return;
        prev.disabled = true;
        try {
          const r = await SE.sounds.preview();
          if (r && r.silent) toast(lang() === "en" ? "Silent" : "بی‌صدا");
          else if (r && r.ok === false) toast(lang() === "en" ? "Add adhan.mp3 to sounds/" : "فایل اذان یافت نشد (sounds/adhan.mp3)");
        } finally {
          prev.disabled = false;
        }
      });
    }

    document.querySelectorAll(".tabbar a[data-tab]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const tab = a.getAttribute("data-tab");
        if (tab === "settings") {
          e.preventDefault();
          location.hash = "#/settings";
          showView("settings");
        }
      });
    });

    function onHash() {
      const h = (location.hash || "").replace(/^#\/?/, "");
      if (h === "settings") showView("settings");
    }
    window.addEventListener("hashchange", onHash);
    if ((location.hash || "").indexOf("settings") >= 0) onHash();
  }

  function init() {
    bind();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(bind, 0));
    }
  }

  window.SE_settingsUI = { renderSoundOptions, renderAlarmToggles, renderReminderControls, showView };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
