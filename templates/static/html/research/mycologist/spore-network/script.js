/* Spore Network — register data is the single source of truth.
   The explorer sheet and the season strip both render from SPECIMENS,
   so what the strip promises for a month is what the sheets print. */
"use strict";

/* View-transition abort guard: when Chrome aborts a cross-document
   view transition, the rejection surfaces as an unhandled promise
   rejection although the navigation completed. Swallow only that. */
window.addEventListener("unhandledrejection", function (e) {
  var r = e.reason;
  if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
    e.preventDefault();
  }
});

var SPECIMENS = [
  {
    no: "001", latin: "Armillaria ostoyae", common: "Dark honey fungus",
    status: "PATHOGEN — RECORDED FOR TREE HEALTH",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Agaricales", Family: "Physalacriaceae", Genus: "Armillaria" },
    substrate: "Roots and stumps of conifers and hardwoods — parasitic on the living tree, saprotrophic on the dead one.",
    months: [9, 10, 11], seasonText: "September – November",
    spore: "White", sporeClass: "spore-white",
    marks: "Honey-brown caps in dense troops at the trunk base; black rhizomorphs — bootlaces — under bark and through the soil.",
    caution: "A tree pathogen first and a mushroom second. One individual of this species in Oregon covers about 965 hectares and is thousands of years old: the register records colonies, not trophies.",
    note: "Gastric upsets are reported after eating honey fungi. The register does not collect them; it maps them, because the map is what saves the next row of trees."
  },
  {
    no: "002", latin: "Amanita muscaria", common: "Fly agaric",
    status: "TOXIC — NEVER EATEN",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Agaricales", Family: "Amanitaceae", Genus: "Amanita" },
    substrate: "Mycorrhizal partner of birch, pine and spruce; woodland edges, rides and clearings.",
    months: [8, 9, 10, 11], seasonText: "August – November",
    spore: "White", sporeClass: "spore-white",
    marks: "Scarlet cap carrying white veil warts; white gills; a ring on the stem and a volva at the base.",
    caution: "Toxic — ibotenic acid and muscimol. Rain washes the warts off; a washed cap is still this species, keyed by base, ring, gills and host tree, not by colour.",
    note: "The register's most photographed entry and its most useful warning: the best-known fungus in Britain is poisonous, and no photograph on this site changes that."
  },
  {
    no: "003", latin: "Cantharellus cibarius", common: "Chanterelle",
    status: "RECORDED — NOT PICKED ON SURVEY",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Cantharellales", Family: "Cantharellaceae", Genus: "Cantharellus" },
    substrate: "Mycorrhizal partner of oak, beech, birch and pine; mossy woodland floors.",
    months: [6, 7, 8, 9, 10], seasonText: "June – October",
    spore: "Pale pinkish yellow", sporeClass: "spore-pink",
    marks: "Blunt, forked ridges running down the stem — not true gills; solid flesh with a faint smell of apricots.",
    caution: "The lookalike problem of the register. False chanterelle (Hygrophoropsis aurantiaca) has true, crowded, orange gills; jack-o'-lantern (Omphalotus illudens) is toxic. Determination is by ridge, flesh and print — never by a photograph or an app.",
    note: "A prized edible in the literature. A survey record is not a meal recommendation, and this entry is not one either."
  },
  {
    no: "004", latin: "Boletus edulis", common: "Penny bun",
    status: "RECORDED — NOT PICKED ON SURVEY",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Boletales", Family: "Boletaceae", Genus: "Boletus" },
    substrate: "Mycorrhizal partner of oak, beech, spruce and pine; rides and clearings.",
    months: [8, 9, 10, 11], seasonText: "August – November",
    spore: "Olive brown", sporeClass: "spore-olive",
    marks: "Pores, not gills, under a bun-brown cap; a fine pale net — the reticulum — on the upper stem.",
    caution: "Bitter bolete (Tylopilus felleus) mimics it closely: pinkish pores and a dark net. The key separates them in the hand, which is where identifications belong.",
    note: "Choice edible in the literature; on survey it is counted, measured and left for the wood's own economy."
  },
  {
    no: "005", latin: "Laetiporus sulphureus", common: "Chicken of the woods",
    status: "TREE-HEALTH FINDING",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Polyporales", Family: "Fomitopsidaceae", Genus: "Laetiporus" },
    substrate: "Standing oak, yew, sweet chestnut and willow — heart-rot parasite first, saprotroph after.",
    months: [5, 6, 7, 8, 9, 10], seasonText: "May – October",
    spore: "White", sporeClass: "spore-white",
    marks: "Sulphur-yellow shelves with a salmon-orange top and no stem; fine pores beneath, never gills.",
    caution: "Adverse reactions are reported, most often from yew hosts and from undercooked material. On a survey the bracket matters for another reason: it means heartwood decay is established inside the trunk.",
    note: "Recorded with the tree's position and a note to the tree officer. Not collected."
  },
  {
    no: "006", latin: "Hydnum repandum", common: "Wood hedgehog",
    status: "TEACHING SPECIMEN",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Cantharellales", Family: "Hydnaceae", Genus: "Hydnum" },
    substrate: "Mycorrhizal partner of beech and oak; often in troops and arcs on the woodland floor.",
    months: [8, 9, 10, 11], seasonText: "August – November",
    spore: "White", sporeClass: "spore-white",
    marks: "Teeth, not gills — soft spines hang beneath a buff, irregular cap; flesh firm and peppery when raw.",
    caution: "Almost nothing dangerous shares the teeth, which is why the identification courses start here: a beginner can key it in minutes and be right for checkable reasons.",
    note: "Edible in the literature. On courses it is keyed, printed and returned to the wood."
  },
  {
    no: "007", latin: "Clathrus archeri", common: "Devil's fingers",
    status: "RECORDED FOR DISTRIBUTION DATA",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Phallales", Family: "Clathraceae", Genus: "Clathrus" },
    substrate: "Saprotrophic on woodchip mulch, garden edges and deep leaf litter.",
    months: [6, 7, 8, 9, 10], seasonText: "June – October",
    spore: "No print taken", sporeClass: "spore-none",
    marks: "Four to eight scarlet arms rising from a white egg; the olive gleba on the arms smells of carrion, to draw the flies that carry its spores.",
    caution: "An introduction from the southern hemisphere, first recorded in Britain in 1914 and spreading with the mulch trade. Harmless to handle and photograph; records of it track a range still on the move.",
    note: "Spores ripen in the gleba rather than falling as a print — the register records the fact instead of forcing the field."
  },
  {
    no: "008", latin: "Panellus stipticus", common: "Bitter oyster",
    status: "NOT EATEN — BITTER, ASTRINGENT",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Agaricales", Family: "Mycenaceae", Genus: "Panellus" },
    substrate: "Dead oak — logs, stumps and fallen branches, in overlapping troops.",
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], seasonText: "All year; freshest after autumn rain",
    spore: "White", sporeClass: "spore-white",
    marks: "Small tan shells on short side-stems; tough flesh; crowded white gills.",
    caution: "Eastern North American populations of this species have luminescent gills; British material generally does not. The register records the population in front of it, not the legend.",
    note: "The name is the use: stipticus, styptic — it was once carried to staunch blood. Bitter enough that nobody eats it twice."
  },
  {
    no: "009", latin: "Hericium erinaceus", common: "Lion's mane (bearded tooth)",
    status: "PROTECTED — SCHEDULE 8, WCA 1981",
    taxonomy: { Phylum: "Basidiomycota", Class: "Agaricomycetes", Order: "Russulales", Family: "Hericiaceae", Genus: "Hericium" },
    substrate: "Wounds, hollows and dead heartwood of veteran beech and oak.",
    months: [8, 9, 10, 11], seasonText: "August – November",
    spore: "White", sporeClass: "spore-white",
    marks: "A cascade of white icicle spines hanging from a single rooting point; no cap, no stem, nothing else like it on a British tree.",
    caution: "Protected in Britain under Schedule 8 of the Wildlife and Countryside Act 1981 — picking it is an offence. On survey it is photographed in situ, the host tree is mapped, and the work plan changes around it. See Case 01.",
    note: "The entry that justifies the register: one find, properly recorded, kept three veteran beeches standing."
  }
];

var MONTHS = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"];
var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Exposed for verification: the probe reads the same data the page renders. */
window.__REGISTER = { specimens: SPECIMENS, months: MONTHS };

function byMonth(m) {
  return SPECIMENS.filter(function (s) { return s.months.indexOf(m) !== -1; });
}

/* ---------- specimen explorer ---------- */
(function () {
  var list = document.getElementById("regList");
  var sheet = document.getElementById("sheet");
  if (!list || !sheet) return;

  function renderSheet(s) {
    var ranks = ["Phylum", "Class", "Order", "Family", "Genus"];
    var ladder = ranks.map(function (r) {
      var cls = r === "Genus" ? "taxon genus" : "taxon";
      return '<div class="ladder-row"><span class="rank">' + r.toUpperCase() +
        '</span><span class="' + cls + '">' + s.taxonomy[r] + "</span></div>";
    }).join("");
    sheet.innerHTML =
      '<div class="sheet-top"><div>' +
        '<div class="sheet-no">REGISTER № ' + s.no + " · SPORE NETWORK OPEN REGISTER</div>" +
        "<h3>" + s.latin + "</h3>" +
        '<div class="common-name">' + s.common + "</div>" +
      '</div><div class="status-stamp">' + s.status + "</div></div>" +
      '<div class="ladder" aria-label="Taxonomy">' + ladder + "</div>" +
      '<div class="sheet-fields">' +
        '<div class="field"><span class="fk">SUBSTRATE &amp; HOST</span><span class="fv">' + s.substrate + "</span></div>" +
        '<div class="field"><span class="fk">FRUITING SEASON</span><span class="fv">' + s.seasonText + "</span></div>" +
        '<div class="field"><span class="fk">SPORE PRINT</span><span class="fv"><span class="spore-dot ' + s.sporeClass + '" aria-hidden="true"></span>' + s.spore + "</span></div>" +
        '<div class="field"><span class="fk">FIELD MARKS</span><span class="fv">' + s.marks + "</span></div>" +
        '<div class="field full caution"><span class="fk">CAUTION — LOOKALIKES &amp; LIMITS</span><span class="fv">' + s.caution + "</span></div>" +
        '<div class="field full"><span class="fk">REGISTER NOTE</span><span class="fv">' + s.note + "</span></div>" +
      "</div>";
  }

  SPECIMENS.forEach(function (s, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "reg-row";
    b.id = "reg-row-" + s.no;
    b.setAttribute("aria-current", i === 0 ? "true" : "false");
    b.innerHTML =
      '<span class="no">№ ' + s.no + "</span>" +
      '<span class="spore-dot ' + s.sporeClass + '" aria-hidden="true"></span>' +
      '<span class="names"><span class="latin">' + s.latin + '</span>' +
      '<span class="common">' + s.common + "</span></span>";
    b.addEventListener("click", function () {
      list.querySelectorAll(".reg-row").forEach(function (r) { r.setAttribute("aria-current", "false"); });
      b.setAttribute("aria-current", "true");
      renderSheet(s);
    });
    list.appendChild(b);
  });

  renderSheet(SPECIMENS[0]);
})();

/* ---------- season strip ---------- */
(function () {
  var monthsEl = document.getElementById("months");
  var out = document.getElementById("seasonOut");
  if (!monthsEl || !out) return;

  function renderMonth(m) {
    monthsEl.querySelectorAll(".month-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", Number(b.dataset.month) === m ? "true" : "false");
    });
    var found = byMonth(m);
    var chips = found.map(function (s) {
      return '<span class="chip"><span class="no">№ ' + s.no + "</span>" + s.latin + "</span>";
    }).join("");
    out.innerHTML =
      '<p class="line">In <strong>' + MONTHS[m - 1] + "</strong> the register fruits: " +
      found.length + (found.length === 1 ? " entry." : " entries.") + "</p>" +
      '<div class="chips">' + chips + "</div>";
  }

  MONTH_SHORT.forEach(function (label, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "month-btn";
    b.textContent = label;
    b.dataset.month = String(i + 1);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { renderMonth(i + 1); });
    monthsEl.appendChild(b);
  });

  renderMonth(10); /* October — the register's fullest month */
})();

/* ---------- mobile menu ---------- */
(function () {
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("menuPanel");
  if (!btn || !panel) return;

  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      var first = panel.querySelector("a");
      if (first) requestAnimationFrame(function () { first.focus({ preventScroll: true }); });
    }
  }
  btn.addEventListener("click", function () {
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      btn.focus();
    }
  });
  panel.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });
})();

/* ---------- enquiry form ---------- */
(function () {
  var form = document.getElementById("enquiryForm");
  if (!form) return;
  var confirmation = document.getElementById("confirmation");

  function setError(id, msg) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + "Error");
    if (!input || !err) return;
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      err.textContent = msg;
      err.classList.add("show");
    } else {
      input.removeAttribute("aria-invalid");
      err.textContent = "";
      err.classList.remove("show");
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fName");
    var email = document.getElementById("fEmail");
    var type = document.getElementById("fType");
    var msg = document.getElementById("fMessage");
    var ok = true, firstBad = null;

    if (!name.value.trim()) { setError("fName", "Your name is needed — the report is addressed to someone."); ok = false; firstBad = firstBad || name; }
    else setError("fName", "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError("fEmail", "Enter an email address that can receive the report."); ok = false; firstBad = firstBad || email; }
    else setError("fEmail", "");
    if (!type.value) { setError("fType", "Choose the closest kind of enquiry."); ok = false; firstBad = firstBad || type; }
    else setError("fType", "");
    if (msg.value.trim().length < 12) { setError("fMessage", "A line or two about the site — where it is, how big, what prompted the enquiry."); ok = false; firstBad = firstBad || msg; }
    else setError("fMessage", "");

    if (!ok) { if (firstBad) firstBad.focus(); return; }

    var ref = "SN-2026-" + String(100 + Math.floor(Math.random() * 900));
    document.getElementById("confRef").textContent = "Enquiry reference " + ref;
    document.getElementById("confSummary").textContent =
      "Thank you, " + name.value.trim() + ". Your " + type.options[type.selectedIndex].text.toLowerCase() +
      " enquiry is noted for a reply within three working days — sooner in the October peak, when the answer is usually about dates.";
    form.style.display = "none";
    confirmation.classList.add("show");
    confirmation.setAttribute("tabindex", "-1");
    confirmation.focus({ preventScroll: false });
  });

  var again = document.getElementById("sendAnother");
  if (again) {
    again.addEventListener("click", function () {
      form.reset();
      form.style.display = "";
      confirmation.classList.remove("show");
      document.getElementById("fName").focus();
    });
  }
})();
