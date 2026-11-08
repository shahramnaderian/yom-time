(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const cap = () => g.Capacitor;
  const isNative = () => {
    try {
      return !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
    } catch (e) {
      return false;
    }
  };
  function toBase64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1]);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3e4);
  }
  const MIME = { png: "image/png", pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  const mimeOf = (name, blob) => MIME[String(name).split(".").pop().toLowerCase()] || blob && blob.type || "application/octet-stream";
  let saver = null;
  function fileSaver() {
    if (!saver) saver = SE.native.plugin("FileSaver");
    return saver;
  }
  const msgOf = (e) => String(e && (e.message || e.errorMessage) || e || "?").slice(0, 140);
  async function save(blob, filename, opts) {
    opts = opts || {};
    SE.platform.last = null;
    try {
      if (isNative()) {
        const p = fileSaver();
        if (p && p.save) {
          const b64 = await toBase64(blob);
          await p.save({ data: b64, filename, mime: mimeOf(filename, blob) });
          return { ok: true, method: "native" };
        }
        // fallback share
        const share = SE.native.plugin("Share");
        if (share) {
          await share.share({ title: filename, files: [URL.createObjectURL(blob)], dialogTitle: filename });
          return { ok: true, method: "share" };
        }
      }
      download(blob, filename);
      return { ok: true, method: "download" };
    } catch (e) {
      SE.platform.last = msgOf(e);
      try { download(blob, filename); return { ok: true, method: "download-fallback" }; } catch (e2) {
        return { ok: false, error: msgOf(e) };
      }
    }
  }
  SE.platform = { isNative, save, download, toBase64, last: null };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.platform;
})(typeof globalThis !== "undefined" ? globalThis : this);
