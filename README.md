# interview-question-03 Approval App

Go + Gin + SQLite backend, Angular 22 frontend. Full spec: `../qwer.md`

## Install

| Tool | Version | Command |
| --- | --- | --- |
| Go | 1.26.4+ | `winget install GoLang.Go` |
| air | latest | `go install github.com/air-verse/air@latest` |
| Node.js | v24.15.0+ (or v22.22.3+ / v26+) | `winget install OpenJS.NodeJS.LTS` |

No separate SQLite install (pure-Go driver). No global Angular CLI needed.

## Run

One-time:
```bash
cd approval-app/frontend
npm install
```

Then two terminals:
```bash
cd approval-app/backend && air         # http://localhost:8080
```
```bash
cd approval-app/frontend && npm start  # http://localhost:4200
```
