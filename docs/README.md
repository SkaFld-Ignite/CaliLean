# CaliLean Documentation

```
docs/
├── brand/              # Visual assets + brand book
│   ├── assets/         # logos, favicon, imagery, renders
│   ├── brand-book/     # source HTML + export script + output PDF
│   ├── packaging/      # label color system, box design, render prompts
│   └── archive/        # retired assets (v1 renders, old favicon, wordmark brief)
├── strategy/           # Positioning, voice, launch narrative, product lineup
│   └── archive/        # executed docs (storefront copy swap)
├── compliance/         # Legal posture, C&D playbook, state matrix, GLP naming
├── ops/                # Runbooks, SKUs, pricing, per-state suppression
│   └── archive/        # point-in-time audits
├── deliverables/       # External-facing generated docs
│   └── pitch-deck/     # source HTML + export script + output PDF
├── utils/              # Shared tooling (brand constants, PDF conversion, Drive sync)
└── superpowers/        # Sprint artifacts
    ├── plans/
    └── specs/
```

## Environment

For local development or scripts operating in the `docs` context, the `.env` file should be placed at the root of the `docs` directory (`docs/.env`).

Any Doppler configuration linking to these secrets should be updated to target this `docs/` path.

## Build

```bash
npm run build:brand-book    # → docs/brand/brand-book/CaliLean_Brand_Book.pdf
npm run build:deck          # → docs/deliverables/pitch-deck/CaliLean_Pitch_Deck.pdf
npm run build:all-docs      # build everything
```

## Google Drive Sync

```bash
npm run drive:push:all           # push all mapped outputs
npm run drive:status             # show sync status
npm run drive:check-conflicts    # check for Drive-side changes
```
