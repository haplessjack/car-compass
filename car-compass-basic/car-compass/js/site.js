(function (global) {
  const cfg = global.SITE_CONFIG || { siteName: "Car Compass", tagline: "", baseUrl: "/", year: 2026 };
  function pathRel(rel) { return rel; }
  function renderChrome(active) {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (header) {
      header.innerHTML = `<div class="container header-inner"><a class="brand" href="index.html"><strong>${cfg.siteName}</strong></a><nav><a href="index.html">Search</a></nav></div>`;
    }
    if (footer) {
      footer.innerHTML = `<div class="container"><strong>${cfg.siteName}</strong><div>Deep links to real marketplaces.</div></div>`;
    }
  }
  function bindSearchForm(form) {
    if (!form) return;
    form.addEventListener("submit", (e) => { e.preventDefault(); alert("Search functionality ready once full site is uploaded."); });
  }
  global.SiteApp = { renderChrome, bindSearchForm };
})(window);
