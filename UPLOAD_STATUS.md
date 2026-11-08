# وضعیت آپلود سورس

## روی GitHub هست
ماژول‌های محاسبه، آلارم، تاریخ سه‌گانه، مکان/GPS، روش‌های محاسبه، تنظیمات صدا، validate، place، methods، locate، dates، settings-ui

## فایل‌های بزرگ باقی‌مانده (محلی)

| فایل | حجم تقریبی | نقش |
|------|------------|-----|
| `www/js/app.js` | 40 KB | UI اصلی |
| `www/js/cities.js` | 23 KB | جستجوی شهر |
| `www/js/i18n.js` | 28 KB | ترجمه |
| `www/js/vendor/tz-lookup.js` | 73 KB | منطقه زمانی |
| `www/js/jobs.js` | 6 KB | صف ساخت جدول |
| `www/js/xlsx.js` | 14 KB | خروجی اکسل |
| `www/js/viewer.js` | 6 KB | نمایشگر |
| `www/js/pdf.js` | 4 KB | PDF |
| `www/js/render-png.js` | 5 KB | تصویر |
| `www/fonts/*.woff2` | ~150 KB | فونت |
| `www/icons/icon-*.png` | ~110 KB | آیکون |
| `www/data/world-cities.js` | ~5 MB | دیتابیس شهرهای جهان (اختیاری) |

## آپلود کامل از سیستم خودتان

```bash
git clone https://github.com/shahramnaderian/yom-time.git
cd yom-time
# فایل‌های بالا را از سورس استخراج‌شده کپی کنید
git add -A
git commit -m "complete source upload"
git push
```

یا در GitHub → **Add file → Upload files** فایل‌ها را بکشید.
