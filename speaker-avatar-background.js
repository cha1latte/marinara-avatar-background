(function () {
  // Speaker Avatar Background — renders the latest speaker's avatar as a soft,
  // blurred background in group Conversation chats. Browser-only, DOM-driven, no API calls.

  var SURFACE_SELECTOR = '[data-component="ChatArea.Conversation"]';
  var SCROLL_SELECTOR = ".mari-messages-scroll";
  // Avatar circle wrapper class string used in both render paths: standard
  // (.mari-message-avatar) and merged group-mode (no .mari-message-avatar wrapper).
  var AVATAR_IMG_SELECTOR = "div.h-10.w-10.overflow-hidden.rounded-full img";
  var THROTTLE_MS = 150;
  var POLL_MS = 1000;

  var reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var currentSpeaker = null, currentAvatarUrl = null;
  var activeLayer = 0, throttleTimer = null, lastSurface = null, messagesObserver = null;
  var bgRoot = null, layers = [null, null];

  function getSurface() { return document.querySelector(SURFACE_SELECTOR); }
  function getScroll() { return document.querySelector(SCROLL_SELECTOR); }

  function speakerImages() {
    var scroll = getScroll();
    if (!scroll) return [];
    var imgs = scroll.querySelectorAll(AVATAR_IMG_SELECTOR);
    var out = [];
    for (var i = 0; i < imgs.length; i++) {
      // Skip the user persona's avatar — only assistant speakers count.
      if (imgs[i].closest(".mari-message-user")) continue;
      out.push(imgs[i]);
    }
    return out;
  }

  function isGroupConversation() {
    if (!getSurface()) return false;
    var imgs = speakerImages();
    var names = new Set();
    for (var i = 0; i < imgs.length; i++) {
      var alt = (imgs[i].alt || "").trim();
      if (alt) names.add(alt);
    }
    return names.size >= 2;
  }

  function findLatestSpeaker() {
    var imgs = speakerImages();
    for (var i = imgs.length - 1; i >= 0; i--) {
      var img = imgs[i];
      var url = img.src;
      if (!url) continue;
      var name = (img.alt || "").trim();
      return { name: name, avatarUrl: url };
    }
    return null;
  }

  function ensureBackground() {
    if (bgRoot) return;
    bgRoot = marinara.addElement("body", "div", {
      class: "speaker-avatar-bg is-hidden",
      "aria-hidden": "true",
    });
    if (!bgRoot) return;
    if (reduceMotion) bgRoot.classList.add("is-reduced-motion");
    layers[0] = marinara.addElement(bgRoot, "div", { class: "speaker-avatar-bg-layer" });
    layers[1] = marinara.addElement(bgRoot, "div", { class: "speaker-avatar-bg-layer" });
  }

  function syncBgPosition() {
    if (!bgRoot) return;
    var surface = getSurface();
    if (!surface) return;
    var r = surface.getBoundingClientRect();
    bgRoot.style.left = r.left + "px";
    bgRoot.style.top = r.top + "px";
    bgRoot.style.width = r.width + "px";
    bgRoot.style.height = r.height + "px";
  }

  function fadeOut() { if (bgRoot) bgRoot.classList.add("is-hidden"); }

  function applySpeaker(speaker) {
    if (!speaker || !speaker.avatarUrl) {
      fadeOut();
      currentSpeaker = speaker ? speaker.name : null;
      currentAvatarUrl = null;
      return;
    }
    if (speaker.name === currentSpeaker && speaker.avatarUrl === currentAvatarUrl) return;
    currentSpeaker = speaker.name;
    currentAvatarUrl = speaker.avatarUrl;
    var url = speaker.avatarUrl;
    var probe = new Image();
    probe.onload = function () {
      if (currentAvatarUrl !== url) return;
      if (!bgRoot || !layers[0] || !layers[1]) return;
      var next = (activeLayer + 1) % 2;
      var escaped = url.replace(/"/g, '\\"');
      layers[next].style.backgroundImage = 'url("' + escaped + '")';
      layers[next].classList.add("is-active");
      layers[activeLayer].classList.remove("is-active");
      activeLayer = next;
      bgRoot.classList.remove("is-hidden");
    };
    probe.onerror = function () { if (currentAvatarUrl === url) fadeOut(); };
    probe.src = url;
  }

  function update() {
    if (!isGroupConversation()) { fadeOut(); return; }
    syncBgPosition();
    applySpeaker(findLatestSpeaker());
  }

  function scheduleUpdate() {
    if (throttleTimer != null) return;
    throttleTimer = marinara.setTimeout(function () {
      throttleTimer = null;
      update();
    }, THROTTLE_MS);
  }

  function attachMessagesObserver() {
    if (messagesObserver) return;
    var target = getScroll();
    if (!target) return;
    messagesObserver = marinara.observe(target, scheduleUpdate, { childList: true, subtree: true });
  }

  function watchSurface() {
    marinara.setInterval(function () {
      var current = getSurface();
      if (current === lastSurface) return;
      lastSurface = current;
      if (messagesObserver) {
        try { messagesObserver.disconnect(); } catch (e) {}
        messagesObserver = null;
      }
      if (!current) {
        fadeOut();
        currentSpeaker = null;
        currentAvatarUrl = null;
        return;
      }
      attachMessagesObserver();
      scheduleUpdate();
    }, POLL_MS);
  }

  ensureBackground();
  marinara.on(window, "resize", syncBgPosition);
  lastSurface = getSurface();
  if (lastSurface) attachMessagesObserver();
  watchSurface();
  update();
})();
