# Yom Time — اوقات شرعی

اپلیکیشن محاسبه اوقات شرعی برای هر نقطه جهان، با آلارم، یادآوری قرآن و زکات.

**ریپو:** https://github.com/shahramnaderian/yom-time

## امکانات

- محاسبه اوقات شرعی (چند روش: تهران، MWL، ISNA، …)
- موقعیت دلخواه / GPS دقیق
- تاریخ جلالی + میلادی + قمری
- آلارم نمازها + یک‌سوم و دو‌سوم شب
- انتخاب صدای اذان / زنگ / اعلان
- یادآوری روزانه مطالعه ۲ صفحه قرآن (ساعت ۱۷)
- یادآوری زکات در **روز ۲۹ هر ماه جلالی** (ساعت ۱۰)
- خروجی جدول (PNG / PDF / XLSX)

## اجرا

```bash
cd www && python3 -m http.server 8080
# http://localhost:8080
```

یا با Capacitor برای اندروید:

```bash
npm install
npx cap sync android
npx cap open android
```

## ساخت APK اندروید

با هر push به شاخه `main`، GitHub Actions پروژه Android را ایجاد و APK آزمایشی را می‌سازد. اجرای دستی نیز از زبانه Actions امکان‌پذیر است.

- نام artifact: `yom-time-android-debug-apk`
- مسیر فایل در خروجی: `app-debug.apk`
- این خروجی Debug است و برای نصب و آزمایش است، نه انتشار رسمی در فروشگاه.

فایل‌های اذان عبدالباسط هنگام ساخت APK از مخزن [Kiwifu/adhan-mp3](https://github.com/Kiwifu/adhan-mp3) دریافت می‌شوند. منبع آن‌ها را برای استفاده در اپلیکیشن‌های اسلامی و نرم‌افزارهای اوقات نماز آزاد معرفی کرده است؛ انتساب منبع در `www/sounds/README.md` ثبت شده است.

## یادآوری‌ها

| مورد | زمان پیش‌فرض |
|------|----------------|
| قرآن (۲ صفحه) | هر روز ۱۷:۰۰ |
| زکات | روز **۲۹** جلالی، ساعت ۱۰:۰۰ |

قابل تغییر از تب **تنظیمات**.

## ساختار

```
www/js/app.js              UI
www/js/methods.js          محاسبه
www/js/place.js, locate.js مکان / GPS
www/js/alarms.js, sounds.js آلارم
www/js/quran-reminder.js   قرآن
www/js/zakat-reminder.js   زکات (روز ۲۹)
www/js/dates.js            تقویم سه‌گانه
www/js/settings-ui.js      تنظیمات
```
