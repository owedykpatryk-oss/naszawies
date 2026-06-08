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
      let rafId = 0;
      let nextLeft = 0;
      let nextTop = 0;

      function flushMove() {
        rafId = 0;
        el.style.transform =
          "translate(" + (nextLeft - startLeft) + "%, " + (nextTop - startTop) + "%)";
      }

      function onMove(e) {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const pt = e.touches ? e.touches[0] : e;
        const dx = ((pt.clientX - startX) / rect.width) * 100;
        const dy = ((pt.clientY - startY) / rect.height) * 100;
        nextLeft = Math.max(1, Math.min(88, startLeft + dx));
        nextTop = Math.max(18, Math.min(82, startTop + dy));
        if (!rafId) rafId = requestAnimationFrame(flushMove);
      }

      function onUp() {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove("dragging");
        el.style.left = nextLeft + "%";
        el.style.top = nextTop + "%";
        el.style.transform = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }

      const onDown = function (e) {
        isDragging = true;
        el.classList.add("dragging");
        const pt = e.touches ? e.touches[0] : e;
        startX = pt.clientX;
        startY = pt.clientY;
        startLeft = parseFloat(el.style.left) || 0;
        startTop = parseFloat(el.style.top) || 0;
        nextLeft = startLeft;
        nextTop = startTop;
        document.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchend", onUp);
        e.preventDefault();
      };

      el.addEventListener("mousedown", onDown);
      el.addEventListener("touchstart", onDown, { passive: false });
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

      if (!q.hasAttribute("role")) {
        q.setAttribute("role", "button");
        q.setAttribute("tabindex", "0");
      }
      q.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");

      function toggleItem() {
        var willOpen = !item.classList.contains("open");
        document.querySelectorAll(".faq-item").forEach(function (other) {
          other.classList.remove("open");
          var oq = other.querySelector(".faq-question");
          if (oq) oq.setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          item.classList.add("open");
          q.setAttribute("aria-expanded", "true");
        }
      }

      q.addEventListener("click", toggleItem);
      q.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleItem();
        }
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

  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    var backdrop = document.getElementById("nav-backdrop");
    if (!toggle || !menu) return;

    function syncNavHeight() {
      var navEl =
        document.getElementById("landing-nav") ||
        document.querySelector("#strona-glowna nav") ||
        document.querySelector("nav");
      if (navEl) {
        document.documentElement.style.setProperty("--landing-nav-height", navEl.offsetHeight + "px");
      }
    }

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      if (backdrop) {
        backdrop.setAttribute("hidden", "");
        backdrop.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("landing-nav-open");
    }

    function openMenu() {
      syncNavHeight();
      toggle.setAttribute("aria-expanded", "true");
      menu.classList.add("is-open");
      if (backdrop) {
        backdrop.removeAttribute("hidden");
        backdrop.setAttribute("aria-hidden", "false");
      }
      document.body.classList.add("landing-nav-open");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeMenu();
      else openMenu();
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeMenu);
    }

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener(
      "scroll",
      function () {
        if (menu.classList.contains("is-open")) closeMenu();
      },
      { passive: true },
    );

    syncNavHeight();
    window.addEventListener("resize", syncNavHeight);
  }

  function syncLandingBottomStack() {
    var root = document.documentElement;
    var cookie = document.getElementById("baner-ciasteczek");
    var pwa = document.querySelector('[aria-label="Instalacja aplikacji"]');
    var sticky = document.getElementById("landing-sticky-cta");
    var cookieH = cookie ? cookie.offsetHeight : 0;
    var pwaH = pwa ? pwa.offsetHeight : 0;
    var stack = cookieH + pwaH;
    root.style.setProperty("--landing-bottom-stack", stack ? stack + "px" : "0px");
    if (sticky && !sticky.hasAttribute("hidden")) {
      root.style.setProperty("--landing-sticky-cta-height", sticky.offsetHeight + "px");
    } else {
      root.style.setProperty("--landing-sticky-cta-height", "0px");
    }
  }

  function initStickyCta() {
    var bar = document.getElementById("landing-sticky-cta");
    if (!bar || !window.matchMedia("(max-width: 1180px)").matches) return;

    var hero = document.querySelector(".hero");
    if (!hero) return;

    function update() {
      var pastHero = window.scrollY > hero.offsetHeight * 0.45;
      if (pastHero) bar.removeAttribute("hidden");
      else bar.setAttribute("hidden", "");
      syncLandingBottomStack();
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", syncLandingBottomStack);
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(syncLandingBottomStack);
      ["baner-ciasteczek"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) ro.observe(el);
      });
    }
    syncLandingBottomStack();
  }

  function initBackToTop() {
    var btn = document.getElementById("landing-back-top");
    if (!btn) return;

    function update() {
      if (window.scrollY > 600) btn.removeAttribute("hidden");
      else btn.setAttribute("hidden", "");
      syncLandingBottomStack();
    }

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initPlannerLazy() {
    var sekcja = document.getElementById("swietlica");
    if (!sekcja || !("IntersectionObserver" in window)) {
      init();
      return;
    }
    var started = false;
    var obs = new IntersectionObserver(
      function (entries) {
        if (started) return;
        if (entries.some(function (e) { return e.isIntersecting; })) {
          started = true;
          obs.disconnect();
          init();
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(sekcja);
  }

  function initWowScroll() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".wow-on-scroll, .ujawnij-scroll").forEach(function (el) {
        el.classList.add("is-visible", "ujawnij-scroll--widoczny");
      });
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".wow-on-scroll, .ujawnij-scroll").forEach(function (el) {
        el.classList.add("is-visible", "ujawnij-scroll--widoczny");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible", "ujawnij-scroll--widoczny");
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    document.querySelectorAll(".wow-on-scroll, .ujawnij-scroll").forEach(function (el) {
      obs.observe(el);
    });
  }

  function initStatCounters() {
    var els = document.querySelectorAll(".meta-value--anim[data-count]");
    if (!els.length) return;

    function animateEl(el) {
      var raw = el.getAttribute("data-count") || "0";
      var target = parseInt(raw.replace(/\s/g, ""), 10);
      if (!isFinite(target) || target <= 0) {
        el.textContent = raw;
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = target.toLocaleString("pl-PL");
        return;
      }
      var start = performance.now();
      var dur = Math.min(1600, 500 + target * 6);
      function frame(ts) {
        var t = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString("pl-PL");
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(animateEl);
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateEl(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.35 },
    );
    els.forEach(function (el) {
      obs.observe(el);
    });
  }

  function initProductPreview() {
    var root = document.getElementById("pokaz-demo");
    if (!root) return;

    var tabs = root.querySelectorAll("[data-pokaz-tab]");
    var screens = root.querySelectorAll("[data-pokaz-screen]");
    var hint = document.getElementById("pokaz-hint-tekst");
    var hints = {
      profil: "Profil wsi — widoczny dla każdego z linku od sołtysa.",
      rynek: "Rynek lokalny — ogłoszenia i firmy bez prowizji, z moderacją.",
      panel: "Panel mieszkańca — przypomnienia, świetlica i Twoje ogłoszenia.",
    };
    var order = ["profil", "rynek", "panel"];
    var idx = 0;
    var timer = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(id) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-pokaz-tab") === id;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      screens.forEach(function (screen) {
        screen.classList.toggle("is-active", screen.getAttribute("data-pokaz-screen") === id);
      });
      if (hint && hints[id]) hint.textContent = hints[id];
      idx = order.indexOf(id);
      if (idx < 0) idx = 0;
    }

    function startAuto() {
      if (reduced || tabs.length < 2) return;
      stopAuto();
      timer = window.setInterval(function () {
        idx = (idx + 1) % order.length;
        show(order[idx]);
      }, 5500);
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        show(tab.getAttribute("data-pokaz-tab") || "profil");
        stopAuto();
        startAuto();
      });
    });

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) startAuto();
    });

    show("profil");
    startAuto();
  }

  function initScrollProgress() {
    var bar = document.getElementById("landing-scroll-progress");
    if (!bar) return;

    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (scrollTop / max) * 100 : 0;
      bar.style.width = pct + "%";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initNavScrollSpy() {
    var nav = document.getElementById("landing-nav");
    var links = document.querySelectorAll('#nav-menu a[href^="#"]');
    if (!links.length) return;

    var sections = [];
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (el) sections.push({ el: el, link: link });
    });

    function navOffset() {
      var raw = getComputedStyle(document.documentElement).getPropertyValue("--landing-nav-height");
      var n = parseFloat(raw);
      return isFinite(n) ? n : 76;
    }

    function update() {
      if (nav) nav.classList.toggle("nav--scrolled", window.scrollY > 16);

      var y = window.scrollY + navOffset() + 48;
      var current = null;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s;
      });

      links.forEach(function (l) {
        l.classList.remove("is-active");
        l.removeAttribute("aria-current");
      });
      if (current && current.link) {
        current.link.classList.add("is-active");
        current.link.setAttribute("aria-current", "location");
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  initPlannerLazy();
  initFaq();
  initTabs();
  initWaitlist();
  initWaitlistTurnstile();
  initMobileNav();
  initStickyCta();
  initBackToTop();
  initScrollProgress();
  initNavScrollSpy();
  initWowScroll();
  initStatCounters();
  initProductPreview();
})();
