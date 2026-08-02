# SEO scripts

- `audit.mjs` — health check over the content registry: missing/duplicate/over-
  length titles and descriptions, thin pages, empty alt text. Run it after any
  bulk content change.
- `apply-money-meta.mjs` — re-applies `reference/seo/money-page-meta.json` to
  the 34 commercial pages. Edit the JSON, then run this; do not hand-edit
  `seo.title`/`seo.description` in those page files.

```bash
node scripts/seo/audit.mjs
node scripts/seo/apply-money-meta.mjs
```

The one-off passes that rebuilt the long tail's metadata (sentence-aware
description rebuild, duplicate repair) are not kept here — they were a
migration fix, not a routine. The audit script is what catches a regression.
