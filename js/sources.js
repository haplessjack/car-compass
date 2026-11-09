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
        qs.set("searchRadius", "0");
        qs.set("marketExtension", "include");
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
      verify: "bot_blocked",
      note: "Bot-blocked from server checks; browser deep link uses standard filters",
      build(p) {
        const make = slug(p.make);
        const model = slug(p.model);
        const params = new URLSearchParams();
        params.set("stock_type", "all");
        params.set("maximum_distance", "all");
        params.set("zip", "");
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
      verify: "bot_blocked",
      note: "Pretty entity URLs often blocked to bots; uses inventory listing filters",
      build(p) {
        // Entity IDs vary by model; use year filters + on-site refinement.
        // Pretty /l-Used-Make-Model-dNNN URLs often return 406 to bots.
        const params = new URLSearchParams();
        params.set("sourceContext", "untrackedExternal_false_0");
        params.set("newSearchFromOverviewPage", "true");
        if (p.yearFrom) params.set("startYear", p.yearFrom);
        if (p.yearTo) params.set("endYear", p.yearTo);
        const kw = keyword(p.make, p.model, "", "");
        const hash = kw ? ("#q=" + enc(kw)) : "#resultsPage=1";
        return "https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?" +
          params.toString() + hash;
      }
    },
    {
      id: "ebay-motors",
      name: "eBay Motors",
      region: "US",
      regions: ["us", "worldwide"],
      kinds: ["market", "auction"],
      home: "https://www.ebay.com/motors",
      verify: "bot_blocked",
      note: "Cars & Trucks category search",
      build(p) {
        const nkw = keyword(p.make, p.model, p.yearFrom, p.yearTo) || "car";
        return `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw=${enc(nkw)}&_from=R40`;
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
      verify: "bot_blocked",
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
      note: "UK national classifieds",
      build(p) {
        const params = new URLSearchParams();
        if (p.make) params.set("make", p.make);
        if (p.model) params.set("model", p.model);
        if (p.yearFrom) params.set("year-from", p.yearFrom);
        if (p.yearTo) params.set("year-to", p.yearTo);
        const q = params.toString();
        return q ? "https://www.autotrader.co.uk/car-search?" + q : "https://www.autotrader.co.uk/car-search";
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
      note: "UK enthusiast classifieds; site may normalize query params",
      build(p) {
        const params = new URLSearchParams();
        params.set("Category", "used-cars");
        if (p.make) params.set("Make", p.make);
        if (p.model) params.set("Model", p.model);
        if (p.yearFrom) params.set("YearFrom", p.yearFrom);
        if (p.yearTo) params.set("YearTo", p.yearTo);
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
      verify: "bot_blocked",
      note: "Germany’s largest marketplace; keyword search deep link",
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
      note: "France classifieds (category 2 = vehicles)",
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
      note: "Major Japanese used-car portal",
      build(p) {
        const kw = keyword(p.make, p.model, p.yearFrom, p.yearTo);
        // Keyword endpoint used by the site’s search box
        return kw
          ? "https://www.carsensor.net/usedcar/search.php?STID=CS210610&keyword=" + enc(kw)
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
      verify: "bot_blocked",
      note: "English-facing Goo-net; domestic goo-net.com TLS failed from this environment",
      build(p) {
        const kw = keyword(p.make, p.model, p.yearFrom, p.yearTo);
        return kw
          ? "https://www.goo-net-exchange.com/search/?keyword=" + enc(kw)
          : "https://www.goo-net-exchange.com/";
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
      note: "Japan export stock; keyword stocklist (make IDs are numeric on-site)",
      build(p) {
        const kw = keyword(p.make, p.model, p.yearFrom, p.yearTo);
        return kw
          ? "https://www.beforward.jp/stocklist/keyword=" + enc(kw) + "/"
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
      note: "Australia’s largest car classifieds",
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
      verify: "bot_blocked",
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
      verify: "bot_blocked",
      note: "Porsche-strong classic marketplace; filters work for other makes too",
      build(p) {
        const params = new URLSearchParams();
        if (p.make) params.set("make", p.make);
        if (p.model) params.set("model", p.model);
        const q = params.toString();
        return q ? "https://www.elferspot.com/en/cars/?" + q : "https://www.elferspot.com/en/cars/";
      }
    },
    {
      id: "collectingcars",
      name: "Collecting Cars",
      region: "Classic / Exotic",
      regions: ["worldwide", "uk", "us", "eu"],
      kinds: ["auction", "classic"],
      home: "https://collectingcars.com/",
      verify: "verified",
      note: "Online collector auctions; site search via ?q=",
      build(p) {
        const s = keyword(p.make, p.model, p.yearFrom, p.yearTo);
        return s ? `https://collectingcars.com/?q=${enc(s)}` : "https://collectingcars.com/auctions";
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
