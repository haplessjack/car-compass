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
    return "deeplink";
  }
  function statusLabel(v) {
    if (v === "verified") return "Verified link";
    if (v === "bot_blocked") return "Browser link";
    return "Deep link";
  }

  function renderResultGroups(container, params) {
    if (!container || !global.SITE_SOURCES) return;
    const results = global.SITE_SOURCES.buildResults(params);
    const groups = global.SITE_SOURCES.groupByRegion(results);
    if (!results.length) {
      container.innerHTML = `<div class="empty">No sources matched that region.</div>`;
      return;
    }
    const summary = [params.make, params.model].filter(Boolean).join(" ") || "Any make/model";
    const years = [params.yearFrom, params.yearTo].filter(Boolean).join("–") || "Any year";
    const region = params.country || "worldwide";
    container.innerHTML = `
      <div class="notice" style="margin-bottom:1.25rem">
        Showing <strong>${results.length}</strong> marketplace deep links for
        <strong>${escapeHtml(summary)}</strong>,
        <strong>${escapeHtml(years)}</strong>,
        region <strong>${escapeHtml(region)}</strong>.
        This site does not host listings or prices — each button opens the live search on that site.
      </div>
      ${groups.map(g => `
        <div class="region-block">
          <h2>${escapeHtml(g.region)}</h2>
          <div class="source-list">
            ${g.items.map(it => `
              <article class="source-item">
                <div>
                  <h3>${escapeHtml(it.name)}</h3>
                  <p>${escapeHtml(it.note || "")}</p>
                </div>
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
                  <span class="status-pill ${statusClass(it.verify)}">${statusLabel(it.verify)}</span>
                  <a class="btn btn-primary btn-sm" href="${it.url}" target="_blank" rel="noopener noreferrer">Open search</a>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `).join("")}`;
  }

  async function loadJSON(rel) {
    const res = await fetch(url(rel));
    if (!res.ok) throw new Error("Failed to load " + rel);
    return res.json();
  }

  global.SiteApp = {
    cfg, url, pathRel, absolutePublic, injectSeo, renderChrome,
    bindSearchForm, readQuery, goSearch, renderResultGroups,
    loadJSON, yearsOptions, escapeHtml, statusClass, statusLabel, resolvedRoot
  };
})(window);
