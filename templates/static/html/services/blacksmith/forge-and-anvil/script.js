/* Forge & Anvil — shared script. No audio, no canvas. */
(function () {
  "use strict";

  /* View-transition abort guard: an interrupted cross-page transition
     rejects its promise; swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menuPanel");
  if (btn && panel) {
    function setMenu(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("open", open);
      if (open) {
        var first = panel.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      }
    }
    btn.addEventListener("click", function () {
      setMenu(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---------- knife commission planner (index) ---------- */
  var planner = document.getElementById("planner");
  if (planner) {
    var selBlade = document.getElementById("p-blade");
    var selSteel = document.getElementById("p-steel");
    var selHandle = document.getElementById("p-handle");
    var inpDate = document.getElementById("p-date");
    var outLines = document.getElementById("p-lines");
    var outTotal = document.getElementById("p-total");
    var outReady = document.getElementById("p-ready");
    var honest = document.getElementById("p-honest");
    var honestText = document.getElementById("p-honest-text");

    function eur(n) { return "€" + n.toLocaleString("en-GB"); }
    function fmtDate(d) {
      return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    }
    function optData(sel) {
      var o = sel.options[sel.selectedIndex];
      return {
        label: o.getAttribute("data-label") || o.textContent,
        price: parseInt(o.getAttribute("data-price"), 10) || 0,
        weeks: parseInt(o.getAttribute("data-weeks"), 10) || 0
      };
    }
    function compute() {
      var b = optData(selBlade), s = optData(selSteel), h = optData(selHandle);
      var total = b.price + s.price + h.price;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var ready = new Date(today.getTime() + b.weeks * 7 * 24 * 60 * 60 * 1000);
      outLines.innerHTML = "";
      [
        [b.label + " — blade, forged and ground", b.price],
        [s.label + " — steel", s.price],
        [h.label + " — handle, fitted by hand", h.price]
      ].forEach(function (row) {
        var li = document.createElement("li");
        var a = document.createElement("span"); a.textContent = row[0];
        var c = document.createElement("span"); c.textContent = row[1] === 0 ? "included" : eur(row[1]);
        li.appendChild(a); li.appendChild(c); outLines.appendChild(li);
      });
      outTotal.textContent = eur(total);
      outReady.innerHTML = "Ready to collect or ship: <b>" + fmtDate(ready) + "</b> (" + b.weeks +
        " weeks at the forge, then a final hone). Deposit to book the slot: " + eur(Math.round(total * 0.3)) + " (30%).";
      var wanted = inpDate.value ? new Date(inpDate.value + "T00:00:00") : null;
      if (wanted && wanted < ready) {
        honest.hidden = false;
        honestText.textContent = "You asked for " + fmtDate(wanted) + ", but this blade cannot be forged, hardened and finished before " +
          fmtDate(ready) + " — the queue is the queue, and rushing a quench ruins blades. Two honest options: book the slot and take delivery on " +
          fmtDate(ready) + ", or take a finished blade from the bench today — everything listed under \u201COn the bench now\u201D above can leave this week.";
      } else {
        honest.hidden = true;
      }
    }
    [selBlade, selSteel, selHandle, inpDate].forEach(function (el) {
      el.addEventListener("change", compute);
      el.addEventListener("input", compute);
    });
    compute();
  }

  /* ---------- enquiry form (contact) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name").value.trim();
      var type = document.getElementById("f-type");
      var typeLabel = type.options[type.selectedIndex].textContent;
      var ref = "FA-" + new Date().getFullYear() + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      var box = document.getElementById("confirmBox");
      document.getElementById("confirmRef").textContent = ref;
      document.getElementById("confirmText").textContent =
        "Thank you, " + (name || "friend") + ". Your " + typeLabel.toLowerCase() +
        " enquiry is in the forge book. I read every message myself and reply within two working days — sooner in the September rush, when I check the book twice a day.";
      box.hidden = false;
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
      form.reset();
    });
  }

  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
