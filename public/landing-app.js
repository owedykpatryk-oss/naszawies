(function () {
  function init() {
    const canvas = document.getElementById("planner-canvas");
    const tableCountEl = document.getElementById("table-count");
    const seatCountEl = document.getElementById("seat-count");
    const layoutBtns = document.querySelectorAll(".layout-btn");

    if (!canvas || !tableCountEl || !seatCountEl) return;

    const layouts = {
      banquet: [
        { type: "rect-6", x: 12, y: 32, seats: 6 },
        { type: "rect-6", x: 12, y: 50, seats: 6 },
        { type: "rect-6", x: 12, y: 68, seats: 6 },
        { type: "rect-6", x: 45, y: 32, seats: 6 },
        { type: "rect-6", x: 45, y: 50, seats: 6 },
        { type: "rect-6", x: 45, y: 68, seats: 6 },
        { type: "rect-6", x: 70, y: 50, seats: 6 },
      ],
      "u-shape": [
        { type: "rect-6", x: 25, y: 30, seats: 6 },
        { type: "rect-6", x: 50, y: 30, seats: 6 },
        { type: "rect-6", x: 18, y: 50, seats: 6 },
        { type: "rect-6", x: 18, y: 70, seats: 6 },
        { type: "rect-6", x: 65, y: 50, seats: 6 },
        { type: "rect-6", x: 65, y: 70, seats: 6 },
      ],
      theater: [
        { type: "rect-6", x: 12, y: 32, seats: 6 },
        { type: "rect-6", x: 38, y: 32, seats: 6 },
        { type: "rect-6", x: 64, y: 32, seats: 6 },
        { type: "rect-6", x: 12, y: 55, seats: 6 },
        { type: "rect-6", x: 38, y: 55, seats: 6 },
        { type: "rect-6", x: 64, y: 55, seats: 6 },
        { type: "rect-6", x: 25, y: 75, seats: 6 },
        { type: "rect-6", x: 52, y: 75, seats: 6 },
      ],
      islands: [
        { type: "round-8", x: 18, y: 30, seats: 8 },
        { type: "round-8", x: 52, y: 30, seats: 8 },
        { type: "round-8", x: 18, y: 60, seats: 8 },
        { type: "round-8", x: 52, y: 60, seats: 8 },
        { type: "round-8", x: 75, y: 45, seats: 8 },
      ],
      clear: [],
    };

    function makeDraggable(el) {
      let isDragging = false;
      let startX,
        startY,
        startLeft,
        startTop;

      const onDown = function (e) {
        isDragging = true;
        el.classList.add("dragging");
        const pt = e.touches ? e.touches[0] : e;
        startX = pt.clientX;
        startY = pt.clientY;
        startLeft = parseFloat(el.style.left);
        startTop = parseFloat(el.style.top);
        e.preventDefault();
      };
      const onMove = function (e) {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const pt = e.touches ? e.touches[0] : e;
        const dx = ((pt.clientX - startX) / rect.width) * 100;
        const dy = ((pt.clientY - startY) / rect.height) * 100;
        el.style.left = Math.max(1, Math.min(88, startLeft + dx)) + "%";
        el.style.top = Math.max(18, Math.min(82, startTop + dy)) + "%";
      };
      const onUp = function () {
        isDragging = false;
        el.classList.remove("dragging");
      };

      el.addEventListener("mousedown", onDown);
      el.addEventListener("touchstart", onDown, { passive: false });
      document.addEventListener("mousemove", onMove);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchend", onUp);
    }

    function renderLayout(layoutName) {
      canvas.querySelectorAll(".table").forEach(function (t) {
        t.remove();
      });
      const tables = layouts[layoutName] || [];
      let totalSeats = 0;
      tables.forEach(function (t) {
        const el = document.createElement("div");
        el.className = "table " + t.type;
        el.style.left = t.x + "%";
        el.style.top = t.y + "%";
        el.textContent = String(t.seats);
        canvas.appendChild(el);
        makeDraggable(el);
        totalSeats += t.seats;
      });
      tableCountEl.textContent = String(tables.length);
      seatCountEl.textContent = String(totalSeats);
    }

    layoutBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        layoutBtns.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        renderLayout(btn.dataset.layout);
      });
    });

    renderLayout("banquet");
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      const q = item.querySelector(".faq-question");
      if (!q) return;
      q.addEventListener("click", function () {
        item.classList.toggle("open");
      });
    });
  }

  function initTabs() {
    document.querySelectorAll(".form-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".form-tab").forEach(function (t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");
      });
    });
  }

  async function handleWaitlistSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector(".form-submit");
    if (!submitBtn) return;

    const poleImie = form.querySelector('[name="imie_nazwisko"]');
    const poleEmail = form.querySelector('[name="email"]');
    const poleWies = form.querySelector('[name="nazwa_wsi"]');
    const poleGmina = form.querySelector('[name="gmina"]');
    const poleZgoda = form.querySelector("#waitlist-zgoda");
    const poleBottrap = form.querySelector('[name="bottrap"]');

    if (!poleImie || !poleEmail || !poleWies || !poleGmina || !poleZgoda) {
      return;
    }

    const fullName = poleImie.value.trim();
    const email = poleEmail.value.trim();
    const villageName = poleWies.value.trim();
    const commune = poleGmina.value.trim();
    const bottrap = poleBottrap ? String(poleBottrap.value || "") : "";

    if (!poleZgoda.checked) {
      submitBtn.textContent = "Zaznacz zgodę na przetwarzanie danych";
      submitBtn.style.background = "#b22222";
      setTimeout(function () {
        submitBtn.textContent = "Chcę być pierwszy →";
        submitBtn.style.background = "var(--green-dark)";
      }, 3500);
      return;
    }

    const activeTab = document.querySelector(".form-tab.active");
    const role =
      activeTab && activeTab.getAttribute("data-tab") === "mieszkaniec"
        ? "mieszkaniec"
        : "soltys";

    const prevText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłanie...";

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          villageName,
          commune,
          role,
          rodoZaakceptowane: true,
          bottrap: bottrap,
          cfTurnstileResponse:
            typeof window.__waitlistTurnstileToken === "string"
              ? window.__waitlistTurnstileToken
              : "",
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (res.status === 409) {
        submitBtn.textContent = "Ten email jest już zapisany — dziękujemy!";
        submitBtn.style.background = "var(--green-medium)";
        form.reset();
        setTimeout(function () {
          submitBtn.textContent = prevText;
          submitBtn.style.background = "var(--green-dark)";
        }, 4000);
        return;
      }

      if (!res.ok) {
        submitBtn.textContent =
          data.error || "Coś poszło nie tak. Spróbuj za chwilę.";
        submitBtn.style.background = "#b22222";
        setTimeout(function () {
          submitBtn.textContent = prevText;
          submitBtn.style.background = "var(--green-dark)";
        }, 4500);
        return;
      }

      submitBtn.textContent = "✓ Jesteś zapisany/a!";
      submitBtn.style.background = "var(--green-medium)";
      form.reset();
      if (window.turnstile && waitlistTurnstileWidgetId != null) {
        try {
          window.turnstile.reset(waitlistTurnstileWidgetId);
        } catch (_) {}
        window.__waitlistTurnstileToken = "";
      }
      setTimeout(function () {
        submitBtn.textContent = prevText;
        submitBtn.style.background = "var(--green-dark)";
      }, 3500);
    } catch (_) {
      submitBtn.textContent = "Brak połączenia. Spróbuj ponownie.";
      submitBtn.style.background = "#b22222";
      setTimeout(function () {
        submitBtn.textContent = prevText;
        submitBtn.style.background = "var(--green-dark)";
      }, 4000);
    } finally {
      submitBtn.disabled = false;
    }
  }

  function initWaitlist() {
    const form = document.getElementById("waitlist-form");
    if (form) form.addEventListener("submit", handleWaitlistSubmit);
  }

  var waitlistTurnstileWidgetId = null;

  function loadTurnstileScript(cb) {
    if (window.turnstile) {
      cb();
      return;
    }
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = function () {
      cb();
    };
    document.head.appendChild(s);
  }

  function initWaitlistTurnstile() {
    var sk =
      typeof window.__NEXT_PUBLIC_TURNSTILE_SITE_KEY__ === "string"
        ? String(window.__NEXT_PUBLIC_TURNSTILE_SITE_KEY__).trim()
        : "";
    if (!sk) return;
    var mount = document.getElementById("waitlist-turnstile");
    if (!mount) return;
    loadTurnstileScript(function () {
      if (!window.turnstile) return;
      waitlistTurnstileWidgetId = window.turnstile.render(mount, {
        sitekey: sk,
        theme: "light",
        callback: function (token) {
          window.__waitlistTurnstileToken = token || "";
        },
        "expired-callback": function () {
          window.__waitlistTurnstileToken = "";
        },
        "error-callback": function () {
          window.__waitlistTurnstileToken = "";
        },
      });
    });
  }

  init();
  initFaq();
  initTabs();
  initWaitlist();
  initWaitlistTurnstile();
})();
