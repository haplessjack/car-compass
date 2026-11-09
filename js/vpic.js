(function (global) {
  const API = "https://vpic.nhtsa.dot.gov/api/vehicles";
  let makesCache = null;
  let makesPromise = null;
  const modelCache = new Map();

  async function getAllMakes() {
    if (makesCache) return makesCache;
    if (makesPromise) return makesPromise;
    makesPromise = fetch(`${API}/GetAllMakes?format=json`)
      .then(r => {
        if (!r.ok) throw new Error("vPIC GetAllMakes HTTP " + r.status);
        return r.json();
      })
      .then(data => {
        makesCache = (data.Results || [])
          .map(x => x.Make_Name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        return makesCache;
      })
      .catch(err => {
        makesPromise = null;
        throw err;
      });
    return makesPromise;
  }

  async function getModelsForMake(make) {
    const key = String(make || "").trim().toLowerCase();
    if (!key) return [];
    if (modelCache.has(key)) return modelCache.get(key);
    const res = await fetch(`${API}/GetModelsForMake/${encodeURIComponent(make)}?format=json`);
    if (!res.ok) throw new Error("vPIC GetModelsForMake HTTP " + res.status);
    const data = await res.json();
    const models = [...new Set((data.Results || []).map(x => x.Model_Name).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    modelCache.set(key, models);
    return models;
  }

  async function decodeVin(vin) {
    const clean = String(vin || "").trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    if (clean.length !== 17) throw new Error("VIN must be 17 characters (letters I,O,Q not used).");
    const res = await fetch(`${API}/DecodeVinValues/${encodeURIComponent(clean)}?format=json`);
    if (!res.ok) throw new Error("vPIC DecodeVinValues HTTP " + res.status);
    const data = await res.json();
    const row = (data.Results && data.Results[0]) || {};
    return { vin: clean, row, raw: data };
  }


  function rankNames(all, q) {
    if (!q) return all.slice();
    const ql = q.toLowerCase();
    const scored = [];
    for (const name of all) {
      const n = name.toLowerCase();
      let score = -1;
      if (n === ql) score = 300;
      else if (n.startsWith(ql)) score = 200;
      else if (n.split(/[^a-z0-9]+/).some(p => p.startsWith(ql))) score = 150;
      else if (n.includes(ql)) score = 50;
      if (score >= 0) scored.push({ name, score, n });
    }
    scored.sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
    return scored.map(x => x.name);
  }

  function bindAutocomplete(input, listEl, { mode, makeInput, onPick } = {}) {
    if (!input || !listEl) return;
    let items = [];
    let active = -1;
    let timer = null;

    function close() {
      listEl.classList.remove("open");
      listEl.innerHTML = "";
      active = -1;
    }
    function open(list) {
      items = list;
      active = -1;
      if (!list.length) { close(); return; }
      listEl.innerHTML = list.map((t, i) =>
        `<button type="button" data-i="${i}" class="${i === active ? "active" : ""}">${SiteApp.escapeHtml(t)}</button>`
      ).join("");
      listEl.classList.add("open");
    }
    async function refresh() {
      const q = input.value.trim().toLowerCase();
      try {
        if (mode === "make") {
          const all = await getAllMakes();
          const hits = rankNames(all, q).slice(0, 12);
          open(hits);
        } else if (mode === "model") {
          const make = (makeInput && makeInput.value.trim()) || "";
          if (!make) { close(); return; }
          const all = await getModelsForMake(make);
          const hits = rankNames(all, q).slice(0, 12);
          open(hits);
        }
      } catch (err) {
        listEl.innerHTML = `<button type="button" disabled>Autocomplete unavailable (${SiteApp.escapeHtml(err.message)})</button>`;
        listEl.classList.add("open");
      }
    }

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 180);
    });
    input.addEventListener("focus", () => { refresh(); });
    input.addEventListener("keydown", (e) => {
      if (!listEl.classList.contains("open")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, items.length - 1); open(items); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); open(items); }
      else if (e.key === "Enter" && active >= 0) {
        e.preventDefault();
        input.value = items[active];
        close();
        onPick && onPick(items[active]);
      } else if (e.key === "Escape") close();
    });
    listEl.addEventListener("mousedown", (e) => {
      const btn = e.target.closest("button[data-i]");
      if (!btn) return;
      e.preventDefault();
      input.value = items[Number(btn.dataset.i)];
      close();
      onPick && onPick(input.value);
    });
    document.addEventListener("click", (e) => {
      if (!listEl.contains(e.target) && e.target !== input) close();
    });
  }

  global.SiteVPIC = { getAllMakes, getModelsForMake, decodeVin, bindAutocomplete, API };
})(window);
