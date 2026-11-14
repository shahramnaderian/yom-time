(function () {
  "use strict";
  var SE = window.SE = window.SE || {};
  var WGS84 = { a: 6378137, f: 1 / 298.257223563 };
  var KAABA = { lat: 21.422487, lng: 39.826206 };

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  function sphericalInverse(lat1, lng1, lat2, lng2) {
    var φ1 = toRad(lat1), φ2 = toRad(lat2);
    var Δλ = toRad(lng2 - lng1);
    var y = Math.sin(Δλ) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    var bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    var dφ = toRad(lat2 - lat1);
    var a = Math.sin(dφ / 2) * Math.sin(dφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { distanceM: dist, initialBearingDeg: bearing };
  }

  function vincentyInverse(lat1, lng1, lat2, lng2) {
    var a = WGS84.a, f = WGS84.f, b = a * (1 - f);
    var φ1 = toRad(lat1), φ2 = toRad(lat2);
    var L = toRad(lng2 - lng1);
    var tanU1 = (1 - f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1), sinU1 = tanU1 * cosU1;
    var tanU2 = (1 - f) * Math.tan(φ2), cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2), sinU2 = tanU2 * cosU2;
    var λ = L, λPrev, cosSqα, sinσ, cosσ, σ, sinα, cos2σM, C, iterations = 0;
    do {
      var sinλ = Math.sin(λ), cosλ = Math.cos(λ);
      var sinSqσ = (cosU2 * sinλ) * (cosU2 * sinλ) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
      if (sinSqσ === 0) return { distanceM: 0, initialBearingDeg: 0 };
      sinσ = Math.sqrt(sinSqσ);
      cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
      σ = Math.atan2(sinσ, cosσ);
      sinα = cosU1 * cosU2 * sinλ / sinσ;
      cosSqα = 1 - sinα * sinα;
      cos2σM = cosSqα !== 0 ? cosσ - 2 * sinU1 * sinU2 / cosSqα : 0;
      C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
      λPrev = λ;
      λ = L + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σM + C * cosσ * (-1 + 2 * cos2σM * cos2σM)));
    } while (Math.abs(λ - λPrev) > 1e-12 && ++iterations < 100);

    if (iterations >= 100) return sphericalInverse(lat1, lng1, lat2, lng2);

    var uSq = cosSqα * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var Δσ = B * sinσ * (cos2σM + B / 4 * (cosσ * (-1 + 2 * cos2σM * cos2σM) -
      B / 6 * cos2σM * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σM * cos2σM)));
    var distanceM = b * A * (σ - Δσ);
    sinλ = Math.sin(λ); cosλ = Math.cos(λ);
    var α1 = Math.atan2(cosU2 * sinλ, cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
    return {
      distanceM: distanceM,
      initialBearingDeg: (toDeg(α1) + 360) % 360
    };
  }

  function bearingTo(lat1, lng1, lat2, lng2) {
    return vincentyInverse(lat1, lng1, lat2, lng2).initialBearingDeg;
  }
  function distanceKm(lat1, lng1, lat2, lng2) {
    return vincentyInverse(lat1, lng1, lat2, lng2).distanceM / 1000;
  }

  SE.qibla = SE.qibla || {};
  SE.qibla.kaaba = KAABA;
  SE.qibla.bearingTo = bearingTo;
  SE.qibla.distanceKm = distanceKm;
  SE.qibla.vincentyInverse = vincentyInverse;
  SE.qibla.trueNorthNote = "زاویه نسبت به شمال جغرافیایی (True North) است، نه شمال مغناطیسی.";

  try { if (SE.qibla.render) SE.qibla.render(); } catch (_) {}
  try { if (SE.homeQiblaCard && SE.homeQiblaCard.render) SE.homeQiblaCard.render(); } catch (_) {}
})();
