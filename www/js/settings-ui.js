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

  window.SE_settingsUI = { renderSoundOptions, renderAlarmToggles, showView };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
