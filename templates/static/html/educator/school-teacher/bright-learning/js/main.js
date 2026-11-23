/* Bright Learning Tuition — shared script.
   Sound ruling: FAILS the need-test — no audio anywhere on this site.
   A tutor's portfolio has nothing that needs to sound; the stub had
   no audio promise and none was invented.

   THE MODEL — one source of truth for the planner.
   FEES are the printed fee table on the home page, as numbers:
   one-to-one £42 a session, a pair £54 a session, a small group
   £84 a session (split between the students in the group). TERMS
   are the printed term calendar: 12 / 10 / 11 lesson weeks, with
   one lesson free in every full term. The planner sheet computes
   every figure from these, so the sheet cannot disagree with the
   printed tables. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces an unhandled InvalidStateError rejection
     although the navigation completed. Swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- mobile register panel ---------------- */
  var panel = document.getElementById("mobilePanel");
  var openBtn = document.getElementById("menuBtn");
  var closeBtn = document.getElementById("panelClose");
  if (panel && openBtn && closeBtn) {
    var lastFocus = null;
    function openPanel() {
      lastFocus = document.activeElement;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("locked");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { closeBtn.focus(); });
      });
    }
    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("locked");
      if (lastFocus) lastFocus.focus();
    }
    openBtn.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    panel.querySelector(".scrim").addEventListener("click", closePanel);
    panel.querySelectorAll("nav a").forEach(function (a) {
      a.addEventListener("click", closePanel);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  /* ---------------- reveals ---------------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && !reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- tuition planner ---------------- */
  var FEES = {
    solo:  { label: "One-to-one",  session: 42, minutes: 60 },
    pair:  { label: "Pair",        session: 54, minutes: 60 },
    group: { label: "Small group", session: 84, minutes: 75 }
  };
  var TERMS = {
    autumn: { label: "Autumn term 2026", lessons: 12 },
    spring: { label: "Spring term 2027", lessons: 10 },
    summer: { label: "Summer term 2027", lessons: 11 }
  };
  var SUBJECTS = {
    maths: {
      label: "Mathematics — Years 3 to 6",
      formats: ["solo", "pair", "group"],
      covers: "Number fluency, fractions and decimals, and the word problems that carry the marks — taught in small steps, checked every lesson.",
      note: ""
    },
    english: {
      label: "English — Years 3 to 6",
      formats: ["solo", "pair", "group"],
      covers: "Reading comprehension, writing that is planned before it is written, and spelling and grammar taught inside real sentences, not lists.",
      note: ""
    },
    eleven: {
      label: "11+ Preparation — Years 5 to 6",
      formats: ["solo", "pair"],
      covers: "Mathematics, English, verbal and non-verbal reasoning, with timed practice from the second term of the course — and honest mock results, shared in full.",
      note: "Small groups are not offered for 11+: pupils need different pacing, and a group of four would short-change all four."
    },
    early: {
      label: "Early Reading & Phonics — Years 1 to 2",
      formats: ["solo"],
      covers: "Phonics phases, blending and early number sense, in short bursts with plenty of success built in.",
      note: "Early reading is one-to-one only: at five and six, the lesson has to follow the child, not a group."
    }
  };

  var state = { subject: "maths", format: "solo", groupSize: 4, term: "autumn" };
  var money = function (n) {
    return "£" + (Math.round(n * 100) / 100).toLocaleString("en-GB", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  var subjectSel = document.getElementById("plSubject");
  if (subjectSel) {
    var formatBtns = Array.prototype.slice.call(document.querySelectorAll("[data-format]"));
    var termBtns = Array.prototype.slice.call(document.querySelectorAll("[data-term]"));
    var stepper = document.getElementById("grpStepper");
    var grpVal = document.getElementById("grpVal");
    var ctlNote = document.getElementById("ctlNote");
    var out = {
      format: document.getElementById("outFormat"),
      length: document.getElementById("outLength"),
      per: document.getElementById("outPer"),
      perArith: document.getElementById("outPerArith"),
      term: document.getElementById("outTerm"),
      termArith: document.getElementById("outTermArith"),
      covers: document.getElementById("outCovers")
    };

    function students() {
      if (state.format === "solo") return 1;
      if (state.format === "pair") return 2;
      return state.groupSize;
    }

    function render() {
      var subj = SUBJECTS[state.subject];
      var fee = FEES[state.format];
      var term = TERMS[state.term];
      var n = students();
      var per = fee.session / n;
      var termFull = per * term.lessons;
      var termTotal = per * (term.lessons - 1);

      formatBtns.forEach(function (b) {
        var f = b.getAttribute("data-format");
        b.setAttribute("aria-pressed", f === state.format ? "true" : "false");
        b.disabled = subj.formats.indexOf(f) === -1;
      });
      termBtns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-term") === state.term ? "true" : "false");
      });
      stepper.classList.toggle("show", state.format === "group");
      grpVal.textContent = state.groupSize + (state.groupSize === 1 ? " student" : " students");
      ctlNote.textContent = subj.note;

      out.format.textContent = fee.label + " · " + subj.label;
      out.length.textContent = state.subject === "early"
        ? fee.minutes + "-minute slot — 45 minutes teaching, then 15 minutes with the parent"
        : fee.minutes + " minutes, once a week";
      out.per.innerHTML = "";
      var fig = document.createElement("span");
      fig.className = "fig";
      fig.textContent = money(per);
      out.per.appendChild(fig);
      out.per.appendChild(document.createTextNode(" per student, per lesson"));
      out.perArith.textContent =
        money(fee.session) + " session ÷ " + n + (n === 1 ? " student" : " students") +
        " = " + money(per) + " each";
      out.term.textContent = money(termTotal) + " for the " + term.label.toLowerCase();
      out.termArith.textContent =
        term.lessons + " lessons × " + money(per) + " = " + money(termFull) +
        " − one lesson free (−" + money(per) + ") = " + money(termTotal);
      out.covers.textContent = subj.covers;
    }

    subjectSel.addEventListener("change", function () {
      state.subject = subjectSel.value;
      if (SUBJECTS[state.subject].formats.indexOf(state.format) === -1) {
        state.format = "solo";
      }
      render();
    });
    formatBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.format = b.getAttribute("data-format");
        render();
      });
    });
    termBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.term = b.getAttribute("data-term");
        render();
      });
    });
    document.getElementById("grpMinus").addEventListener("click", function () {
      state.groupSize = Math.max(3, state.groupSize - 1);
      render();
    });
    document.getElementById("grpPlus").addEventListener("click", function () {
      state.groupSize = Math.min(4, state.groupSize + 1);
      render();
    });

    /* honour a subject chosen on the contact page link, e.g. ?subject=eleven */
    var q = new URLSearchParams(window.location.search);
    if (q.get("subject") && SUBJECTS[q.get("subject")]) {
      state.subject = q.get("subject");
      subjectSel.value = state.subject;
      if (SUBJECTS[state.subject].formats.indexOf(state.format) === -1) state.format = "solo";
    }
    render();
  }

  /* ---------------- enquiry form ---------------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var done = document.getElementById("formDone");
    function fieldErr(input, bad) {
      var wrap = input.closest(".field");
      if (wrap) wrap.classList.toggle("invalid", bad);
      return !bad;
    }
    function validate() {
      var ok = true;
      var name = form.elements.parentName;
      var email = form.elements.email;
      var year = form.elements.yearGroup;
      ok = fieldErr(name, !name.value.trim()) && ok;
      ok = fieldErr(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = fieldErr(year, !year.value) && ok;
      return ok;
    }
    ["parentName", "email", "yearGroup"].forEach(function (n) {
      form.elements[n].addEventListener("input", function () { fieldErr(form.elements[n], false); });
      form.elements[n].addEventListener("change", function () { fieldErr(form.elements[n], false); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select");
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (form.elements.parentName.value + form.elements.email.value)
        .split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      var ref = "BL-2026-" + (100 + (seed % 900));
      document.getElementById("doneRef").textContent = ref;
      document.getElementById("doneSummary").textContent =
        form.elements.yearGroup.value + " · " +
        form.elements.subject.options[form.elements.subject.selectedIndex].text;
      form.style.display = "none";
      done.classList.add("show");
      done.setAttribute("tabindex", "-1");
      done.focus();
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function (e) {
        e.preventDefault();
        form.reset();
        form.style.display = "";
        done.classList.remove("show");
        form.elements.parentName.focus();
      });
    }
  }
})();
