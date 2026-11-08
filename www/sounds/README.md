# فایل‌های اذان

فایل‌های زیر هنگام ساخت APK اندروید توسط GitHub Actions دریافت و در بسته برنامه قرار می‌گیرند:

- `adhan.mp3` — اذان عمومی با صدای عبدالباسط عبدالصمد
- `adhan-fajr.mp3` — اذان صبح با صدای عبدالباسط عبدالصمد

در اندروید نیز نسخه‌های اعلان در مسیر `android/app/src/main/res/raw/` با نام‌های `adhan.mp3` و `adhan_fajr.mp3` قرار می‌گیرند.

## منبع و انتساب

منبع فایل‌ها: [Kiwifu/adhan-mp3](https://github.com/Kiwifu/adhan-mp3)، فایل‌های عبدالباسط عبدالصمد (مصر). توضیحات مخزن منبع، استفاده در اپلیکیشن‌های اسلامی و نرم‌افزارهای اوقات نماز را آزاد معرفی می‌کند. پیش از انتشار تجاری، شرایط مجوز هر ضبط را دوباره بررسی کنید.

## انتخاب صدا در برنامه

```js
SE.sounds.setSoundPref("adhan");   // اذان
SE.sounds.setSoundPref("default"); // صدای اعلان
SE.sounds.setSoundPref("system");  // صدای گوشی
SE.sounds.setSoundPref("silent");  // بی‌صدا
SE.sounds.preview("adhan");        // پیش‌نمایش
```
