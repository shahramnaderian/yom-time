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


  function renderCustomReminder() {
    const prefs = SE.store && SE.store.prefs;
    const cfg = prefs ? prefs.get("customDailyReminder", {enabled:false,time:"09:00",text:"زمان انجام کار دلخواه شماست",sound:"system"}) : {enabled:false,time:"09:00",text:"زمان انجام کار دلخواه شماست",sound:"system"};
    const enabled=document.getElementById("custom-reminder-enabled"),time=document.getElementById("custom-reminder-time"),text=document.getElementById("custom-reminder-text"),sound=document.getElementById("custom-reminder-sound");
    if(enabled)enabled.checked=!!cfg.enabled;if(time)time.value=cfg.time||"09:00";if(text)text.value=cfg.text||"";if(sound)sound.value=cfg.sound||"system";
  }

  function bindCustomReminder() {
    const save=document.getElementById("custom-reminder-save"),test=document.getElementById("custom-reminder-test");
    const read=()=>({enabled:!!document.getElementById("custom-reminder-enabled").checked,time:document.getElementById("custom-reminder-time").value,text:document.getElementById("custom-reminder-text").value.trim(),sound:document.getElementById("custom-reminder-sound").value});
    const status=document.getElementById("custom-reminder-status");
    if(save&&!save.dataset.bound){save.dataset.bound="1";save.addEventListener("click",async()=>{
      const cfg=read();if(!cfg.time||!cfg.text){if(status)status.textContent="ساعت و متن یادآوری را وارد کنید.";return;}
      if(SE.store&&SE.store.prefs)SE.store.prefs.set("customDailyReminder",cfg);
      const r=await SE.alarms.scheduleCustomReminder(cfg);
      if(status)status.textContent=r.ok?(cfg.enabled?"یادآوری روزانه ذخیره شد و برای ۳۰ روز آینده زمان‌بندی شد.":"یادآوری خاموش شد."):(r.reason==="native_required"?"برای زمان‌بندی پایدار، از نسخه نصب‌شده اندروید استفاده کنید.":r.reason==="denied"?"اجازه اعلان را در تنظیمات گوشی فعال کنید.":"زمان‌بندی یادآوری انجام نشد.");
      toast(r.ok?"تنظیم یادآوری ذخیره شد":"تنظیم ذخیره شد؛ زمان‌بندی اعلان نیاز به بررسی دارد");
    });}
    if(test&&!test.dataset.bound){test.dataset.bound="1";test.addEventListener("click",async()=>{
      const cfg=read();if(!cfg.text){if(status)status.textContent="متن یادآوری را وارد کنید.";return;}
      const permission=SE.notify&&SE.notify.ensurePermission?await SE.notify.ensurePermission():"denied";
      if(permission!=="granted"){if(status)status.textContent="برای آزمایش، اجازه اعلان را فعال کنید.";return;}
      if(SE.notify&&SE.notify.show)await SE.notify.show("یادآوری دلخواه",cfg.text,"custom-reminder",true);
      if(SE.sounds&&SE.sounds.onAlarmFire)await SE.sounds.onAlarmFire("custom-reminder","یادآوری دلخواه",cfg.text,{soundMode:cfg.sound==="adhan"?"adhan":"system"});
      if(status)status.textContent="اعلان آزمایشی ارسال شد.";
    });}
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
    }
  }

  function bindReminderControls() {
    const qEnabled = document.getElementById("quran-enabled");
    const zEnabled = document.getElementById("zakat-enabled");
    const sabtEnabled = document.getElementById("sabt-enabled");
    const qFields = ["quran-hour", "quran-minute", "quran-pages"];
    const zFields = ["zakat-day", "zakat-hour", "zakat-minute"];

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

  function bindQibla() {
    const view = document.getElementById("view-home");
    if (!view) return;
    let card = document.getElementById("qibla-card");
    if (!card) {
      card = document.createElement("div");
      card.className = "card";
      card.id = "qibla-card";
      card.innerHTML =
        '<div class="card-title"><span class="settings-icon">🧭</span>' + (lang() === "en" ? "Qibla direction" : "قبله‌یاب") + '</div>' +
        '<p class="hint">' + (lang() === "en" ? "Find the direction to the Kaaba using your current location and phone compass." : "برای نمایش جهت کعبه، موقعیت مکانی و قطب‌نمای گوشی استفاده می‌شود.") + '</p>' +
        '<div id="qibla-compass" style="width:164px;height:164px;border:2px solid var(--line);border-radius:50%;margin:14px auto;display:flex;align-items:center;justify-content:center;position:relative;background:var(--surface,#fff)">' +
          '<span style="position:absolute;top:8px;font-weight:700">N</span><span id="qibla-arrow" style="font-size:66px;line-height:1;color:var(--brand,#C22928);transform:rotate(0deg);transition:transform .15s">↑</span>' +
        '</div>' +
        '<p id="qibla-degree" style="text-align:center;font-weight:700;margin:6px 0"></p>' +
        '<p id="qibla-status" class="hint" role="status" aria-live="polite">' + (lang() === "en" ? "Tap the button to determine your direction." : "برای تعیین جهت قبله، دکمه را بزنید.") + '</p>' +
        '<button type="button" id="qibla-start" class="primary">' + (lang() === "en" ? "Find Qibla" : "یافتن جهت قبله") + '</button>';
      const first = view.querySelector(".card");
      view.insertBefore(card, first || view.firstChild);
    }
    const btn = card.querySelector("#qibla-start");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
      const status = card.querySelector("#qibla-status");
      const degree = card.querySelector("#qibla-degree");
      const arrow = card.querySelector("#qibla-arrow");
      const isEn = lang() === "en";
      btn.disabled = true;
      status.textContent = isEn ? "Getting your location…" : "در حال دریافت موقعیت مکانی…";
      try {
        if (!SE.locate || !SE.locate.locate) throw new Error(isEn ? "Location service unavailable" : "سرویس موقعیت مکانی در دسترس نیست");
        const pos = await SE.locate.locate({ ask: true, ipFallback: false, timeout: 20000 });
        const lat1 = pos.lat * Math.PI / 180, lon1 = pos.lng * Math.PI / 180;
        const lat2 = 21.4225 * Math.PI / 180, lon2 = 39.8262 * Math.PI / 180;
        const dLon = lon2 - lon1;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        degree.textContent = (isEn ? "Qibla bearing: " : "زاویه قبله از شمال: ") + Math.round(bearing) + "°";
        status.textContent = isEn ? "Turn your phone flat and allow compass access if prompted." : "گوشی را افقی نگه دارید؛ در صورت درخواست، دسترسی قطب‌نما را تأیید کنید.";
        const update = (e) => {
          let heading = null;
          if (typeof e.webkitCompassHeading === "number") heading = e.webkitCompassHeading;
          else if (e.absolute && typeof e.alpha === "number") heading = (360 - e.alpha) % 360;
          else if (typeof e.alpha === "number") heading = (360 - e.alpha) % 360;
          if (heading != null && Number.isFinite(heading)) arrow.style.transform = "rotate(" + (bearing - heading) + "deg)";
        };
        if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function") {
          const permission = await window.DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") throw new Error(isEn ? "Compass permission denied" : "اجازه استفاده از قطب‌نما داده نشد");
        }
        window.removeEventListener("deviceorientation", update);
        window.removeEventListener("deviceorientationabsolute", update);
        window.addEventListener("deviceorientation", update, true);
        window.addEventListener("deviceorientationabsolute", update, true);
        btn.textContent = isEn ? "Refresh direction" : "به‌روزرسانی جهت";
      } catch (e) {
        status.textContent = e && e.code === "DENIED"
          ? (isEn ? "Location permission denied. Enable it in phone settings." : "اجازه موقعیت مکانی داده نشد؛ آن را در تنظیمات گوشی فعال کنید.")
          : String(e && e.message || (isEn ? "Could not determine Qibla." : "تعیین جهت قبله ممکن نشد."));
      } finally { btn.disabled = false; }
    });
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
      renderCustomReminder();
      bindCustomReminder();
      bindQibla();
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
