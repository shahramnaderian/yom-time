# وضعیت سورس Yom Time

## ✅ سورس کامل و قابل اجرا روی GitHub

همه ماژول‌های ضروری آپلود شده‌اند:

- `app.js` — UI کامل (سال/ماه، شهر، GPS، ساخت جدول، آلارم)
- `cities.js` / `place.js` — جستجوی شهر و هر نقطه جهان
- `methods.js` — روش‌های محاسبه اوقات
- `alarms.js` / `sounds.js` — آلارم + انتخاب اذان/زنگ
- `dates.js` — جلالی + میلادی + قمری
- `locate.js` — GPS دقیق
- `settings-ui.js` — صفحه تنظیمات
- `validate.js` / `jobs.js` / `store.js` / …

## اختیاری (هنوز محلی)

| فایل | توضیح |
|------|--------|
| `www/data/world-cities.js` (~5MB) | دیتابیس خیلی بزرگ شهرها |
| `www/fonts/*.woff2` | فونت وزیرمتن |
| `www/icons/icon-*.png` | آیکون PNG |
| `www/js/vendor/tz-lookup.js` | timezone دقیق‌تر |

بدون این‌ها اپ کار می‌کند (شهرهای نمونه + تقریب timezone).

ریپو: https://github.com/shahramnaderian/yom-time
