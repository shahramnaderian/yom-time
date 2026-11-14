(function () {
  "use strict";
  const SE = window.SE = window.SE || {};
  const translations = {
    "محاسبهٔ اوقات شرعی":"Prayer Times",
    "شهر محاسبهٔ اوقات شرعی":"City for prayer times",
    "نام شهر را جست‌وجو کنید":"Search for a city",
    "انتخاب شهر":"Select city",
    "اوقات شرعی مریوان":"Prayer times",
    "انتخاب تاریخ":"Select date",
    "امروز":"Today",
    "رویداد بعدی":"Next event",
    "زمان باقی‌مانده تا رویداد بعدی":"Time until the next event",
    "اوقات شرعی امروز":"Today's prayer times",
    "یادآوری دلخواه روزانه":"Custom daily reminder",
    "یک ساعت و متن دلخواه تعیین کنید تا هر روز در همان زمان به شما یادآوری شود.":"Set a time and a custom message for a daily reminder.",
    "فعال‌سازی یادآوری روزانه":"Enable daily reminder",
    "ساعت یادآوری":"Reminder time",
    "متن یادآوری":"Reminder message",
    "صدای یادآوری":"Reminder sound",
    "زنگ گوشی":"Phone ringtone",
    "اذان":"Adhan",
    "ذخیره یادآوری":"Save reminder",
    "آزمایش یادآوری":"Test reminder",
    "تنظیمات کامل برنامه":"Full app settings",
    "سال و ماه":"Year and month",
    "شهر":"City",
    "فرمت خروجی":"Export format",
    "ثبت درخواست جدول":"Generate table",
    "بایگانی":"Archive",
    "هنوز جدولی نساخته‌اید.":"You haven't created a table yet.",
    "پیگیری عبادت روزانه":"Daily worship tracker",
    "چطور ستاره بگیرم؟":"How do I earn stars?",
    "هر نماز: ۱۰ ⭐ · هر صفحه قرآن: ۲ ⭐ · هر ۱۰ ذکر: ۱ ⭐":"Each prayer: 10 ⭐ · Each Quran page: 2 ⭐ · Every 10 dhikr: 1 ⭐",
    "پنج نماز کامل: ۲۰ ستاره جایزه · ۱۰ صفحه قرآن در روز: ۱۰ ستاره جایزه":"Complete all five prayers: 20 bonus stars · Read 10 Quran pages a day: 10 bonus stars",
    "برای حفظ تعادل، امتیاز قرآن و ذکر روزانه سقف دارد؛ این ستاره‌ها امتیاز تشویقی‌اند و ارزش مالی ندارند.":"Daily Quran and dhikr points are capped for balance. Stars are reward points and have no monetary value.",
    "ثبت فعالیت‌های روزانه":"Log daily activities",
    "تاریخ":"Date",
    "نمازهای روزانه":"Daily prayers",
    "تعداد صفحه‌های قرآن":"Number of Quran pages",
    "تعداد ذکرها":"Number of dhikr",
    "گزارش هفت روز اخیر":"Last seven days",
    "جلسات هفتگی":"Weekly sessions",
    "ثبت جلسهٔ جدید":"Add a session",
    "عنوان جلسه":"Session title",
    "روز هفته":"Day of week",
    "شنبه":"Saturday",
    "یکشنبه":"Sunday",
    "دوشنبه":"Monday",
    "سه‌شنبه":"Tuesday",
    "چهارشنبه":"Wednesday",
    "پنجشنبه":"Thursday",
    "جمعه":"Friday",
    "ساعت":"Time",
    "مکان یا لینک جلسه (اختیاری)":"Location or meeting link (optional)",
    "زمان یادآوری":"Reminder time",
    "در زمان شروع":"At start time",
    "۵ دقیقه قبل":"5 minutes before",
    "۱۰ دقیقه قبل":"10 minutes before",
    "۱۵ دقیقه قبل":"15 minutes before",
    "۳۰ دقیقه قبل":"30 minutes before",
    "۱ ساعت قبل":"1 hour before",
    "۱ روز قبل":"1 day before",
    "ذخیرهٔ جلسه":"Save session",
    "لغو ویرایش":"Cancel editing",
    "برنامهٔ هفتگی من":"My weekly schedule",
    "جلسه‌ها هر هفته در روز و ساعت ثبت‌شده تکرار می‌شوند.":"Sessions repeat every week on the selected day and time.",
    "تنظیمات":"Settings",
    "جدول ماهانه":"Monthly table",
    "ساخت جدول اوقات شرعی ماهانه و دریافت خروجی PDF و اکسل":"Create a monthly prayer-times table and export it as PDF or Excel.",
    "ساخت جدول ماهانه و دریافت خروجی PDF و اکسل ←":"Create monthly table and export PDF / Excel ←",
    "نمایش تاریخ‌ها در بالای صفحه":"Date display options",
    "نمایش تاریخ میلادی":"Show Gregorian date",
    "نمایش تاریخ قمری":"Show Hijri date",
    "تاریخ شمسی همیشه نمایش داده می‌شود. انتخاب‌های شما ذخیره خواهند شد.":"The Solar Hijri date is always shown. Your preferences will be saved.",
    "صدای اعلان اوقات":"Prayer alarm sound",
    "برای آلارم نمازها و یک‌سوم / دو‌سوم شب؛ زنگ‌های شاد به‌صورت آفلاین داخل برنامه هستند.":"For prayer and night-third alarms. Chime sounds are built into the app and work offline.",
    "پخش نمونه":"Preview sound",
    "آلارم‌های فعال":"Enabled alarms",
    "یادآوری مطالعه قرآن (۲ صفحه)":"Quran reading reminder (2 pages)",
    "دقیقه":"Minutes",
    "تعداد صفحه":"Number of pages",
    "آزمایش یادآوری قرآن":"Test Quran reminder",
    "یادآوری زکات":"Zakat reminder",
    "فعال‌سازی یادآوری ماهانه":"Enable monthly reminder",
    "روز ماه شمسی":"Solar Hijri day",
    "آزمایش یادآوری زکات":"Test zakat reminder",
    "یادآوری یوم سبت":"Yom Shabbat reminder",
    "هر شنبه: یوم سبت؛ خرید و فروش ممنوع":"Every Saturday: Yom Shabbat; buying and selling are prohibited.",
    "فعال‌سازی یادآوری هفتگی شنبه":"Enable weekly Saturday reminder",
    "زمان اعلان به‌صورت خودکار از ستون «شروع روز» در جدول همان شنبه خوانده می‌شود.":"The notification time is read automatically from the “Day begins” column for that Saturday.",
    "آزمایش یادآوری یوم سبت":"Test Yom Shabbat reminder",
    "اوقات شرعی":"Prayer times",
    "عبادت":"Worship",
    "جلسات":"Sessions",
    "نام شهر را جست‌وجو کنید":"Search for a city",
    "موقعیت من (GPS)":"My location (GPS)",
    "فعال‌سازی یادآوری هفتگی شنبه":"Enable weekly Saturday reminder"
  };
  const attributes = ["placeholder", "aria-label", "title"];
  function isEnglish() { return (SE.i18n && SE.i18n.lang) === "en" || document.documentElement.lang === "en"; }
  function translateText(value) {
    let out = value;
    if (Object.prototype.hasOwnProperty.call(translations, out.trim())) {
      const lead = out.match(/^\s*/)[0], tail = out.match(/\s*$/)[0];
      return lead + translations[out.trim()] + tail;
    }
    const partial = [
      ["یادآوری در زمان شروع", "Reminder at start time"],
      ["یادآوری ", "Reminder "],
      [" دقیقه قبل", " minutes before"],
      [" دقیقه", " minutes"],
      ["ستاره تا سطح ", "stars to level "],
      ["سطح ", "Level "],
      [" روز پیوسته", " consecutive days"],
      ["نمازهای ثبت‌شده", "Prayers logged"],
      ["صفحه قرآن", "Quran pages"],
      ["ذکر", "Dhikr"],
      ["موجودی ستاره‌های تو", "Your star balance"],
      ["به بالاترین سطح فعلی رسیدی؛ آفرین!", "You've reached the highest available level. Well done!"]
    ];
    partial.forEach(([fa, en]) => { out = out.split(fa).join(en); });
    return out;
  }
  function apply() {
    const en = isEnglish();
    document.documentElement.lang = en ? "en" : "fa";
    document.documentElement.dir = en ? "ltr" : "rtl";
    const button = document.getElementById("lang");
    if (button) button.textContent = en ? "فارسی" : "English";
    if (!en) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const next = translateText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    document.querySelectorAll("input,textarea,button,select,[aria-label],[title]").forEach(el => {
      attributes.forEach(attr => {
        if (el.hasAttribute(attr)) {
          const old = el.getAttribute(attr), next = translateText(old);
          if (next !== old) el.setAttribute(attr, next);
        }
      });
      if (el.tagName === "OPTION") {
        const next = translateText(el.textContent);
        if (next !== el.textContent) el.textContent = next;
      }
    });
    if (window.SE_refreshDateBar) window.SE_refreshDateBar();
    if (window.SE_settingsUI) {
      window.SE_settingsUI.renderSoundOptions();
      window.SE_settingsUI.renderAlarmToggles();
      window.SE_settingsUI.renderReminderControls();
    }
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; apply(); }, 30);
  }
  document.addEventListener("click", event => {
    if (event.target && (event.target.id === "lang" || event.target.closest && event.target.closest("#lang"))) setTimeout(schedule, 80);
  }, true);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  const rootObserver = new MutationObserver(schedule);
  rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();
  SE.localization = { apply };
})();