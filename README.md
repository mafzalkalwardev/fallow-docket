# Fallow Docket

Fallow Docket is a desk for older motor-carrier records. It reads the public FMCSA files that sit behind [MOTUS](https://motus.dot.gov), the U.S. Department of Transportation registration system. It does not log in, and it does not crawl that site.

“Old MCs” here means docket numbers from the retired Licensing & Insurance file, [Carrier – All With History](https://data.transportation.gov/d/6eyk-hxee). Those are the pre-MOTUS numbers (`MC-143`), frozen on 14 May 2026. Each row is joined to the daily [Company Census File](https://data.transportation.gov/d/az4n-8mr2) on the USDOT number. The census is the public file that carries email, the company officer, power units, and driver counts.

A row can include:

- Legal name and DBA
- MC number and USDOT
- Authority status (common, contract, broker) and carrier kind
- Phone, fax, and email
- Company officer
- Power units, truck units, and the mix of tractors, straight trucks, and trailers (owned, term leased, trip leased)
- Driver counts, including CDL, interstate, and intrastate
- Cargo, operation class, and the insurance flags on the legacy file
- A link to the public MOTUS company page

FMCSA publishes fleet counts, not unit numbers or VINs. Driver names are not in these files.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:4317.

Inactive property carriers in Texas are filled in. Pick a state or a status, then run the search. Click a row for the full record. Export CSV downloads the open search.

One search keeps 250 rows by default and will not keep more than 2,000. A state or an authority status is required. Results stay in a local SQLite file, `data/fallow.db`, which git ignores.

## Optional token

The DOT open-data API works without a key. A Socrata app token raises the rate limit. Copy `.env.example` to `.env.local` and set `SOCRATA_APP_TOKEN`. Do not commit the token.

## What this is not

The rows are a public snapshot. They are not a legal authority check, and Fallow Docket is not affiliated with the U.S. Department of Transportation. Confirm a carrier on the public MOTUS page before you rely on a row.
