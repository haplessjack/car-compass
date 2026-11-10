/* Marketplace deep-link builders. No invented listings/prices — links only. */
(function (global) {
  function enc(s) { return encodeURIComponent(String(s || "").trim()); }
  function slug(s) {
    return String(s || "").trim().toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  function qYear(yFrom, yTo) {
    const a = yFrom ? String(yFrom) : "";
    const b = yTo ? String(yTo) : "";
    if (a && b) return a + ".." + b + " ";
    if (a) return a + " ";
    if (b) return b + " ";
    return "";
  }
  // Search text is make + model only. Year syntax like "2015..2020" inside a
  // keyword box is not understood by these sites and caused "no results"
  // (BaT 404, BE FORWARD 404, CarSensor 0件). Years go in real year filters.
  function keyword(make, model) {
    return [make, model].map(x => String(x || "").trim()).filter(Boolean).join(" ");
  }
  // Ordered, validated year range. Either bound may be blank.
  function yr(p) {
    const ok = v => { const n = parseInt(v, 10); return n >= 1900 && n <= 2100 ? n : 0; };
    let a = ok(p.yearFrom), b = ok(p.yearTo);
    if (a && b && a > b) { const t = a; a = b; b = t; }
    return { from: a ? String(a) : "", to: b ? String(b) : "", any: !!(a || b) };
  }
  // Append non-empty query params to a URL.
  function withQs(url, obj) {
    const qs = new URLSearchParams();
    Object.keys(obj).forEach(k => { if (obj[k] !== "" && obj[k] != null) qs.set(k, obj[k]); });
    const q = qs.toString();
    return q ? url + (url.indexOf("?") === -1 ? "?" : "&") + q : url;
  }
  // slug with underscores instead of hyphens inside a name (cars.com, Goo-net, JamesEdition)
  function b64url(str) {
    const b = btoa(unescape(encodeURIComponent(str)));
    return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function uslug(s) { return slug(s).replace(/-/g, "_"); }

  const SOURCES = [
    {
      id: "autotrader-us",
      name: "Autotrader",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["market"],
      home: "https://www.autotrader.com/",
      verify: "verified",
      note: "National US marketplace",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.autotrader.com/cars-for-sale/";
        let url = `https://www.autotrader.com/cars-for-sale/${make}`;
        if (model) url += `/${model}`;
        const qs = new URLSearchParams();
        const y = yr(p);
        if (y.from) qs.set("startYear", y.from);
        if (y.to) qs.set("endYear", y.to);
        // 0 = nationwide. Do not send marketExtension without a zip;
        // that pairing can yield a "no vehicles found" page for some users.
        qs.set("searchRadius", "0");
        const q = qs.toString();
        return q ? url + "?" + q : url;
      }
    },
    {
      id: "cars-com",
      name: "Cars.com",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["market"],
      home: "https://www.cars.com/",
      verify: "verified",
      note: "National US marketplace",
      build(p) {
        // cars.com ids use underscores inside names: mercedes_benz, toyota-land_cruiser.
        // Hyphenated ids silently drop the filter (verified 2026-11-10).
        const make = uslug(p.make);
        const model = uslug(p.model);
        const params = new URLSearchParams();
        params.set("stock_type", "all");
        params.set("maximum_distance", "all");
        if (make) params.append("makes[]", make);
        if (make && model) params.append("models[]", `${make}-${model}`);
        const y = yr(p);
        if (y.from) params.set("year_min", y.from);
        if (y.to) params.set("year_max", y.to);
        return "https://www.cars.com/shopping/results/?" + params.toString();
      }
    },
    {
      id: "cargurus",
      name: "CarGurus",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["market"],
      home: "https://www.cargurus.com/",
      verify: "search_on_site",
      note: "No reliable public URL filters by make/model without CarGurus’ internal IDs. Opens CarGurus search — type the make and model there.",
      build(p) {
        return "https://www.cargurus.com/Cars/";
      }
    },
    {
      id: "ebay-motors",
      name: "eBay Motors",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["market", "auction"],
      home: "https://www.ebay.com/motors",
      verify: "verified",
      note: "Cars & Trucks category search",
      build(p) {
        const nkw = keyword(p.make, p.model) || "car";
        // Current public search form (legacy /sch/Cars-Trucks/6001/i.html returns an error page).
        return `https://www.ebay.com/sch/i.html?_nkw=${enc(nkw)}&_sacat=6001`;
      }
    },
    {
      id: "bringatrailer",
      name: "Bring a Trailer",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["auction", "classic"],
      home: "https://bringatrailer.com/",
      verify: "verified",
      note: "Enthusiast auction; search resolves to make/model hubs when possible",
      build(p) {
        const s = keyword(p.make, p.model);
        return s ? `https://bringatrailer.com/search/?s=${enc(s)}` : "https://bringatrailer.com/";
      }
    },
    {
      id: "carsandbids",
      name: "Cars & Bids",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["auction"],
      home: "https://carsandbids.com/",
      verify: "verified",
      note: "Modern enthusiast auctions",
      build(p) {
        const s = keyword(p.make, p.model), y = yr(p);
        if (!s && !y.any) return "https://carsandbids.com/";
        return withQs("https://carsandbids.com/search", { q: s, start_year: y.from, end_year: y.to });
      }
    },
    {
      id: "hemmings",
      name: "Hemmings",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["classic", "market"],
      home: "https://www.hemmings.com/",
      verify: "verified",
      note: "Classic and collector classifieds",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://www.hemmings.com/classifieds/cars-for-sale/${make}/${model}`;
        if (make) return `https://www.hemmings.com/classifieds/cars-for-sale/${make}`;
        return "https://www.hemmings.com/classifieds/cars-for-sale";
      }
    },
    {
      id: "classiccars",
      name: "ClassicCars.com",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["classic", "market"],
      home: "https://classiccars.com/",
      verify: "verified",
      note: "Collector car marketplace",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        const y = yr(p);
        const yf = y.from || "1900";
        const yt = y.to || new Date().getFullYear();
        if (make && model) return `https://classiccars.com/listings/find/${yf}-${yt}/${make}/${model}`;
        if (make) return `https://classiccars.com/listings/find/${yf}-${yt}/${make}`;
        return `https://classiccars.com/listings/find/${yf}-${yt}`;
      }
    },
    {
      id: "autotrader-uk",
      name: "AutoTrader UK",
      region: "UK & Ireland",
      regions: ["uk", "worldwide"],
      kinds: ["market"],
      home: "https://www.autotrader.co.uk/",
      verify: "verified",
      note: "UK classifieds. The site hides results until a postcode is set, so this link uses a default London postcode (SW1A 1AA) with a 1500-mile nationwide radius.",
      build(p) {
        const params = new URLSearchParams();
        params.set("advertising-location", "at_cars");
        if (p.make) params.set("make", p.make);
        // Autotrader UK needs its exact model name; Defender is split into
        // "Defender 90/110/130", so model=Defender shows 0 results. Use keywords there.
        const splitModels = { defender: 1 };
        if (p.model) params.set(splitModels[slug(p.model)] ? "keywords" : "model", p.model);
        const y = yr(p);
        if (y.from) params.set("year-from", y.from);
        if (y.to) params.set("year-to", y.to);
        // The UK site shows "0 results" until a postcode is provided.
        // Default London postcode + 1500-mile radius = nationwide results.
        params.set("postcode", "SW1A1AA");
        params.set("radius", "1500");
        return "https://www.autotrader.co.uk/car-search?" + params.toString();
      }
    },
    {
      id: "pistonheads",
      name: "PistonHeads",
      region: "UK & Ireland",
      regions: ["uk", "worldwide"],
      kinds: ["market", "enthusiast"],
      home: "https://www.pistonheads.com/",
      verify: "verified",
      note: "UK enthusiast classifieds (keyword search)",
      build(p) {
        const params = new URLSearchParams();
        // Current UI ignores Category/Make/Model query params and redirects to
        // an unfiltered search. The keywords= parameter does filter.
        // No working year parameter (yearFrom/yearTo are ignored), so years are set on the site.
        const s = keyword(p.make, p.model);
        if (s) params.set("keywords", s);
        return "https://www.pistonheads.com/buy/search?" + params.toString();
      }
    },
    {
      id: "mobile-de",
      name: "mobile.de",
      region: "Europe",
      regions: ["de", "eu", "worldwide"],
      kinds: ["market"],
      home: "https://www.mobile.de/",
      verify: "verified",
      note: "Germany’s largest marketplace; keyword search",
      build(p) {
        const q = keyword(p.make, p.model) || "auto", y = yr(p);
        let url = "https://suchen.mobile.de/fahrzeuge/search.html?dam=false&isSearchRequest=true&ref=quickSearch&s=Car&sb=rel&vc=Car&q=" + enc(q);
        // fr=FROM:TO is mobile.de's first-registration filter (either side may be blank).
        if (y.any) url += "&fr=" + enc(y.from + ":" + y.to);
        return url;
      }
    },
    {
      id: "autoscout24",
      name: "AutoScout24",
      region: "Europe",
      regions: ["de", "eu", "fr", "it", "nl", "be", "at", "es", "worldwide"],
      kinds: ["market"],
      home: "https://www.autoscout24.com/",
      verify: "verified",
      note: "Pan-European marketplace",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        let url = "https://www.autoscout24.com/lst";
        if (make) url += "/" + make;
        if (model) url += "/" + model;
        const params = new URLSearchParams();
        const y = yr(p);
        if (y.from) params.set("fregfrom", y.from);
        if (y.to) params.set("fregto", y.to);
        const q = params.toString();
        return q ? url + "?" + q : url;
      }
    },
    {
      id: "leboncoin",
      name: "Leboncoin",
      region: "Europe",
      regions: ["fr", "eu", "worldwide"],
      kinds: ["market"],
      home: "https://www.leboncoin.fr/",
      verify: "bot_blocked",
      note: "France classifieds (category 2 = vehicles). The URL format is standard; automated checks hit a 403/captcha, so this stays a browser link.",
      build(p) {
        const text = keyword(p.make, p.model) || "voiture";
        return "https://www.leboncoin.fr/recherche?category=2&text=" + enc(text) + "&owner_type=all";
      }
    },
    {
      id: "carsensor",
      name: "CarSensor",
      region: "Japan",
      regions: ["jp", "worldwide"],
      kinds: ["market"],
      home: "https://www.carsensor.net/",
      verify: "verified",
      note: "Major Japanese used-car portal (free-word search)",
      build(p) {
        const kw = keyword(p.make, p.model);
        // /usedcar/search.php?keyword= does not apply the filter (shows the
        // unfiltered national list). The freeword path does.
        return kw
          ? "https://www.carsensor.net/usedcar/freeword/" + enc(kw) + "/index.html"
          : "https://www.carsensor.net/usedcar/";
      }
    },
    {
      id: "goonet-exchange",
      name: "Goo-net Exchange",
      region: "Japan",
      regions: ["jp", "worldwide"],
      kinds: ["market", "export"],
      home: "https://www.goo-net-exchange.com/",
      verify: "verified",
      note: "English-facing Goo-net (make/model path)",
      build(p) {
        // Goo-net uses underscores inside names (LAND_ROVER, LAND_CRUISER, MERCEDES_BENZ);
        // hyphens return a 500 or the unfiltered make page.
        const make = uslug(p.make).toUpperCase();
        const model = uslug(p.model).toUpperCase();
        // /search/?keyword= returns a 404. Public listings use /usedcars/MAKE/MODEL/.
        if (make && model) return `https://www.goo-net-exchange.com/usedcars/${make}/${model}/`;
        // The bare make page is a model index; /ALL/ lists the make's cars.
        if (make) return `https://www.goo-net-exchange.com/usedcars/${make}/ALL/`;
        return "https://www.goo-net-exchange.com/usedcars/";
      }
    },
    {
      id: "beforward",
      name: "BE FORWARD",
      region: "Japan",
      regions: ["jp", "worldwide"],
      kinds: ["export", "market"],
      home: "https://www.beforward.jp/",
      verify: "verified",
      note: "Japan export stock (keyword stocklist)",
      build(p) {
        const kw = keyword(p.make, p.model);
        return kw
          ? "https://www.beforward.jp/stocklist/keyword=" + enc(kw)
          : "https://www.beforward.jp/stocklist/";
      }
    },
    {
      id: "carsales",
      name: "Carsales",
      region: "Australia & NZ",
      regions: ["au", "worldwide"],
      kinds: ["market"],
      home: "https://www.carsales.com.au/",
      verify: "bot_blocked",
      note: "Australia’s largest car classifieds. The URL format is standard; automated checks hit a captcha, so this stays a browser link.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://www.carsales.com.au/cars/${make}/${model}/`;
        if (make) return `https://www.carsales.com.au/cars/${make}/`;
        return "https://www.carsales.com.au/cars/";
      }
    },
    {
      id: "autotrader-ca",
      name: "AutoTrader.ca",
      region: "Canada",
      regions: ["ca", "worldwide"],
      kinds: ["market"],
      home: "https://www.autotrader.ca/",
      verify: "verified",
      note: "Canadian marketplace",
      build(p) {
        const make = slug(p.make), model = slug(p.model), y = yr(p);
        let url = "https://www.autotrader.ca/cars/";
        if (make) url += make + "/" + (model ? model + "/" : "");
        // modelyearfrom/modelyearto filter (847 → 167 results for 911 2015–2020).
        return withQs(url, { modelyearfrom: y.from, modelyearto: y.to });
      }
    },
    {
      id: "dubizzle",
      name: "Dubizzle",
      region: "Middle East",
      regions: ["ae", "worldwide"],
      kinds: ["market"],
      home: "https://uae.dubizzle.com/motors/",
      verify: "verified",
      note: "UAE motors classifieds",
      build(p) {
        const make = slug(p.make), model = slug(p.model), y = yr(p);
        let url = "https://uae.dubizzle.com/motors/used-cars/";
        if (make) url += make + "/" + (model ? model + "/" : "");
        return withQs(url, { year__gte: y.from, year__lte: y.to });
      }
    },
    {
      id: "classicdriver",
      name: "Classic Driver",
      region: "Classic / Exotic",
      regions: ["worldwide", "us", "uk", "de", "eu"],
      kinds: ["classic"],
      home: "https://www.classicdriver.com/",
      verify: "verified",
      note: "Global classic & exotic marketplace",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://www.classicdriver.com/en/cars/${make}/${model}`;
        if (make) return `https://www.classicdriver.com/en/cars/${make}`;
        return "https://www.classicdriver.com/en/cars";
      }
    },
    {
      id: "elferspot",
      name: "Elferspot",
      region: "Classic / Exotic",
      regions: ["worldwide", "de", "eu", "us"],
      kinds: ["classic"],
      home: "https://www.elferspot.com/",
      verify: "verified",
      onlyMakes: ["porsche"],
      note: "Porsche-only marketplace (shown for Porsche searches). Keyword search.",
      build(p) {
        const s = keyword(p.make, p.model);
        if (!s) return "https://www.elferspot.com/en/search/";
        const qs = new URLSearchParams();
        qs.set("cs", s);
        qs.set("sorting", "newest");
        return "https://www.elferspot.com/en/search/?" + qs.toString();
      }
    },
    {
      id: "collectingcars",
      name: "Collecting Cars",
      region: "Classic / Exotic",
      regions: ["worldwide", "uk", "us", "eu"],
      kinds: ["auction", "classic"],
      home: "https://collectingcars.com/",
      verify: "search_on_site",
      note: "Filtered pages need Collecting Cars’ internal make/model IDs, and query-string searches were redirected unfiltered. Opens their buy page — type the make and model there.",
      build(p) {
        return "https://collectingcars.com/buy";
      }
    },
    {
      id: "dupontregistry",
      name: "DuPont Registry",
      region: "Classic / Exotic",
      regions: ["worldwide", "us"],
      kinds: ["classic", "exotic"],
      home: "https://www.dupontregistry.com/",
      verify: "verified",
      note: "Luxury and exotic dealer inventory (make/model page)",
      build(p) {
        // The old /autos/results/MAKE/any/any_year form showed "No cars found" for
        // make-only searches; the site's own canonical pages filter correctly.
        // Multi-word names use underscores (land_rover, mercedes_benz, land_cruiser);
        // with hyphens the site reads only the first word ("Used Land for Sale").
        const make = uslug(p.make), model = uslug(p.model);
        if (make && model) return `https://www.dupontregistry.com/used-${make}-${model}-for-sale`;
        if (make) return `https://www.dupontregistry.com/used-${make}-for-sale`;
        return "https://www.dupontregistry.com/autos/";
      }
    }
  ];

  /* ---- Expanded worldwide sources (added 2026-11-10). Each URL pattern was
     test-opened with Toyota Supra / Porsche 911 (curl, then a real headless
     Chrome where curl was bot-blocked). See data/url-verification.md. ---- */
  function mmText(p) { return [p.make, p.model].map(x => String(x || "").trim()).filter(Boolean).join(" "); }
  function plus(s) { return enc(s).replace(/%20/g, "+"); }
  // make/model path: base/make/model + tail; falls back to make-only, then home.
  function pathMM(p, base, tail, fallback) {
    const make = slug(p.make), model = slug(p.model);
    if (!make) return fallback;
    return base + "/" + make + (model ? "/" + model : "") + (tail || "");
  }
  // keyword query: prefix + encoded "make model" (+ suffix); home when empty.
  function kwq(p, prefix, suffix, fallback, usePlus) {
    const t = mmText(p);
    if (!t) return fallback;
    return prefix + (usePlus ? plus(t) : enc(t)) + (suffix || "");
  }

  // AutoScout24 country sites: make/model path + first-registration years.
  function as24(p, base) {
    const y = yr(p);
    return withQs(pathMM(p, base, "", base), { fregfrom: y.from, fregto: y.to });
  }
  // Mercado Libre: /make/model/ plus a /FROM-TO/ year segment (verified MX, AR, CL).
  function mlPath(p, host) {
    const make = slug(p.make), model = slug(p.model), y = yr(p);
    let url = host + "/";
    if (make) url += make + "/" + (model ? model + "/" : "");
    if (y.any) url += (y.from || "1950") + "-" + (y.to || String(new Date().getFullYear() + 1)) + "/";
    return url;
  }
  // Marktplaats / 2dehands: stay inside the cars category. A bare keyword
  // search covers every category ("ferrari" matched lawn mowers; "porsche 911"
  // returned 12,917 ads incl. parts and toys vs 589 cars).
  function mpPath(p, host) {
    const make = slug(p.make), model = String(p.model || "").trim().toLowerCase();
    if (!make) return host + "/l/auto-s/";
    return host + "/l/auto-s/" + make + "/" + (model ? "q/" + plus(model) + "/" : "");
  }
  // OLX-group sites (Otomoto, Autovit): production-year filter.
  function olxYears(p, url) {
    const y = yr(p);
    return withQs(url, { "search[filter_float_year:from]": y.from, "search[filter_float_year:to]": y.to });
  }
  function aliasModel(p, map) {
    const m = slug(p.model);
    return map[m] ? Object.assign({}, p, { model: map[m] }) : p;
  }
  function aliasMake(p, map) {
    const m = slug(p.make);
    return map[m] ? Object.assign({}, p, { make: map[m] }) : p;
  }

  const MORE_SOURCES = [
    /* ---------- North America ---------- */
    { id: "classic-com", name: "CLASSIC.COM", region: "US", regions: ["us", "worldwide"], kinds: ["classic", "market", "auction"],
      home: "https://www.classic.com/", verify: "verified",
      note: "Collector-car aggregator: dealer listings and auction lots from many sites in one search",
      build(p) { return kwq(p, "https://www.classic.com/search?q=", "", "https://www.classic.com/search", true); } },
    { id: "autotempest", name: "AutoTempest", region: "US", regions: ["us", "worldwide"], kinds: ["market", "aggregator"],
      home: "https://www.autotempest.com/", verify: "verified",
      note: "Aggregator that searches many US sites at once (nationwide radius)",
      build(p) {
        // AutoTempest ids are lower-case with no separators (landrover, landcruiser,
        // mercedesbenz, gclass); "land-cruiser" or "mercedes-benz" gives an error page.
        const id = s => slug(s).replace(/-/g, "");
        const make = id(p.make), model = id(p.model), y = yr(p);
        if (!make) return "https://www.autotempest.com/";
        const qs = new URLSearchParams({ make, model, zip: "", radius: "any" });
        if (y.from) qs.set("minyear", y.from);
        if (y.to) qs.set("maxyear", y.to);
        return "https://www.autotempest.com/results?" + qs.toString();
      } },
    { id: "carmax", name: "CarMax", region: "US", regions: ["us", "worldwide"], kinds: ["dealer"],
      home: "https://www.carmax.com/", verify: "verified",
      note: "Nationwide used-car retailer (make/model page)",
      build(p) {
        const y = yr(p), now = new Date().getFullYear() + 1;
        return withQs(pathMM(p, "https://www.carmax.com/cars", "", "https://www.carmax.com/cars"),
          { year: y.any ? (y.from || "1990") + "-" + (y.to || now) : "" });
      } },
    { id: "carvana", name: "Carvana", region: "US", regions: ["us", "worldwide"], kinds: ["dealer"],
      home: "https://www.carvana.com/", verify: "verified",
      note: "Online used-car retailer (make, model and year filters). Shows 0 cars when the model is not in stock.",
      build(p) {
        // Carvana's /cars/make-model pages redirect to the whole make when the slug
        // is unknown (toyota-supra → all Toyotas; Defender is split into 90/110/130).
        // The site's own filter link (cvnaid = base64url JSON) keeps the model:
        // Land Cruiser 15, Defender 97, 911 56 cars; year {min,max} 911 2015–2020 → 24 cars.
        const make = String(p.make || "").trim(), model = String(p.model || "").trim();
        if (!make) return "https://www.carvana.com/cars";
        const alias = { supra: "GR Supra" }; // Carvana sells the current Supra as "GR Supra"
        const m = { name: make };
        if (model) m.parentModels = [{ name: alias[model.toLowerCase()] || model }];
        const f = { makes: [m] };
        const y = yr(p);
        if (y.any) f.year = { min: +(y.from || 1990), max: +(y.to || new Date().getFullYear() + 1) };
        return "https://www.carvana.com/cars/filters?cvnaid=" + b64url(JSON.stringify({ filters: f }));
      } },
    { id: "truecar", name: "TrueCar", region: "US", regions: ["us", "worldwide"], kinds: ["market"],
      home: "https://www.truecar.com/", verify: "bot_blocked",
      note: "Used listings by make/model. Automated checks hit a 'press and hold' bot check, so this stays a browser link.",
      build(p) { return pathMM(p, "https://www.truecar.com/used-cars-for-sale/listings", "/", "https://www.truecar.com/used-cars-for-sale/listings/"); } },
    { id: "edmunds", name: "Edmunds", region: "US", regions: ["us", "worldwide"], kinds: ["market"],
      home: "https://www.edmunds.com/", verify: "verified",
      note: "US dealer inventory (make/model + year filters). Results are sorted by distance from your location (New York by default).",
      build(p) {
        // Verified 2026-11-10 by outside fetch: make=land-rover&model=land-rover|defender and
        // year=2015-2020 return only matching cars. (Our box itself gets a 403.)
        const make = slug(p.make), model = slug(p.model), y = yr(p);
        if (!make) return "https://www.edmunds.com/inventory/srp.html";
        let url = "https://www.edmunds.com/inventory/srp.html?make=" + make + (model ? "&model=" + make + "|" + model : "");
        if (y.any) url += "&year=" + (y.from || "1990") + "-" + (y.to || String(new Date().getFullYear() + 1));
        return url;
      } },
    { id: "copart", name: "Copart", region: "US", regions: ["us", "ca", "uk", "worldwide"], kinds: ["auction", "salvage"],
      home: "https://www.copart.com/", verify: "verified",
      note: "Salvage and repairable vehicle auctions (free-text search)",
      build(p) { return kwq(p, "https://www.copart.com/lotSearchResults?free=true&query=", "", "https://www.copart.com/vehicleFinder", false); } },
    { id: "hagerty-marketplace", name: "Hagerty Marketplace", region: "US", regions: ["us", "worldwide"], kinds: ["auction", "classic"],
      home: "https://www.hagerty.com/marketplace", verify: "verified",
      note: "Collector auctions and classifieds from Hagerty",
      build(p) { return kwq(p, "https://www.hagerty.com/marketplace/search?searchQuery=", "", "https://www.hagerty.com/marketplace", false); } },
    { id: "pcarmarket", name: "PCARMARKET", region: "US", regions: ["us", "worldwide"], kinds: ["auction", "classic"],
      home: "https://www.pcarmarket.com/", verify: "verified",
      note: "Enthusiast auctions and marketplace (Porsche-heavy, all makes)",
      build(p) { return kwq(p, "https://www.pcarmarket.com/search?q=", "", "https://www.pcarmarket.com/", true); } },
    { id: "kijiji-autos", name: "Kijiji", region: "Canada", regions: ["ca", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://www.kijiji.ca/", verify: "verified",
      note: "Canada-wide cars & trucks classifieds (keyword)",
      build(p) {
        const k = slug(mmText(p));
        return k ? "https://www.kijiji.ca/b-cars-trucks/canada/" + k + "/k0c174l0" : "https://www.kijiji.ca/b-cars-trucks/canada/c174l0";
      } },

    /* ---------- Latin America ---------- */
    { id: "mercadolibre-mx", name: "Mercado Libre México", region: "Latin America", regions: ["mx", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://autos.mercadolibre.com.mx/", verify: "verified",
      note: "Mexico vehicle listings (make/model path)",
      build(p) { return mlPath(p, "https://autos.mercadolibre.com.mx"); } },
    { id: "mercadolibre-ar", name: "Mercado Libre Argentina", region: "Latin America", regions: ["ar", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://autos.mercadolibre.com.ar/", verify: "verified",
      note: "Argentina vehicle listings (make/model path)",
      build(p) { return mlPath(p, "https://autos.mercadolibre.com.ar"); } },
    { id: "mercadolibre-cl", name: "Mercado Libre Chile", region: "Latin America", regions: ["cl", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://autos.mercadolibre.cl/", verify: "verified",
      note: "Chile vehicle listings (make/model path)",
      build(p) { return mlPath(p, "https://autos.mercadolibre.cl"); } },
    { id: "mercadolibre-co", name: "Mercado Libre Colombia", region: "Latin America", regions: ["co", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://carros.mercadolibre.com.co/", verify: "bot_blocked",
      note: "Colombia vehicle listings. Same path format as the other Mercado Libre sites; automated checks hit a security wall, so this stays a browser link.",
      build(p) { return mlPath(p, "https://carros.mercadolibre.com.co"); } },
    { id: "webmotors", name: "Webmotors", region: "Latin America", regions: ["br", "worldwide"], kinds: ["market"],
      home: "https://www.webmotors.com.br/", verify: "verified",
      note: "Brazil’s largest car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.webmotors.com.br/carros/estoque", "", "https://www.webmotors.com.br/carros/estoque"); } },
    { id: "olx-br", name: "OLX Brasil", region: "Latin America", regions: ["br", "worldwide"], kinds: ["classifieds"],
      home: "https://www.olx.com.br/", verify: "verified",
      note: "Brazil classifieds, cars category (keyword, all of Brazil)",
      build(p) { return kwq(p, "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios?q=", "", "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios", true); } },
    { id: "chileautos", name: "Chileautos", region: "Latin America", regions: ["cl", "worldwide"], kinds: ["market"],
      home: "https://www.chileautos.cl/", verify: "search_on_site",
      note: "Chile’s main car portal. No filtered URL could be confirmed (automated checks were blocked). Opens the vehicle search — pick the make and model there.",
      build(p) { return "https://www.chileautos.cl/vehiculos/"; } },

    /* ---------- UK & Ireland ---------- */
    { id: "carandclassic", name: "Car & Classic", region: "UK & Ireland", regions: ["uk", "eu", "worldwide"], kinds: ["classic", "auction", "classifieds"],
      home: "https://www.carandclassic.com/", verify: "verified",
      note: "Classic car classifieds and auctions (UK and Europe)",
      build(p) { return kwq(p, "https://www.carandclassic.com/search?q=", "", "https://www.carandclassic.com/", false); } },
    { id: "gumtree-uk", name: "Gumtree UK", region: "UK & Ireland", regions: ["uk", "worldwide"], kinds: ["classifieds"],
      home: "https://www.gumtree.com/", verify: "verified",
      note: "UK classifieds, cars category (keyword)",
      build(p) { return kwq(p, "https://www.gumtree.com/search?search_category=cars&q=", "", "https://www.gumtree.com/cars", true); } },
    { id: "ebay-uk", name: "eBay UK Motors", region: "UK & Ireland", regions: ["uk", "worldwide"], kinds: ["market", "auction"],
      home: "https://www.ebay.co.uk/", verify: "verified",
      note: "Cars category keyword search (outside check: Land Cruiser → 272 results, all Land Cruisers).",
      build(p) { return kwq(p, "https://www.ebay.co.uk/sch/i.html?_sacat=9801&_nkw=", "", "https://www.ebay.co.uk/b/Cars/9801", true); } },
    { id: "donedeal", name: "DoneDeal", region: "UK & Ireland", regions: ["ie", "uk", "worldwide"], kinds: ["classifieds", "market"],
      home: "https://www.donedeal.ie/", verify: "verified",
      note: "Ireland’s largest car classifieds (make/model path)",
      build(p) {
        const mk = String(p.make || "").trim(), md = String(p.model || "").trim();
        const y = yr(p);
        const url = mk ? "https://www.donedeal.ie/cars/" + enc(mk) + (md ? "/" + enc(md) : "") : "https://www.donedeal.ie/cars";
        return withQs(url, { year_from: y.from, year_to: y.to });
      } },
    { id: "carzone", name: "Carzone", region: "UK & Ireland", regions: ["ie", "worldwide"], kinds: ["market"],
      home: "https://www.carzone.ie/", verify: "verified",
      note: "Irish dealer and private listings (make, model and year filters). Shows 0 results when the model is not in stock.",
      build(p) {
        // The /used-cars/make/model path redirects to the whole make when nothing matches
        // (Supra → 5,063 Toyotas). The site's own /search form keeps the filter and says
        // "0 results found" instead. Same counts as the path (911: 33). Irish listings
        // spell it "Landcruiser" (141; "Land Cruiser" gives 0). minYear/maxYear verified.
        const make = String(p.make || "").trim(); let model = String(p.model || "").trim();
        if (!make) return "https://www.carzone.ie/used-cars";
        const alias = { "land cruiser": "Landcruiser", "land-cruiser": "Landcruiser" };
        model = alias[model.toLowerCase()] || model;
        const y = yr(p);
        return withQs("https://www.carzone.ie/search", { make, model, minYear: y.from, maxYear: y.to });
      } },

    /* ---------- Europe ---------- */
    { id: "classic-trader", name: "Classic Trader", region: "Europe", regions: ["de", "eu", "uk", "worldwide"], kinds: ["classic", "classifieds"],
      home: "https://www.classic-trader.com/", verify: "verified",
      note: "European classic car marketplace (full-text search)",
      build(p) { return kwq(p, "https://www.classic-trader.com/uk/cars/search?fulltext=", "", "https://www.classic-trader.com/uk/cars/search", true); } },
    { id: "autoscout24-de", name: "AutoScout24 Germany", region: "Europe", regions: ["de", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.de/", verify: "verified", note: "German AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.de/lst"); } },
    { id: "autoscout24-it", name: "AutoScout24 Italy", region: "Europe", regions: ["it", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.it/", verify: "verified", note: "Italian AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.it/lst"); } },
    { id: "autoscout24-fr", name: "AutoScout24 France", region: "Europe", regions: ["fr", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.fr/", verify: "verified", note: "French AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.fr/lst"); } },
    { id: "autoscout24-nl", name: "AutoScout24 Netherlands", region: "Europe", regions: ["nl", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.nl/", verify: "verified", note: "Dutch AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.nl/lst"); } },
    { id: "autoscout24-be", name: "AutoScout24 Belgium", region: "Europe", regions: ["be", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.be/", verify: "verified", note: "Belgian AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.be/nl/lst"); } },
    { id: "autoscout24-es", name: "AutoScout24 Spain", region: "Europe", regions: ["es", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.es/", verify: "verified", note: "Spanish AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.es/lst"); } },
    { id: "autoscout24-at", name: "AutoScout24 Austria", region: "Europe", regions: ["at", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.at/", verify: "verified", note: "Austrian AutoScout24 site (make/model path)",
      build(p) { return as24(p, "https://www.autoscout24.at/lst"); } },
    { id: "kleinanzeigen", name: "Kleinanzeigen", region: "Europe", regions: ["de", "eu"], kinds: ["classifieds"],
      home: "https://www.kleinanzeigen.de/", verify: "verified",
      note: "Germany’s big classifieds site (formerly eBay Kleinanzeigen), cars category",
      build(p) {
        const k = slug(mmText(p)), y = yr(p);
        // "+autos.ez_i:FROM,TO" is the first-registration filter (verified 33 of 37 years in range).
        const ez = y.any ? "+autos.ez_i:" + y.from + "%2C" + y.to : "";
        return k ? "https://www.kleinanzeigen.de/s-autos/" + k + "/k0c216" + ez : "https://www.kleinanzeigen.de/s-autos/c216" + ez;
      } },
    { id: "ebay-de", name: "eBay Germany", region: "Europe", regions: ["de", "eu"], kinds: ["market", "auction"],
      home: "https://www.ebay.de/", verify: "verified",
      note: "Autos category keyword search (outside check: Land Cruiser → 7 matches; eBay may add “fewer search terms” results below).",
      build(p) { return kwq(p, "https://www.ebay.de/sch/i.html?_sacat=9801&_nkw=", "", "https://www.ebay.de/b/Autos/9801", true); } },
    { id: "marktplaats", name: "Marktplaats", region: "Europe", regions: ["nl", "eu"], kinds: ["classifieds"],
      home: "https://www.marktplaats.nl/", verify: "verified",
      note: "Netherlands classifieds, cars category (make path + model keyword)",
      build(p) { return mpPath(p, "https://www.marktplaats.nl"); } },
    { id: "2dehands", name: "2dehands", region: "Europe", regions: ["be", "eu"], kinds: ["classifieds"],
      home: "https://www.2dehands.be/", verify: "verified",
      note: "Belgium classifieds, cars category (make path + model keyword)",
      build(p) { return mpPath(p, "https://www.2dehands.be"); } },
    { id: "lacentrale", name: "La Centrale", region: "Europe", regions: ["fr", "eu"], kinds: ["market"],
      home: "https://www.lacentrale.fr/", verify: "bot_blocked",
      note: "Major French used-car site (MAKE:MODEL filter). Automated checks got a 403, so this stays a browser link.",
      build(p) {
        const mk = String(p.make || "").trim().toUpperCase(), md = String(p.model || "").trim().toUpperCase();
        if (!mk) return "https://www.lacentrale.fr/listing";
        return "https://www.lacentrale.fr/listing?makesModelsCommercialNames=" + enc(md ? mk + ":" + md : mk);
      } },
    { id: "subito", name: "Subito", region: "Europe", regions: ["it", "eu"], kinds: ["classifieds"],
      home: "https://www.subito.it/", verify: "verified",
      note: "Italy classifieds, cars category, all of Italy (keyword)",
      build(p) { const y = yr(p); return withQs("https://www.subito.it/annunci-italia/vendita/auto/", { q: mmText(p), ys: y.from, ye: y.to }); } },
    { id: "coches-net", name: "coches.net", region: "Europe", regions: ["es", "eu"], kinds: ["market"],
      home: "https://www.coches.net/", verify: "verified",
      note: "Spain’s big used-car portal (keyword)",
      build(p) { return kwq(p, "https://www.coches.net/segunda-mano/?KeyWords=", "", "https://www.coches.net/segunda-mano/", true); } },
    { id: "milanuncios", name: "Milanuncios", region: "Europe", regions: ["es", "eu"], kinds: ["classifieds"],
      home: "https://www.milanuncios.com/", verify: "bot_blocked",
      note: "Spain classifieds, used cars (keyword). Automated checks hit a captcha, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.milanuncios.com/coches-de-segunda-mano/?s=", "", "https://www.milanuncios.com/coches-de-segunda-mano/", true); } },
    { id: "wallapop", name: "Wallapop", region: "Europe", regions: ["es", "eu"], kinds: ["classifieds"],
      home: "https://es.wallapop.com/", verify: "search_on_site",
      note: "Spain peer-to-peer marketplace, cars category. The link pre-fills your search, but every check we ran showed “Nada por aquí” (Wallapop needs your location and blocks outside checks). If it's empty, set your location and search on the site.",
      build(p) { return kwq(p, "https://es.wallapop.com/search?category_id=100&keywords=", "", "https://es.wallapop.com/coches-segunda-mano", false); } },
    { id: "standvirtual", name: "Standvirtual", region: "Europe", regions: ["pt", "eu"], kinds: ["market"],
      home: "https://www.standvirtual.com/", verify: "verified",
      note: "Portugal’s main car marketplace (make path + model keyword, year filter)",
      build(p) {
        // Model paths map to one generation (/porsche/911 = "911 Série F", 10 ads),
        // so use the make path plus a q- keyword (303 ads) and the year filter.
        const make = slug(p.make), model = slug(p.model), y = yr(p);
        let url = "https://www.standvirtual.com/carros" + (make ? "/" + make : "") + (model ? "/q-" + model : "");
        return withQs(url, { "search[filter_float_first_registration_year:from]": y.from, "search[filter_float_first_registration_year:to]": y.to });
      } },
    { id: "willhaben", name: "willhaben", region: "Europe", regions: ["at", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.willhaben.at/", verify: "verified",
      note: "Austria’s largest classifieds, car exchange (keyword)",
      build(p) { const y = yr(p); return withQs("https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse", { keyword: mmText(p), YEAR_MODEL_FROM: y.from, YEAR_MODEL_TO: y.to }); } },
    { id: "blocket", name: "Blocket", region: "Europe", regions: ["se", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.blocket.se/", verify: "verified",
      note: "Sweden’s main classifieds, cars (keyword)",
      build(p) { const y = yr(p); return withQs("https://www.blocket.se/mobility/search/car", { q: mmText(p), year_from: y.from, year_to: y.to }); } },
    { id: "finn", name: "FINN.no", region: "Europe", regions: ["no", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.finn.no/", verify: "verified",
      note: "Norway’s main marketplace, cars (keyword)",
      build(p) { const y = yr(p); return withQs("https://www.finn.no/mobility/search/car", { q: mmText(p), year_from: y.from, year_to: y.to }); } },
    { id: "bilbasen", name: "Bilbasen", region: "Europe", regions: ["dk", "eu"], kinds: ["market"],
      home: "https://www.bilbasen.dk/", verify: "verified",
      note: "Denmark’s largest used-car site (make page + model keyword)",
      build(p) {
        // Bilbasen ids use underscores (land_rover, land_cruiser) and "mercedes";
        // hyphenated names silently fall back to all 42,000 cars.
        const alias = { "mercedes-benz": "mercedes" };
        let make = slug(p.make);
        make = alias[make] || make.replace(/-/g, "_");
        // Model ids are split by variant (911 = 29 cars, but "911 Carrera S", "911 GT3"…
        // are separate models; Defender is only "Defender 90/110"), so a model path misses most
        // cars or falls back to the make. The site's own free-text box (free=) on the make page
        // keeps them all: 911 → 181, Defender → 17, Land Cruiser → 6, Supra → 4.
        const model = String(p.model || "").trim();
        if (!make) return "https://www.bilbasen.dk/brugt/bil";
        return withQs("https://www.bilbasen.dk/brugt/bil/" + make, { free: model });
      } },
    { id: "nettiauto", name: "Nettiauto", region: "Europe", regions: ["fi", "eu"], kinds: ["market"],
      home: "https://www.nettiauto.com/", verify: "verified",
      note: "Finland’s main car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.nettiauto.com", "", "https://www.nettiauto.com/"); } },
    { id: "otomoto", name: "Otomoto", region: "Europe", regions: ["pl", "eu"], kinds: ["market"],
      home: "https://www.otomoto.pl/", verify: "verified",
      note: "Poland’s largest car marketplace (make/model path)",
      build(p) { return olxYears(p, pathMM(p, "https://www.otomoto.pl/osobowe", "", "https://www.otomoto.pl/osobowe")); } },
    { id: "sauto", name: "Sauto", region: "Europe", regions: ["cz", "eu"], kinds: ["market"],
      home: "https://www.sauto.cz/", verify: "verified",
      note: "Czech Republic car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.sauto.cz/inzerce/osobni", "", "https://www.sauto.cz/inzerce/osobni"); } },
    { id: "autovit", name: "Autovit", region: "Europe", regions: ["ro", "eu"], kinds: ["market"],
      home: "https://www.autovit.ro/", verify: "verified",
      note: "Romania’s main car marketplace (make/model path)",
      build(p) { return olxYears(p, pathMM(p, "https://www.autovit.ro/autoturisme", "", "https://www.autovit.ro/autoturisme")); } },
    { id: "car-gr", name: "Car.gr", region: "Europe", regions: ["gr", "eu"], kinds: ["market", "classifieds"],
      home: "https://www.car.gr/", verify: "search_on_site",
      note: "Greece’s main car site. Filters need internal IDs and automated checks were blocked. Opens car classifieds — pick the make and model there.",
      build(p) { return "https://www.car.gr/classifieds/cars/"; } },
    { id: "autohero", name: "Autohero", region: "Europe", regions: ["de", "eu"], kinds: ["dealer"],
      home: "https://www.autohero.com/", verify: "search_on_site",
      note: "Online used-car retailer (Germany). Opens the make’s cars; pick the model on the site (Autohero names models by generation, e.g. “Golf VII”).",
      build(p) {
        // brand0= filters correctly (Mercedes-Benz 9,572 cars, Porsche 1). The model filter
        // only matches Autohero's generation names: models0=golf → 0 results though Golf VII
        // cars are listed, so we don't pass the model.
        const make = slug(p.make);
        if (!make) return "https://www.autohero.com/de/search/";
        return "https://www.autohero.com/de/search/?brand0=" + make;
      } },

    /* ---------- Japan, Korea, China & Hong Kong ---------- */
    { id: "goo-net", name: "Goo-net (Japan)", region: "Japan", regions: ["jp", "worldwide"], kinds: ["market"],
      home: "https://www.goo-net.com/", verify: "bot_blocked",
      note: "Japanese-language Goo-net (brand/car path). Our automated checks were refused, so this stays a browser link.",
      build(p) {
        const make = slug(p.make).toUpperCase(), model = slug(p.model).toUpperCase();
        if (!make) return "https://www.goo-net.com/usedcar/";
        return "https://www.goo-net.com/usedcar/brand-" + make + "/" + (model ? "car-" + model + "/" : "");
      } },
    { id: "yahoo-auctions-jp", name: "Yahoo! Auctions Japan", region: "Japan", regions: ["jp", "worldwide"], kinds: ["auction"],
      home: "https://auctions.yahoo.co.jp/", verify: "verified",
      note: "Japan’s big auction site, cars category (keyword; Japanese or English names)",
      build(p) { return kwq(p, "https://auctions.yahoo.co.jp/search/search?auccat=26318&p=", "", "https://auctions.yahoo.co.jp/category/list/26318/", true); } },
    { id: "tcv", name: "TCV", region: "Japan", regions: ["jp", "worldwide"], kinds: ["export", "market"],
      home: "https://www.tc-v.com/", verify: "verified",
      note: "Japan export marketplace, formerly tradecarview (make/model path)",
      build(p) {
        // TCV paths use lower-case names with spaces ("land rover", "land cruiser");
        // hyphenated multi-word names 404. fid/jid = year from/to.
        const name = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
        const alias = { kia: "kia motors" };
        let mk = name(p.make), md = name(p.model);
        mk = alias[mk] || mk;
        const y = yr(p);
        // Make-only: /make/ is a model index, /make/all/ lists the cars ("All Models (61)").
        const url = mk ? "https://www.tc-v.com/used_car/" + enc(mk) + "/" + (md ? enc(md) + "/" : "all/") : "https://www.tc-v.com/used_car/all/all/";
        return withQs(url, { fid: y.from, jid: y.to });
      } },
    { id: "sbt-japan", name: "SBT Japan", region: "Japan", regions: ["jp", "worldwide"], kinds: ["export"],
      home: "https://www.sbtjapan.com/", verify: "verified",
      note: "Japanese used-car exporter (make/model path)",
      build(p) { return pathMM(aliasMake(p, { "mercedes-benz": "mercedes" }), "https://www.sbtjapan.com/used-cars", "", "https://www.sbtjapan.com/used-cars"); } },
    { id: "carfromjapan", name: "CAR FROM JAPAN", region: "Japan", regions: ["jp", "worldwide"], kinds: ["export"],
      home: "https://carfromjapan.com/", verify: "verified",
      note: "Japan export marketplace (make/model page)",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://carfromjapan.com/cheap-used-cars-for-sale";
        return "https://carfromjapan.com/cheap-used-" + make + (model ? "-" + model : "") + "-for-sale";
      } },
    { id: "encar", name: "Encar", region: "Korea", regions: ["kr", "worldwide"], kinds: ["market"],
      home: "https://www.encar.com/", verify: "search_on_site",
      note: "South Korea’s largest used-car site. Filters live in a hash code we can’t build reliably. Opens the import-car search — pick the make and model there.",
      build(p) { return "https://www.encar.com/fc/fc_carsearchlist.do?carType=for"; } },
    { id: "che168", name: "Che168 (Autohome)", region: "China & Hong Kong", regions: ["cn", "worldwide"], kinds: ["market"],
      home: "https://www.che168.com/", verify: "search_on_site",
      note: "China’s big used-car site. Keyword links could not be confirmed to filter. Opens the national list — search in Chinese there.",
      build(p) { return "https://www.che168.com/china/list/"; } },
    { id: "28car", name: "28car", region: "China & Hong Kong", regions: ["hk", "worldwide"], kinds: ["classifieds"],
      home: "https://www.28car.com/", verify: "search_on_site",
      note: "Hong Kong’s long-running car classifieds. There is no query URL — use the site’s own make menu.",
      build(p) { return "https://www.28car.com/"; } },

    /* ---------- Southeast Asia & India ---------- */
    { id: "carousell-sg", name: "Carousell Singapore", region: "Southeast Asia", regions: ["sg", "worldwide"], kinds: ["classifieds"],
      home: "https://www.carousell.sg/", verify: "verified",
      note: "Singapore marketplace, cars category (keyword)",
      build(p) { return kwq(p, "https://www.carousell.sg/search/", "?categoryId=32", "https://www.carousell.sg/categories/cars-32/", false); } },
    { id: "sgcarmart", name: "sgCarMart", region: "Southeast Asia", regions: ["sg", "worldwide"], kinds: ["market"],
      home: "https://www.sgcarmart.com/", verify: "verified",
      note: "Singapore’s main used-car portal (keyword). Our box was blocked, but an outside fetch returned filtered results.",
      build(p) { return kwq(p, "https://www.sgcarmart.com/used-cars/listing?q=", "", "https://www.sgcarmart.com/used-cars/", true); } },
    { id: "mudah", name: "Mudah.my", region: "Southeast Asia", regions: ["my", "worldwide"], kinds: ["classifieds"],
      home: "https://www.mudah.my/", verify: "verified",
      note: "Malaysia classifieds, cars (keyword)",
      build(p) { return kwq(p, "https://www.mudah.my/malaysia/cars-for-sale?q=", "", "https://www.mudah.my/malaysia/cars-for-sale", true); } },
    { id: "carlist-my", name: "Carlist.my", region: "Southeast Asia", regions: ["my", "worldwide"], kinds: ["market"],
      home: "https://www.carlist.my/", verify: "verified",
      note: "Malaysia car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.carlist.my/cars-for-sale", "/malaysia", "https://www.carlist.my/cars-for-sale/malaysia"); } },
    { id: "carsome", name: "Carsome", region: "Southeast Asia", regions: ["my", "worldwide"], kinds: ["dealer"],
      home: "https://www.carsome.my/", verify: "deeplink",
      note: "Malaysia used-car retailer. The make filter applies; when the model isn’t stocked it shows the whole make.",
      build(p) { return pathMM(p, "https://www.carsome.my/buy-car", "", "https://www.carsome.my/buy-car"); } },
    { id: "one2car", name: "One2car", region: "Southeast Asia", regions: ["th", "worldwide"], kinds: ["market"],
      home: "https://www.one2car.com/", verify: "verified",
      note: "Thailand car marketplace (make/model path; outside check: 55 Land Cruisers).",
      build(p) { return pathMM(p, "https://www.one2car.com/en/cars-for-sale", "", "https://www.one2car.com/en/cars-for-sale"); } },
    { id: "cardekho", name: "CarDekho", region: "India", regions: ["in", "worldwide"], kinds: ["market"],
      home: "https://www.cardekho.com/", verify: "verified",
      note: "India used cars (make/model page). Land Cruiser opens the Land Cruiser 300 page; models CarDekho doesn't list open its general search.",
      build(p) {
        // CarDekho splits Land Cruiser into 200 / 300 / Prado; plain land-cruiser redirects
        // to all of India (60,000+ cars). There is no keyword URL (its search box opens an AI chat).
        p = aliasModel(p, { "land-cruiser": "land-cruiser-300" });
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.cardekho.com/used-cars+in+india";
        return "https://www.cardekho.com/used-" + make + (model ? "-" + model : "") + "+cars+in+india";
      } },
    { id: "carwale", name: "CarWale", region: "India", regions: ["in", "worldwide"], kinds: ["market"],
      home: "https://www.carwale.com/", verify: "verified",
      note: "India used cars (make-model page). If the model has no used listings in India (e.g. Supra), CarWale shows the whole make.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.carwale.com/used/";
        return "https://www.carwale.com/used/" + make + (model ? "-" + model : "") + "/";
      } },
    { id: "olx-in", name: "OLX India", region: "India", regions: ["in", "worldwide"], kinds: ["classifieds"],
      home: "https://www.olx.in/", verify: "verified",
      note: "India classifieds, cars (keyword; outside check: 149 Land Cruisers).",
      build(p) { const k = slug(mmText(p)); return k ? "https://www.olx.in/cars_c84/q-" + k : "https://www.olx.in/cars_c84"; } },

    /* ---------- Australia & NZ ---------- */
    { id: "drive-au", name: "Drive Marketplace", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["market"],
      home: "https://www.drive.com.au/cars-for-sale/", verify: "verified",
      note: "Australia dealer and private listings (make/model path)",
      // Australian listings spell it "Landcruiser"; /land-cruiser/ is a 404.
      build(p) { return pathMM(aliasModel(p, { "land-cruiser": "landcruiser" }), "https://www.drive.com.au/cars-for-sale/search/all/all", "/", "https://www.drive.com.au/cars-for-sale/"); } },
    { id: "gumtree-au", name: "Gumtree Australia", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["classifieds"],
      home: "https://www.gumtree.com.au/", verify: "bot_blocked",
      note: "Australia classifieds, cars (keyword). Automated checks got Access Denied, so this stays a browser link.",
      build(p) { const t = mmText(p).toLowerCase(); return t ? "https://www.gumtree.com.au/s-cars-vans-utes/" + plus(t) + "/k0c18320" : "https://www.gumtree.com.au/s-cars-vans-utes/c18320"; } },
    { id: "autotrader-au", name: "Autotrader Australia", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["market"],
      home: "https://www.autotrader.com.au/", verify: "bot_blocked",
      note: "Australia listings (make/model path). Automated checks got Access Denied, so this stays a browser link.",
      build(p) { return pathMM(p, "https://www.autotrader.com.au/for-sale", "", "https://www.autotrader.com.au/for-sale"); } },
    { id: "ebay-au", name: "eBay Australia", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["market", "auction"],
      home: "https://www.ebay.com.au/", verify: "bot_blocked",
      note: "Cars category search. Same format as eBay US; automated checks got eBay’s error page, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.ebay.com.au/sch/i.html?_sacat=29690&_nkw=", "", "https://www.ebay.com.au/b/Cars/29690", true); } },
    { id: "shannons", name: "Shannons Auctions", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["auction", "classic"],
      home: "https://www.shannons.com.au/", verify: "search_on_site",
      note: "Australian classic car auctions. No lot search URL — opens the auctions page.",
      build(p) { return "https://www.shannons.com.au/auctions.html"; } },
    { id: "trademe", name: "Trade Me Motors", region: "Australia & NZ", regions: ["nz", "au", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://www.trademe.co.nz/a/motors", verify: "verified",
      note: "New Zealand’s main marketplace (make/model path)",
      build(p) { const y = yr(p); return withQs(pathMM(p, "https://www.trademe.co.nz/a/motors/cars", "", "https://www.trademe.co.nz/a/motors/cars"), { year_min: y.from, year_max: y.to }); } },

    /* ---------- Middle East & Africa ---------- */
    { id: "yallamotor", name: "YallaMotor", region: "Middle East", regions: ["ae", "worldwide"], kinds: ["market"],
      home: "https://uae.yallamotor.com/", verify: "verified",
      note: "UAE used cars (make/model path)",
      build(p) { return pathMM(p, "https://uae.yallamotor.com/used-cars", "", "https://uae.yallamotor.com/used-cars"); } },
    { id: "opensooq", name: "OpenSooq", region: "Middle East", regions: ["jo", "sa", "ae", "worldwide"], kinds: ["classifieds"],
      home: "https://jo.opensooq.com/", verify: "verified",
      note: "Middle East classifieds (Jordan site; switch country on the site)",
      build(p) { return kwq(p, "https://jo.opensooq.com/en/find?term=", "", "https://jo.opensooq.com/en/cars", true); } },
    { id: "haraj", name: "Haraj", region: "Middle East", regions: ["sa", "worldwide"], kinds: ["classifieds"],
      home: "https://haraj.com.sa/", verify: "verified",
      note: "Saudi Arabia’s biggest classifieds (keyword; Arabic or English)",
      build(p) { return kwq(p, "https://haraj.com.sa/search/", "/", "https://haraj.com.sa/", false); } },
    { id: "cars-co-za", name: "Cars.co.za", region: "Africa", regions: ["za", "worldwide"], kinds: ["market"],
      home: "https://www.cars.co.za/", verify: "verified",
      note: "South Africa used cars (make filter + model keyword, year filter).",
      build(p) {
        // Model paths are split by variant (Land-Cruiser-79/200/300/Prado, Defender-90/110,
        // GR-Supra), and an unknown model falls back to the make page. The site's search
        // with make_model=Make&keyword=model keeps every variant: Land Cruiser 1,385,
        // Defender 390 (all 90/110), 911 47, Supra 3 (GR Supra). year=2015-2020 → 22, all in range.
        const mk = String(p.make || "").trim(), md = String(p.model || "").trim(), y = yr(p);
        if (!mk) return "https://www.cars.co.za/usedcars/";
        return withQs("https://www.cars.co.za/usedcars/", {
          make_model: mk, keyword: md,
          year: y.any ? (y.from || "1950") + "-" + (y.to || String(new Date().getFullYear() + 1)) : ""
        });
      } },
    { id: "autotrader-za", name: "AutoTrader South Africa", region: "Africa", regions: ["za", "worldwide"], kinds: ["market"],
      home: "https://www.autotrader.co.za/", verify: "verified",
      note: "South Africa listings (make/model path)",
      build(p) {
        const y = yr(p);
        return withQs(pathMM(p, "https://www.autotrader.co.za/cars-for-sale", "", "https://www.autotrader.co.za/cars-for-sale"),
          { year: y.any ? (y.from || "1950") + "-to-" + (y.to || String(new Date().getFullYear() + 1)) : "" });
      } },
    { id: "jiji-ng", name: "Jiji Nigeria", region: "Africa", regions: ["ng", "worldwide"], kinds: ["classifieds"],
      home: "https://jiji.ng/", verify: "verified",
      note: "Nigeria classifieds, cars (make-model path). Our box was blocked, but an outside fetch returned filtered listings.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        return make ? "https://jiji.ng/cars/" + make + (model ? "-" + model : "") : "https://jiji.ng/cars";
      } },
    { id: "jiji-ke", name: "Jiji Kenya", region: "Africa", regions: ["ke", "worldwide"], kinds: ["classifieds"],
      home: "https://jiji.co.ke/", verify: "verified",
      note: "Kenya classifieds, cars (make-model path; outside check: Land Cruiser listings only).",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        return make ? "https://jiji.co.ke/cars/" + make + (model ? "-" + model : "") : "https://jiji.co.ke/cars";
      } },

    /* ---------- Global auctions & luxury ---------- */
    { id: "rm-sothebys", name: "RM Sotheby’s", region: "Auctions", regions: ["worldwide", "us", "uk", "eu"], kinds: ["auction", "classic"],
      home: "https://rmsothebys.com/", verify: "verified",
      note: "Global collector car auctions (lot search, past and upcoming)",
      build(p) { return kwq(p, "https://rmsothebys.com/search#?SearchTerm=", "", "https://rmsothebys.com/search", false); } },
    { id: "mecum", name: "Mecum Auctions", region: "Auctions", regions: ["worldwide", "us"], kinds: ["auction", "classic"],
      home: "https://www.mecum.com/", verify: "verified",
      note: "US collector car auctions (site search covers upcoming lots and results)",
      build(p) { return kwq(p, "https://www.mecum.com/search/?q=", "", "https://www.mecum.com/lots/", true); } },
    { id: "barrett-jackson", name: "Barrett-Jackson", region: "Auctions", regions: ["worldwide", "us"], kinds: ["auction", "classic"],
      home: "https://www.barrett-jackson.com/", verify: "search_on_site",
      note: "US collector car auctions. Search URLs we tried returned 404. Opens the site — use its docket search.",
      build(p) { return "https://www.barrett-jackson.com/"; } },
    { id: "gooding", name: "Gooding Christie’s", region: "Auctions", regions: ["worldwide", "us", "uk", "eu"], kinds: ["auction", "classic"],
      home: "https://www.goodingco.com/", verify: "search_on_site",
      note: "Global collector car auctions. Query links were not applied. Opens the lots page — filter there.",
      build(p) { return "https://www.goodingco.com/lots"; } },
    { id: "broad-arrow", name: "Broad Arrow Auctions", region: "Auctions", regions: ["worldwide", "us", "eu"], kinds: ["auction", "classic"],
      home: "https://www.broadarrowauctions.com/", verify: "search_on_site",
      note: "Hagerty-owned collector auctions. Its search ignores URL keywords (tested: unrelated cars shown), so search on the site.",
      build(p) { return "https://www.broadarrowauctions.com/vehicles"; } },
    { id: "bonhams", name: "Bonhams", region: "Auctions", regions: ["worldwide", "uk", "us", "eu"], kinds: ["auction", "classic"],
      home: "https://www.bonhams.com/", verify: "search_on_site",
      note: "Global auction house. The search page loads but the query is not applied from a link — type the car there.",
      build(p) { return "https://www.bonhams.com/search/"; } },
    { id: "iconic-auctions", name: "Iconic Auctions (ex-Silverstone Auctions)", region: "Auctions", regions: ["worldwide", "uk"], kinds: ["auction", "classic"],
      home: "https://www.iconicauctions.com/", verify: "search_on_site",
      note: "UK classic car auctions (Silverstone Auctions now trades as Iconic Auctions). No search URL — opens the auctions site.",
      build(p) { return "https://www.iconicauctions.com/"; } },
    { id: "artcurial", name: "Artcurial Motorcars", region: "Auctions", regions: ["worldwide", "fr", "eu"], kinds: ["auction", "classic"],
      home: "https://www.artcurial.com/", verify: "verified",
      note: "Paris auction house (Rétromobile sales); lot search",
      build(p) { return kwq(p, "https://www.artcurial.com/en/search?search=", "", "https://www.artcurial.com/en", true); } },
    { id: "catawiki", name: "Catawiki", region: "Auctions", regions: ["worldwide", "eu", "nl"], kinds: ["auction", "classic"],
      home: "https://www.catawiki.com/", verify: "verified",
      note: "European weekly online auctions, classic cars included (keyword)",
      build(p) { return kwq(p, "https://www.catawiki.com/en/s?q=", "", "https://www.catawiki.com/en/c/423-classic-cars", true); } },
    { id: "jamesedition", name: "JamesEdition", region: "Auctions", regions: ["worldwide", "us", "eu", "ae"], kinds: ["exotic", "market"],
      home: "https://www.jamesedition.com/cars/", verify: "verified",
      note: "Global luxury marketplace, dealer listings worldwide (make/model path)",
      build(p) {
        // Make ids use underscores (aston_martin, land_rover, rolls_royce) and
        // Mercedes-Benz is "mercedes"; hyphenated makes redirect to the unfiltered /cars page.
        const mkAlias = { "mercedes-benz": "mercedes" };
        let make = slug(p.make);
        make = mkAlias[make] || make.replace(/-/g, "_");
        const model = slug(p.model);
        if (!make) return "https://www.jamesedition.com/cars/";
        return "https://www.jamesedition.com/cars/" + make + "/" + (model ? model + "/" : "");
      } }
  ];

  /* ---- Forums & communities. Most forums have no public query URL, so these
     open a Google search limited to that site with "for sale" + make/model.
     They are labelled "Forum search via Google" and are NOT verified listings. ---- */
  function googleSite(site, p) {
    const q = ["site:" + site, '"for sale"', mmText(p)].filter(Boolean).join(" ");
    return "https://www.google.com/search?q=" + plus(q);
  }
  function forum(id, name, site, note, makes, models) {
    return {
      id, name, region: "Forums & communities", regions: ["worldwide"], kinds: ["forum"],
      home: "https://" + site.split("/")[0] + "/", verify: "google_site", site, note,
      makes: makes || null, models: models || null,
      build(p) { return googleSite(site, p); }
    };
  }
  const FORUMS = [
    // General — always shown
    { id: "reddit-carsforsale", name: "Reddit r/carsforsale", region: "Forums & communities", regions: ["worldwide"], kinds: ["forum"],
      home: "https://www.reddit.com/r/carsforsale/", verify: "bot_blocked", makes: null, models: null,
      note: "Reddit’s main car-sale community, newest first. Reddit blocks automated checks, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.reddit.com/r/carsforsale/search/?q=", "&restrict_sr=1&sort=new", "https://www.reddit.com/r/carsforsale/new/", false); } },
    { id: "facebook-marketplace", name: "Facebook Marketplace", region: "Forums & communities", regions: ["worldwide"], kinds: ["forum", "classifieds"],
      home: "https://www.facebook.com/marketplace/", verify: "bot_blocked", makes: null, models: null,
      note: "Vehicle search. Facebook requires you to be logged in, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.facebook.com/marketplace/category/vehicles?query=", "", "https://www.facebook.com/marketplace/category/vehicles", false); } },
    forum("craigslist", "Craigslist (all cities)", "craigslist.org", "Craigslist is split by city; this searches every city’s listings via Google."),
    forum("garage-journal", "The Garage Journal", "garagejournal.com", "Large garage/enthusiast forum with a classifieds section"),
    forum("grassroots-motorsports", "Grassroots Motorsports forum", "grassrootsmotorsports.com/forum", "Enthusiast forum with an active classifieds board"),
    forum("the-hamb", "The H.A.M.B. (Jalopy Journal)", "jalopyjournal.com", "Traditional hot rod and classic forum with a classifieds section"),
    forum("pistonheads-forums", "PistonHeads forums", "pistonheads.com/gassing", "UK enthusiast forums (Gassing Station)"),
    // Make / model forums — shown when the search make (and model, where set) matches
    forum("rennlist", "Rennlist Marketplace", "rennlist.com", "Porsche enthusiast forum and marketplace", ["porsche"]),
    forum("pelican-parts", "Pelican Parts forums", "forums.pelicanparts.com", "Porsche/BMW/Mercedes forums with classifieds", ["porsche", "bmw", "mercedes-benz"]),
    forum("planet-9", "Planet-9", "planet-9.com", "Boxster/Cayman forum with classifieds", ["porsche"], /boxster|cayman|718/),
    forum("pca-mart", "PCA Mart", "mart.pca.org", "Porsche Club of America classifieds", ["porsche"]),
    forum("6speedonline", "6SpeedOnline", "6speedonline.com", "Porsche, Ferrari, Lamborghini, McLaren and Aston Martin forums with classifieds",
      ["porsche", "ferrari", "lamborghini", "mclaren", "aston-martin", "bentley", "rolls-royce", "maserati"]),
    forum("ferrarichat", "FerrariChat", "ferrarichat.com", "Ferrari forum with a large for-sale section", ["ferrari"]),
    forum("lotustalk", "LotusTalk", "lotustalk.com", "Lotus owners’ forum with classifieds", ["lotus"]),
    forum("corvette-forum", "CorvetteForum", "corvetteforum.com", "Corvette forum with classifieds", ["chevrolet"], /corvette/),
    forum("camaro6", "Camaro6", "camaro6.com", "Camaro forum with classifieds", ["chevrolet"], /camaro/),
    forum("ls1tech", "LS1Tech", "ls1tech.com", "GM LS-engine forum (Camaro, Firebird, Corvette, trucks) with classifieds", ["chevrolet", "pontiac", "gmc", "cadillac"]),
    forum("bimmerpost", "Bimmerpost", "bimmerpost.com", "BMW model forums with classifieds", ["bmw"]),
    forum("bimmerforums", "Bimmerforums", "bimmerforums.com", "BMW forum with classifieds", ["bmw"]),
    forum("supraforums", "SupraForums", "supraforums.com", "Toyota Supra forum with classifieds", ["toyota"], /supra/),
    forum("ih8mud", "IH8MUD", "forum.ih8mud.com", "Land Cruiser / 4Runner / Lexus LX-GX forum with classifieds", ["toyota", "lexus"], /land-cruiser|4runner|fj|lx|gx/),
    forum("tacoma-world", "Tacoma World", "tacomaworld.com", "Toyota truck forum with classifieds", ["toyota"], /tacoma|tundra|4runner/),
    forum("toyota-nation", "Toyota Nation", "toyotanation.com", "General Toyota forum with classifieds", ["toyota", "scion"]),
    forum("ft86club", "FT86Club", "ft86club.com", "GR86 / 86 / FR-S / BRZ forum with classifieds", ["toyota", "subaru", "scion"], /^(gr-?86|86|brz|fr-s|frs)$/),
    forum("clublexus", "ClubLexus", "clublexus.com", "Lexus forum with classifieds", ["lexus"]),
    forum("nasioc", "NASIOC", "forums.nasioc.com", "Subaru forum with a big classifieds section", ["subaru"]),
    forum("miata-net", "Miata.net forum", "forum.miata.net", "Mazda Miata forum with classifieds", ["mazda"], /miata|mx-5|mx5/),
    forum("miataturbo", "MiataTurbo.net", "miataturbo.net", "Performance Miata forum with classifieds", ["mazda"], /miata|mx-5|mx5/),
    forum("rx7club", "RX7Club", "rx7club.com", "Mazda rotary (RX-7/RX-8) forum with classifieds", ["mazda"], /rx-?7|rx-?8/),
    forum("s2ki", "S2Ki", "s2ki.com", "Honda S2000 forum with classifieds", ["honda"], /s2000/),
    forum("honda-tech", "Honda-Tech", "honda-tech.com", "Honda/Acura forum with classifieds", ["honda", "acura"]),
    forum("nsxprime", "NSX Prime", "nsxprime.com", "Acura/Honda NSX forum with classifieds", ["acura", "honda"], /nsx/),
    forum("gtrlife", "GT-R Life", "gtrlife.com", "Nissan GT-R forum with classifieds", ["nissan"], /gt-?r|skyline/),
    forum("my350z", "My350Z", "my350z.com", "Nissan Z forum with classifieds", ["nissan"], /350z|370z|^z$|300zx/),
    forum("nicoclub", "NICOclub", "nicoclub.com", "General Nissan/Infiniti forum", ["nissan", "infiniti"]),
    forum("evolutionm", "EvolutionM", "evolutionm.net", "Mitsubishi Lancer Evolution forum with classifieds", ["mitsubishi"]),
    forum("vwvortex", "VWVortex", "vwvortex.com", "VW/Audi forum with classifieds", ["volkswagen", "audi"]),
    { id: "thesamba", name: "TheSamba classifieds", region: "Forums & communities", regions: ["worldwide"], kinds: ["forum", "classifieds"],
      home: "https://www.thesamba.com/vw/classifieds/", verify: "verified", makes: ["volkswagen", "porsche"], models: null,
      note: "Air-cooled VW (and vintage Porsche) community classifieds — native keyword search",
      build(p) {
        const t = mmText({ make: "", model: p.model }) || mmText(p);
        return t ? "https://www.thesamba.com/vw/classifieds/search.php?type=text&stype=all&keywords=" + plus(t) : "https://www.thesamba.com/vw/classifieds/";
      } },
    forum("audizine", "Audizine", "audizine.com", "Audi forum with classifieds", ["audi"]),
    forum("audiworld", "AudiWorld", "audiworld.com", "Audi forum with a marketplace", ["audi"]),
    forum("mbworld", "MBWorld", "mbworld.org", "Mercedes-Benz forum with classifieds", ["mercedes-benz"]),
    forum("benzworld", "BenzWorld", "benzworld.org", "Mercedes-Benz forum with classifieds", ["mercedes-benz"]),
    forum("mustang6g", "Mustang6G", "mustang6g.com", "Mustang forum with classifieds", ["ford"], /mustang/),
    forum("bronco6g", "Bronco6G", "bronco6g.com", "Ford Bronco forum with classifieds", ["ford"], /bronco/),
    forum("ford-trucks", "Ford Truck Enthusiasts", "ford-trucks.com", "Ford truck forum with classifieds", ["ford"], /^f-?\d{3}|ranger|bronco|super-duty|excursion|expedition/),
    forum("jeepforum", "JeepForum", "jeepforum.com", "General Jeep forum with classifieds", ["jeep"]),
    forum("jlwrangler", "JL Wrangler Forums", "jlwranglerforums.com", "Jeep Wrangler/Gladiator forum with classifieds", ["jeep"], /wrangler|gladiator/),
    forum("landroverforums", "Land Rover Forums", "landroverforums.com", "Land Rover / Range Rover forum with classifieds", ["land-rover"]),
    forum("defendersource", "Defender Source", "defendersource.com", "Land Rover Defender forum with classifieds", ["land-rover"], /defender/),
    forum("teslamotorsclub", "Tesla Motors Club", "teslamotorsclub.com", "Tesla forum with a marketplace", ["tesla"]),
    forum("alfabb", "AlfaBB", "alfabb.com", "Alfa Romeo forum with classifieds", ["alfa-romeo"]),
    forum("nam-mini", "North American Motoring", "northamericanmotoring.com", "MINI forum with classifieds", ["mini"]),
    forum("turbobricks", "Turbobricks", "turbobricks.com", "Volvo forum with classifieds", ["volvo"])
  ];

  function forumMatches(f, params) {
    if (!f.makes) return true;
    const make = slug(params.make), model = slug(params.model);
    if (!make || f.makes.indexOf(make) === -1) return false;
    if (f.models && model) return f.models.test(model);
    return true;
  }
  function forumsFor(params) { return FORUMS.filter(f => forumMatches(f, params || {})); }

  SOURCES.push(...MORE_SOURCES);

  function sourcesFor(country) {
    const c = (country || "worldwide").toLowerCase();
    if (!c || c === "worldwide" || c === "all") return SOURCES.slice();
    return SOURCES.filter(s => (s.regions || []).includes(c));
  }

  // Single-brand sites (e.g. Elferspot = Porsche only) are hidden for other makes.
  function makeAllowed(src, params) {
    if (!src.onlyMakes) return true;
    const m = slug(params.make);
    return !m || src.onlyMakes.indexOf(m) !== -1;
  }
  // A source "applies years" if adding a year range changes its URL.
  function appliesYears(src, params) {
    const base = Object.assign({}, params, { yearFrom: "", yearTo: "" });
    const withY = Object.assign({}, params, { yearFrom: "2001", yearTo: "2002" });
    try { return src.build(base) !== src.build(withY); } catch (e) { return false; }
  }
  function safeUrl(src, params) {
    let u;
    try { u = src.build(params); } catch (e) { u = ""; }
    if (!u || /undefined|null/.test(u)) u = src.home;
    return u;
  }

  // Free-text makes: map common spellings to the names marketplaces use
  // ("mercedes benz" → "Mercedes-Benz", "vw" → "Volkswagen"). Unknown makes pass through.
  const MAKE_ALIASES = {
    "mercedes": "Mercedes-Benz", "mercedes benz": "Mercedes-Benz", "mercedesbenz": "Mercedes-Benz", "merc": "Mercedes-Benz", "benz": "Mercedes-Benz",
    "vw": "Volkswagen", "chevy": "Chevrolet", "landrover": "Land Rover", "land-rover": "Land Rover",
    "rolls royce": "Rolls-Royce", "rollsroyce": "Rolls-Royce", "aston": "Aston Martin", "aston-martin": "Aston Martin",
    "alfa": "Alfa Romeo", "alfa-romeo": "Alfa Romeo", "lambo": "Lamborghini", "citroën": "Citroen", "škoda": "Skoda"
  };
  function normParams(params) {
    const p = Object.assign({}, params);
    const key = String(p.make || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (MAKE_ALIASES[key]) p.make = MAKE_ALIASES[key];
    p.make = String(p.make || "").trim();
    p.model = String(p.model || "").trim();
    return p;
  }

  function buildResults(params) {
    params = normParams(params || {});
    const list = sourcesFor(params.country).filter(s => makeAllowed(s, params)).concat(forumsFor(params));
    return list.map(src => ({
      id: src.id,
      name: src.name,
      region: src.region,
      verify: src.verify,
      note: src.note,
      home: src.home,
      kinds: src.kinds,
      years: appliesYears(src, params),
      url: safeUrl(src, params)
    }));
  }

  function groupByRegion(items) {
    const order = ["US", "Canada", "Latin America", "UK & Ireland", "Europe", "Japan", "Korea", "China & Hong Kong",
      "Southeast Asia", "India", "Australia & NZ", "Middle East", "Africa", "Classic / Exotic", "Auctions", "Forums & communities"];
    const map = {};
    items.forEach(it => {
      (map[it.region] = map[it.region] || []).push(it);
    });
    const keys = Object.keys(map).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return keys.map(k => ({ region: k, items: map[k] }));
  }

  global.SITE_SOURCES = { SOURCES, FORUMS, sourcesFor, forumsFor, buildResults, groupByRegion };
})(window);
