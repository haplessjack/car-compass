# Source URL verification (curl from box, 2026-11-09)

Status legend:
- **verified**: HTTP 200 with working deep-link pattern from this environment
- **bot_blocked**: HTTP 403/406/429 from curl; standard browser URL format still used for deep links
- **tls_fail**: connection/TLS error from this environment; public browser URL still provided
- **fallback**: keyword or homepage pattern used when model-specific path failed

| Source | Region | Curl status | Pattern used |
|--------|--------|-------------|--------------|
| Autotrader | US | verified 200 | `/cars-for-sale/{make}/{model}?startYear=&endYear=` |
| Cars.com | US | bot_blocked 403 | `/shopping/results/?makes[]=&models[]=&year_min=&year_max=` |
| CarGurus | US | mixed (406 on pretty URLs; inventorylisting 200) | keyword inventory listing + year filters |
| eBay Motors | US | bot_blocked 403 | `/sch/Cars-Trucks/6001/i.html?_nkw=` |
| Bring a Trailer | US | verified 200 | `/search/?s=` (resolves to make/model hubs) |
| Cars & Bids | US | verified 200 | `/search?q=` |
| Hemmings | US | bot_blocked 403 | `/classifieds/cars-for-sale/{make}/{model}` |
| ClassicCars.com | US | verified 200 | `/listings/find/{year}-{year}/{make}/{model}` |
| AutoTrader UK | UK | verified 200 | `/car-search?make=&model=&year-from=&year-to=` |
| PistonHeads | UK | verified 200 (params may normalize) | `/buy/search?Category=used-cars&Make=&Model=&YearFrom=&YearTo=` |
| mobile.de | EU | bot_blocked 403 | `suchen.mobile.de/...&q=` keyword search |
| AutoScout24 | EU | verified 200 | `/lst/{make}/{model}?fregfrom=&fregto=` |
| Leboncoin | EU/FR | bot_blocked 403 | `/recherche?category=2&text=` |
| CarSensor | Japan | verified 200 | `/usedcar/` + keyword query when available; make hubs where known |
| Goo-net | Japan | tls_fail / rate-limit on exchange | `goo-net-exchange.com` homepage + search when available |
| BE FORWARD | Japan | verified 200 | `/stocklist/keyword=` |
| Carsales | Australia | bot_blocked 403 | `/cars/{make}/{model}/` |
| AutoTrader.ca | Canada | verified 200 | `/cars/{make}/{model}/` |
| Dubizzle | UAE | verified 200 | `/motors/used-cars/{make}/{model}/` |
| Classic Driver | Classic | bot_blocked 403 | `/en/cars/{make}/{model}` |
| Elferspot | Classic | bot_blocked 403 | `/en/cars/?make=&model=` |
| Collecting Cars | Classic | verified 200 on `/?q=` | `https://collectingcars.com/?q=` |
| DuPont Registry | Classic | verified 200 | `/autos/results/{make}/{model}/any_year` → pretty URL |

NHTSA vPIC: GetAllMakes / GetModelsForMake / DecodeVinValues HTTP 200; `Access-Control-Allow-Origin: *` on GET (browser CORS OK).


# Expansion check (box curl + headless Chrome, 2026-11-10)

Test queries: Toyota Supra and Porsche 911 (plus Toyota Fortuner / Corolla / Camry where a market had no Supra stock). Curl first; bot-blocked sites re-checked in headless Chrome; a few Cloudflare-blocked sites checked with an outside fetch.

| Source | Region | Status | Example (Toyota Supra) |
|---|---|---|---|
| CLASSIC.COM | US | verified | `https://www.classic.com/search?q=Toyota+Supra` |
| AutoTempest | US | verified | `https://www.autotempest.com/results?make=toyota&model=supra&zip=&radius=any` |
| CarMax | US | verified | `https://www.carmax.com/cars/toyota/supra` |
| Carvana | US | verified | `https://www.carvana.com/cars/toyota-supra` |
| TrueCar | US | bot_blocked (Browser link) | `https://www.truecar.com/used-cars-for-sale/listings/toyota/supra/` |
| Edmunds | US | bot_blocked (Browser link) | `https://www.edmunds.com/inventory/srp.html?make=toyota&model=toyota|supra` |
| Copart | US | verified | `https://www.copart.com/lotSearchResults?free=true&query=Toyota%20Supra` |
| Hagerty Marketplace | US | verified | `https://www.hagerty.com/marketplace/search?searchQuery=Toyota%20Supra` |
| PCARMARKET | US | verified | `https://www.pcarmarket.com/search?q=Toyota+Supra` |
| Kijiji | Canada | verified | `https://www.kijiji.ca/b-cars-trucks/canada/toyota-supra/k0c174l0` |
| Mercado Libre México | Latin America | verified | `https://autos.mercadolibre.com.mx/toyota/supra/` |
| Mercado Libre Argentina | Latin America | verified | `https://autos.mercadolibre.com.ar/toyota/supra/` |
| Mercado Libre Chile | Latin America | verified | `https://autos.mercadolibre.cl/toyota/supra/` |
| Mercado Libre Colombia | Latin America | bot_blocked (Browser link) | `https://carros.mercadolibre.com.co/toyota/supra/` |
| Webmotors | Latin America | verified | `https://www.webmotors.com.br/carros/estoque/toyota/supra` |
| OLX Brasil | Latin America | verified | `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios?q=Toyota+Supra` |
| Chileautos | Latin America | search_on_site | `https://www.chileautos.cl/vehiculos/` |
| Car & Classic | UK & Ireland | verified | `https://www.carandclassic.com/search?q=Toyota%20Supra` |
| Gumtree UK | UK & Ireland | verified | `https://www.gumtree.com/search?search_category=cars&q=Toyota+Supra` |
| eBay UK Motors | UK & Ireland | bot_blocked (Browser link) | `https://www.ebay.co.uk/sch/i.html?_sacat=9801&_nkw=Toyota+Supra` |
| DoneDeal | UK & Ireland | verified | `https://www.donedeal.ie/cars/Toyota/Supra` |
| Carzone | UK & Ireland | verified | `https://www.carzone.ie/used-cars/toyota/supra` |
| Classic Trader | Europe | verified | `https://www.classic-trader.com/uk/cars/search?fulltext=Toyota+Supra` |
| AutoScout24 Germany | Europe | verified | `https://www.autoscout24.de/lst/toyota/supra` |
| AutoScout24 Italy | Europe | verified | `https://www.autoscout24.it/lst/toyota/supra` |
| AutoScout24 France | Europe | verified | `https://www.autoscout24.fr/lst/toyota/supra` |
| AutoScout24 Netherlands | Europe | verified | `https://www.autoscout24.nl/lst/toyota/supra` |
| AutoScout24 Belgium | Europe | verified | `https://www.autoscout24.be/nl/lst/toyota/supra` |
| AutoScout24 Spain | Europe | verified | `https://www.autoscout24.es/lst/toyota/supra` |
| AutoScout24 Austria | Europe | verified | `https://www.autoscout24.at/lst/toyota/supra` |
| Kleinanzeigen | Europe | verified | `https://www.kleinanzeigen.de/s-autos/toyota-supra/k0c216` |
| eBay Germany | Europe | bot_blocked (Browser link) | `https://www.ebay.de/sch/i.html?_sacat=9801&_nkw=Toyota+Supra` |
| Marktplaats | Europe | verified | `https://www.marktplaats.nl/q/toyota+supra/` |
| 2dehands | Europe | verified | `https://www.2dehands.be/q/toyota+supra/` |
| La Centrale | Europe | bot_blocked (Browser link) | `https://www.lacentrale.fr/listing?makesModelsCommercialNames=TOYOTA%3ASUPRA` |
| Subito | Europe | verified | `https://www.subito.it/annunci-italia/vendita/auto/?q=Toyota+Supra` |
| coches.net | Europe | verified | `https://www.coches.net/segunda-mano/?KeyWords=Toyota+Supra` |
| Milanuncios | Europe | bot_blocked (Browser link) | `https://www.milanuncios.com/coches-de-segunda-mano/?s=Toyota+Supra` |
| Wallapop | Europe | deeplink | `https://es.wallapop.com/search?category_id=100&keywords=Toyota%20Supra` |
| Standvirtual | Europe | verified | `https://www.standvirtual.com/carros/toyota/supra` |
| willhaben | Europe | verified | `https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse?keyword=Toyota+Supra` |
| Blocket | Europe | verified | `https://www.blocket.se/mobility/search/car?q=Toyota+Supra` |
| FINN.no | Europe | verified | `https://www.finn.no/mobility/search/car?q=Toyota+Supra` |
| Bilbasen | Europe | verified | `https://www.bilbasen.dk/brugt/bil/toyota/supra` |
| Nettiauto | Europe | verified | `https://www.nettiauto.com/toyota/supra` |
| Otomoto | Europe | verified | `https://www.otomoto.pl/osobowe/toyota/supra` |
| Sauto | Europe | verified | `https://www.sauto.cz/inzerce/osobni/toyota/supra` |
| Autovit | Europe | verified | `https://www.autovit.ro/autoturisme/toyota/supra` |
| Car.gr | Europe | search_on_site | `https://www.car.gr/classifieds/cars/` |
| Autohero | Europe | deeplink | `https://www.autohero.com/de/search/?brand=toyota&model=supra` |
| Goo-net (Japan) | Japan | bot_blocked (Browser link) | `https://www.goo-net.com/usedcar/brand-TOYOTA/car-SUPRA/` |
| Yahoo! Auctions Japan | Japan | verified | `https://auctions.yahoo.co.jp/search/search?auccat=26318&p=Toyota+Supra` |
| TCV | Japan | verified | `https://www.tc-v.com/used_car/toyota/supra/` |
| SBT Japan | Japan | verified | `https://www.sbtjapan.com/used-cars/toyota/supra` |
| CAR FROM JAPAN | Japan | verified | `https://carfromjapan.com/cheap-used-toyota-supra-for-sale` |
| Encar | Korea | search_on_site | `https://www.encar.com/fc/fc_carsearchlist.do?carType=for` |
| Che168 (Autohome) | China & Hong Kong | search_on_site | `https://www.che168.com/china/list/` |
| 28car | China & Hong Kong | search_on_site | `https://www.28car.com/` |
| Carousell Singapore | Southeast Asia | verified | `https://www.carousell.sg/search/Toyota%20Supra?categoryId=32` |
| sgCarMart | Southeast Asia | verified | `https://www.sgcarmart.com/used-cars/listing?q=Toyota+Supra` |
| Mudah.my | Southeast Asia | verified | `https://www.mudah.my/malaysia/cars-for-sale?q=Toyota+Supra` |
| Carlist.my | Southeast Asia | verified | `https://www.carlist.my/cars-for-sale/toyota/supra/malaysia` |
| Carsome | Southeast Asia | deeplink | `https://www.carsome.my/buy-car/toyota/supra` |
| One2car | Southeast Asia | bot_blocked (Browser link) | `https://www.one2car.com/en/cars-for-sale/toyota/supra` |
| CarDekho | India | verified | `https://www.cardekho.com/used-toyota-supra+cars+in+india` |
| CarWale | India | verified | `https://www.carwale.com/used/toyota-supra/` |
| OLX India | India | bot_blocked (Browser link) | `https://www.olx.in/cars_c84/q-toyota-supra` |
| Drive Marketplace | Australia & NZ | verified | `https://www.drive.com.au/cars-for-sale/search/all/all/toyota/supra/` |
| Gumtree Australia | Australia & NZ | bot_blocked (Browser link) | `https://www.gumtree.com.au/s-cars-vans-utes/toyota+supra/k0c18320` |
| Autotrader Australia | Australia & NZ | bot_blocked (Browser link) | `https://www.autotrader.com.au/for-sale/toyota/supra` |
| eBay Australia | Australia & NZ | bot_blocked (Browser link) | `https://www.ebay.com.au/sch/i.html?_sacat=29690&_nkw=Toyota+Supra` |
| Shannons Auctions | Australia & NZ | search_on_site | `https://www.shannons.com.au/auctions.html` |
| Trade Me Motors | Australia & NZ | verified | `https://www.trademe.co.nz/a/motors/cars/toyota/supra` |
| YallaMotor | Middle East | verified | `https://uae.yallamotor.com/used-cars/toyota/supra` |
| OpenSooq | Middle East | verified | `https://jo.opensooq.com/en/find?term=Toyota+Supra` |
| Haraj | Middle East | verified | `https://haraj.com.sa/search/Toyota%20Supra/` |
| Cars.co.za | Africa | verified | `https://www.cars.co.za/usedcars/Toyota/Supra/` |
| AutoTrader South Africa | Africa | verified | `https://www.autotrader.co.za/cars-for-sale/toyota/supra` |
| Jiji Nigeria | Africa | verified | `https://jiji.ng/cars/toyota-supra` |
| Jiji Kenya | Africa | bot_blocked (Browser link) | `https://jiji.co.ke/cars/toyota-supra` |
| RM Sotheby’s | Auctions | verified | `https://rmsothebys.com/search#?SearchTerm=Toyota%20Supra` |
| Mecum Auctions | Auctions | verified | `https://www.mecum.com/search/?q=Toyota+Supra` |
| Barrett-Jackson | Auctions | search_on_site | `https://www.barrett-jackson.com/` |
| Gooding Christie’s | Auctions | search_on_site | `https://www.goodingco.com/lots` |
| Broad Arrow Auctions | Auctions | deeplink | `https://www.broadarrowauctions.com/vehicles/results?q%5Bsearch%5D=Toyota+Supra` |
| Bonhams | Auctions | search_on_site | `https://www.bonhams.com/search/` |
| Iconic Auctions (ex-Silverstone Auctions) | Auctions | search_on_site | `https://www.iconicauctions.com/` |
| Artcurial Motorcars | Auctions | verified | `https://www.artcurial.com/en/search?search=Toyota+Supra` |
| Catawiki | Auctions | verified | `https://www.catawiki.com/en/s?q=Toyota+Supra` |
| JamesEdition | Auctions | verified | `https://www.jamesedition.com/cars/toyota/supra/` |

## Forums & communities

Google site-search links are not verified listings; forum domains were checked as reachable (HTTP 200/202, or a bot challenge page).

| Forum | Makes | Status | Example |
|---|---|---|---|
| Reddit r/carsforsale | all | bot_blocked (Browser link) | `https://www.reddit.com/r/carsforsale/search/?q=Toyota%20Supra&restrict_sr=1&sort=new` |
| Facebook Marketplace | all | bot_blocked (Browser link) | `https://www.facebook.com/marketplace/category/vehicles?query=Toyota%20Supra` |
| Craigslist (all cities) | all | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Acraigslist.org+%22for+sale%22+Toyota+Supra` |
| The Garage Journal | all | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Agaragejournal.com+%22for+sale%22+Toyota+Supra` |
| Grassroots Motorsports forum | all | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Agrassrootsmotorsports.com%2Fforum+%22for+sale%22+Toyota+Supra` |
| The H.A.M.B. (Jalopy Journal) | all | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ajalopyjournal.com+%22for+sale%22+Toyota+Supra` |
| PistonHeads forums | all | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Apistonheads.com%2Fgassing+%22for+sale%22+Toyota+Supra` |
| Rennlist Marketplace | porsche | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Arennlist.com+%22for+sale%22+porsche` |
| Pelican Parts forums | porsche, bmw, mercedes-benz | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aforums.pelicanparts.com+%22for+sale%22+porsche` |
| Planet-9 | porsche (boxster|cayman|718) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aplanet-9.com+%22for+sale%22+porsche` |
| PCA Mart | porsche | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Amart.pca.org+%22for+sale%22+porsche` |
| 6SpeedOnline | porsche, ferrari, lamborghini, mclaren, aston-martin, bentley, rolls-royce, maserati | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3A6speedonline.com+%22for+sale%22+porsche` |
| FerrariChat | ferrari | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aferrarichat.com+%22for+sale%22+ferrari` |
| LotusTalk | lotus | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Alotustalk.com+%22for+sale%22+lotus` |
| CorvetteForum | chevrolet (corvette) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Acorvetteforum.com+%22for+sale%22+chevrolet` |
| Camaro6 | chevrolet (camaro) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Acamaro6.com+%22for+sale%22+chevrolet` |
| LS1Tech | chevrolet, pontiac, gmc, cadillac | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Als1tech.com+%22for+sale%22+chevrolet` |
| Bimmerpost | bmw | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Abimmerpost.com+%22for+sale%22+bmw` |
| Bimmerforums | bmw | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Abimmerforums.com+%22for+sale%22+bmw` |
| SupraForums | toyota (supra) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Asupraforums.com+%22for+sale%22+toyota` |
| IH8MUD | toyota, lexus (land-cruiser|4runner|fj|lx|gx) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aforum.ih8mud.com+%22for+sale%22+toyota` |
| Tacoma World | toyota (tacoma|tundra|4runner) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Atacomaworld.com+%22for+sale%22+toyota` |
| Toyota Nation | toyota, scion | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Atoyotanation.com+%22for+sale%22+toyota` |
| FT86Club | toyota, subaru, scion (^(gr-?86|86|brz|fr-s|frs)$) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aft86club.com+%22for+sale%22+toyota` |
| ClubLexus | lexus | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aclublexus.com+%22for+sale%22+lexus` |
| NASIOC | subaru | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aforums.nasioc.com+%22for+sale%22+subaru` |
| Miata.net forum | mazda (miata|mx-5|mx5) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aforum.miata.net+%22for+sale%22+mazda` |
| MiataTurbo.net | mazda (miata|mx-5|mx5) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Amiataturbo.net+%22for+sale%22+mazda` |
| RX7Club | mazda (rx-?7|rx-?8) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Arx7club.com+%22for+sale%22+mazda` |
| S2Ki | honda (s2000) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3As2ki.com+%22for+sale%22+honda` |
| Honda-Tech | honda, acura | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ahonda-tech.com+%22for+sale%22+honda` |
| NSX Prime | acura, honda (nsx) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ansxprime.com+%22for+sale%22+acura` |
| GT-R Life | nissan (gt-?r|skyline) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Agtrlife.com+%22for+sale%22+nissan` |
| My350Z | nissan (350z|370z|^z$|300zx) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Amy350z.com+%22for+sale%22+nissan` |
| NICOclub | nissan, infiniti | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Anicoclub.com+%22for+sale%22+nissan` |
| EvolutionM | mitsubishi | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aevolutionm.net+%22for+sale%22+mitsubishi` |
| VWVortex | volkswagen, audi | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Avwvortex.com+%22for+sale%22+volkswagen` |
| TheSamba classifieds | volkswagen, porsche | verified | `https://www.thesamba.com/vw/classifieds/search.php?type=text&stype=all&keywords=volkswagen` |
| Audizine | audi | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aaudizine.com+%22for+sale%22+audi` |
| AudiWorld | audi | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aaudiworld.com+%22for+sale%22+audi` |
| MBWorld | mercedes-benz | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ambworld.org+%22for+sale%22+mercedes-benz` |
| BenzWorld | mercedes-benz | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Abenzworld.org+%22for+sale%22+mercedes-benz` |
| Mustang6G | ford (mustang) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Amustang6g.com+%22for+sale%22+ford` |
| Bronco6G | ford (bronco) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Abronco6g.com+%22for+sale%22+ford` |
| Ford Truck Enthusiasts | ford (^f-?\d{3}|ranger|bronco|super-duty|excursion|expedition) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aford-trucks.com+%22for+sale%22+ford` |
| JeepForum | jeep | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ajeepforum.com+%22for+sale%22+jeep` |
| JL Wrangler Forums | jeep (wrangler|gladiator) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ajlwranglerforums.com+%22for+sale%22+jeep` |
| Land Rover Forums | land-rover | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Alandroverforums.com+%22for+sale%22+land-rover` |
| Defender Source | land-rover (defender) | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Adefendersource.com+%22for+sale%22+land-rover` |
| Tesla Motors Club | tesla | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Ateslamotorsclub.com+%22for+sale%22+tesla` |
| AlfaBB | alfa-romeo | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aalfabb.com+%22for+sale%22+alfa-romeo` |
| North American Motoring | mini | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Anorthamericanmotoring.com+%22for+sale%22+mini` |
| Turbobricks | volvo | google_site (Forum search via Google) | `https://www.google.com/search?q=site%3Aturbobricks.com+%22for+sale%22+volvo` |

Dropped after testing: AutoScout24 Switzerland (filtered URL format could not be confirmed; Cloudflare), Dubizzle Saudi Arabia (security wall, format unconfirmed), Motors.co.uk (now redirects to Cazoo), ClassicCarsForSale.co.uk search (404), che168 keyword links (not applied; kept as Search on site).

# Precision audit (box headless Chrome + curl, 2026-11-10)

Test searches, each run against every marketplace that builds a filtered link: Porsche 911, Toyota Supra, Ferrari (make only), Porsche 911 2015–2020, Toyota Land Cruiser, Land Rover Defender, Mercedes-Benz (make only). We read the page text of each result to check the listings matched the make, model and year, not just that the page was non-empty. Text dumps and the TSV results are kept outside the repo.

## Root causes found
- **Year ranges were added to the search text** ("2015..2020 Porsche 911"). Sites don't understand this syntax: BaT and BE FORWARD returned 404 or "No results", CarSensor found no match, and Cars & Bids and mobile.de returned unrelated subsets. Search text is now make + model only. Years go into each site's own year filter where one was verified.
- **Bare keyword searches across all categories.** Marktplaats and 2dehands matched lawn mowers for "Ferrari" and 12,917 mixed ads for "Porsche 911". They now use the cars category: `/l/auto-s/{make}/q/{model}/` (589 Porsche 911s, 141 Ferraris).
- **Multi-word names.** Each site spells them its own way, and a wrong form silently drops the filter or errors:
  - Cars.com: `mercedes_benz`, `toyota-land_cruiser`
  - Goo-net Exchange: `LAND_CRUISER`
  - DuPont: `used-land_rover-defender-for-sale`
  - Bilbasen: `land_rover`, `land_cruiser`, `mercedes`
  - AutoTempest: `landrover`, `landcruiser`, `mercedesbenz`
  - TCV: `land%20cruiser`
  - JamesEdition: `land_rover`, `mercedes`
  - SBT: `mercedes`
  - Carzone and Drive AU: `landcruiser`
- **Model pages that map to one generation.** Standvirtual `/porsche/911` showed only "911 Série F" (10 ads). It now uses `/carros/{make}/q-{model}` (303 ads).
- **Make-only pages.** DuPont `/autos/results/ferrari/any/any_year` showed "No cars found". It now uses `/used-{make}-for-sale` (1,826 Ferraris).
- **Strict model lists.** Autotrader UK `model=Defender` returns 0 results because the site splits it into Defender 90/110/130. For that model the link uses `keywords=` instead (4,292 Defenders).

## Year filters verified (link now carries the range)

| Site | Parameter |
|---|---|
| AutoScout24 (all 8 sites) | `fregfrom`/`fregto` |
| AutoTrader.ca | `modelyearfrom`/`modelyearto` (847 → 167) |
| Cars & Bids | `start_year`/`end_year` (32/32 in range) |
| mobile.de | `fr=2015:2020` |
| CarMax | `year=2015-2020` |
| Edmunds | `year=2015-2020` (outside fetch: all listings 2015–2020) |
| Trade Me | `year_min`/`year_max` (19 results, 21/23) |
| Dubizzle | `year__gte`/`year__lte` (98 ads, 50/58) |
| Otomoto, Autovit | `search[filter_float_year:from/to]` |
| Standvirtual | `search[filter_float_first_registration_year:from/to]` (42/42) |
| willhaben | `YEAR_MODEL_FROM`/`YEAR_MODEL_TO` |
| Kleinanzeigen | `+autos.ez_i:2015%2C2020` (65/77) |
| FINN, Blocket | `year_from`/`year_to` (52/56, 54/54) |
| AutoTrader ZA | `year=2015-to-2020` (36/36) |
| Subito | `ys`/`ye` (164 results, 45/52) |
| Mercado Libre MX/AR/CL | path segment `/2015-2020/` (MX 52 autos, 98/99); Colombia uses the same format but blocks automated checks |
| TCV | `fid`/`jid` |
| DoneDeal | `year_from`/`year_to` (33 → 3) |

These were already working: Autotrader US, Cars.com, ClassicCars, Autotrader UK and AutoTempest.

**Tried and rejected** (ignored or broke results):
- Bilbasen `yearfrom` (0 cars)
- Carzone `minYear`
- PistonHeads `yearFrom`
- Hemmings
- Carvana `year`
- CarSensor `YMIN`
- Kijiji `carYear`
- Sauto
- SBT
- Mudah
- Gumtree UK
- JamesEdition
- classic.com (500)

When the user sets years, the other links show "Year range not applied by this link — set it on the site."

## Label changes
- **Broad Arrow → Search on site.** Its search ignored the URL keyword and showed unrelated cars.
- **Elferspot is shown only for Porsche searches**, or when no make is given. It is a Porsche-only site.
- **Edmunds: Browser link → Verified link.** An outside fetch confirmed the make/model/year filters; the box itself gets a 403.

## Legitimate empty results (not bugs)
- DoneDeal: 0 Supras
- OLX Brasil: 0 Supras
- Mercado Libre Chile: Supra
- Autohero: no Porsche 911, Ferrari or Defender
- DuPont: no Land Cruiser or Defender in stock
- Carvana: doesn't sell Ferrari (its page 404s)
- Artcurial: no Supra lots

## Remaining limitations
- **Some sites fall back to the whole make (or the whole country) when a model is out of stock or named differently:**
  - Carvana (Supra, Defender)
  - Carzone (Supra)
  - CarWale (Supra)
  - CarDekho (Supra, and Land Cruiser, which it only knows as "Land Cruiser 300")
  - Cars.co.za (maps Land Cruiser and Defender to a single variant)
  - Bilbasen (lists only Defender 90/110, not "Defender")
- **Wallapop showed "Nada por aquí" for every search from the box**, with or without a location. It stays a Deep link, unconfirmed.
- **Blocked from the box and the outside fetcher:** eBay (4 sites), TrueCar, Carsales, Autotrader AU, Gumtree AU, Leboncoin, La Centrale, Milanuncios, OLX India, One2car, Carsome, Classic Driver, Webmotors, Jiji KE, Mercado Libre CO and Goo-net JP. These keep the standard public URL format.
- **Rate-limited intermittently from the box:** Autotrader US ("page unavailable"), Cars.com, CarMax, mobile.de and Kleinanzeigen. Each was confirmed working in at least one test run.
- **Sauto shows a Seznam consent page first** in a fresh browser. curl confirmed filtered counts (187 Porsche 911s, 3 Supras, 102 Ferraris).
- **Make pages on TCV and Goo-net Exchange** (e.g. Ferrari) are make landing pages listing that make's models and counts.

# Precision pass 2: empty and fallback results (2026-11-10)

## Model kept instead of falling back to the whole make

| Source | Before | Now |
|---|---|---|
| Carvana | `/cars/toyota-supra` redirected to all 6,224 Toyotas. `land-rover-defender` showed every Land Rover (Carvana splits it into Defender 90/110/130). Ferrari gave a 404. | The site's own filter link, `/cars/filters?cvnaid=` (base64url JSON with makes, parentModels and a year min/max). Results: Land Cruiser 15, Defender 97, 911 56, GR Supra 22 (Supra is aliased to Carvana's name), 911 2015–2020 gives 24 cars, all in range. With no stock it shows "0 cars", not the make. |
| Carzone | The `/used-cars/make/model` path redirected to the make when nothing matched (Supra showed 5,063 Toyotas). | `/search?make=&model=&minYear=&maxYear=`. Counts match the path (911: 33), Supra shows "0 results found", and Landcruiser gives 141 ("Land Cruiser" gives 0, so it's aliased). The years filter works: 911 2015–2020 gives 1, matching the site's year facet. |
| Cars.co.za | Model paths are split by variant (Land-Cruiser-79/200/300/Prado, Defender-90/110, GR-Supra), and unknown models fell back to the make. | `/usedcars/?make_model=Make&keyword=model&year=a-b`. Results: Land Cruiser 1,385 (all variants), Defender 390 (90 and 110 only), 911 47, Supra 3 (all GR Supra). 911 2015–2020 gives 22, all in range. |
| Bilbasen | Model paths miss variants: `/porsche/911` = 29 cars, and Defender fell back to all Land Rovers. | `/brugt/bil/{make}?free=model` (the site's own search box). Results: 911 181, Defender 17, Land Cruiser 6, Supra 4. |
| CarDekho | `land-cruiser` redirected to all 60,000 cars in India. | Aliased to `land-cruiser-300` (6 cars; the 200 and Prado pages also exist). There is no keyword URL, because CarDekho's search box opens an AI chat. Models it doesn't list (Supra) still open its general search page. |
| CarWale | Supra redirected to all Toyotas. | No keyword URL exists, and the Supra isn't in CarWale's catalogue, so this is real zero stock. The note now says so. |

## Make-only searches now list cars
- **TCV:** `/used_car/{make}/all/`. The bare make page was a model index.
- **Goo-net Exchange:** `/usedcars/{MAKE}/ALL/`. Checked for Ferrari and Mercedes-Benz.

## Relabelled
- **Autohero → Search on site.** The link now opens only the make (`brand0=`). Its model filter only matches generation names: `models0=golf` gives 0 results while Golf VII cars are listed. Autohero had 1 Porsche in stock, so the earlier 911 zeros were real.
- **Wallapop → Search on site.** It always showed "Nada por aquí" from our box, and outside fetches got a 403. The link still pre-fills the keyword.
- **Browser link → Verified link** for eBay UK, eBay DE, Jiji Kenya, OLX India and One2car. Outside fetches showed filtered Land Cruiser results (272, 7, about 20, 149 and 55).

## Empties checked and confirmed as real zero stock
- DoneDeal: Supra (both the Supra and GR Supra paths return 0)
- Mercado Libre Chile: Supra (`gr-supra` is a 404)
- OLX Brasil: Supra (`q=supra` returns 5 BMWs and no Supra)
- DuPont: Land Cruiser and Defender
- Artcurial: Supra

## Still unverifiable
The box gets 403s or timeouts, as did the outside fetch and reader:
- eBay AU
- TrueCar
- Carsales
- Autotrader AU
- Gumtree AU
- Leboncoin
- La Centrale
- Milanuncios
- Carsome
- Webmotors
- Mercado Libre Colombia
- Goo-net (Japan)

They keep the standard public URL format, and none has been shown to be wrong.

# Nightly stock check (2026-11-12)
`data/stock-hints.json` is written by the stock checker (see the runbook in the monitor workspace). The first full run covered 42 searches and 4,077 links.
It found three builder naming bugs, which are now fixed and rechecked:
- **AutoTrader UK:** G-Class, Civic Type R, Lancer Evolution and WRX used `model=` and showed 0 results. They now use `keywords=` and show 435, 70, 19 and 154 results.
- **Carvana:** MX-5 is now aliased to "MX-5 Miata" (355 cars).
- **AutoTempest:** `mx5` is now aliased to `mx5miata` (211+).
