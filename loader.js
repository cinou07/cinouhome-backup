/* ==========================================================
   Cinou AI — wake-up loader
   Shows a branded overlay while https://cinouai.onrender.com
   spins up from a cold start, then redirects the user there.
   This file is standalone and does not modify script.js.
   ========================================================== */
(function () {
  var TARGET_URL = 'https://cinouai.onrender.com/';
  var HEALTH_URL = 'https://cinouai.onrender.com/api/health';
  var POLL_INTERVAL_MS = 2000;
  var MAX_WAIT_MS = 90000; // show a fallback link after ~90s

  var overlay = document.getElementById('cinouWakeOverlay');
  var statusEl = document.getElementById('cinouWakeStatus');
  var directLink = document.getElementById('cinouWakeDirectLink');
  var launchers = document.querySelectorAll('.js-launch-cinou');

  var isPolling = false;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function showOverlay() {
    if (!overlay) {
      // No overlay markup found — fail safe by just navigating.
      window.location.href = TARGET_URL;
      return false;
    }
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (directLink) directLink.hidden = true;
    return true;
  }

  async function wakeAndRedirect() {
    if (isPolling) return;
    if (!showOverlay()) return;

    isPolling = true;
    setStatus('This can take a few seconds on the first visit.');

    var attempt = 0;
    var startedAt = Date.now();

    while (true) {
      try {
        var res = await fetch(HEALTH_URL, { cache: 'no-store' });
        if (res && res.ok) {
          setStatus('Ready — taking you there…');
          window.location.href = TARGET_URL;
          return;
        }
      } catch (err) {
        // Still asleep / cold-starting — ignore and retry.
      }

      attempt++;
      if (attempt === 3) {
        setStatus('Still warming up, almost there…');
      }

      if (Date.now() - startedAt > MAX_WAIT_MS) {
        setStatus("Taking longer than usual. You can wait, or open it directly.");
        if (directLink) directLink.hidden = false;
        isPolling = false;
        return;
      }

      await new Promise(function (resolve) {
        setTimeout(resolve, POLL_INTERVAL_MS);
      });
    }
  }

  launchers.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      wakeAndRedirect();
    });
  });
})();
