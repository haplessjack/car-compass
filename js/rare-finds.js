/* Rare Finds page: renders data/rare-finds.json with client-side filters and Wanted flagging. Static, no tracking. */
(function (global) {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => " " + String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() + " ";
  const safeUrl = u => (/^https?:\/\//i.test(String(u || "")) ? String(u) : null);
  const TAGS = {
    "hypercar": "Hypercar", "supercar": "Supercar", "homologation": "Homologation special", "limited-edition": "Limited edition",
    "coachbuilt": "Coachbuilt", "pre-war": "Pre-war", "competition": "Competition", "jdm-icon": "Japanese icon",
    "low-volume": "Low volume", "blue-chip-classic": "Blue-chip classic"
  };
  const TYPES = { auction: "Auction", classified: "Classified", dealer: "Dealer" };
  const FILTER_IDS = ["rf-q", "rf-make", "rf-era", "rf-region", "rf-type", "rf-recent", "rf-tag", "rf-sort"];
  let DATA = { items: [], sources: [] }, WANTED = [];

  const fmtDate = iso => {
    if (!iso) return "";
    const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  const daysAgo = iso => (Date.now() - new Date(iso + "T00:00:00Z").getTime()) / 86400000;
  const eraOf = y => (y ? Math.floor(y / 10) * 10 : null);

  async function getJson(rel) {
    const bust = new Date().toISOString().slice(0, 10);
    const r = await fetch(SiteApp.url(rel) + "?d=" + bust, { cache: "no-cache" });
    if (!r.ok) throw new Error(rel + " " + r.status);
    return r.json();
  }

  function wantedMatch(it) {
    for (const w of WANTED) {
      if (!w || !w.make || norm(it.make).indexOf(norm(w.make)) < 0 && norm(it.title).indexOf(norm(w.make)) < 0) continue;
      if (w.model) {
        const hay = norm(it.title + " " + it.model);
        if (!norm(w.model).trim().split(" ").every(t => hay.indexOf(" " + t + " ") >= 0)) continue;
      }
      if (Array.isArray(w.years) && w.years.length === 2) { if (!it.year || it.year < w.years[0] || it.year > w.years[1]) continue; }
      if (w.region && it.region !== w.region && it.country !== w.region) continue;
      return w;
    }
    return null;
  }
  const wantedLabel = w => [w.make, w.model].filter(Boolean).join(" ") + (Array.isArray(w.years) && w.years.length === 2 ? ` (${w.years[0]}–${w.years[1]})` : "") + (w.region ? `, ${w.region}` : "");

  function fillSelect(id, values, label) {
    const sel = $(id); const keep = sel.value;
    values.forEach(v => { const o = document.createElement("option"); o.value = v.value; o.textContent = v.text; sel.appendChild(o); });
    if (keep) sel.value = keep;
  }
  function buildFilters() {
    const items = DATA.items;
    const count = key => items.reduce((m, i) => (i[key] ? (m[i[key]] = (m[i[key]] || 0) + 1, m) : m), {});
    const makes = count("make");
    fillSelect("rf-make", Object.keys(makes).sort().map(m => ({ value: m, text: `${m} (${makes[m]})` })));
    const eras = {}; items.forEach(i => { const e = eraOf(i.year); if (e) eras[e] = (eras[e] || 0) + 1; });
    fillSelect("rf-era", Object.keys(eras).sort().map(e => ({ value: e, text: (e < 1940 ? `${e}s (pre-war)` : `${e}s`) + ` (${eras[e]})` })));
    const regions = count("region");
    fillSelect("rf-region", Object.keys(regions).sort().map(r => ({ value: r, text: `${r} (${regions[r]})` })));
    const tags = count("rarity_tag");
    fillSelect("rf-tag", Object.keys(tags).sort((a, b) => (TAGS[a] || a).localeCompare(TAGS[b] || b)).map(t => ({ value: t, text: `${TAGS[t] || t} (${tags[t]})` })));
  }

  function readState() {
    const p = new URLSearchParams(location.search);
    FILTER_IDS.forEach(id => { const k = id.slice(3); if (p.has(k)) $(id).value = p.get(k); });
  }
  function writeState() {
    const p = new URLSearchParams();
    FILTER_IDS.forEach(id => { const v = $(id).value; if (v && !(id === "rf-sort" && v === "newest")) p.set(id.slice(3), v); });
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  function card(it) {
    const url = safeUrl(it.url); if (!url) return "";
    const w = it._wanted;
    const initial = esc((it.make || "?").trim().charAt(0).toUpperCase());
    const where = [it.country, it.region && it.region !== it.country ? it.region : null].filter(Boolean).join(" · ");
    const price = it.price_text ? `<span class="rf-price">${esc(it.price_text)}</span><span class="rf-price-note">as shown at last check</span>` : `<span class="rf-price rf-see">See listing</span>`;
    const ends = it.ends ? `<li><span>Ends</span> ${esc(fmtDate(it.ends))}</li>` : "";
    return `<article class="card rf-card${w ? " rf-is-wanted" : ""}">
      ${w ? `<div class="rf-wanted-flag">Matches wanted: ${esc(wantedLabel(w))}</div>` : ""}
      <div class="rf-card-head">
        <span class="rf-initial" aria-hidden="true">${initial}</span>
        <div class="rf-head-text">
          <div class="badge">${esc([it.year, it.make, it.model].filter(Boolean).join(" · "))}</div>
          <h3><a href="${esc(url)}" target="_blank" rel="noopener nofollow">${esc(it.title)}</a></h3>
        </div>
      </div>
      <div class="rf-tags"><span class="tag">${esc(TAGS[it.rarity_tag] || it.rarity_tag || "Rare")}</span><span class="tag rf-type-${esc(it.source_type)}">${esc(TYPES[it.source_type] || it.source_type)}</span></div>
      <p class="rf-note"><strong>Why it's rare:</strong> ${esc(it.rarity_note)}</p>
      <ul class="rf-meta">
        <li><span>Where</span> ${esc(where || "See listing")}</li>
        <li><span>Source</span> ${esc(it.source)}</li>
        <li><span>Found</span> ${esc(fmtDate(it.found))}${it.last_seen && it.last_seen !== it.found ? ` <em>(seen ${esc(fmtDate(it.last_seen))})</em>` : ""}</li>
        ${ends}
      </ul>
      <div class="rf-card-foot">
        <div class="rf-price-wrap">${price}</div>
        <a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener nofollow">View listing ↗</a>
      </div>
    </article>`;
  }

  function apply() {
    const q = norm($("rf-q").value).trim();
    const f = { make: $("rf-make").value, era: $("rf-era").value, region: $("rf-region").value, type: $("rf-type").value, recent: +$("rf-recent").value || 0, tag: $("rf-tag").value };
    let list = DATA.items.filter(it =>
      (!f.make || it.make === f.make) && (!f.era || String(eraOf(it.year)) === f.era) && (!f.region || it.region === f.region) &&
      (!f.type || it.source_type === f.type) && (!f.recent || daysAgo(it.found) <= f.recent) && (!f.tag || it.rarity_tag === f.tag) &&
      (!q || q.split(" ").every(t => norm([it.title, it.make, it.model, it.year, it.country, it.region, it.source, TAGS[it.rarity_tag]].join(" ")).indexOf(t) >= 0)));
    const sort = $("rf-sort").value;
    list.sort((a, b) => (b._wanted ? 1 : 0) - (a._wanted ? 1 : 0) ||
      (sort === "make" ? (a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || (a.year || 0) - (b.year || 0))
                       : (b.found.localeCompare(a.found) || (b.last_seen || "").localeCompare(a.last_seen || "") || a.make.localeCompare(b.make))));
    const n = list.length, total = DATA.items.length, nw = list.filter(i => i._wanted).length;
    $("rf-count").textContent = `${n} of ${total} cars` + (nw ? ` · ${nw} match wanted` : "");
    $("rf-grid").innerHTML = n ? list.map(card).join("") : `<div class="empty">No rare finds match these filters. Try widening them or <button type="button" class="btn btn-ghost btn-sm" id="rf-reset2">reset filters</button>.</div>`;
    const r2 = $("rf-reset2"); if (r2) r2.addEventListener("click", reset);
    writeState();
  }
  function reset() { FILTER_IDS.forEach(id => { $(id).value = id === "rf-sort" ? "newest" : ""; }); apply(); }

  function renderWanted() {
    const body = $("rf-wanted-body");
    if (!WANTED.length) {
      body.innerHTML = `<p>No wanted requests yet. When the site owner adds a request for a specific car, it shows here and any matching listing is flagged and moved to the top of the list.</p>`;
      return;
    }
    const hits = w => DATA.items.filter(it => wantedMatch(it) === w).length;
    body.innerHTML = `<ul class="rf-wanted-list">${WANTED.filter(w => w && w.make).map(w => `<li><strong>${esc(wantedLabel(w))}</strong>${w.note ? ` — ${esc(w.note)}` : ""} <span class="rf-wanted-hits">${hits(w)} matching now</span></li>`).join("")}</ul>`;
  }
  function renderAbout() {
    const gen = DATA.generated ? new Date(DATA.generated) : null;
    $("rf-checked").innerHTML = gen ? `<strong>Last checked:</strong> ${esc(gen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }))}.` : "";
    const label = { ok: "checked", blocked: "blocks automated checks, skipped", "not-checked": "not checked yet", error: "could not be read last time", empty: "no listings read last time", "robots-disallowed": "robots.txt disallows, skipped", "robots-unreadable": "robots.txt unreadable, skipped" };
    $("rf-sources").innerHTML = (DATA.sources || []).map(s => {
      const u = safeUrl(s.url);
      return `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(s.name)}</a>` : esc(s.name)} <span class="rf-src-status rf-src-${esc(s.status)}">${esc(label[s.status] || s.status)}${s.checked ? " " + esc(fmtDate(s.checked)) : ""}</span>${s.items ? ` · ${s.items} car${s.items === 1 ? "" : "s"} listed` : ""}</li>`;
    }).join("");
  }

  async function init() {
    try {
      const [data, wanted] = await Promise.all([getJson("data/rare-finds.json"), getJson("data/wanted.json").catch(() => ({ wanted: [] }))]);
      DATA = data && Array.isArray(data.items) ? data : { items: [], sources: [] };
      WANTED = wanted && Array.isArray(wanted.wanted) ? wanted.wanted : [];
    } catch (e) {
      $("rf-grid").innerHTML = `<div class="empty">Rare Finds could not be loaded right now. Please try again later.</div>`;
      $("rf-wanted-body").innerHTML = "<p>No wanted requests to show.</p>";
      return;
    }
    DATA.items = DATA.items.filter(it => safeUrl(it.url) && it.title && it.make);
    DATA.items.forEach(it => { it._wanted = wantedMatch(it); });
    buildFilters(); readState(); renderWanted(); renderAbout();
    FILTER_IDS.forEach(id => $(id).addEventListener(id === "rf-q" ? "input" : "change", apply));
    $("rf-reset").addEventListener("click", reset);
    apply();
  }
  global.RareFinds = { init, _wantedMatch: it => wantedMatch(it) };
})(window);
