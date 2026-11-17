/* Car Compass Marketplace + profiles. Client-side only; talks to Supabase with the PUBLIC publishable key.
   Every permission is enforced by Row Level Security in the database, never just by hiding buttons here. */
(function (global) {
  "use strict";
  const cfg = SiteApp.cfg;
  const SB = cfg.supabase || {};
  const $ = id => document.getElementById(id);
  const esc = s => SiteApp.escapeHtml(s == null ? "" : s);
  const PAGE_SIZE = 24;
  const MAX_PHOTOS = 6;
  const MAX_BYTES = 5 * 1024 * 1024;
  const MAX_INPUT_BYTES = 25 * 1024 * 1024;
  let client = null;

  /* ---------- core ---------- */
  function sb() {
    if (client) return client;
    if (!global.supabase || !global.supabase.createClient) throw new Error("The sign-in library could not load. Check your connection or ad blocker and reload.");
    client = global.supabase.createClient(SB.url, SB.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }
  async function currentUser() {
    const { data } = await sb().auth.getSession();
    return data && data.session ? data.session.user : null;
  }
  function updateNav(user) { const a = $("nav-account"); if (a) a.textContent = user ? "My account" : "Sign in"; }
  function photoUrl(path) {
    return SB.url + "/storage/v1/object/public/" + SB.photoBucket + "/" + String(path).split("/").map(encodeURIComponent).join("/");
  }
  function fmtPrice(p, c) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(p); }
    catch (e) { return c + " " + Number(p).toLocaleString(); }
  }
  const fmtNum = n => Number(n).toLocaleString();
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
  const fmtDateTime = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); };
  const region = p => [p && p.city, p && p.country].filter(Boolean).join(", ");
  const qs = k => new URLSearchParams(location.search).get(k);
  const isUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ""));
  const page = rel => SiteApp.pathRel(rel);
  const likeEsc = s => String(s).replace(/[\\%_]/g, m => "\\" + m);
  const STATUS_LABEL = { pending: "Pending review", approved: "Live", rejected: "Not approved", sold: "Sold", expired: "Expired" };
  function effectiveStatus(l) { return l.status === "approved" && new Date(l.expires_at) <= new Date() ? "expired" : l.status; }
  function statusPill(l) { const s = effectiveStatus(l); return `<span class="mk-status mk-status-${s}">${esc(STATUS_LABEL[s] || s)}</span>`; }

  function friendly(err) {
    const m = String((err && (err.message || err.error_description)) || err || "Something went wrong");
    if (/rate limit: at most 3/.test(m)) return "You can post at most 3 new cars per 24 hours. Please try again tomorrow.";
    if (/rate limit: at most 20/.test(m)) return "You've reached the limit of 20 messages per 24 hours. Please try again later.";
    if (/banned/.test(m)) return "This account can't post or send messages. Contact the site owner if you think this is a mistake.";
    if (/at most 6 photos/.test(m)) return "A listing can have at most 6 photos.";
    if (/not available/.test(m)) return "This listing isn't available any more.";
    if (/own listing/.test(m)) return "You can't message your own listing.";
    if (/duplicate key.*reports/.test(m)) return "You've already reported this listing. Thanks, an admin will review it.";
    if (/Email rate limit|over_email_send_rate_limit|rate limit exceeded/i.test(m)) return "Too many sign-in emails were requested. Please wait a few minutes and try again.";
    if (/not authorized/i.test(m) && /email/i.test(m)) return "Sign-in emails can't be sent to this address yet (the site's email service is still being set up).";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Couldn't reach the Marketplace service. Check your connection and try again.";
    if (/check constraint/.test(m)) return "Some details aren't valid. Please check the form and try again.";
    return m;
  }
  function say(el, msg, kind) {
    if (typeof el === "string") el = $(el);
    if (!el) return;
    el.className = "mk-msg" + (kind ? " mk-msg-" + kind : "");
    el.textContent = msg || "";
    el.hidden = !msg;
  }
  function safeNext(n) { return n && /^[a-z-]+\.html(\?[A-Za-z0-9=&%._-]*)?$/.test(n) ? n : null; }
  function signInLink(next, text) {
    return `<a class="btn btn-primary" href="${page("account.html")}?next=${encodeURIComponent(next || "")}">${esc(text || "Sign in")}</a>`;
  }
  function libFailed(container) {
    const el = typeof container === "string" ? $(container) : container;
    if (el) el.innerHTML = `<div class="empty">The Marketplace couldn't load. Check your connection or ad blocker, then reload the page.</div>`;
  }

  let MAKES = null, COUNTRIES = null;
  async function refData() {
    if (!MAKES) {
      try { MAKES = (await SiteApp.loadJSON("data/makes.json")).map(m => m.name).sort((a, b) => a.localeCompare(b)); } catch (e) { MAKES = []; }
      COUNTRIES = allCountries();
    }
    return { makes: MAKES, countries: COUNTRIES };
  }
  // Full country list from the browser's own ISO 3166 names (English, so stored values stay consistent).
  const ISO = "AD AE AF AG AI AL AM AO AR AS AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS XK YE YT ZA ZM ZW";
  function allCountries() {
    let names = [];
    try { const dn = new Intl.DisplayNames(["en"], { type: "region" }); names = ISO.split(" ").map(c => dn.of(c)).filter(n => n && !/^[A-Z]{2}$/.test(n)); }
    catch (e) { names = ["United States", "Canada", "United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands", "Japan", "Australia"]; }
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }
  const COUNTRY_ALIASES = { "usa": "United States", "us": "United States", "u.s.": "United States", "u.s.a.": "United States", "america": "United States", "united states of america": "United States", "uk": "United Kingdom", "u.k.": "United Kingdom", "great britain": "United Kingdom", "england": "United Kingdom", "scotland": "United Kingdom", "wales": "United Kingdom", "uae": "United Arab Emirates", "holland": "Netherlands" };
  function normCountry(v) {
    const t = String(v || "").trim(); const a = COUNTRY_ALIASES[t.toLowerCase()];
    if (a) return a;
    const hit = (COUNTRIES || []).find(c => c.toLowerCase() === t.toLowerCase());
    return hit || t;
  }

  function fillDatalist(id, values) { const dl = $(id); if (dl) dl.innerHTML = values.map(v => `<option value="${esc(v)}"></option>`).join(""); }

  /* ---------- photos: resize + strip EXIF/GPS by re-encoding through a canvas ---------- */
  function loadImg(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(file.name + " isn't a readable image.")); };
      img.src = url;
    });
  }
  async function resizeImage(file, maxSide, quality) {
    maxSide = maxSide || 1600; quality = quality || 0.85;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error(file.name + ": only JPEG, PNG or WebP photos are allowed.");
    if (file.size > MAX_INPUT_BYTES) throw new Error(file.name + " is too large (max 25 MB before resizing).");
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { src = await loadImg(file); }
    const w = src.width, h = src.height, scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    if (src.close) src.close();
    let q = quality, blob;
    do {
      blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", q));
      q -= 0.1;
    } while (blob && blob.size > MAX_BYTES && q > 0.35);
    if (!blob || blob.size > MAX_BYTES) throw new Error(file.name + " is still over 5 MB after resizing.");
    return blob; // fresh JPEG: no EXIF, no GPS, no camera metadata
  }
  const rand = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- shared rendering ---------- */
  function listingCard(l, cover) {
    const title = `${l.year} ${l.make} ${l.model}`;
    const href = `${page("listing.html")}?id=${encodeURIComponent(l.id)}`;
    return `<article class="card rf-card mk-card">
      <a class="mk-thumb" href="${href}" tabindex="-1" aria-hidden="true">${cover ? `<img src="${esc(photoUrl(cover))}" alt="" loading="lazy" />` : `<span class="mk-nophoto">No photo</span>`}</a>
      <div class="badge">${esc(region(l)) || "&nbsp;"}</div>
      <h3><a href="${href}">${esc(title)}</a></h3>
      <ul class="rf-meta">
        <li><span>Mileage</span>${esc(fmtNum(l.mileage))} ${esc(l.mileage_unit)}</li>
        <li><span>Listed</span>${esc(fmtDate(l.created_at))}</li>
      </ul>
      <div class="rf-card-foot"><div class="rf-price-wrap"><span class="rf-price">${esc(fmtPrice(l.price, l.currency))}</span><span class="rf-price-note">Asking price, set by the seller</span></div>
      <a class="btn btn-ghost btn-sm" href="${href}">View</a></div>
    </article>`;
  }
  async function coversFor(ids) {
    const map = {};
    if (!ids.length) return map;
    const { data, error } = await sb().from("listing_photos").select("listing_id,path,sort_order").in("listing_id", ids).order("sort_order");
    if (error) return map;
    data.forEach(p => { if (!map[p.listing_id]) map[p.listing_id] = p.path; });
    return map;
  }
  const LISTING_COLS = "id,seller_id,make,model,year,mileage,mileage_unit,price,currency,country,city,vin_last6,description,status,created_at,expires_at,approved_at";
  const SAFETY = `<ul class="mk-safety">
      <li><strong>See the car in person</strong>, ideally with a mechanic, before paying anything.</li>
      <li><strong>Never wire a deposit</strong> or pay with gift cards, crypto or a money transfer app to "hold" a car.</li>
      <li>Check the full VIN, title and service history yourself, and run a vehicle history report.</li>
      <li>Be wary of prices far below market, sellers who are "abroad", or anyone pushing you to move off-site fast.</li>
      <li>Meet in a busy public place, and never share codes sent to your phone.</li>
      <li>Report anything suspicious with the Report button. Car Compass isn't part of any sale and can't recover money.</li>
    </ul>`;

  /* ================= account.html ================= */
  async function account() {
    try { sb(); } catch (e) { return libFailed("acct-root"); }
    const next = safeNext(qs("next"));
    if (next) localStorage.setItem("cc-after-signin", next);
    // Errors from an expired/invalid magic link come back in the URL hash.
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hash.get("error_description")) say("acct-msg", "That sign-in link didn't work: " + hash.get("error_description").replace(/\+/g, " ") + ". Request a new one below.", "err");
    sb().auth.onAuthStateChange((evt, session) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "INITIAL_SESSION") setTimeout(() => renderAccount(session ? session.user : null), 0);
    });
  }
  let acctRendered = null;
  async function renderAccount(user) {
    const key = user ? user.id : "anon";
    if (acctRendered === key) return; acctRendered = key;
    if (!$("acct-signedout")) return; // page replaced (e.g. after account deletion)
    updateNav(user);
    $("acct-signedout").hidden = !!user;
    $("acct-signedin").hidden = !user;
    if (!user) return bindSignIn();
    const after = safeNext(localStorage.getItem("cc-after-signin"));
    if (after) { localStorage.removeItem("cc-after-signin"); location.href = page(after); return; }
    if (location.hash && /access_token|refresh_token/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    $("acct-email").textContent = user.email || "";
    const { countries } = await refData();
    fillDatalist("dl-countries", countries);
    const { data: prof } = await sb().from("profiles").select("id,display_name,city,country,avatar_path,created_at").eq("id", user.id).maybeSingle();
    const f = $("profile-form");
    if (prof) {
      f.display_name.value = prof.display_name === "New member" ? "" : prof.display_name;
      f.city.value = prof.city || ""; f.country.value = prof.country || "";
      $("acct-since").textContent = fmtDate(prof.created_at);
      $("acct-public").href = `${page("profile.html")}?u=${user.id}`;
      showAvatar(prof.avatar_path);
      if (prof.display_name === "New member") say("profile-msg", "Pick a display name. It's shown on your listings instead of your email.", "info");
    }
    f.onsubmit = async ev => {
      ev.preventDefault();
      const name = f.display_name.value.trim();
      if (name.length < 2 || name.length > 40) return say("profile-msg", "Display name must be 2 to 40 characters.", "err");
      if (/@|https?:\/\//i.test(name)) return say("profile-msg", "Please don't put an email address or link in your display name.", "err");
      say("profile-msg", "Saving…");
      const upd = { display_name: name, city: f.city.value.trim() || null, country: f.country.value.trim() ? normCountry(f.country.value) : null };
      const file = f.avatar.files && f.avatar.files[0];
      try {
        if (file) {
          const blob = await resizeImage(file, 400, 0.85);
          const path = `${user.id}/avatar-${rand()}.jpg`;
          const up = await sb().storage.from(SB.photoBucket).upload(path, blob, { contentType: "image/jpeg", upsert: false });
          if (up.error) throw up.error;
          upd.avatar_path = path;
          if (prof && prof.avatar_path) sb().storage.from(SB.photoBucket).remove([prof.avatar_path]);
        }
        const { error } = await sb().from("profiles").update(upd).eq("id", user.id);
        if (error) throw error;
        if (upd.avatar_path) { prof.avatar_path = upd.avatar_path; showAvatar(upd.avatar_path); }
        f.avatar.value = "";
        say("profile-msg", "Profile saved.", "ok");
      } catch (e) { say("profile-msg", friendly(e), "err"); }
    };
    $("acct-signout").onclick = async () => { await sb().auth.signOut(); acctRendered = null; location.reload(); };
    $("acct-delete").onclick = () => deleteAccount(user);
    sb().rpc("my_flags").then(({ data }) => {
      const fl = data && data[0];
      if (fl && fl.is_admin) $("acct-admin").hidden = false;
      if (fl && fl.banned) say("acct-msg", "This account has been suspended. You can still read your messages and delete your account.", "err");
    });
    sb().from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null)
      .then(({ count }) => { if (count) $("acct-unread").textContent = ` (${count} new)`; });
    myListings(user);
  }
  function showAvatar(path) {
    const el = $("acct-avatar");
    if (el) el.innerHTML = path ? `<img src="${esc(photoUrl(path))}" alt="Your profile photo" />` : `<span aria-hidden="true">◎</span>`;
  }
  function bindSignIn() {
    const f = $("signin-form");
    f.onsubmit = async ev => {
      ev.preventDefault();
      if (f.website.value) { say("signin-msg", "Check your email for a sign-in link.", "ok"); return; } // honeypot: bots get a fake success
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say("signin-msg", "Please enter a valid email address.", "err");
      if (!f.agree.checked) return say("signin-msg", "Please accept the Terms and Privacy policy to continue.", "err");
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      say("signin-msg", "Sending your sign-in link…");
      const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: SiteApp.url("account.html"), shouldCreateUser: true } });
      btn.disabled = false;
      if (error) return say("signin-msg", friendly(error), "err");
      say("signin-msg", `Check ${email} for a sign-in link. It works once and expires in about an hour. You can close this tab.`, "ok");
    };
  }
  async function myListings(user) {
    const box = $("acct-listings");
    const { data, error } = await sb().from("listings").select(LISTING_COLS).eq("seller_id", user.id).order("created_at", { ascending: false });
    if (error) { box.innerHTML = `<div class="empty">${esc(friendly(error))}</div>`; return; }
    if (!data.length) { box.innerHTML = `<div class="empty">You haven't listed a car yet. <a href="${page("sell.html")}">Sell a car</a></div>`; return; }
    box.innerHTML = `<div class="mk-table-wrap"><table class="mk-table"><thead><tr><th>Car</th><th>Price</th><th>Status</th><th>Expires</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${data.map(l => `
      <tr><td><a href="${page("listing.html")}?id=${l.id}">${esc(`${l.year} ${l.make} ${l.model}`)}</a></td>
      <td>${esc(fmtPrice(l.price, l.currency))}</td><td>${statusPill(l)}</td><td>${esc(fmtDate(l.expires_at))}</td>
      <td class="mk-actions">${["sold", "expired"].includes(effectiveStatus(l)) ? "" : `<a class="btn btn-ghost btn-sm" href="${page("sell.html")}?id=${l.id}">Edit</a>`}
      ${["approved", "pending"].includes(l.status) ? `<button type="button" class="btn btn-ghost btn-sm" data-sold="${l.id}">Mark sold</button>` : ""}
      <button type="button" class="btn btn-ghost btn-sm" data-del="${l.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
    box.querySelectorAll("[data-sold]").forEach(b => b.onclick = async () => {
      if (!confirm("Mark this car as sold? It will be removed from the Marketplace.")) return;
      const { error } = await sb().from("listings").update({ status: "sold" }).eq("id", b.dataset.sold);
      if (error) alert(friendly(error)); myListings(user);
    });
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!confirm("Delete this listing and its photos permanently?")) return;
      const err = await deleteListing(user, b.dataset.del);
      if (err) alert(friendly(err)); myListings(user);
    });
  }
  async function deleteListing(user, id) {
    const { data: photos } = await sb().from("listing_photos").select("path").eq("listing_id", id);
    if (photos && photos.length) await sb().storage.from(SB.photoBucket).remove(photos.map(p => p.path));
    const { error } = await sb().from("listings").delete().eq("id", id);
    return error;
  }
  async function deleteAccount(user) {
    const typed = prompt("This permanently deletes your profile, listings, photos and messages. Type DELETE to confirm.");
    if (typed !== "DELETE") return;
    say("acct-msg", "Deleting your account…");
    try {
      const bucket = sb().storage.from(SB.photoBucket);
      const top = await bucket.list(user.id, { limit: 1000 });
      const paths = [];
      for (const it of (top.data || [])) {
        if (it.id) paths.push(`${user.id}/${it.name}`);
        else { const sub = await bucket.list(`${user.id}/${it.name}`, { limit: 100 }); (sub.data || []).forEach(s => paths.push(`${user.id}/${it.name}/${s.name}`)); }
      }
      if (paths.length) await bucket.remove(paths);
      const { error } = await sb().rpc("delete_my_account");
      if (error) throw error;
      // The server-side user and sessions are already gone; just forget the local session (signOut() would 403).
      try { sb().auth.stopAutoRefresh(); localStorage.removeItem("sb-" + new URL(SB.url).hostname.split(".")[0] + "-auth-token"); } catch (e) {}
      updateNav(null);
      document.getElementById("acct-root").innerHTML = `<div class="notice"><strong>Your account has been deleted.</strong> Your profile, listings, photos and messages were removed.</div>`;
    } catch (e) { say("acct-msg", friendly(e), "err"); }
  }

  /* ================= profile.html ================= */
  async function profile() {
    const root = $("prof-root");
    try { sb(); } catch (e) { return libFailed(root); }
    currentUser().then(updateNav);
    const id = qs("u");
    if (!isUuid(id)) { root.innerHTML = `<div class="empty">No profile selected. <a href="${page("marketplace.html")}">Browse the Marketplace</a></div>`; return; }
    const { data: p, error } = await sb().from("profiles").select("id,display_name,city,country,avatar_path,created_at").eq("id", id).maybeSingle();
    if (error || !p) { root.innerHTML = `<div class="empty">This profile isn't available.</div>`; return; }
    document.title = `${p.display_name} — Marketplace seller — ${cfg.siteName}`;
    const { data: ls } = await sb().from("listings").select(LISTING_COLS).eq("seller_id", id).eq("status", "approved").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
    const covers = await coversFor((ls || []).map(l => l.id));
    root.innerHTML = `<div class="mk-profile-head card">
        <div class="mk-avatar">${p.avatar_path ? `<img src="${esc(photoUrl(p.avatar_path))}" alt="" />` : `<span aria-hidden="true">◎</span>`}</div>
        <div><h1>${esc(p.display_name)}</h1><p>${esc(region(p) || "Region not shared")} · Member since ${esc(fmtDate(p.created_at))}</p></div>
      </div>
      <h2>Cars for sale (${(ls || []).length})</h2>
      <div class="grid rf-grid">${(ls || []).length ? ls.map(l => listingCard(l, covers[l.id])).join("") : `<div class="empty">No cars for sale right now.</div>`}</div>`;
  }

  /* ================= marketplace.html ================= */
  const MK_FIELDS = ["q", "make", "model", "ymin", "ymax", "pmin", "pmax", "country", "sort"];
  let mkPage = 0, mkTimer = null;
  async function marketplace() {
    try { sb(); } catch (e) { return libFailed("mk-grid"); }
    currentUser().then(updateNav);
    const { makes, countries } = await refData();
    fillDatalist("dl-makes", makes);
    const cs = $("mk-country"); countries.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; cs.appendChild(o); });
    const yNow = new Date().getFullYear() + 1;
    ["mk-ymin", "mk-ymax"].forEach(id => { const s = $(id); for (let y = yNow; y >= 1900; y--) { const o = document.createElement("option"); o.value = y; o.textContent = y; s.appendChild(o); } });
    const params = new URLSearchParams(location.search);
    MK_FIELDS.forEach(k => { if (params.get(k) && $("mk-" + k)) $("mk-" + k).value = params.get(k); });
    const f = $("mk-filters");
    f.addEventListener("input", () => { clearTimeout(mkTimer); mkTimer = setTimeout(() => loadMarket(true), 350); });
    f.addEventListener("change", () => { clearTimeout(mkTimer); loadMarket(true); });
    f.addEventListener("submit", ev => { ev.preventDefault(); loadMarket(true); });
    $("mk-reset").onclick = () => { f.reset(); loadMarket(true); };
    $("mk-more").onclick = () => loadMarket(false);
    loadMarket(true);
  }
  function readFilters() {
    const v = {}; MK_FIELDS.forEach(k => { const el = $("mk-" + k); v[k] = el ? el.value.trim() : ""; }); return v;
  }
  async function loadMarket(reset) {
    const v = readFilters();
    const grid = $("mk-grid"), more = $("mk-more");
    if (reset) {
      mkPage = 0;
      const p = new URLSearchParams(); MK_FIELDS.forEach(k => { if (v[k] && !(k === "sort" && v[k] === "newest")) p.set(k, v[k]); });
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
      grid.innerHTML = `<div class="empty">Loading cars…</div>`;
    }
    let q = sb().from("listings").select(LISTING_COLS, { count: "exact" })
      .eq("status", "approved").gt("expires_at", new Date().toISOString());
    if (v.make) q = q.ilike("make", likeEsc(v.make));
    if (v.model) q = q.ilike("model", "%" + likeEsc(v.model) + "%");
    if (/^\d{4}$/.test(v.ymin)) q = q.gte("year", +v.ymin);
    if (/^\d{4}$/.test(v.ymax)) q = q.lte("year", +v.ymax);
    if (/^\d+$/.test(v.pmin)) q = q.gte("price", +v.pmin);
    if (/^\d+$/.test(v.pmax)) q = q.lte("price", +v.pmax);
    if (v.country) q = q.ilike("country", likeEsc(v.country));
    const t = v.q.replace(/[^\p{L}\p{N} .-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    if (t) { const w = "%" + likeEsc(t) + "%"; q = q.or(`make.ilike.${w},model.ilike.${w},description.ilike.${w},city.ilike.${w}`); }
    const SORTS = { newest: ["created_at", false], price_asc: ["price", true], price_desc: ["price", false], year_desc: ["year", false], year_asc: ["year", true], mileage_asc: ["mileage", true] };
    const [col, asc] = SORTS[v.sort] || SORTS.newest;
    q = q.order(col, { ascending: asc }).order("created_at", { ascending: false }).range(mkPage * PAGE_SIZE, mkPage * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, error, count } = await q;
    if (error) { grid.innerHTML = `<div class="empty">${esc(friendly(error))}</div>`; more.hidden = true; return; }
    const covers = await coversFor(data.map(l => l.id));
    const html = data.map(l => listingCard(l, covers[l.id])).join("");
    if (reset) grid.innerHTML = html || `<div class="empty">${Object.values(v).some(x => x && x !== "newest") ? "No cars match these filters yet. Try widening them." : "No cars listed yet. Be the first:"} <a href="${page("sell.html")}">Sell a car</a></div>`;
    else grid.insertAdjacentHTML("beforeend", html);
    mkPage++;
    const shown = Math.min(count || 0, mkPage * PAGE_SIZE);
    $("mk-count").textContent = count ? `Showing ${shown} of ${count} car${count === 1 ? "" : "s"}` : "";
    more.hidden = !(count > shown);
  }

  /* ================= listing.html ================= */
  async function listing() {
    const root = $("ls-root");
    try { sb(); } catch (e) { return libFailed(root); }
    const id = qs("id");
    if (!isUuid(id)) { root.innerHTML = `<div class="empty">No listing selected. <a href="${page("marketplace.html")}">Browse the Marketplace</a></div>`; return; }
    const user = await currentUser(); updateNav(user);
    const { data: l, error } = await sb().from("listings").select(LISTING_COLS).eq("id", id).maybeSingle();
    if (error || !l) { root.innerHTML = `<div class="empty">This listing isn't available. It may be waiting for review, sold, expired or removed. <a href="${page("marketplace.html")}">Browse the Marketplace</a></div>`; return; }
    const [{ data: photos }, { data: seller }] = await Promise.all([
      sb().from("listing_photos").select("path,sort_order").eq("listing_id", id).order("sort_order"),
      sb().from("profiles").select("id,display_name,city,country,avatar_path,created_at").eq("id", l.seller_id).maybeSingle()
    ]);
    const title = `${l.year} ${l.make} ${l.model}`;
    const mine = user && user.id === l.seller_id;
    const live = effectiveStatus(l) === "approved";
    SiteApp.injectSeo({ title: `${title} for sale${l.country ? " in " + l.country : ""} — Marketplace — ${cfg.siteName}`,
      description: `${title}, ${fmtNum(l.mileage)} ${l.mileage_unit}, ${fmtPrice(l.price, l.currency)}. Listed by a private seller on the Car Compass Marketplace.`,
      path: `listing.html?id=${l.id}` });
    if (!live) { const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m); }
    const ph = photos || [];
    root.innerHTML = `
      ${!live ? `<div class="notice mk-owner-note">${statusPill(l)} ${mine ? (l.status === "pending" ? "Only you (and the admins) can see this listing until it's approved." : "This listing isn't visible to the public.") : "This listing isn't public."}</div>` : ""}
      <div class="mk-listing">
        <div class="mk-gallery">
          <div class="mk-main-photo" id="ls-main">${ph.length ? `<img src="${esc(photoUrl(ph[0].path))}" alt="${esc(title)}, photo 1 of ${ph.length}" />` : `<span class="mk-nophoto">No photos</span>`}</div>
          ${ph.length > 1 ? `<div class="mk-thumbs">${ph.map((p, i) => `<button type="button" data-i="${i}" aria-label="Show photo ${i + 1}"${i === 0 ? ' aria-current="true"' : ""}><img src="${esc(photoUrl(p.path))}" alt="" loading="lazy" /></button>`).join("")}</div>` : ""}
        </div>
        <div class="mk-side">
          <div class="eyebrow">Marketplace · private seller</div>
          <h1>${esc(title)}</h1>
          <div class="mk-bigprice">${esc(fmtPrice(l.price, l.currency))}</div>
          <dl class="mk-specs">
            <div><dt>Mileage</dt><dd>${esc(fmtNum(l.mileage))} ${esc(l.mileage_unit)}</dd></div>
            <div><dt>Location</dt><dd>${esc(region(l))}</dd></div>
            <div><dt>Year</dt><dd>${esc(l.year)}</dd></div>
            <div><dt>VIN (last 6)</dt><dd>${l.vin_last6 ? "…" + esc(l.vin_last6) : "Not given"}</dd></div>
            <div><dt>Listed</dt><dd>${esc(fmtDate(l.created_at))}</dd></div>
          </dl>
          ${seller ? `<a class="mk-seller card" href="${page("profile.html")}?u=${seller.id}"><span class="mk-avatar mk-avatar-sm">${seller.avatar_path ? `<img src="${esc(photoUrl(seller.avatar_path))}" alt="" />` : "◎"}</span><span><strong>${esc(seller.display_name)}</strong><small>${esc(region(seller) || "Region not shared")} · Member since ${esc(fmtDate(seller.created_at))}</small></span></a>` : ""}
          ${mine ? `<div class="mk-owner-actions">${["sold", "expired"].includes(effectiveStatus(l)) ? "" : `<a class="btn btn-primary btn-sm" href="${page("sell.html")}?id=${l.id}">Edit listing</a>`} <a class="btn btn-ghost btn-sm" href="${page("account.html")}">Manage in My account</a></div>` : `
          <section class="mk-contact" aria-labelledby="ls-contact-h">
            <h2 id="ls-contact-h">Message the seller</h2>
            ${!live ? `<p class="hint">Messaging is closed for this listing.</p>` : !user ? `<p>Sign in to send a message. Your email is never shown to the seller.</p>${signInLink("listing.html?id=" + l.id, "Sign in to message")}` : `
            <form id="ls-msg-form" novalidate>
              <div class="field"><label for="ls-msg">Your message</label><textarea id="ls-msg" name="msg" rows="4" maxlength="2000" required>Hi, is your ${esc(title)} still available?</textarea></div>
              <div class="mk-hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off" /></label></div>
              <button class="btn btn-primary" type="submit">Send message</button>
              <p class="hint">The seller sees your display name and message, never your email. Replies arrive in <a href="${page("messages.html")}">Messages</a>.</p>
              <div id="ls-msg-status" class="mk-msg" hidden></div>
            </form>`}
          </section>`}
        </div>
      </div>
      <div class="mk-two">
        <section class="prose"><h2>Seller's description</h2><div class="mk-desc">${l.description ? esc(l.description) : "<em>No description.</em>"}</div>
          <p class="hint">Details, photos and price are provided by the seller and haven't been verified by Car Compass.</p></section>
        <section class="card mk-safety-card"><h2>Stay safe</h2>${SAFETY}
          ${!mine ? `<details class="mk-report" id="ls-report"><summary>Report this listing</summary>
            ${!user ? `<p>Sign in to report a listing.</p>${signInLink("listing.html?id=" + l.id, "Sign in to report")}` : `
            <form id="ls-report-form">
              <div class="field"><label for="ls-reason">Reason</label><select id="ls-reason" required>
                <option value="">Choose a reason</option><option>Scam or fake listing</option><option>Wrong or misleading details</option>
                <option>Prohibited item</option><option>Offensive content</option><option>Car already sold</option><option>Other</option></select></div>
              <div class="field"><label for="ls-rdetail">Details (optional)</label><textarea id="ls-rdetail" rows="3" maxlength="800"></textarea></div>
              <button class="btn btn-ghost btn-sm" type="submit">Send report</button>
              <div id="ls-report-status" class="mk-msg" hidden></div>
            </form>`}</details>` : ""}
        </section>
      </div>`;
    root.querySelectorAll(".mk-thumbs button").forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      $("ls-main").innerHTML = `<img src="${esc(photoUrl(ph[i].path))}" alt="${esc(title)}, photo ${i + 1} of ${ph.length}" />`;
      root.querySelectorAll(".mk-thumbs button").forEach(x => x.removeAttribute("aria-current")); b.setAttribute("aria-current", "true");
    });
    const mf = $("ls-msg-form");
    if (mf) mf.onsubmit = async ev => {
      ev.preventDefault();
      if (mf.website.value) return say("ls-msg-status", "Message sent.", "ok");
      const body = mf.msg.value.trim();
      if (body.length < 2) return say("ls-msg-status", "Please write a message.", "err");
      const btn = mf.querySelector("button"); btn.disabled = true; say("ls-msg-status", "Sending…");
      // First message opens a conversation (contact_request); later ones go into the same thread.
      const { data: open } = await sb().from("contact_requests").select("id").eq("listing_id", l.id).eq("buyer_id", user.id).maybeSingle();
      let { error } = open
        ? await sb().from("messages").insert({ listing_id: l.id, recipient_id: l.seller_id, body })
        : await sb().from("contact_requests").insert({ listing_id: l.id, message: body });
      if (error && error.code === "23505") ({ error } = await sb().from("messages").insert({ listing_id: l.id, recipient_id: l.seller_id, body }));
      btn.disabled = false;
      if (error) return say("ls-msg-status", friendly(error), "err");
      mf.msg.value = "";
      const st = $("ls-msg-status"); st.className = "mk-msg mk-msg-ok"; st.hidden = false;
      st.innerHTML = `Message sent. <a href="${page("messages.html")}?l=${l.id}&w=${l.seller_id}">Open the conversation</a>`;
    };
    const rf = $("ls-report-form");
    if (rf) rf.onsubmit = async ev => {
      ev.preventDefault();
      const r = $("ls-reason").value; if (!r) return say("ls-report-status", "Please choose a reason.", "err");
      const reason = (r + ($("ls-rdetail").value.trim() ? ": " + $("ls-rdetail").value.trim() : "")).slice(0, 1000);
      const { error } = await sb().from("reports").insert({ listing_id: l.id, reason });
      if (error) return say("ls-report-status", friendly(error), error.code === "23505" ? "info" : "err");
      rf.innerHTML = `<p class="mk-msg mk-msg-ok">Thanks. An admin will review this listing.</p>`;
    };
  }

  /* ================= sell.html ================= */
  async function sell() {
    const root = $("sell-root");
    try { sb(); } catch (e) { return libFailed(root); }
    const user = await currentUser(); updateNav(user);
    const editId = qs("id");
    if (!user) {
      root.innerHTML = `<div class="card mk-gate"><h2>Sign in to sell a car</h2><p>It's free. We'll email you a one-time sign-in link, so there's no password to remember. Your email is never shown to buyers.</p>${signInLink(editId && isUuid(editId) ? "sell.html?id=" + editId : "sell.html", "Sign in to continue")}</div>`;
      return;
    }
    $("sell-form-wrap").hidden = false; root.hidden = true;
    const { makes, countries } = await refData();
    fillDatalist("dl-makes", makes); fillDatalist("dl-countries", countries);
    const f = $("sell-form");
    const yr = f.year; const yNow = new Date().getFullYear() + 1;
    for (let y = yNow; y >= 1900; y--) { const o = document.createElement("option"); o.value = y; o.textContent = y; yr.appendChild(o); }
    let existing = [], removed = [], added = [], editing = null;
    if (editId) {
      if (!isUuid(editId)) return say("sell-msg", "That listing link isn't valid.", "err");
      const { data: l } = await sb().from("listings").select(LISTING_COLS).eq("id", editId).eq("seller_id", user.id).maybeSingle();
      if (!l) return say("sell-msg", "You can only edit your own listings.", "err");
      if (["sold", "expired"].includes(effectiveStatus(l))) return say("sell-msg", "Sold or expired listings can't be edited.", "err");
      editing = l;
      ["make", "model", "year", "mileage", "mileage_unit", "price", "currency", "country", "city", "description"].forEach(k => { if (l[k] != null) f[k].value = l[k]; });
      if (l.vin_last6) f.vin.placeholder = "Saved: …" + l.vin_last6 + " (leave blank to keep)";
      f.terms.checked = true;
      $("sell-h").textContent = `Edit your ${l.year} ${l.make} ${l.model}`;
      $("sell-submit").textContent = "Save changes";
      $("sell-edit-note").hidden = false;
      const { data: ph } = await sb().from("listing_photos").select("path,sort_order").eq("listing_id", l.id).order("sort_order");
      existing = ph || [];
    }
    const renderPhotos = () => {
      const keep = existing.filter(p => !removed.includes(p.path));
      const total = keep.length + added.length;
      $("sell-photo-count").textContent = `${total} of ${MAX_PHOTOS} photos`;
      f.photos.disabled = total >= MAX_PHOTOS;
      $("sell-photos").innerHTML = keep.map(p => `<figure><img src="${esc(photoUrl(p.path))}" alt="" /><button type="button" class="btn btn-ghost btn-sm" data-rm-old="${esc(p.path)}">Remove</button></figure>`).join("")
        + added.map((a, i) => `<figure><img src="${a.preview}" alt="" /><button type="button" class="btn btn-ghost btn-sm" data-rm-new="${i}">Remove</button></figure>`).join("");
      $("sell-photos").querySelectorAll("[data-rm-old]").forEach(b => b.onclick = () => { removed.push(b.dataset.rmOld); renderPhotos(); });
      $("sell-photos").querySelectorAll("[data-rm-new]").forEach(b => b.onclick = () => { URL.revokeObjectURL(added[+b.dataset.rmNew].preview); added.splice(+b.dataset.rmNew, 1); renderPhotos(); });
    };
    f.photos.onchange = () => {
      const keepN = existing.filter(p => !removed.includes(p.path)).length;
      const errs = [];
      [...f.photos.files].forEach(file => {
        if (keepN + added.length >= MAX_PHOTOS) { errs.push(`Only ${MAX_PHOTOS} photos allowed.`); return; }
        if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) { errs.push(`${file.name}: only JPEG, PNG or WebP.`); return; }
        if (file.size > MAX_INPUT_BYTES) { errs.push(`${file.name}: over 25 MB.`); return; }
        added.push({ file, preview: URL.createObjectURL(file) });
      });
      f.photos.value = "";
      say("sell-photo-msg", [...new Set(errs)].join(" "), errs.length ? "err" : "");
      renderPhotos();
    };
    renderPhotos();
    f.onsubmit = async ev => {
      ev.preventDefault();
      if (f.website.value) { say("sell-msg", "Thanks! Your listing was submitted for review.", "ok"); return; } // honeypot
      const errs = validateSell(f);
      if (errs.length) { say("sell-msg", errs.join(" "), "err"); return; }
      const vin = f.vin.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const row = {
        make: f.make.value.trim(), model: f.model.value.trim(), year: +f.year.value,
        mileage: Math.round(+f.mileage.value), mileage_unit: f.mileage_unit.value,
        price: Math.round(+f.price.value), currency: f.currency.value,
        country: normCountry(f.country.value), city: f.city.value.trim() || null,
        description: f.description.value.trim()
      };
      if (vin) row.vin_last6 = vin.slice(-6); // the full VIN never leaves this browser
      const btn = $("sell-submit"); btn.disabled = true;
      say("sell-msg", editing ? "Saving changes…" : "Submitting your listing…");
      try {
        let id;
        if (editing) {
          const { error } = await sb().from("listings").update(row).eq("id", editing.id);
          if (error) throw error; id = editing.id;
          if (removed.length) {
            await sb().from("listing_photos").delete().eq("listing_id", id).in("path", removed);
            await sb().storage.from(SB.photoBucket).remove(removed);
          }
        } else {
          const { data, error } = await sb().from("listings").insert(row).select("id").single();
          if (error) throw error; id = data.id;
        }
        const used = new Set(existing.filter(p => !removed.includes(p.path)).map(p => p.sort_order));
        let n = 0;
        for (const a of added) {
          let slot = 0; while (used.has(slot)) slot++;
          if (slot >= MAX_PHOTOS) break;
          say("sell-msg", `Uploading photo ${++n} of ${added.length}…`);
          const blob = await resizeImage(a.file, 1600, 0.85);
          const path = `${user.id}/${id}/${slot}-${rand()}.jpg`;
          const up = await sb().storage.from(SB.photoBucket).upload(path, blob, { contentType: "image/jpeg", upsert: false });
          if (up.error) throw new Error("Photo upload failed: " + up.error.message + ". Your listing was saved; edit it to add photos again.");
          const { error: pe } = await sb().from("listing_photos").insert({ listing_id: id, path, sort_order: slot });
          if (pe) { await sb().storage.from(SB.photoBucket).remove([path]); throw pe; }
          used.add(slot);
        }
        location.href = `${page("listing.html")}?id=${id}&submitted=1`;
      } catch (e) { btn.disabled = false; say("sell-msg", friendly(e), "err"); }
    };
  }
  function validateSell(f) {
    const e = [], y = new Date().getFullYear() + 1;
    if (!f.make.value.trim()) e.push("Enter the make.");
    if (!f.model.value.trim()) e.push("Enter the model.");
    if (!(+f.year.value >= 1900 && +f.year.value <= y)) e.push("Choose the year.");
    if (!/^\d{1,7}$/.test(f.mileage.value.trim())) e.push("Mileage must be a whole number.");
    if (!/^\d{1,10}$/.test(f.price.value.trim())) e.push("Price must be a whole number, without symbols.");
    if (!/^[A-Z]{3}$/.test(f.currency.value)) e.push("Choose a currency.");
    if (f.country.value.trim().length < 2) e.push("Enter the country the car is in.");
    const vin = f.vin.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (vin && (/[IOQ]/.test(vin) || vin.length > 17)) e.push("That VIN doesn't look right (VINs never contain I, O or Q).");
    if (f.description.value.length > 5000) e.push("Description is too long (5,000 characters max).");
    if (/(western union|moneygram|gift ?card|wire (the )?deposit)/i.test(f.description.value)) e.push("Descriptions can't ask for wire transfers, gift cards or deposits.");
    if (!f.terms.checked) e.push("Please accept the Terms and confirm you have the right to sell this car.");
    return e;
  }

  /* ================= messages.html ================= */
  async function messages() {
    const root = $("msg-root");
    try { sb(); } catch (e) { return libFailed(root); }
    const user = await currentUser(); updateNav(user);
    if (!user) { root.innerHTML = `<div class="card mk-gate"><h2>Sign in to see your messages</h2>${signInLink("messages.html", "Sign in")}</div>`; return; }
    await loadThreads(user, qs("l"), qs("w"));
  }
  async function loadThreads(user, selL, selW) {
    const root = $("msg-root");
    const { data: msgs, error } = await sb().from("messages").select("id,listing_id,sender_id,recipient_id,body,created_at,read_at").order("created_at", { ascending: true }).limit(1000);
    if (error) { root.innerHTML = `<div class="empty">${esc(friendly(error))}</div>`; return; }
    const threads = {};
    msgs.forEach(m => {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const k = m.listing_id + "|" + other;
      (threads[k] = threads[k] || { listing_id: m.listing_id, other, msgs: [], unread: 0 }).msgs.push(m);
      if (m.recipient_id === user.id && !m.read_at) threads[k].unread++;
    });
    const list = Object.values(threads).sort((a, b) => new Date(b.msgs[b.msgs.length - 1].created_at) - new Date(a.msgs[a.msgs.length - 1].created_at));
    if (!list.length) { root.innerHTML = `<div class="empty">No conversations yet. Find a car on the <a href="${page("marketplace.html")}">Marketplace</a> and message the seller.</div>`; return; }
    const lids = [...new Set(list.map(t => t.listing_id))], uids = [...new Set(list.map(t => t.other))];
    const [{ data: ls }, { data: ps }] = await Promise.all([
      sb().from("listings").select("id,make,model,year,seller_id,status,expires_at").in("id", lids),
      sb().from("profiles").select("id,display_name").in("id", uids)
    ]);
    const L = {}, P = {}; (ls || []).forEach(x => L[x.id] = x); (ps || []).forEach(x => P[x.id] = x);
    let cur = list.find(t => t.listing_id === selL && t.other === selW) || list[0];
    const carName = t => L[t.listing_id] ? `${L[t.listing_id].year} ${L[t.listing_id].make} ${L[t.listing_id].model}` : "Listing no longer available";
    const who = t => P[t.other] ? P[t.other].display_name : "Former member";
    const render = () => {
      root.innerHTML = `<div class="mk-inbox">
        <nav class="mk-threads" aria-label="Conversations">${list.map((t, i) => `<button type="button" data-t="${i}" ${t === cur ? 'aria-current="true"' : ""}>
          <strong>${esc(who(t))}</strong><span>${esc(carName(t))}</span><small>${esc(fmtDateTime(t.msgs[t.msgs.length - 1].created_at))}${t.unread ? ` · <b>${t.unread} new</b>` : ""}</small></button>`).join("")}</nav>
        <section class="mk-thread card" aria-live="polite">
          <header><h2>${esc(who(cur))}</h2><a href="${page("listing.html")}?id=${cur.listing_id}">${esc(carName(cur))}</a>
            ${L[cur.listing_id] && L[cur.listing_id].seller_id === user.id ? `<span class="hint">You're the seller</span>` : ""}</header>
          <ol class="mk-bubbles">${cur.msgs.map(m => `<li class="${m.sender_id === user.id ? "me" : "them"}"><p>${esc(m.body)}</p><small>${esc(fmtDateTime(m.created_at))}</small></li>`).join("")}</ol>
          <form id="msg-reply"><div class="field"><label for="msg-body">Reply</label><textarea id="msg-body" rows="3" maxlength="2000" required></textarea></div>
            <div class="mk-hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off" /></label></div>
            <div class="mk-row"><button class="btn btn-primary btn-sm" type="submit">Send</button><button class="btn btn-ghost btn-sm" type="button" id="msg-refresh">Refresh</button></div>
            <div id="msg-status" class="mk-msg" hidden></div></form>
          <p class="hint">Never send deposits or payment details over chat. See the car in person first.</p>
        </section></div>`;
      root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { cur = list[+b.dataset.t]; history.replaceState(null, "", `?l=${cur.listing_id}&w=${cur.other}`); markRead(); render(); });
      const bub = root.querySelector(".mk-bubbles"); bub.scrollTop = bub.scrollHeight;
      $("msg-refresh").onclick = () => loadThreads(user, cur.listing_id, cur.other);
      $("msg-reply").onsubmit = async ev => {
        ev.preventDefault();
        if (ev.target.website.value) return;
        const body = $("msg-body").value.trim(); if (!body) return;
        const { error } = await sb().from("messages").insert({ listing_id: cur.listing_id, recipient_id: cur.other, body });
        if (error) return say("msg-status", friendly(error), "err");
        loadThreads(user, cur.listing_id, cur.other);
      };
    };
    const markRead = () => {
      if (!cur.unread) return;
      sb().from("messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("listing_id", cur.listing_id).eq("sender_id", cur.other).is("read_at", null).then(() => {});
      cur.unread = 0;
    };
    markRead(); render();
  }

  /* ================= admin.html ================= */
  async function admin() {
    const root = $("adm-root");
    try { sb(); } catch (e) { return libFailed(root); }
    const user = await currentUser(); updateNav(user);
    if (!user) { root.innerHTML = `<div class="card mk-gate"><h2>Admins only</h2><p>Sign in with an admin account.</p>${signInLink("admin.html", "Sign in")}</div>`; return; }
    const { data: fl } = await sb().rpc("my_flags");
    if (!(fl && fl[0] && fl[0].is_admin)) { root.innerHTML = `<div class="card mk-gate"><h2>Admins only</h2><p>This account isn't an admin. The database refuses admin actions from non-admin accounts, so nothing here would work anyway.</p></div>`; return; }
    root.innerHTML = `<section><h2>Pending listings <span class="hint" id="adm-pending-n"></span></h2><div id="adm-pending"></div></section>
      <section><h2>Open reports <span class="hint" id="adm-reports-n"></span></h2><div id="adm-reports"></div></section>
      <section><h2>Recently approved</h2><div id="adm-recent"></div></section>
      <section><h2>Banned accounts</h2><div id="adm-banned"></div></section>`;
    adminLoad();
  }
  async function adminLoad() {
    const [pend, reps, recent, banned] = await Promise.all([
      sb().from("listings").select(LISTING_COLS).eq("status", "pending").order("created_at").limit(100),
      sb().from("reports").select("id,listing_id,reporter_id,reason,created_at").eq("resolved", false).order("created_at").limit(100),
      sb().from("listings").select(LISTING_COLS).eq("status", "approved").order("approved_at", { ascending: false }).limit(20),
      sb().rpc("admin_banned_profiles")
    ]);
    const all = [...(pend.data || []), ...(recent.data || [])];
    const repLids = [...new Set((reps.data || []).map(r => r.listing_id))].filter(id => !all.find(l => l.id === id));
    let repListings = [];
    if (repLids.length) repListings = (await sb().from("listings").select(LISTING_COLS).in("id", repLids)).data || [];
    const LMAP = {}; [...all, ...repListings].forEach(l => LMAP[l.id] = l);
    const uids = [...new Set([...Object.values(LMAP).map(l => l.seller_id), ...(reps.data || []).map(r => r.reporter_id)])];
    const P = {}; if (uids.length) ((await sb().from("profiles").select("id,display_name,created_at").in("id", uids)).data || []).forEach(p => P[p.id] = p);
    const covers = await coversFor(Object.keys(LMAP));
    const name = id => P[id] ? esc(P[id].display_name) : "(banned or deleted)";
    const row = (l, extra) => `<article class="card mk-adm-row">
        <a class="mk-thumb mk-thumb-sm" href="${page("listing.html")}?id=${l.id}">${covers[l.id] ? `<img src="${esc(photoUrl(covers[l.id]))}" alt="" />` : `<span class="mk-nophoto">No photo</span>`}</a>
        <div class="mk-adm-body"><h3><a href="${page("listing.html")}?id=${l.id}">${esc(`${l.year} ${l.make} ${l.model}`)}</a> ${statusPill(l)}</h3>
          <p>${esc(fmtPrice(l.price, l.currency))} · ${esc(fmtNum(l.mileage))} ${esc(l.mileage_unit)} · ${esc(region(l))} · seller <a href="${page("profile.html")}?u=${l.seller_id}">${name(l.seller_id)}</a> · ${esc(fmtDate(l.created_at))}</p>
          ${l.description ? `<p class="mk-adm-desc">${esc(l.description.slice(0, 400))}${l.description.length > 400 ? "…" : ""}</p>` : ""}${extra || ""}</div>
        <div class="mk-actions">
          ${l.status !== "approved" ? `<button class="btn btn-primary btn-sm" data-act="approve" data-id="${l.id}">Approve</button>` : ""}
          ${l.status !== "rejected" ? `<button class="btn btn-ghost btn-sm" data-act="reject" data-id="${l.id}">Reject</button>` : ""}
          <button class="btn btn-ghost btn-sm mk-danger" data-act="ban" data-id="${l.seller_id}">Ban seller</button></div></article>`;
    $("adm-pending-n").textContent = `(${(pend.data || []).length})`;
    $("adm-pending").innerHTML = (pend.data || []).map(l => row(l)).join("") || `<div class="empty">Nothing waiting for review.</div>`;
    $("adm-reports-n").textContent = `(${(reps.data || []).length})`;
    $("adm-reports").innerHTML = (reps.data || []).map(r => LMAP[r.listing_id] ? row(LMAP[r.listing_id], `<p class="mk-report-reason"><strong>Report:</strong> ${esc(r.reason)} <em>— ${name(r.reporter_id)}, ${esc(fmtDate(r.created_at))}</em> <button class="btn btn-ghost btn-sm" data-act="resolve" data-id="${r.id}">Mark resolved</button></p>`) : "").join("") || `<div class="empty">No open reports.</div>`;
    $("adm-recent").innerHTML = (recent.data || []).map(l => row(l)).join("") || `<div class="empty">No live listings yet.</div>`;
    $("adm-banned").innerHTML = (banned.data || []).length ? `<ul class="mk-banned">${banned.data.map(p => `<li>${esc(p.display_name)} <small>(member since ${esc(fmtDate(p.created_at))})</small> <button class="btn btn-ghost btn-sm" data-act="unban" data-id="${p.id}">Unban</button></li>`).join("")}</ul>` : `<div class="empty">No banned accounts.</div>`;
    document.querySelectorAll("#adm-root [data-act]").forEach(b => b.onclick = () => adminAct(b.dataset.act, b.dataset.id));
  }
  async function adminAct(act, id) {
    let res;
    if (act === "approve") res = await sb().from("listings").update({ status: "approved" }).eq("id", id).select("id");
    if (act === "reject") res = await sb().from("listings").update({ status: "rejected" }).eq("id", id).select("id");
    if (act === "resolve") res = await sb().from("reports").update({ resolved: true }).eq("id", id).select("id");
    if (act === "ban") { if (!confirm("Ban this seller? Their live and pending listings will be rejected and they won't be able to post or message.")) return; res = await sb().from("profiles").update({ banned: true }).eq("id", id).select("id"); }
    if (act === "unban") res = await sb().from("profiles").update({ banned: false }).eq("id", id).select("id");
    if (res && res.error) alert(friendly(res.error));
    else if (res && !res.data.length) alert("Nothing changed. The database only lets admins do this.");
    adminLoad();
  }

  global.Market = { account, profile, marketplace, listing, sell, messages, admin, _resizeImage: resizeImage, _validateSell: validateSell };
})(window);
