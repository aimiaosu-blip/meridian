# City data

City names, coordinates, country codes, first-level administrative divisions,
population and IANA time-zone identifiers are derived from **GeoNames**.

- Provider: [GeoNames](https://www.geonames.org/)
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Source files: [cities15000.zip](https://download.geonames.org/export/dump/cities15000.zip),
  [countryInfo.txt](https://download.geonames.org/export/dump/countryInfo.txt),
  [admin1CodesASCII.txt](https://download.geonames.org/export/dump/admin1CodesASCII.txt)
- Schema and coverage: [GeoNames export README](https://download.geonames.org/export/dump/readme.txt)
- Retrieved: 15 November 2026. Latest record modification in the city source: 14 November 2026.

The source contains places with more than 15,000 inhabitants or capitals. It
also includes some urban districts and smaller administrative places. It is
not a directory of every town, neighborhood or address. GeoNames supplies its
data without a warranty of completeness or accuracy.

## Meridian adaptation

`cities-extra.js` exports a compact object containing:

- `countries`: country or territory code → English name.
- `admins`: `countryCode.admin1Code` → first-level administrative area name.
- `cities`: rows in the following order:
  `[geonameId, name, countryCode, admin1Code, latitude, longitude, timezone, population, aliases]`.

The adaptation retains 34,194 places across 244 country or territory codes and
356 IANA time-zone identifiers. From 34,216 source records, it omits 9 abandoned
places (`PPLQ`), 8 historical places (`PPLH`) and 5 destroyed places (`PPLW`).
Coordinates retain up to five decimal places. GeoNames identifiers remain
unchanged and unique. Names and time-zone identifiers are copied from the
source, not inferred from country boundaries or longitude. Only administrative
names used by retained records are included; 25 administrative codes have no
matching name in the source index.

Each place retains up to 12 alternate names, prioritizing the ASCII form and
different writing systems before other available aliases. These aliases are
for search; they do not imply that each place has a complete, language-tagged
translation set. Records are sorted by country code and descending population.
Meridian's separately curated common-city list is retained by the application.

## Source checksums (SHA-256)

```text
cities15000.zip
ce7a405587d6d68ee7ed78743770b42d663e0ef1971e6193a6c14e54f1af207e

countryInfo.txt
79f8f59ea01cbb40438bf1856dd6c2ff201f03f8fc72d0530b2646aaf603ef04

admin1CodesASCII.txt
2e4867f5397acb056ea26377601b57af37cb4c81399770225018e9e439e91ad3
```
