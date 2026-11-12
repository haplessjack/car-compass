(function (global) {
  const cfg = global.SITE_CONFIG || { siteName: "Car Compass", tagline: "", baseUrl: "/", year: 2026 };

  function resolvedRoot() {
    if (cfg._root) return cfg._root;
    const scripts = [...document.getElementsByTagName("script")];
    const me = scripts.find(s => /\/js\/site\.js(\?|$)/.test(s.src));
    if (me) {
      cfg._root = me.src.replace(/js\/site\.js(\?.*)?$/, "");
      return cfg._root;
    }
    // Fallback: directory of current page if at root depth unknown
    cfg._root = new URL("./", location.href).href;
    return cfg._root;
  }

  function url(rel) {
    return new URL(rel, resolvedRoot()).href;
  }

  function pathRel(rel) {
    // Prefer path suitable for same-tab navigation under subpath
    try {
      const u = new URL(rel, resolvedRoot());
      return u.pathname + u.search + u.hash;
    } catch {
      return rel;
    }
  }

  function ensureBaseUrl() {
    let b = cfg.baseUrl || "";
    if (!b.endsWith("/")) b += "/";
    cfg.baseUrl = b;
    return b;
  }

  function absolutePublic(relPath) {
    return ensureBaseUrl() + String(relPath || "").replace(/^\//, "");
  }

  function injectSeo(opts) {
    const title = opts.title || cfg.siteName;
    const desc = opts.description || cfg.tagline;
    const path = opts.path || "";
    const canonical = absolutePublic(path);
    document.title = title;

    function setMeta(attr, key, content) {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", opts.type || "website");
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:site_name", cfg.siteName);
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    if (opts.jsonLd) {
      let script = document.getElementById("jsonld");
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "jsonld";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(opts.jsonLd);
    }
  }

  function renderChrome(active) {
    const name = cfg.siteName;
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (header) {
      header.innerHTML = `
        <div class="container header-inner">
          <a class="brand" href="${pathRel("index.html")}">
            <span class="brand-mark" aria-hidden="true">◎</span>
            <span class="brand-text">
              <strong class="js-site-name">${escapeHtml(name)}</strong>
              <span>Worldwide car locator</span>
            </span>
          </a>
          <nav class="nav" aria-label="Primary">
            <a href="${pathRel("index.html")}" ${active === "home" ? 'aria-current="page"' : ""}>Search</a>
            <a href="${pathRel("sources.html")}" ${active === "sources" ? 'aria-current="page"' : ""}>Sources</a>
            <a href="${pathRel("vin.html")}" ${active === "vin" ? 'aria-current="page"' : ""}>VIN decoder</a>
            <a href="${pathRel("about.html")}" ${active === "about" ? 'aria-current="page"' : ""}>About</a>
          </nav>
        </div>`;
    }
    if (footer) {
      footer.innerHTML = `
        <div class="container footer-inner">
          <div>
            <strong class="js-site-name">${escapeHtml(name)}</strong>
            <div>Deep links to real marketplaces. No invented listings or prices.</div>
            <div>© ${cfg.year} · Static site for GitHub Pages</div>
          </div>
          <div class="footer-links">
            <a href="${pathRel("sources.html")}">Sources</a>
            <a href="${pathRel("vin.html")}">VIN decoder</a>
            <a href="${pathRel("about.html")}">About</a>
            <a href="${pathRel("robots.txt")}">robots.txt</a>
            <a href="${pathRel("sitemap.xml")}">Sitemap</a>
          </div>
        </div>`;
    }
    document.querySelectorAll(".js-site-name").forEach(el => { el.textContent = name; });
    document.querySelectorAll(".js-tagline").forEach(el => { el.textContent = cfg.tagline; });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function yearsOptions(selectEl, selected) {
    if (!selectEl) return;
    const now = new Date().getFullYear();
    const frag = document.createDocumentFragment();
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = selectEl.dataset.placeholder || "Any";
    frag.appendChild(blank);
    for (let y = now + 1; y >= 1950; y--) {
      const o = document.createElement("option");
      o.value = String(y);
      o.textContent = String(y);
      if (String(selected) === String(y)) o.selected = true;
      frag.appendChild(o);
    }
    selectEl.innerHTML = "";
    selectEl.appendChild(frag);
  }

  function readQuery() {
    const q = new URLSearchParams(location.search);
    return {
      make: q.get("make") || "",
      model: q.get("model") || "",
      yearFrom: q.get("yearFrom") || q.get("y1") || "",
      yearTo: q.get("yearTo") || q.get("y2") || "",
      country: q.get("country") || "worldwide"
    };
  }

  function goSearch(params) {
    const qs = new URLSearchParams();
    if (params.make) qs.set("make", params.make);
    if (params.model) qs.set("model", params.model);
    if (params.yearFrom) qs.set("yearFrom", params.yearFrom);
    if (params.yearTo) qs.set("yearTo", params.yearTo);
    if (params.country) qs.set("country", params.country);
    location.href = pathRel("results.html") + "?" + qs.toString();
  }

  function bindSearchForm(form) {
    if (!form) return;
    yearsOptions(form.querySelector('[name="yearFrom"]'));
    yearsOptions(form.querySelector('[name="yearTo"]'));
    const pre = readQuery();
    if (form.make && pre.make) form.make.value = pre.make;
    if (form.model && pre.model) form.model.value = pre.model;
    if (form.yearFrom && pre.yearFrom) form.yearFrom.value = pre.yearFrom;
    if (form.yearTo && pre.yearTo) form.yearTo.value = pre.yearTo;
    if (form.country && pre.country) form.country.value = pre.country;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      goSearch({
        make: form.make?.value.trim() || "",
        model: form.model?.value.trim() || "",
        yearFrom: form.yearFrom?.value || "",
        yearTo: form.yearTo?.value || "",
        country: form.country?.value || "worldwide"
      });
    });
  }

  function statusClass(v) {
    if (v === "verified") return "live";
    if (v === "bot_blocked") return "blocked";
    if (v === "search_on_site") return "onsite";
    if (v === "google_site") return "google";
    return "deeplink";
  }
  function statusLabel(v) {
    if (v === "verified") return "Verified link";
    if (v === "bot_blocked") return "Browser link";
    if (v === "search_on_site") return "Search on site";
    if (v === "google_site") return "Forum search via Google";
    return "Deep link";
  }
  function actionLabel(v) {
    if (v === "google_site") return "Search forum posts";
    return v === "search_on_site" ? "Search on site" : "Open search";
  }


  const OPEN_TABS_CONFIRM_THRESHOLD = 8;
  const CONFIRM_RESET_MS = 10000;
  let pendingConfirm = null;

  function popupHostLabel() {
    return location.hostname || "this site";
  }

  function showPopupNotice(container, attempted, opened) {
    let notice = container.querySelector(".popup-blocker-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "notice popup-blocker-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      const toolbar = container.querySelector(".results-toolbar");
      if (toolbar && toolbar.nextSibling) container.insertBefore(notice, toolbar.nextSibling);
      else container.prepend(notice);
    }
    const host = popupHostLabel();
    notice.innerHTML = `
      <strong>Your browser blocked the extra tabs</strong>
      (${opened} of ${attempted} opened). Chrome and other browsers usually allow only
      <strong>one</strong> new tab per click unless pop-ups are allowed for this site.
      To open all ${attempted} tabs at once, allow pop-ups for
      <strong>${escapeHtml(host)}</strong>
      (click the pop-up icon in the address bar, then choose “Always allow”),
      and click the button again.`;
    notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearPopupNotice(container) {
    const notice = container.querySelector(".popup-blocker-notice");
    if (notice) notice.remove();
  }

  function clearPendingConfirm() {
    if (!pendingConfirm) return;
    const { btn, label, aria, timer } = pendingConfirm;
    if (timer) clearTimeout(timer);
    if (btn && btn.dataset.confirmPending === "1") {
      btn.dataset.confirmPending = "";
      btn.classList.remove("btn-confirm-pending");
      if (label) btn.textContent = label;
      if (aria) btn.setAttribute("aria-label", aria);
    }
    pendingConfirm = null;
  }

  function armConfirm(btn, count) {
    clearPendingConfirm();
    const label = btn.textContent;
    const aria = btn.getAttribute("aria-label") || label;
    btn.dataset.confirmPending = "1";
    btn.classList.add("btn-confirm-pending");
    btn.textContent = "Click again to open " + count + " tabs";
    btn.setAttribute("aria-label", "Click again to open " + count + " marketplace searches in new tabs");
    const timer = setTimeout(clearPendingConfirm, CONFIRM_RESET_MS);
    pendingConfirm = { btn, label, aria, timer };
  }

  function openUrlsInTabs(urls, container, btn) {
    const list = (urls || []).filter(Boolean);
    if (!list.length) return { opened: 0, blocked: false };

    // Two-step confirmation without window.confirm(), which would
    // consume the user gesture and cause every window.open to be blocked.
    const armed = btn && btn.dataset.confirmPending === "1";
    if (list.length > OPEN_TABS_CONFIRM_THRESHOLD && btn && !armed) {
      armConfirm(btn, list.length);
      return { opened: 0, blocked: false, pending: true };
    }
    if (armed) clearPendingConfirm();

    clearPopupNotice(container);
    let opened = 0;
    for (let i = 0; i < list.length; i++) {
      // Do not pass "noopener" as a window.open feature string: that makes
      // the call return null even when the tab opened, so blocker detection
      // misfires and the rest of the loop is aborted.
      const win = window.open(list[i], "_blank");
      if (!win) break;
      try { win.opener = null; } catch (_) {}
      opened += 1;
    }
    const blocked = opened < list.length;
    if (blocked) showPopupNotice(container, list.length, opened);
    return { opened, blocked };
  }

  function collectCheckedUrls(scope) {
    return [...scope.querySelectorAll(".source-include:checked")].map(cb => cb.value).filter(Boolean);
  }

  function updateOpenSelectedLabel(container) {
    const btn = container.querySelector("[data-open-selected]");
    if (!btn) return;
    const n = container.querySelectorAll(".source-include:checked").length;
    btn.textContent = n ? `Open selected (${n}) in tabs` : "Open selected in tabs";
    btn.disabled = n === 0;
    btn.setAttribute("aria-label", n
      ? `Open ${n} selected marketplace searches in new tabs`
      : "Open selected marketplace searches in new tabs");
  }

  function bindOpenAllControls(container) {
    // The results can be re-rendered once stock hints arrive; bind the delegated listeners only once.
    if (container.dataset.openBound === "1") { updateOpenSelectedLabel(container); return; }
    container.dataset.openBound = "1";
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-open-all], button[data-open-selected], button[data-open-region]");
      if (!btn || !container.contains(btn)) return;
      e.preventDefault();

      let urls = [];
      if (btn.hasAttribute("data-open-selected")) {
        urls = collectCheckedUrls(container);
      } else if (btn.hasAttribute("data-open-region")) {
        const region = btn.closest(".region-block");
        urls = region
          ? [...region.querySelectorAll(".source-include")].map(cb => cb.value).filter(Boolean)
          : [];
      } else if (btn.hasAttribute("data-open-all")) {
        // Marketplaces only; forums have their own section button.
        urls = [...container.querySelectorAll('.region-block[data-kind="market"] .source-include')].map(cb => cb.value).filter(Boolean);
      }
      openUrlsInTabs(urls, container, btn);
    });

    container.addEventListener("change", (e) => {
      if (e.target && e.target.classList && e.target.classList.contains("source-include")) {
        updateOpenSelectedLabel(container);
      }
    });

    updateOpenSelectedLabel(container);
  }

  function fmtCheckDate(iso) {
    try {
      return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    } catch (e) { return iso; }
  }
  function stockBadge(it) {
    if (!it.stock || it.stock.status !== "found") return "";
    const n = it.stock.count ? ` · ${Number(it.stock.count).toLocaleString("en-US")} results` : "";
    return `<span class="stock-badge" title="Our nightly check found matching cars on this page (any year). Stock changes daily.">Stock checked ${escapeHtml(fmtCheckDate(it.stock.checked))}${n}</span>`;
  }

  function renderSourceItem(it, checked, wantYears) {
    // Only some sites accept a year range in the link; say so on the others.
    const yearNote = wantYears && !it.years && it.verify !== "search_on_site" && it.verify !== "google_site"
      ? `<span class="year-hint">Year range not applied by this link — set it on the site.</span>` : "";
    const action = it.verify === "search_on_site"
      ? "Open " + escapeHtml(it.name) + " and type the make and model there"
      : it.verify === "google_site"
        ? "Search " + escapeHtml(it.name) + " for-sale posts on Google"
        : "Open " + escapeHtml(it.name) + " search";
    return `
              <article class="source-item">
                <label class="source-check">
                  <input type="checkbox" class="source-include" value="${escapeHtml(it.url)}" ${checked ? "checked" : ""}
                    aria-label="Include ${escapeHtml(it.name)} when opening selected tabs" />
                  <span class="source-check-body">
                    <h3>${escapeHtml(it.name)}</h3>
                    <p>${escapeHtml(it.note || "")}</p>
                    ${yearNote}
                    ${stockBadge(it)}
                  </span>
                </label>
                <div class="source-actions">
                  <span class="status-pill ${statusClass(it.verify)}">${statusLabel(it.verify)}</span>
                  <a class="btn btn-primary btn-sm" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer"
                    aria-label="${action}">${actionLabel(it.verify)}</a>
                </div>
              </article>`;
  }

  // ---- Stock hints (data/stock-hints.json, written by the nightly stock checker) ----
  let stockHintsPromise = null;
  function loadStockHints() {
    if (!stockHintsPromise) {
      const day = new Date().toISOString().slice(0, 10);    // cache-bust once a day
      stockHintsPromise = fetch(url("data/stock-hints.json") + "?d=" + day, { cache: "no-cache" })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null);                                  // missing file or offline: behave as before
    }
    return stockHintsPromise;
  }
  function stockEntryFor(hints, params) {
    if (!hints || !hints.searches || !global.SITE_SOURCES || !global.SITE_SOURCES.stockKey) return null;
    if (!params.make) return null;
    const e = hints.searches[global.SITE_SOURCES.stockKey(params)];
    return e && e.sources ? e : null;
  }

  function renderResultGroups(container, params, hints) {
    if (!container || !global.SITE_SOURCES) return;
    if (hints === undefined) {
      // Render straight away, then re-render if the nightly check covers this search.
      loadStockHints().then(h => { if (stockEntryFor(h, params)) renderResultGroups(container, params, h); });
    }
    const entry = stockEntryFor(hints, params);
    const results = global.SITE_SOURCES.buildResults(params);
    const FORUM_REGION = "Forums & communities";
    let markets = results.filter(r => r.region !== FORUM_REGION);
    const forums = results.filter(r => r.region === FORUM_REGION);
    let found = [], zero = [], hidden = [];
    if (entry) {
      const siteBroken = hints.broken || {};
      const rest = [];
      markets.forEach(m => {
        const s = entry.sources[m.id];
        if (siteBroken[m.id] || (s && s.status === "broken")) hidden.push(m);
        else if (s && s.status === "found") { m.stock = Object.assign({ checked: entry.checked }, s); found.push(m); }
        else if (s && s.status === "zero") zero.push(m);
        else rest.push(m);
      });
      markets = rest;
    }
    const groups = global.SITE_SOURCES.groupByRegion(markets);
    const shown = markets.length + found.length;
    if (!results.length) {
      container.innerHTML = `<div class="empty">No sources matched that region.</div>`;
      return;
    }
    const summary = [params.make, params.model].filter(Boolean).join(" ") || "Any make/model";
    const years = [params.yearFrom, params.yearTo].filter(Boolean).join("–") || "Any year";
    const region = params.country || "worldwide";
    const wantYears = !!(params.yearFrom || params.yearTo);
    const yearCount = wantYears ? markets.concat(found).filter(m => m.years).length : 0;
    const checkedOn = entry ? fmtCheckDate(entry.checked) : "";
    const foundBlock = found.length ? `
        <div class="region-block found-block" data-region="In stock at last check" data-kind="market">
          <div class="region-header">
            <h2>Matching cars found at last check</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-open-region
              aria-label="Open all ${found.length} marketplaces that had matching cars in new tabs">
              Open all ${found.length} in tabs
            </button>
          </div>
          <p class="hint">Our automatic check on ${escapeHtml(checkedOn)} found ${escapeHtml([params.make, params.model].filter(Boolean).join(" "))} listings on these sites${wantYears ? " (any year — check your year range on the site)" : ""}. Stock changes daily.</p>
          <div class="source-list">
            ${found.map(it => renderSourceItem(it, true, wantYears)).join("")}
          </div>
        </div>` : "";
    const zeroBlock = zero.length ? `
        <details class="region-block zero-block" data-region="No matching cars at last check" data-kind="zero">
          <summary><h2>No matching cars at last check (${escapeHtml(checkedOn)})</h2>
            <span class="hint">${zero.length} site${zero.length === 1 ? "" : "s"} — not included in “Open all”. Click to show.</span></summary>
          <p class="hint">These sites showed no matching cars for this search when we checked. They may have new stock since, so the links are still here.</p>
          <div class="source-list">
            ${zero.map(it => renderSourceItem(it, false, wantYears)).join("")}
          </div>
        </details>` : "";
    const hiddenNote = hidden.length
      ? `<p class="hint hidden-note" role="note">${hidden.length} link${hidden.length === 1 ? "" : "s"} hidden because ${hidden.length === 1 ? "it was" : "they were"} broken at last check (${escapeHtml(checkedOn)}).</p>` : "";
    const forumBlock = forums.length ? `
        <div class="region-block forum-block" data-region="${escapeHtml(FORUM_REGION)}" data-kind="forum" id="forums">
          <div class="region-header">
            <h2>${escapeHtml(FORUM_REGION)}</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-open-region
              aria-label="Open all ${forums.length} forum searches in new tabs">
              Open all ${forums.length} forum searches in tabs
            </button>
          </div>
          <p class="hint forum-hint">Enthusiasts often sell cars in forum classifieds. Most forums have no search link, so these open a
            Google search limited to that forum for “for sale” posts${params.make ? " about <strong>" + escapeHtml(summary) + "</strong>" : ""}.
            Results are forum posts, not verified listings — check dates and sellers. Brand and model forums appear when they match your search.
            Forum boxes start unticked so “Open selected” stays marketplace-only unless you tick them.</p>
          <div class="source-list">
            ${forums.map(it => renderSourceItem(it, false)).join("")}
          </div>
        </div>` : "";
    container.innerHTML = `
      <div class="notice" style="margin-bottom:1.25rem">
        Showing <strong>${shown}</strong> marketplace deep links${forums.length ? ` and <strong>${forums.length}</strong> <a href="#forums">forum searches</a>` : ""} for
        <strong>${escapeHtml(summary)}</strong>,
        <strong>${escapeHtml(years)}</strong>,
        region <strong>${escapeHtml(region)}</strong>.
        This site does not host listings or prices — each button opens the live search on that site.
      </div>
      <p class="hint stock-hint">Each link opens that site’s own live search. A page saying “no results” or “0 cars” usually means
        that market has no matching car for sale right now — try another region or widen the search.
        If a site doesn’t recognise a model name it may show the whole make instead.${wantYears
          ? ` The year range is built into ${yearCount} of ${shown} marketplace links; the others are marked so you can set the years on the site.`
          : ""}</p>
      <div class="results-toolbar" role="group" aria-label="Open marketplace tabs">
        <button type="button" class="btn btn-primary btn-sm" data-open-all
          aria-label="Open all ${shown} marketplace searches in new tabs">
          Open all ${shown} marketplaces in tabs
        </button>
        <button type="button" class="btn btn-ghost btn-sm" data-open-selected
          aria-label="Open selected marketplace searches in new tabs">
          Open selected in tabs
        </button>
        <span class="hint results-toolbar-hint">Browsers allow one new tab per click unless you allow pop-ups for this site.</span>
      </div>
      ${foundBlock}
      ${groups.map(g => `
        <div class="region-block" data-region="${escapeHtml(g.region)}" data-kind="market">
          <div class="region-header">
            <h2>${escapeHtml(g.region)}</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-open-region
              aria-label="Open all ${g.items.length} ${escapeHtml(g.region)} marketplace searches in new tabs">
              Open all ${g.items.length} in tabs
            </button>
          </div>
          <div class="source-list">
            ${g.items.map(it => renderSourceItem(it, true, wantYears)).join("")}
          </div>
        </div>
      `).join("")}
      ${zeroBlock}
      ${hiddenNote}
      ${forumBlock}`;
    bindOpenAllControls(container);
  }

  async function loadJSON(rel) {
    const res = await fetch(url(rel));
    if (!res.ok) throw new Error("Failed to load " + rel);
    return res.json();
  }

  global.SiteApp = {
    cfg, url, pathRel, absolutePublic, injectSeo, renderChrome,
    bindSearchForm, readQuery, goSearch, renderResultGroups,
    loadJSON, yearsOptions, escapeHtml, statusClass, statusLabel, actionLabel, resolvedRoot
  };
})(window);
