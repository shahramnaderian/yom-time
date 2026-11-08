# وضعیت آپلود سورس Yom Time

آخرین به‌روزرسانی: نوامبر ۲۰۲۶

## ✅ آپلود شده و آماده

### ریشه پروژه
- README.md
- package.json
- capacitor.config.ts
- PROGRESS.md

### وب (www/)
- index.html
- manifest.webmanifest
- css/app.css

### ماژول‌های JS
| فایل | وضعیت | توضیح |
|------|--------|--------|
| formulas.js | ✅ کامل | محاسبه اوقات + یک‌سوم و دو‌سوم شب |
| model.js | ✅ کامل | ساخت مدل جدول |
| builder.js | ✅ کامل | خروجی PNG/PDF/Excel |
| jalali.js | ✅ کامل | تقویم جلالی |
| seasons.js | ✅ کامل | تم فصلی |
| store.js | ✅ کامل | تنظیمات محلی |
| native.js | ✅ کامل | Capacitor |
| notify.js | ✅ کامل | پایه اعلان‌ها (آلارم) |
| sun-local.js | ✅ کامل | محاسبه نجومی محلی |
| solar-api.js | ✅ کامل | API طلوع/غروب |
| usno-check.js | ✅ کامل | اعتبارسنجی با USNO |
| platform.js | ✅ کامل | ذخیره فایل و تشخیص نیتیو |
| locate.js | ✅ کامل | GPS + IP |

## ⏳ باقی‌مانده (حجم بالا)
- www/js/app.js (~40KB) – UI اصلی
- www/js/i18n.js (~28KB) – ترجمه‌های فارسی/انگلیسی
- www/js/cities.js + data/world-cities.js (~5MB) – دیتابیس شهرها
- www/js/render-png.js, pdf.js, xlsx.js, viewer.js, jobs.js – رندر و خروجی
- fonts/ و icons/ – فونت و آیکون

این فایل‌ها در مرحله بعدی یا با استفاده از سورس اصلی APK اضافه می‌شوند.

## اولویت بعدی
1. آلارم برای نمازها + یک‌سوم و دو‌سوم شب
2. روش‌های مختلف محاسبه اوقات
3. نمای روزانه + شمارش معکوس
4. قبله و Dark Mode
