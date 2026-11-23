/* Vestergaard Form — interactions.
   No audio anywhere: furniture making is not a sound profession,
   and the stub's hover-click synth failed the sound need-test. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- view transition aborts ----------
     The page fade uses the CSS cross-document opt-in (@view-transition in
     style.css). When the browser aborts such a transition — the other
     page's opt-in not honoured, a viewport change mid-navigation, a slow
     first paint — it rejects a transition promise that page code cannot
     reach through the pageswap event's viewTransition object (catching
     ready/finished/updateCallbackDone there does not intercept it), and
     the unhandled rejection is reported as an uncaught page error:
     "InvalidStateError: Transition was aborted...". An aborted transition
     is a normal outcome — the navigation simply proceeds without the
     fade — so swallow exactly that rejection and no other. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (navToggle && mobileNav) {
    var navLinks = mobileNav.querySelectorAll("a");
    function openNav() {
      mobileNav.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          mobileNav.classList.add("open");
          /* Focus only once the panel is actually visible: before .open
             lands the panel still computes to visibility:hidden, its links
             are not focusable, and a focus() call is silently dropped —
             focus used to be called synchronously here and never landed. */
          if (navLinks.length) navLinks[0].focus();
        });
      });
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeNav(restoreFocus) {
      mobileNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        if (!mobileNav.classList.contains("open")) mobileNav.hidden = true;
      }, 340);
      if (restoreFocus !== false) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 700 && mobileNav.classList.contains("open")) closeNav(false);
    });
  }

  /* ---------- lightbox ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  if (lb && triggers.length) {
    var lbImg = lb.querySelector("img");
    var lbTitle = lb.querySelector(".lb-title");
    var lbText = lb.querySelector(".lb-text");
    var lbCount = lb.querySelector(".lb-count");
    var current = 0;
    var lastFocus = null;

    function show(i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      lbImg.src = t.getAttribute("data-full");
      lbImg.alt = t.getAttribute("data-title") || "";
      lbTitle.textContent = t.getAttribute("data-title") || "";
      lbText.textContent = t.getAttribute("data-text") || "";
      lbCount.textContent = (current + 1) + " / " + triggers.length;
    }
    function open(i, fromEl) {
      lastFocus = fromEl;
      show(i);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i, t); });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    function setError(input, msg) {
      var err = document.getElementById(input.id + "-error");
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        if (err) { err.textContent = msg; err.classList.add("show"); }
        return false;
      }
      input.removeAttribute("aria-invalid");
      if (err) { err.textContent = ""; err.classList.remove("show"); }
      return true;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var type = document.getElementById("f-type");
      var message = document.getElementById("f-message");
      var firstBad = null;
      function check(input, ok, msg) {
        var valid = setError(input, ok ? "" : msg);
        if (!valid && !firstBad) firstBad = input;
        return valid;
      }
      check(name, name.value.trim().length >= 2, "Please give your name, so the reply can be addressed to you.");
      check(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()), "That email address does not look complete — check it and try again.");
      check(type, type.value !== "", "Choose the kind of piece you have in mind — “not sure yet” is a fine answer.");
      check(message, message.value.trim().length >= 10, "A few words about the piece, the room and your timing will do.");
      if (firstBad) { firstBad.focus(); return; }

      var ref = "VF-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random() * 900));
      document.getElementById("conf-name").textContent = name.value.trim().split(" ")[0];
      document.getElementById("conf-type").textContent = type.options[type.selectedIndex].text;
      document.getElementById("conf-ref").textContent = ref;
      form.style.display = "none";
      confirmation.classList.add("show");
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
    });
    ["f-name", "f-email", "f-type", "f-message"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function () { setError(el, ""); });
    });
    var again = document.getElementById("send-another");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.style.display = "";
        confirmation.classList.remove("show");
        document.getElementById("f-name").focus();
      });
    }
  }
})();
