// Offline app-shell cache (browser/PWA use only)
const V = 'se-v24';
const SHELL = [
  './', 'index.html', 'css/app.css', 'css/settings.css', 'manifest.webmanifest', 'icons/icon.svg', 'sounds/adhan.mp3', 'sounds/adhan-fajr.mp3',
  'js/native.js', 'js/i18n.js', 'js/jalali.js', 'js/formulas.js', 'js/solar-api.js',
  'js/sun-local.js', 'js/usno-check.js', 'js/vendor/tz-lookup.js', 'js/cities.js',
  'js/locate.js', 'js/seasons.js', 'js/model.js', 'js/store.js', 'js/platform.js',
  'js/builder.js', 'js/notify.js', 'js/jobs.js', 'js/dates.js', 'js/place.js',
  'js/methods.js', 'js/sounds.js', 'js/alarms.js', 'js/quran-reminder.js',
  'js/zakat-reminder.js', 'js/sabt-reminder.js', 'js/validate.js', 'js/location-bridge.js',
  'js/settings-ui.js', 'js/weekly-sessions.js', 'js/worship-tracker.js', 'js/app.js', 'js/home-dashboard.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(V).then((c) => c.put(e.request, copy));
    return r;
  })));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (list.length) return list[0].focus();
    return clients.openWindow('./');
  }));
});
