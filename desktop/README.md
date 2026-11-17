# Little Steps Planner — Windows desktop edition

An offline Windows desktop application built from the same planner used in the web demo.

## Personal use

1. Install with `Little-Steps-Planner-Setup-1.0.0-x64.exe`, or run the portable `.exe` without installing.
2. Enter the owner's existing activation code on first launch for that Windows profile.
3. Add your name, currency, payday and opening balance in Setup & details.
4. Use My space → Download backup regularly. Restore a backup to transfer data from the web app or another computer.

Every Windows profile uses its own `%APPDATA%\Little Steps Planner` directory. The installed and portable editions share that directory when used by the same Windows user. The program works offline and does not need Python, a browser window, a server, or an account. There is no automatic device sync. A copied installer contains only app files, never another person's saved planner. Backups are plain JSON files; store them privately.

The activation check is offline and local. It is a basic access check, not a server-backed licensing or per-device entitlement system. An activated profile is remembered across launches. The data folder can be opened from My space.

## Installation notes

This initial release is an unsigned x64 Windows build. Windows may show an unrecognized-publisher / SmartScreen notice. There is no signing certificate in this project. iPhone and iPad cannot run Windows `.exe` files; use the web app there.

The installer is per-user, adds Start menu / optional desktop shortcuts, and does not require administrator elevation. Uninstalling the program does not intentionally delete the planner data folder. Download a backup before uninstalling, changing computers or clearing application data.

## Build

```powershell
npm.cmd ci
node node_modules/electron/install.js
node prepare.cjs
npm.cmd run build:windows
```

`prepare.cjs` copies only static planner assets from the local web project. It excludes personal databases, backups and the plain owner code. The public app stores only a verification hash. A Windows icon must be present at `build/icon.ico`.

Release QA verifies wrong/correct activation, native export, persistence across restarts and isolation between Windows profiles. Tests use separate profile directories and do not ship personal test records in the executable.
