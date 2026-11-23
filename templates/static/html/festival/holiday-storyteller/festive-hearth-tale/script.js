/* Festive Hearth Tale — interactions
   No audio anywhere on this site. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- cue-sheet data ---------- */

  var NIGHTS = {
    1: {
      title: "The oil that lasted",
      ritual: "Both blessings over the first flame, then the shamash lit and the house lights down to one lamp",
      parts: [
        "One cruse of oil, sealed and stamped with the seal of the high priest, found in the wreck of the Temple.",
        "The menorah is lit anyway. The oil that should burn one night burns eight, and nobody can explain the arithmetic.",
        "The following year the whole street is told to light one more, and the story starts being told out loud."
      ],
      close: "Who has watched a wick burn all the way down, and what did you do with the last inch?",
      props: ["A small clay cruse with a cork", "A wax seal on a length of string", "Eight tea lights on a brass tray"]
    },
    2: {
      title: "Hannah and her seven sons",
      ritual: "The second candle, lit from the shamash, while the room names anyone they are missing this year",
      parts: [
        "A mother and seven sons are brought before a king who wants one thing: that they give up the law.",
        "Each son is asked in turn. Each one refuses, and the room gets quieter with every refusal.",
        "The youngest answers last, and the answer is the one the story is remembered for."
      ],
      softParts: [
        "A mother and her seven sons are told they may no longer study or pray in the old way.",
        "One by one they find small, stubborn ways to keep doing it anyway: a hidden book, a whispered prayer, a shared meal.",
        "The family stays together, and the story remembers the mother who kept the door open."
      ],
      close: "What is something your family does anyway, even when it would be easier to stop?",
      props: ["Seven small stones in a row", "One larger stone for the mother", "A folded page of text, kept closed"]
    },
    3: {
      title: "Judith's cheese and wine",
      ritual: "The third candle, then a plate of something dairy passed around because the story is about a basket",
      parts: [
        "Judith dresses for a feast, packs a basket of salty cheese and a skin of wine, and walks out to the enemy camp.",
        "The general is flattered, then thirsty, then asleep. The cheese is doing most of the work.",
        "She walks home before dawn. The town wakes to a siege that has already ended, and eats dairy for a week."
      ],
      softParts: [
        "Judith packs a basket of salty cheese and sweet wine and goes to visit the general who is camped outside her town.",
        "She keeps him talking until very late. He is not used to clever company, and he is very tired.",
        "She walks home before breakfast. The town wakes up safe, and eats cheese pancakes to remember it."
      ],
      close: "Where in this story does the cleverness live: in the basket, in the talking, or in the walking home?",
      props: ["A woven basket with a cloth cover", "A small clay cup", "A wedge of hard cheese, wrapped"]
    },
    4: {
      title: "The lost dreidel of Safed",
      ritual: "The fourth candle, then a dreidel passed hand to hand while the room reads the four letters aloud",
      parts: [
        "In Safed, a teacher hides a classroom inside a wine cellar, and a shelf of scrolls behind a curtain.",
        "The children spin tops on the cellar floor and call out the letters as a game, so the sound of learning carries no further than a game.",
        "The letters say a great miracle happened there, and the game outlives the hiding by two thousand years."
      ],
      close: "What is a game you were taught without being told that it was a lesson?",
      props: ["A wooden dreidel with worn corners", "A handful of chocolate gelt", "A small lamp with a shielded flame"]
    },
    5: {
      title: "The rabbi's broken menorah",
      ritual: "The fifth candle, lit while the room looks at the one bent arm on the table and guesses how it happened",
      parts: [
        "A synagogue's old menorah loses an arm in a fall the week before the holiday, and the replacement will not arrive in time.",
        "The rabbi asks the room for hands: a welder, a carpenter, a girl with fingers small enough to reach the joint.",
        "Eight hands hold it steady while the ninth makes the repair, and the blessing is said over a lamp that is visibly mended."
      ],
      close: "Would you rather have the new menorah or the mended one, and who would you ask to hold it?",
      props: ["A candelabra with one bent arm", "A spool of fine wire", "A jeweller's file and a cloth"]
    },
    6: {
      title: "The goat and the golden gelt",
      ritual: "The sixth candle, then the gelt tin opened and one coin set aside for the person who laughs last",
      parts: [
        "A widow in Chelm leaves a purse of gelt on the windowsill to cool, and her goat eats it, purse and all.",
        "The town holds a trial. Then a second trial to review the first. Then a feast, because Chelm settles most things with a feast.",
        "The purse is gone, the goat is fat, and everyone is invited back next year to argue about it again."
      ],
      close: "What is the silliest argument your family has had that everybody still brings up on purpose?",
      props: ["A leather purse with no coins in it", "A wooden goat, about a hand high", "A tin of gelt, one coin loose"]
    },
    7: {
      title: "The song that crossed the sea",
      ritual: "The seventh candle, then the first line of Ocho Kandelikas hummed before anyone is told what it means",
      parts: [
        "A grandmother leaves Salonica with one suitcase, a cooking pot and a song she does not write down.",
        "In Montreal the song is hummed, not sung, until a granddaughter asks for the words and gets half of them.",
        "The rest come back at a kitchen table, in Ladino, off by one line, and the family decides the wrong line is now the right one."
      ],
      close: "What is a song or a recipe in your family that is already a little wrong, and kept anyway?",
      props: ["A small suitcase, packed but not latched", "A pot with a dented lid", "A handwritten card with one Ladino line"]
    },
    8: {
      title: "Eight lights, one window",
      ritual: "All eight candles, the shamash last, and the room's lights switched off for the whole telling",
      parts: [
        "The law is specific: the lamp goes outside the door, or in the window facing the street, not deeper into the house.",
        "A neighbour stops and asks what the lights are for, and the answer is the story, told at the window.",
        "The window is the point. A private miracle is made public on purpose, one night at a time, until the street can count."
      ],
      close: "Who walks past your window, and what would they learn about you if they looked in for eight nights?",
      props: ["A full tray of eight candles plus the shamash", "A window frame, borrowed or improvised", "A hand mirror to show the street view"]
    }
  };

  var AUDIENCES = {
    family: {
      label: "families, ages 4 to 8",
      tone: "Short sentences, one refrain the children repeat, and no battle detail. The props stay on the floor where the front row can reach them.",
      labels: ["Meet the people", "The trouble", "The light comes back"],
      addProps: ["A refrain card the room can read aloud", "A floor cloth for the front row"],
      pacing: "At 15 minutes the middle beat is cut and the refrain carries the story. Ask for a 25-minute set if the room is under six years old."
    },
    school: {
      label: "Hebrew school, ages 8 to 12",
      tone: "The story first, then four minutes of source talk and a dreidel round. The class is invited to correct my Hebrew.",
      labels: ["Set the scene", "The test", "The turn"],
      addProps: ["Two dreidels and a pot of gelt", "A one-page source sheet for the teacher"],
      pacing: "The dreidel round sits inside the last beat. At 15 minutes I tell the story and skip the game, and leave the dreidels with the teacher."
    },
    teens: {
      label: "teens",
      tone: "No props on the floor. The room sits in a circle, the story runs unbroken, and the last ten minutes are argument.",
      labels: ["The world of the story", "The pressure", "What it costs"],
      addProps: ["A printed timeline of the Maccabean revolt", "One chair set apart for the speaker"],
      pacing: "At 40 minutes the closing question opens into a discussion I let run. At 25 the discussion stays to one round."
    },
    adults: {
      label: "adults",
      tone: "The full text, the gaps in the text, and the parts that were added later. The candle table stays lit through the whole set.",
      labels: ["The setting", "The argument", "The reckoning"],
      addProps: ["A source sheet with the Judith and Maccabees passages", "A second cup for the host"],
      pacing: "At 40 minutes I include the Judith material and the rabbinic argument about where the lamp belongs. At 25 that argument becomes one sentence."
    },
    seniors: {
      label: "seniors, care setting",
      tone: "Seated, close, and loud enough for the back row. I leave room for people to join a line they know in Yiddish, and I never ask anyone to stand.",
      labels: ["The people", "The hard part", "The return"],
      addProps: ["Large-print refrain sheets", "A second candle tray at seated height"],
      pacing: "Sets stay at 25 minutes with a 10-minute stay after for anyone who wants to talk. At 15 I tell one story and one song."
    }
  };

  var ENSEMBLES = {
    solo: { label: "voice and props", note: "One table, one chair, one cloth. No power, no screen.", setup: "20 minutes to set the candle table and place chairs in a shallow arc." },
    cello: { label: "with a cellist", note: "The cellist sits at the edge of the light and plays under the last beat and the closing question.", setup: "35 minutes, plus a chair without arms and a clear 2 metres for the bow." },
    shadow: { label: "with shadow puppetry", note: "A 2.2 metre screen stands to the side of the candle table, lit from behind by a single lamp.", setup: "50 minutes, plus a dark wall, one power point and room to stand behind the screen." }
  };

  function fmtTime(mins) {
    var m = Math.floor(mins);
    return m + ":00";
  }

  function buildCue(nightNo, audienceKey, minutes, ensembleKey) {
    var night = NIGHTS[nightNo];
    var aud = AUDIENCES[audienceKey];
    var ens = ENSEMBLES[ensembleKey];
    var total = Number(minutes);
    var opening = Math.max(2, Math.round(total * 0.12));
    var closing = Math.max(2, Math.round(total * 0.1));
    var story = total - opening - closing;
    var p1 = Math.max(2, Math.round(story * 0.45));
    var p2 = Math.max(2, Math.round(story * 0.35));
    var p3 = story - p1 - p2;
    if (p3 < 2) { p3 = 2; p1 = story - p2 - p3; }

    var parts = (softenFor(audienceKey) && night.softParts) ? night.softParts : night.parts;
    var beats = [];
    var t = 0;
    function push(label, detail, len) {
      beats.push({ from: fmtTime(t), to: fmtTime(t + len), label: label, detail: detail });
      t += len;
    }

    push("Opening", night.ritual + ". " + ens.note, opening);
    push(aud.labels[0], parts[0], p1);
    push(aud.labels[1], parts[1], p2);
    push(aud.labels[2], parts[2], p3);
    push("Closing", night.close + (audienceKey === "teens" || audienceKey === "adults" ? " The room answers; I do not fill the silence." : " The room answers, and I take three more."), closing);

    return {
      beats: beats,
      title: "Night " + nightNo + ", " + total + " minutes, " + aud.label,
      sub: night.title + " · " + ens.label,
      total: total + " minutes, including questions",
      props: night.props.concat(aud.addProps),
      room: aud.tone + " " + ens.setup,
      pacing: aud.pacing,
      plain: function () {
        return [
          "Night " + nightNo + ": " + night.title + " (" + total + " minutes)",
          aud.label + " · " + ens.label,
          "",
          this.beats.map(function (b) { return b.from + "–" + b.to + "  " + b.label + ": " + b.detail; }).join("\n"),
          "",
          "On the table: " + this.props.join("; "),
          "The room: " + this.room,
          "Pacing: " + this.pacing
        ].join("\n");
      }
    };
  }

  function softenFor(key) {
    return key === "family" || key === "school";
  }

  /* ---------- builder ---------- */

  var builder = document.getElementById("builder-form");
  if (builder) {
    var nightSelect = document.getElementById("night");
    var audienceInputs = builder.querySelectorAll('input[name="audience"]');
    var minuteInputs = builder.querySelectorAll('input[name="minutes"]');
    var ensembleSelect = document.getElementById("ensemble");
    var beatsList = document.getElementById("beats");
    var propsList = document.getElementById("props");
    var sheetTitle = document.getElementById("sheet-title");
    var sheetSub = document.getElementById("sheet-sub");
    var roomNote = document.getElementById("room-note");
    var sheetTotal = document.getElementById("sheet-total");
    var copyBtn = document.getElementById("copy-sheet");
    var currentCue = null;

    function checkedValue(nodes, fallback) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) return nodes[i].value;
      return fallback || (nodes[0] ? nodes[0].value : null);
    }

    function render() {
      var cue = buildCue(
        nightSelect.value,
        checkedValue(audienceInputs, "family"),
        checkedValue(minuteInputs, "25"),
        ensembleSelect.value
      );
      currentCue = cue;

      sheetTitle.textContent = cue.title;
      sheetSub.textContent = cue.sub;
      beatsList.innerHTML = "";
      cue.beats.forEach(function (b) {
        var li = document.createElement("li");
        var time = document.createElement("span");
        time.className = "beat-time";
        time.textContent = b.from + "–" + b.to;
        var body = document.createElement("span");
        var label = document.createElement("span");
        label.className = "beat-label";
        label.textContent = b.label;
        var detail = document.createElement("span");
        detail.className = "beat-detail";
        detail.textContent = b.detail;
        body.appendChild(label);
        body.appendChild(detail);
        li.appendChild(time);
        li.appendChild(body);
        beatsList.appendChild(li);
      });

      propsList.innerHTML = "";
      cue.props.forEach(function (p) {
        var li = document.createElement("li");
        li.textContent = p;
        propsList.appendChild(li);
      });

      roomNote.textContent = cue.room + " " + cue.pacing;
      sheetTotal.textContent = cue.total;
    }

    builder.addEventListener("change", render);
    builder.addEventListener("input", render);

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!currentCue) return;
        var text = currentCue.plain();
        var done = function () {
          copyBtn.textContent = "Copied";
          window.setTimeout(function () { copyBtn.textContent = "Copy cue sheet"; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { selectSheet(); });
        } else {
          selectSheet();
        }
      });
    }

    function selectSheet() {
      var node = document.querySelector(".sheet");
      if (!node || !window.getSelection) return;
      var range = document.createRange();
      range.selectNodeContents(node);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      copyBtn.textContent = "Selected, press Ctrl C";
      window.setTimeout(function () { copyBtn.textContent = "Copy cue sheet"; }, 2600);
    }

    function loadNight(n) {
      var value = String(n);
      if (!NIGHTS[value]) return;
      nightSelect.value = value;
      render();
      var table = document.getElementById("worktable");
      if (table) table.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    document.querySelectorAll(".night-row").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadNight(btn.getAttribute("data-night"));
      });
    });

    document.querySelectorAll(".night-tick").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        loadNight(link.getAttribute("data-night"));
      });
    });

    var params = new URLSearchParams(window.location.search);
    if (params.get("night")) nightSelect.value = params.get("night");

    render();

    /* light each rail candle when its night is on screen */
    if ("IntersectionObserver" in window) {
      var rows = document.querySelectorAll(".night-row");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var n = entry.target.getAttribute("data-night");
          var tick = document.querySelector('.night-tick[data-night="' + n + '"]');
          if (tick) tick.classList.add("is-lit");
        });
      }, { rootMargin: "-20% 0px -55% 0px" });
      rows.forEach(function (row) { io.observe(row); });
    }
  } else {
    /* on inner pages, night ticks carry the choice to the builder */
    document.querySelectorAll(".night-tick").forEach(function (link) {
      var n = link.getAttribute("data-night");
      if (n) link.setAttribute("href", "index.html?night=" + n + "#worktable");
    });
  }

  /* ---------- snow ---------- */

  var canvas = document.getElementById("snow");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var flakes = [];
    var raf = 0;
    var w = 0, h = 0, dpr = 1;

    function size() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      make();
    }

    function make() {
      flakes = [];
      var count = Math.round(Math.min(64, w / 6));
      for (var i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.7 + Math.random() * 1.5,
          vy: 0.18 + Math.random() * 0.34,
          vx: -0.12 + Math.random() * 0.24,
          a: 0.22 + Math.random() * 0.45
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      flakes.forEach(function (f) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(246,239,226," + f.a + ")";
        ctx.fill();
      });
    }

    function tick() {
      flakes.forEach(function (f) {
        f.y += f.vy;
        f.x += f.vx;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (f.x < -4) f.x = w + 4;
        if (f.x > w + 4) f.x = -4;
      });
      draw();
      raf = window.requestAnimationFrame(tick);
    }

    size();
    if (reduceMotion) {
      draw();
    } else {
      tick();
    }

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        size();
        if (reduceMotion) draw();
      }, 200);
    });
  }

  /* ---------- contact form ---------- */

  var form = document.getElementById("booking-form");
  if (form) {
    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!status) return;

      var required = [
        { id: "name", label: "your name" },
        { id: "email", label: "an email address" },
        { id: "event-date", label: "the event date" },
        { id: "venue", label: "the venue or city" },
        { id: "message", label: "a short note about the audience" }
      ];
      var missing = [];
      required.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var empty = !el.value || !el.value.trim();
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(field.label);
      });

      var email = document.getElementById("email");
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        email.setAttribute("aria-invalid", "true");
        status.className = "form-status is-error";
        status.textContent = "That email address looks incomplete. Please check it and send again.";
        email.focus();
        return;
      }

      if (missing.length) {
        status.className = "form-status is-error";
        status.textContent = "Still needed: " + missing.join(", ") + ".";
        var first = document.getElementById(required.find(function (f) { return missing.indexOf(f.label) !== -1; }).id);
        if (first) first.focus();
        return;
      }

      var name = document.getElementById("name").value.trim();
      var date = document.getElementById("event-date").value;
      var venue = document.getElementById("venue").value.trim();
      var audience = document.getElementById("audience-type");
      var audienceText = audience ? audience.options[audience.selectedIndex].text : "audience to confirm";
      var note = document.getElementById("message").value.trim();

      var subject = "Booking request: " + venue + ", " + date;
      var body = "Name: " + name + "\nEmail: " + email.value.trim() + "\nEvent date: " + date + "\nVenue: " + venue + "\nAudience: " + audienceText + "\n\n" + note;
      var mailto = "mailto:nessa@hearth-tale.ca?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      status.className = "form-status is-ok";
      status.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "Your details check out, " + name.split(" ")[0] + ".";
      status.appendChild(strong);
      status.appendChild(document.createTextNode("The booking note is ready to send from your mail app. Nessa answers requests within two business days, and holds a provisional date for five."));
      var link = document.createElement("a");
      link.href = mailto;
      link.textContent = "Open the message in your mail app";
      link.className = "link-quiet";
      link.style.display = "inline-block";
      link.style.marginTop = "10px";
      status.appendChild(link);
    });
  }
})();
