/* Gilded Script — interactions.
   The stub's gold-shimmer particle canvas is gone: it decorated
   nothing and explained nothing. What remains does a job —
   the script sampler (choosing a hand is the first real decision
   in any commission), the gallery lightbox, and the enquiry form.
   No sound, by the trade's nature and the studio's choice. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("yr");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- script sampler (index) ---------- */
  var HANDS = {
    textura: {
      cls: "hand-textura",
      line: "The pen is the tongue of the soul.",
      period: "c. 1200–1500",
      tool: "Goose quill, cut square",
      best: "Manuscript pages, diplomas, choir books",
      note: "The formal book hand of the great Books of Hours: dense, even, unhurried. Every letter is built from separate strokes, so a page of textura takes roughly three times as long as italic — and reads as permanent."
    },
    capitals: {
      cls: "hand-capitals",
      line: "The pen is the tongue of the soul",
      period: "After Roman stone lettering, 1st c. onwards",
      tool: "Broad quill or flat brush",
      best: "Certificates, charters, names, title pages",
      note: "Capitals cut as the Romans cut them in stone, drawn with the pen instead of the chisel. Used for the lines that carry a name or a title — the parts of a document that are read first and remembered."
    },
    humanist: {
      cls: "hand-humanist",
      line: "The pen is the tongue of the soul.",
      period: "Florence, early 1400s onwards",
      tool: "Quill cut with a slight slope",
      best: "Book plates, letters, long texts meant to be read",
      note: "The round, open hand the Italian humanists revived from Carolingian models. Less ceremony than textura, far more air; the hand to choose when a text will actually be read aloud or at length."
    },
    italic: {
      cls: "hand-italic",
      line: "The pen is the tongue of the soul.",
      period: "Papal chancery, early 1500s onwards",
      tool: "Quill cut to a fine, flexible point",
      best: "Wedding vows, poems, correspondence",
      note: "The cursive of the papal chancery — quick, sloped, personal. Written at near-speaking speed, it keeps something of the writer's hand in it, which is why it suits vows and letters better than any formal book hand."
    }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".hand-tab"));
  var specLine = document.getElementById("specimenLine");
  var specNote = document.getElementById("specimenNote");
  var specPeriod = document.getElementById("specPeriod");
  var specTool = document.getElementById("specTool");
  var specBest = document.getElementById("specBest");
  var handCta = document.getElementById("handCta");

  function setHand(id, focusTab) {
    var hand = HANDS[id];
    if (!hand || !specLine) return;
    tabs.forEach(function (t) {
      t.setAttribute("aria-pressed", t.getAttribute("data-hand") === id ? "true" : "false");
    });
    function apply() {
      specLine.className = "specimen-line " + hand.cls;
      specLine.textContent = hand.line;
      specNote.textContent = hand.note;
      specPeriod.textContent = hand.period;
      specTool.textContent = hand.tool;
      specBest.textContent = hand.best;
      if (handCta) handCta.setAttribute("href", "contact.html?hand=" + id);
      specLine.classList.remove("fading");
    }
    if (reduced) {
      apply();
    } else {
      specLine.classList.add("fading");
      window.setTimeout(apply, 180);
    }
    if (focusTab) {
      var tab = tabs.filter(function (t) { return t.getAttribute("data-hand") === id; })[0];
      if (tab) tab.focus();
    }
  }

  if (tabs.length && specLine) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setHand(tab.getAttribute("data-hand"), false);
      });
    });
    setHand("textura", false);
  }

  /* ---------- gallery lightbox ---------- */
  var pieces = Array.prototype.slice.call(document.querySelectorAll(".piece"));
  var lb = document.getElementById("lightbox");
  if (pieces.length && lb) {
    var lbMedia = document.getElementById("lbMedia");
    var lbCap = document.getElementById("lbCap");
    var lbTitle = document.getElementById("lbTitle");
    var lbTomb = document.getElementById("lbTomb");
    var lbCount = document.getElementById("lbCount");
    var btnClose = document.getElementById("lbClose");
    var btnPrev = document.getElementById("lbPrev");
    var btnNext = document.getElementById("lbNext");
    var current = 0;
    var lastFocus = null;

    function render(i) {
      current = (i + pieces.length) % pieces.length;
      var piece = pieces[current];
      var media = piece.querySelector(".piece-media");
      lbMedia.innerHTML = "";
      var clone = media.cloneNode(true);
      clone.removeAttribute("id");
      if (clone.tagName === "BUTTON") {
        var holder = document.createElement("div");
        holder.className = "piece-media";
        holder.style.cursor = "default";
        holder.innerHTML = clone.innerHTML;
        clone = holder;
      }
      lbMedia.appendChild(clone);
      var cap = piece.querySelector(".photo-cap");
      lbCap.textContent = cap ? cap.textContent : "";
      lbCap.style.display = cap ? "" : "none";
      var title = piece.querySelector("h3");
      lbTitle.textContent = title ? title.textContent : "";
      var tomb = piece.querySelector(".tombstone");
      lbTomb.innerHTML = tomb ? tomb.outerHTML : "";
      lbCount.textContent = "Leaf " + (current + 1) + " of " + pieces.length;
    }

    function open(i, fromEl) {
      lastFocus = fromEl || document.activeElement;
      render(i);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    pieces.forEach(function (piece, i) {
      var btn = piece.querySelector(".piece-media");
      btn.addEventListener("click", function () { open(i, btn); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { render(current - 1); });
    btnNext.addEventListener("click", function () { render(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") render(current - 1);
      if (e.key === "ArrowRight") render(current + 1);
    });
  }

  /* ---------- mobile nav: the parchment sheet ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var sheetNav = document.getElementById("mobile-nav");
  if (navToggle && sheetNav) {
    var sheetLinks = sheetNav.querySelectorAll("a");
    var sheetOpen = false;
    function setSheet(open, refocus) {
      sheetOpen = open;
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      sheetNav.setAttribute("aria-hidden", open ? "false" : "true");
      sheetNav.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        if (sheetLinks.length) sheetLinks[0].focus();
      } else if (refocus) {
        navToggle.focus();
      }
    }
    navToggle.addEventListener("click", function () { setSheet(!sheetOpen, true); });
    sheetLinks.forEach(function (link) {
      link.addEventListener("click", function () { setSheet(false, false); });
    });
    document.addEventListener("keydown", function (e) {
      if (sheetOpen && e.key === "Escape") setSheet(false, true);
    });
    var sheetMq = window.matchMedia("(max-width: 820px)");
    function sheetMqChange(e) { if (!e.matches && sheetOpen) setSheet(false, false); }
    if (sheetMq.addEventListener) sheetMq.addEventListener("change", sheetMqChange);
    else if (sheetMq.addListener) sheetMq.addListener(sheetMqChange);
  }

  /* ---------- enquiry form (contact) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    /* preselect the hand if the visitor arrived from the sampler */
    var params = new URLSearchParams(window.location.search);
    var handParam = params.get("hand");
    var handSelect = document.getElementById("f-hand");
    if (handParam && handSelect && HANDS[handParam]) {
      handSelect.value = handParam;
    }

    function fieldOf(input) { return input.closest(".field"); }
    function markInvalid(input, bad) {
      var f = fieldOf(input);
      if (f) f.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate(input) {
      var v = (input.value || "").trim();
      if (input.id === "f-name") return markInvalid(input, v.length < 2);
      if (input.id === "f-email")
        return markInvalid(input, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      if (input.id === "f-type") return markInvalid(input, v === "");
      if (input.id === "f-message") return markInvalid(input, v.length < 20);
      return true;
    }

    var watched = ["f-name", "f-email", "f-type", "f-message"].map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);
    watched.forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).classList.contains("invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var results = watched.map(validate);
      if (results.indexOf(false) !== -1) {
        var firstBad = watched[results.indexOf(false)];
        if (firstBad) firstBad.focus();
        return;
      }
      var name = document.getElementById("f-name").value.trim();
      var typeSel = document.getElementById("f-type");
      var support = form.querySelector('input[name="support"]:checked');
      var conf = document.getElementById("confirmation");
      document.getElementById("c-name").textContent = name;
      document.getElementById("c-type").textContent =
        typeSel.options[typeSel.selectedIndex].text;
      document.getElementById("c-hand").textContent =
        handSelect.options[handSelect.selectedIndex].text;
      document.getElementById("c-support").textContent = support ? support.value : "Not sure yet";
      form.style.display = "none";
      conf.classList.add("show");
      conf.setAttribute("tabindex", "-1");
      conf.focus();
      conf.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    });

    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        watched.forEach(function (input) { markInvalid(input, false); });
        var conf = document.getElementById("confirmation");
        conf.classList.remove("show");
        form.style.display = "";
        document.getElementById("f-name").focus();
      });
    }
  }
})();
