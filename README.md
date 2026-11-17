# Little Steps — Life & Money Planner

A browser-based ADHD-friendly planner with monthly, weekly and daily pages, plus detailed money planning.

**[Explore the filled client demo](https://qasim4552.github.io/little-steps-adhd-planner/?example=1#month)**

**[Start your own empty planner](https://qasim4552.github.io/little-steps-adhd-planner/#setup)**

## Features

- Monthly calendar, colour-coded appointments, weekly spreads and daily time blocks
- Three daily priorities, routines, focus timer and reflection notes
- Currency selection with 15 currencies including PKR, USD, GBP, EUR, AED and SAR
- Manual payday selection or automatic selection from scheduled paychecks
- Multiple accounts, savings, transfers and recurring bills
- Income schedules, monthly category limits and dated savings goals
- Debt ledger with principal/interest breakdown and payment reversal
- Milestones, brain dump and a 48-hour purchase pause
- Editable financial details, JSON backups and CSV exports
- Offline app shell, responsive layout and print / Save as PDF support

## Example and privacy

The example uses made-up numbers and plans. Example edits stay in memory and do not overwrite your own planner. Your own planner saves in your browser; there is no bank connection, automatic cloud sync or shared database. Download backups regularly because browsers can clear storage.

This public repository contains only the static app files. It does not contain the developer's financial database, browser backups or credentials. Currency selection changes labels and formatting; it does not perform exchange-rate conversion. APR is used to order debts, not calculate interest automatically. No real financial payments are made.

## Install as an app

- **iOS/iPadOS:** open the HTTPS site in Safari → Share → Add to Home Screen.
- **Windows:** open in Edge or Chrome and choose Install app from the browser menu.
- Load online once before offline use. Browser and OS installation behavior can vary.

## Run locally

No build step or packages are required:

```sh
python -m http.server 8080
```

Open `http://localhost:8080/`. Data saved locally is separate from data saved on the hosted site because the browser origins differ.

## Hosting

GitHub Pages serves the `main` branch from the repository root. `.nojekyll` keeps the static assets unchanged. The client demo is available at the link above after the Pages build succeeds.
