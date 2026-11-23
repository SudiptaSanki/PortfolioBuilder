/* Anselm Vogt — shared script.
   Sound ruling: NONE. This site creates no AudioContext and plays no audio.
   The planner and estimator read the tables printed on the page itself
   (data attributes on the printed rows), so the tools cannot disagree
   with the paperwork they sit beside. */
(function(){
  "use strict";

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces as an unhandled rejection; the
     navigation itself has already completed. Swallow only that. */
  window.addEventListener("unhandledrejection", function(e){
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var $ = function(sel, root){ return (root || document).querySelector(sel); };
  var $$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmtEUR = function(n){ return "\u20AC" + n.toLocaleString("en-GB"); };

  /* ---------- mobile register menu ---------- */
  var menuBtn = $("#menuBtn"), menuPanel = $("#menuPanel");
  if (menuBtn && menuPanel) {
    var setMenu = function(open){
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuPanel.hidden = !open;
      if (open) {
        requestAnimationFrame(function(){
          var first = menuPanel.querySelector("a");
          if (first) first.focus();
        });
      }
    };
    menuBtn.addEventListener("click", function(){
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- calibre plate: numbered parts readout (index) ---------- */
  var PARTS = {
    "1":  { name:"Mainplate", origin:"made", originText:"Made in this workshop",
            note:"Cut from brass plate, drilled, jewelled and finished at this bench. One component, and the ground every other count stands on." },
    "2":  { name:"Barrel bridge", origin:"made", originText:"Made in this workshop",
            note:"One of the four bridges and cocks on the plate. Its underside carries the barrel's upper pivot and two of the 31 jewels." },
    "3":  { name:"Mainspring barrel", origin:"made", originText:"Drum and arbor made here \u2014 spring bought in",
            note:"The drum, cover and arbor are made here (3 components). The mainspring inside them is bought from a Swiss spring works, and the plate says so." },
    "4":  { name:"Centre wheel", origin:"made", originText:"Made in this workshop",
            note:"One of nine going-train wheels and pinions cut, crossed out and polished here. It turns once an hour and carries the minute hand." },
    "5":  { name:"Third wheel", origin:"made", originText:"Made in this workshop",
            note:"One of the nine train wheels made here. Its pivot runs in a jewel that is bought in \u2014 the making and the buying share most parts." },
    "6":  { name:"Fourth wheel", origin:"made", originText:"Made in this workshop",
            note:"One of the nine train wheels made here; on Calibre AV-24 its extended pivot carries the small seconds hand." },
    "7":  { name:"Escape wheel", origin:"made", originText:"Made in this workshop",
            note:"Cut in steel and polished tooth by tooth. The wheel most sensitive to a careless hand, so it is the last part fitted before regulation." },
    "8":  { name:"Pallet fork", origin:"made", originText:"Made in this workshop",
            note:"Fork and staff made here; its two pallet stones are jewels, counted with the 31 bought in, not hidden inside the fork's line." },
    "9":  { name:"Balance wheel", origin:"made", originText:"Wheel made here \u2014 timing screws bought in",
            note:"The wheel, staff and roller are made and poised here. The eight gold timing screws around its rim are bought in, and are counted as bought in." },
    "10": { name:"Hairspring", origin:"bought", originText:"Bought in",
            note:"A blued overcoil spring from a Swiss spring works. Forming hairsprings is a trade of its own; this workshop buys them and says so, here and on the plate." },
    "11": { name:"Jewels", origin:"bought", originText:"Bought in",
            note:"31 synthetic ruby bearings from a Swiss jewel maker. They are the single largest bought-in group \u2014 which is why the in-house count on this page is 43.1%, not a rounder lie." },
    "12": { name:"Crown and ratchet wheels", origin:"made", originText:"Made in this workshop",
            note:"Two of the components made here, finished with polished bevels you will only ever see with the back open. They are finished anyway." }
  };
  var partBtns = $$(".part-btn");
  var roNo = $("#roNo"), roName = $("#roName"), roOrigin = $("#roOrigin"), roNote = $("#roNote");
  if (partBtns.length && roName) {
    partBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        var p = PARTS[btn.getAttribute("data-part")];
        if (!p) return;
        partBtns.forEach(function(b){ b.setAttribute("aria-pressed","false"); });
        btn.setAttribute("aria-pressed","true");
        roNo.textContent = "Part " + btn.getAttribute("data-part") + " of 12 \u00B7 Calibre AV-31";
        roName.textContent = p.name;
        roOrigin.textContent = p.originText;
        roOrigin.className = "ro-origin " + p.origin;
        roNote.textContent = p.note;
      });
    });
  }

  /* ---------- Calibre & Regulation Planner (index) ---------- */
  var plCalibre = $("#pl-calibre"), plClass = $("#pl-class");
  if (plCalibre && plClass) {
    var plOut = $("#pl-out"), plRefusal = $("#pl-refusal"), plRateLine = $("#pl-rate-line");
    var sumPlate = function(cal){
      var made = 0, total = 0, boughtNames = [];
      $$("#plate-" + cal + " tbody tr").forEach(function(tr){
        var n = parseInt(tr.getAttribute("data-count"), 10) || 0;
        total += n;
        if (tr.getAttribute("data-origin") === "made") { made += n; }
        else { boughtNames.push(tr.getAttribute("data-group") + " (" + n + ")"); }
      });
      return { made: made, total: total, bought: total - made, boughtNames: boughtNames };
    };
    var regRow = function(cal, cls){
      var found = null;
      $$("#reg-table tbody tr").forEach(function(tr){
        if (tr.getAttribute("data-calibre") === cal && tr.getAttribute("data-class") === cls) found = tr;
      });
      return found;
    };
    var prodRow = function(cal){
      var found = null;
      $$("#prod-table tbody tr").forEach(function(tr){
        if (tr.getAttribute("data-calibre") === cal) found = tr;
      });
      return found;
    };
    var runPlanner = function(){
      var cal = plCalibre.value, cls = plClass.value;
      var calName = cal === "av31" ? "Calibre AV-31" : "Calibre AV-24";
      var plate = sumPlate(cal);
      var pct = (plate.made / plate.total * 100).toFixed(1);
      $("#pl-count-line").textContent =
        "Components counted on the printed plate of " + calName + ": " + plate.total + ".";
      $("#pl-made-line").textContent =
        "Made in this workshop: " + plate.made + " \u2192 " + plate.made + " \u00F7 " + plate.total +
        " = " + pct + "% in-house, counted by component.";
      $("#pl-bought-line").textContent =
        "Bought in, named on the plate: " + plate.boughtNames.join(", ") + " \u2014 " + plate.bought + " components.";
      var prod = prodRow(cal);
      if (prod) {
        var perYear = parseInt(prod.getAttribute("data-peryear"), 10);
        var queue = parseInt(prod.getAttribute("data-queue"), 10);
        var months = queue / (perYear / 12);
        $("#pl-wait-line").textContent =
          "Making list: " + queue + " names ahead \u00F7 (" + perYear + " watches a year \u00F7 12) = " +
          months.toFixed(1) + " months \u2192 about " + Math.ceil(months) +
          " months before your watch enters the bench.";
      }
      if (cls === "guaranteed") {
        plRateLine.hidden = true;
        plRefusal.hidden = false;
        var fine = regRow(cal, "fine");
        $("#pl-refusal-rate").textContent = fine ? fine.getAttribute("data-rate") : "";
      } else {
        var row = regRow(cal, cls);
        plRefusal.hidden = true;
        plRateLine.hidden = false;
        plRateLine.textContent = row ?
          "Regulation, " + (cls === "fine" ? "fine" : "workshop standard") + ": measured " +
          row.getAttribute("data-rate") + " across five positions, from the printed record of " + calName + "." :
          "";
      }
      plOut.hidden = false;
    };
    plCalibre.addEventListener("change", runPlanner);
    plClass.addEventListener("change", runPlanner);
    runPlanner();
  }

  /* ---------- Booking estimator (index) ---------- */
  var estCalibre = $("#est-calibre"), estService = $("#est-service");
  if (estCalibre && estService) {
    var estLines = $("#est-lines"), estTotal = $("#est-total"), estDeposit = $("#est-deposit");
    var runEstimator = function(){
      var lines = [], total = 0;
      var calOpt = estCalibre.options[estCalibre.selectedIndex];
      var calPrice = parseInt(calOpt.getAttribute("data-price"), 10) || 0;
      lines.push([calOpt.getAttribute("data-label"), calPrice]);
      total += calPrice;
      $$(".est-opt").forEach(function(cb){
        if (cb.checked) {
          var p = parseInt(cb.getAttribute("data-price"), 10) || 0;
          lines.push([cb.getAttribute("data-label"), p]);
          total += p;
        }
      });
      var svcOpt = estService.options[estService.selectedIndex];
      var svcPrice = parseInt(svcOpt.getAttribute("data-price"), 10) || 0;
      if (svcPrice > 0) {
        lines.push([svcOpt.getAttribute("data-label"), svcPrice]);
        total += svcPrice;
      }
      estLines.innerHTML = lines.map(function(l){
        return "<li><span>" + l[0] + "</span><span>" + fmtEUR(l[1]) + "</span></li>";
      }).join("");
      $$("#est-lines li").forEach(function(li){
        li.style.display = "flex"; li.style.justifyContent = "space-between"; li.style.gap = "1rem";
      });
      estTotal.textContent = fmtEUR(total);
      estDeposit.textContent =
        "Deposit to join the making list, 30% of the total: " + fmtEUR(Math.round(total * 0.30)) +
        ". The balance is due when the watch is finished and regulated, not before.";
    };
    estCalibre.addEventListener("change", runEstimator);
    estService.addEventListener("change", runEstimator);
    $$(".est-opt").forEach(function(cb){ cb.addEventListener("change", runEstimator); });
    runEstimator();
  }

  /* ---------- Enquiry form (contact) ---------- */
  var form = $("#enquiry-form");
  if (form) {
    var showErr = function(id, msg){
      var el = document.getElementById(id);
      if (el) { el.textContent = msg || ""; el.hidden = !msg; }
    };
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var name = $("#f-name").value.trim();
      var email = $("#f-email").value.trim();
      var msg = $("#f-message").value.trim();
      var ok = true;
      if (name.length < 2) { showErr("err-name", "Please give your name."); ok = false; } else showErr("err-name", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr("err-email", "Please give an email address that can receive a reply."); ok = false; } else showErr("err-email", "");
      if (msg.length < 10) { showErr("err-message", "A few more words, please \u2014 which calibre, and what you are hoping for."); ok = false; } else showErr("err-message", "");
      if (!ok) return;
      var seed = (name.length * 137 + email.length * 89 + msg.length * 7) % 9000 + 1000;
      $("#confirm-ref").textContent = "AV-2026-" + seed;
      $("#confirm-name").textContent = name;
      form.hidden = true;
      var confirm = $("#form-confirm");
      confirm.hidden = false;
      confirm.setAttribute("tabindex", "-1");
      confirm.focus();
    });
  }
})();
