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
  function keyword(make, model, yFrom, yTo) {
    return (qYear(yFrom, yTo) + [make, model].filter(Boolean).join(" ")).trim();
  }

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
        if (p.yearFrom) qs.set("startYear", p.yearFrom);
        if (p.yearTo) qs.set("endYear", p.yearTo);
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
        const make = slug(p.make);
        const model = slug(p.model);
        const params = new URLSearchParams();
        params.set("stock_type", "all");
        params.set("maximum_distance", "all");
        if (make) params.append("makes[]", make);
        if (make && model) params.append("models[]", `${make}-${model}`);
        if (p.yearFrom) params.set("year_min", p.yearFrom);
        if (p.yearTo) params.set("year_max", p.yearTo);
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
        const nkw = keyword(p.make, p.model, p.yearFrom, p.yearTo) || "car";
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
        const s = keyword(p.make, p.model, p.yearFrom, p.yearTo);
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
        const s = keyword(p.make, p.model, p.yearFrom, p.yearTo);
        return s ? `https://carsandbids.com/search?q=${enc(s)}` : "https://carsandbids.com/";
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
        const yf = p.yearFrom || "1900";
        const yt = p.yearTo || new Date().getFullYear();
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
        if (p.model) params.set("model", p.model);
        if (p.yearFrom) params.set("year-from", p.yearFrom);
        if (p.yearTo) params.set("year-to", p.yearTo);
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
        const s = keyword(p.make, p.model, p.yearFrom, p.yearTo);
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
        const q = keyword(p.make, p.model, p.yearFrom, p.yearTo) || "auto";
        return "https://suchen.mobile.de/fahrzeuge/search.html?dam=false&isSearchRequest=true&ref=quickSearch&s=Car&sb=rel&vc=Car&q=" + enc(q);
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
        if (p.yearFrom) params.set("fregfrom", p.yearFrom);
        if (p.yearTo) params.set("fregto", p.yearTo);
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
        const text = keyword(p.make, p.model, p.yearFrom, p.yearTo) || "voiture";
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
        const kw = keyword(p.make, p.model, p.yearFrom, p.yearTo);
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
        const make = slug(p.make).toUpperCase();
        const model = slug(p.model).toUpperCase();
        // /search/?keyword= returns a 404. Public listings use /usedcars/MAKE/MODEL/.
        if (make && model) return `https://www.goo-net-exchange.com/usedcars/${make}/${model}/`;
        if (make) return `https://www.goo-net-exchange.com/usedcars/${make}/`;
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
        const kw = keyword(p.make, p.model, p.yearFrom, p.yearTo);
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
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://www.autotrader.ca/cars/${make}/${model}/`;
        if (make) return `https://www.autotrader.ca/cars/${make}/`;
        return "https://www.autotrader.ca/cars/";
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
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://uae.dubizzle.com/motors/used-cars/${make}/${model}/`;
        if (make) return `https://uae.dubizzle.com/motors/used-cars/${make}/`;
        return "https://uae.dubizzle.com/motors/used-cars/";
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
      verify: "deeplink",
      note: "Porsche-focused classic marketplace. Search uses the cs= parameter (spaces as +).",
      build(p) {
        const s = keyword(p.make, p.model, "", "");
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
      note: "Luxury and exotic inventory",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (make && model) return `https://www.dupontregistry.com/autos/results/${make}/${model}/any_year`;
        if (make) return `https://www.dupontregistry.com/autos/results/${make}/any/any_year`;
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
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.autotempest.com/";
        const qs = new URLSearchParams({ make, model, zip: "", radius: "any" });
        if (p.yearFrom) qs.set("minyear", p.yearFrom);
        if (p.yearTo) qs.set("maxyear", p.yearTo);
        return "https://www.autotempest.com/results?" + qs.toString();
      } },
    { id: "carmax", name: "CarMax", region: "US", regions: ["us", "worldwide"], kinds: ["dealer"],
      home: "https://www.carmax.com/", verify: "verified",
      note: "Nationwide used-car retailer (make/model page)",
      build(p) { return pathMM(p, "https://www.carmax.com/cars", "", "https://www.carmax.com/cars"); } },
    { id: "carvana", name: "Carvana", region: "US", regions: ["us", "worldwide"], kinds: ["dealer"],
      home: "https://www.carvana.com/", verify: "verified",
      note: "Online used-car retailer. If the model is out of stock it falls back to the make page.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.carvana.com/cars";
        return "https://www.carvana.com/cars/" + make + (model ? "-" + model : "");
      } },
    { id: "truecar", name: "TrueCar", region: "US", regions: ["us", "worldwide"], kinds: ["market"],
      home: "https://www.truecar.com/", verify: "bot_blocked",
      note: "Used listings by make/model. Automated checks hit a 'press and hold' bot check, so this stays a browser link.",
      build(p) { return pathMM(p, "https://www.truecar.com/used-cars-for-sale/listings", "/", "https://www.truecar.com/used-cars-for-sale/listings/"); } },
    { id: "edmunds", name: "Edmunds", region: "US", regions: ["us", "worldwide"], kinds: ["market"],
      home: "https://www.edmunds.com/", verify: "bot_blocked",
      note: "Used inventory search. Automated checks got a 403, so this stays a browser link.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.edmunds.com/inventory/srp.html";
        return "https://www.edmunds.com/inventory/srp.html?make=" + make + (model ? "&model=" + make + "|" + model : "");
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
      build(p) { return pathMM(p, "https://autos.mercadolibre.com.mx", "/", "https://autos.mercadolibre.com.mx/"); } },
    { id: "mercadolibre-ar", name: "Mercado Libre Argentina", region: "Latin America", regions: ["ar", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://autos.mercadolibre.com.ar/", verify: "verified",
      note: "Argentina vehicle listings (make/model path)",
      build(p) { return pathMM(p, "https://autos.mercadolibre.com.ar", "/", "https://autos.mercadolibre.com.ar/"); } },
    { id: "mercadolibre-cl", name: "Mercado Libre Chile", region: "Latin America", regions: ["cl", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://autos.mercadolibre.cl/", verify: "verified",
      note: "Chile vehicle listings (make/model path)",
      build(p) { return pathMM(p, "https://autos.mercadolibre.cl", "/", "https://autos.mercadolibre.cl/"); } },
    { id: "mercadolibre-co", name: "Mercado Libre Colombia", region: "Latin America", regions: ["co", "worldwide"], kinds: ["market", "classifieds"],
      home: "https://carros.mercadolibre.com.co/", verify: "bot_blocked",
      note: "Colombia vehicle listings. Same path format as the other Mercado Libre sites; automated checks hit a security wall, so this stays a browser link.",
      build(p) { return pathMM(p, "https://carros.mercadolibre.com.co", "/", "https://carros.mercadolibre.com.co/"); } },
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
      home: "https://www.ebay.co.uk/", verify: "bot_blocked",
      note: "Cars category search. Same format as eBay US; automated checks got eBay’s error page, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.ebay.co.uk/sch/i.html?_sacat=9801&_nkw=", "", "https://www.ebay.co.uk/b/Cars/9801", true); } },
    { id: "donedeal", name: "DoneDeal", region: "UK & Ireland", regions: ["ie", "uk", "worldwide"], kinds: ["classifieds", "market"],
      home: "https://www.donedeal.ie/", verify: "verified",
      note: "Ireland’s largest car classifieds (make/model path)",
      build(p) {
        const mk = String(p.make || "").trim(), md = String(p.model || "").trim();
        if (!mk) return "https://www.donedeal.ie/cars";
        return "https://www.donedeal.ie/cars/" + enc(mk) + (md ? "/" + enc(md) : "");
      } },
    { id: "carzone", name: "Carzone", region: "UK & Ireland", regions: ["ie", "worldwide"], kinds: ["market"],
      home: "https://www.carzone.ie/", verify: "verified",
      note: "Irish dealer and private listings. If no cars match the model it falls back to the make page.",
      build(p) { return pathMM(p, "https://www.carzone.ie/used-cars", "", "https://www.carzone.ie/used-cars"); } },

    /* ---------- Europe ---------- */
    { id: "classic-trader", name: "Classic Trader", region: "Europe", regions: ["de", "eu", "uk", "worldwide"], kinds: ["classic", "classifieds"],
      home: "https://www.classic-trader.com/", verify: "verified",
      note: "European classic car marketplace (full-text search)",
      build(p) { return kwq(p, "https://www.classic-trader.com/uk/cars/search?fulltext=", "", "https://www.classic-trader.com/uk/cars/search", true); } },
    { id: "autoscout24-de", name: "AutoScout24 Germany", region: "Europe", regions: ["de", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.de/", verify: "verified", note: "German AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.de/lst", "", "https://www.autoscout24.de/lst"); } },
    { id: "autoscout24-it", name: "AutoScout24 Italy", region: "Europe", regions: ["it", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.it/", verify: "verified", note: "Italian AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.it/lst", "", "https://www.autoscout24.it/lst"); } },
    { id: "autoscout24-fr", name: "AutoScout24 France", region: "Europe", regions: ["fr", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.fr/", verify: "verified", note: "French AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.fr/lst", "", "https://www.autoscout24.fr/lst"); } },
    { id: "autoscout24-nl", name: "AutoScout24 Netherlands", region: "Europe", regions: ["nl", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.nl/", verify: "verified", note: "Dutch AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.nl/lst", "", "https://www.autoscout24.nl/lst"); } },
    { id: "autoscout24-be", name: "AutoScout24 Belgium", region: "Europe", regions: ["be", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.be/", verify: "verified", note: "Belgian AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.be/nl/lst", "", "https://www.autoscout24.be/nl/lst"); } },
    { id: "autoscout24-es", name: "AutoScout24 Spain", region: "Europe", regions: ["es", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.es/", verify: "verified", note: "Spanish AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.es/lst", "", "https://www.autoscout24.es/lst"); } },
    { id: "autoscout24-at", name: "AutoScout24 Austria", region: "Europe", regions: ["at", "eu"], kinds: ["market"],
      home: "https://www.autoscout24.at/", verify: "verified", note: "Austrian AutoScout24 site (make/model path)",
      build(p) { return pathMM(p, "https://www.autoscout24.at/lst", "", "https://www.autoscout24.at/lst"); } },
    { id: "kleinanzeigen", name: "Kleinanzeigen", region: "Europe", regions: ["de", "eu"], kinds: ["classifieds"],
      home: "https://www.kleinanzeigen.de/", verify: "verified",
      note: "Germany’s big classifieds site (formerly eBay Kleinanzeigen), cars category",
      build(p) {
        const k = slug(mmText(p));
        return k ? "https://www.kleinanzeigen.de/s-autos/" + k + "/k0c216" : "https://www.kleinanzeigen.de/s-autos/c216";
      } },
    { id: "ebay-de", name: "eBay Germany", region: "Europe", regions: ["de", "eu"], kinds: ["market", "auction"],
      home: "https://www.ebay.de/", verify: "bot_blocked",
      note: "Autos category search. Same format as eBay US; automated checks got eBay’s error page, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.ebay.de/sch/i.html?_sacat=9801&_nkw=", "", "https://www.ebay.de/b/Autos/9801", true); } },
    { id: "marktplaats", name: "Marktplaats", region: "Europe", regions: ["nl", "eu"], kinds: ["classifieds"],
      home: "https://www.marktplaats.nl/", verify: "verified",
      note: "Netherlands classifieds (keyword)",
      build(p) { const t = mmText(p).toLowerCase(); return t ? "https://www.marktplaats.nl/q/" + plus(t) + "/" : "https://www.marktplaats.nl/l/auto-s/"; } },
    { id: "2dehands", name: "2dehands", region: "Europe", regions: ["be", "eu"], kinds: ["classifieds"],
      home: "https://www.2dehands.be/", verify: "verified",
      note: "Belgium classifieds (keyword)",
      build(p) { const t = mmText(p).toLowerCase(); return t ? "https://www.2dehands.be/q/" + plus(t) + "/" : "https://www.2dehands.be/l/auto-s/"; } },
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
      build(p) { return kwq(p, "https://www.subito.it/annunci-italia/vendita/auto/?q=", "", "https://www.subito.it/annunci-italia/vendita/auto/", true); } },
    { id: "coches-net", name: "coches.net", region: "Europe", regions: ["es", "eu"], kinds: ["market"],
      home: "https://www.coches.net/", verify: "verified",
      note: "Spain’s big used-car portal (keyword)",
      build(p) { return kwq(p, "https://www.coches.net/segunda-mano/?KeyWords=", "", "https://www.coches.net/segunda-mano/", true); } },
    { id: "milanuncios", name: "Milanuncios", region: "Europe", regions: ["es", "eu"], kinds: ["classifieds"],
      home: "https://www.milanuncios.com/", verify: "bot_blocked",
      note: "Spain classifieds, used cars (keyword). Automated checks hit a captcha, so this stays a browser link.",
      build(p) { return kwq(p, "https://www.milanuncios.com/coches-de-segunda-mano/?s=", "", "https://www.milanuncios.com/coches-de-segunda-mano/", true); } },
    { id: "wallapop", name: "Wallapop", region: "Europe", regions: ["es", "eu"], kinds: ["classifieds"],
      home: "https://es.wallapop.com/", verify: "deeplink",
      note: "Spain peer-to-peer marketplace, cars category. The search URL is accepted, but results load only after Wallapop knows your location.",
      build(p) { return kwq(p, "https://es.wallapop.com/search?category_id=100&keywords=", "", "https://es.wallapop.com/coches-segunda-mano", false); } },
    { id: "standvirtual", name: "Standvirtual", region: "Europe", regions: ["pt", "eu"], kinds: ["market"],
      home: "https://www.standvirtual.com/", verify: "verified",
      note: "Portugal’s main car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.standvirtual.com/carros", "", "https://www.standvirtual.com/carros"); } },
    { id: "willhaben", name: "willhaben", region: "Europe", regions: ["at", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.willhaben.at/", verify: "verified",
      note: "Austria’s largest classifieds, car exchange (keyword)",
      build(p) { return kwq(p, "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse?keyword=", "", "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse", true); } },
    { id: "blocket", name: "Blocket", region: "Europe", regions: ["se", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.blocket.se/", verify: "verified",
      note: "Sweden’s main classifieds, cars (keyword)",
      build(p) { return kwq(p, "https://www.blocket.se/mobility/search/car?q=", "", "https://www.blocket.se/mobility/search/car", true); } },
    { id: "finn", name: "FINN.no", region: "Europe", regions: ["no", "eu"], kinds: ["classifieds", "market"],
      home: "https://www.finn.no/", verify: "verified",
      note: "Norway’s main marketplace, cars (keyword)",
      build(p) { return kwq(p, "https://www.finn.no/mobility/search/car?q=", "", "https://www.finn.no/mobility/search/car", true); } },
    { id: "bilbasen", name: "Bilbasen", region: "Europe", regions: ["dk", "eu"], kinds: ["market"],
      home: "https://www.bilbasen.dk/", verify: "verified",
      note: "Denmark’s largest used-car site (make/model path)",
      build(p) { return pathMM(p, "https://www.bilbasen.dk/brugt/bil", "", "https://www.bilbasen.dk/brugt/bil"); } },
    { id: "nettiauto", name: "Nettiauto", region: "Europe", regions: ["fi", "eu"], kinds: ["market"],
      home: "https://www.nettiauto.com/", verify: "verified",
      note: "Finland’s main car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.nettiauto.com", "", "https://www.nettiauto.com/"); } },
    { id: "otomoto", name: "Otomoto", region: "Europe", regions: ["pl", "eu"], kinds: ["market"],
      home: "https://www.otomoto.pl/", verify: "verified",
      note: "Poland’s largest car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.otomoto.pl/osobowe", "", "https://www.otomoto.pl/osobowe"); } },
    { id: "sauto", name: "Sauto", region: "Europe", regions: ["cz", "eu"], kinds: ["market"],
      home: "https://www.sauto.cz/", verify: "verified",
      note: "Czech Republic car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.sauto.cz/inzerce/osobni", "", "https://www.sauto.cz/inzerce/osobni"); } },
    { id: "autovit", name: "Autovit", region: "Europe", regions: ["ro", "eu"], kinds: ["market"],
      home: "https://www.autovit.ro/", verify: "verified",
      note: "Romania’s main car marketplace (make/model path)",
      build(p) { return pathMM(p, "https://www.autovit.ro/autoturisme", "", "https://www.autovit.ro/autoturisme"); } },
    { id: "car-gr", name: "Car.gr", region: "Europe", regions: ["gr", "eu"], kinds: ["market", "classifieds"],
      home: "https://www.car.gr/", verify: "search_on_site",
      note: "Greece’s main car site. Filters need internal IDs and automated checks were blocked. Opens car classifieds — pick the make and model there.",
      build(p) { return "https://www.car.gr/classifieds/cars/"; } },
    { id: "autohero", name: "Autohero", region: "Europe", regions: ["de", "eu"], kinds: ["dealer"],
      home: "https://www.autohero.com/", verify: "deeplink",
      note: "Online used-car retailer (Germany). The brand/model filter is accepted; stock is small, so rare models may show no cars.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.autohero.com/de/search/";
        return "https://www.autohero.com/de/search/?brand=" + make + (model ? "&model=" + model : "");
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
      build(p) { return pathMM(p, "https://www.tc-v.com/used_car", "/", "https://www.tc-v.com/used_car/"); } },
    { id: "sbt-japan", name: "SBT Japan", region: "Japan", regions: ["jp", "worldwide"], kinds: ["export"],
      home: "https://www.sbtjapan.com/", verify: "verified",
      note: "Japanese used-car exporter (make/model path)",
      build(p) { return pathMM(p, "https://www.sbtjapan.com/used-cars", "", "https://www.sbtjapan.com/used-cars"); } },
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
      home: "https://www.one2car.com/", verify: "bot_blocked",
      note: "Thailand car marketplace (make/model path). Automated checks hit a Cloudflare check, so this stays a browser link.",
      build(p) { return pathMM(p, "https://www.one2car.com/en/cars-for-sale", "", "https://www.one2car.com/en/cars-for-sale"); } },
    { id: "cardekho", name: "CarDekho", region: "India", regions: ["in", "worldwide"], kinds: ["market"],
      home: "https://www.cardekho.com/", verify: "verified",
      note: "India used cars (make/model page). Tested with Toyota Fortuner; rare imports may show no cars.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.cardekho.com/used-cars+in+india";
        return "https://www.cardekho.com/used-" + make + (model ? "-" + model : "") + "+cars+in+india";
      } },
    { id: "carwale", name: "CarWale", region: "India", regions: ["in", "worldwide"], kinds: ["market"],
      home: "https://www.carwale.com/", verify: "verified",
      note: "India used cars (make-model page). Tested with Toyota Fortuner.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        if (!make) return "https://www.carwale.com/used/";
        return "https://www.carwale.com/used/" + make + (model ? "-" + model : "") + "/";
      } },
    { id: "olx-in", name: "OLX India", region: "India", regions: ["in", "worldwide"], kinds: ["classifieds"],
      home: "https://www.olx.in/", verify: "bot_blocked",
      note: "India classifieds, cars (keyword). Automated checks got Access Denied, so this stays a browser link.",
      build(p) { const k = slug(mmText(p)); return k ? "https://www.olx.in/cars_c84/q-" + k : "https://www.olx.in/cars_c84"; } },

    /* ---------- Australia & NZ ---------- */
    { id: "drive-au", name: "Drive Marketplace", region: "Australia & NZ", regions: ["au", "worldwide"], kinds: ["market"],
      home: "https://www.drive.com.au/cars-for-sale/", verify: "verified",
      note: "Australia dealer and private listings (make/model path)",
      build(p) { return pathMM(p, "https://www.drive.com.au/cars-for-sale/search/all/all", "/", "https://www.drive.com.au/cars-for-sale/"); } },
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
      build(p) { return pathMM(p, "https://www.trademe.co.nz/a/motors/cars", "", "https://www.trademe.co.nz/a/motors/cars"); } },

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
      note: "South Africa used cars (Make/Model path). If no cars match the model it shows the make page.",
      build(p) {
        const mk = String(p.make || "").trim(), md = String(p.model || "").trim();
        if (!mk) return "https://www.cars.co.za/usedcars/";
        return "https://www.cars.co.za/usedcars/" + enc(mk) + "/" + (md ? enc(md) + "/" : "");
      } },
    { id: "autotrader-za", name: "AutoTrader South Africa", region: "Africa", regions: ["za", "worldwide"], kinds: ["market"],
      home: "https://www.autotrader.co.za/", verify: "verified",
      note: "South Africa listings (make/model path)",
      build(p) { return pathMM(p, "https://www.autotrader.co.za/cars-for-sale", "", "https://www.autotrader.co.za/cars-for-sale"); } },
    { id: "jiji-ng", name: "Jiji Nigeria", region: "Africa", regions: ["ng", "worldwide"], kinds: ["classifieds"],
      home: "https://jiji.ng/", verify: "verified",
      note: "Nigeria classifieds, cars (make-model path). Our box was blocked, but an outside fetch returned filtered listings.",
      build(p) {
        const make = slug(p.make), model = slug(p.model);
        return make ? "https://jiji.ng/cars/" + make + (model ? "-" + model : "") : "https://jiji.ng/cars";
      } },
    { id: "jiji-ke", name: "Jiji Kenya", region: "Africa", regions: ["ke", "worldwide"], kinds: ["classifieds"],
      home: "https://jiji.co.ke/", verify: "bot_blocked",
      note: "Kenya classifieds, cars (same path format as Jiji Nigeria). Automated checks hit a Cloudflare check, so this stays a browser link.",
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
      home: "https://www.broadarrowauctions.com/", verify: "deeplink",
      note: "Hagerty-owned collector auctions. Search link to auction results; the filter could not be fully confirmed.",
      build(p) { return kwq(p, "https://www.broadarrowauctions.com/vehicles/results?q%5Bsearch%5D=", "", "https://www.broadarrowauctions.com/vehicles", true); } },
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
      build(p) { return pathMM(p, "https://www.jamesedition.com/cars", "/", "https://www.jamesedition.com/cars/"); } }
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

  function buildResults(params) {
    const list = sourcesFor(params.country).concat(forumsFor(params));
    return list.map(src => ({
      id: src.id,
      name: src.name,
      region: src.region,
      verify: src.verify,
      note: src.note,
      home: src.home,
      kinds: src.kinds,
      url: src.build(params)
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
