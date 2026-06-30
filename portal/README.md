# Demo Portal

React/Vite application for the iNat x INQUIRE demo.

## Run

```bash
npm install
npm run dev
```

Set the backend URL at build time:

```bash
VITE_DEMO_API_URL=http://localhost:8088 npm run dev
```

When `VITE_DEMO_API_URL` is empty, Vite development falls back to
`http://localhost:8088`; production builds use same-origin relative API paths.
Same-origin mode is the intended Docker image path, where FastAPI serves the
compiled portal and API from port `8088`.

## Views

- Director
- PI / Researcher
- RSE / Architecture

The app uses the backend API in live mode only.
The intended demo path is batch 1 ingestion, live search with latency, batch 2
ingestion, and the same search again.
The RSE view also renders operating-model evidence from the backend.

## Client Behavior

- Auth tokens are stored in `sessionStorage`, not persistent browser storage.
- A `401` response clears the local token and returns the user to the password
  gate.
- Network, timeout, and `5xx` responses keep the session intact so the portal can
  recover on the next status poll after the backend or pipeline returns.
- API errors preserve backend `detail` text when available, which makes request
  validation and live-pipeline failures actionable during rehearsal.
