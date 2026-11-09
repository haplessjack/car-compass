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
