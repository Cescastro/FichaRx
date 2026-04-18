# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A UX-validation prototype for **FO-SF-20**, a clinical medication reference guide used in a healthcare setting. The goal is to prove the search + unified drug card experience before building a full backend. There is no build system, no package manager, no framework — everything is vanilla HTML/CSS/JS.

## Running locally

```bash
# PWA version (recommended for demo — enables install + offline)
python -m http.server 8080
# then open http://localhost:8080 in Chrome/Edge

# Standalone version (no server needed)
# Just open prototipo_standalone.html directly in a browser
```

## Architecture

Two parallel deliverables that share the same data and UI logic:

| File | Purpose |
| --- | --- |
| `prototipo_standalone.html` | Self-contained single file — data embedded, no external deps |
| `index.html` | PWA entry point — loads `dataset_final.json` at runtime |
| `dataset_final.json` | 847 medications consolidated from 7 sheets of the Excel FO-SF-20 v8.1 |
| `sw.js` | Service Worker — caches all assets for offline use |
| `manifest.webmanifest` | PWA manifest (name, icons, theme color) |

The search implements accent/case-tolerant fuzzy matching. Drug cards display all data from multiple Excel source sheets in a single unified view. High-risk medications (`alto_riesgo: true`) render a prominent banner at the top of the card.

## Data shape

`dataset_final.json` aggregates: estabilidad (347 drugs), administración oral (292), multidosis (268), alto riesgo (57). When editing drug data, changes must be reflected in **both** `dataset_final.json` and the embedded data inside `prototipo_standalone.html`.

## What's intentionally out of scope

This prototype has no backend, auth, ETL, or database. Those are deferred to the MVP phase. Do not add server-side dependencies or build tooling unless explicitly requested.
