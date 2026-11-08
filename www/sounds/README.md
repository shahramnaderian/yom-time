# فایل‌های اذان

برای پخش اذان به‌جای زنگ، فایل‌های صوتی را اینجا قرار دهید:

| فایل | کاربرد |
|------|--------|
| `adhan.mp3` | اذان عمومی |
| `adhan-fajr.mp3` | اذان صبح (اختیاری) |

## اندروید (Capacitor)

```
android/app/src/main/res/raw/adhan.mp3
android/app/src/main/res/raw/adhan_fajr.mp3
```

نام در `res/raw` فقط حروف کوچک و زیرخط.

## انتخاب در اپ

```js
SE.sounds.setSoundPref("adhan");   // اذان
SE.sounds.setSoundPref("default"); // صدای اعلان
SE.sounds.setSoundPref("system");  // زنگ گوشی
SE.sounds.setSoundPref("silent");  // بی‌صدا
SE.sounds.preview("adhan");        // پیش‌نمایش
```
