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
      region: "UK",
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
      region: "UK",
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
      region: "EU",
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
      region: "EU",
      regions: ["de", "eu", "fr", "worldwide"],
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
      region: "EU",
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
      region: "Australia",
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
      region: "UAE",
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

  function sourcesFor(country) {
    const c = (country || "worldwide").toLowerCase();
    if (!c || c === "worldwide" || c === "all") return SOURCES.slice();
    return SOURCES.filter(s => (s.regions || []).includes(c));
  }

  function buildResults(params) {
    const list = sourcesFor(params.country);
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
    const order = ["US", "Canada", "UK", "EU", "Japan", "Australia", "UAE", "Classic / Exotic"];
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

  global.SITE_SOURCES = { SOURCES, sourcesFor, buildResults, groupByRegion };
})(window);
