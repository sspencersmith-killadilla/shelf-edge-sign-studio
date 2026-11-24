# Hosting End-Panel Sign Studio yourself

The studio is free software under the MIT License. You can run it on a staff laptop, a library intranet server, or your own cloud account.

## What works without any online service
Designing, saving signs in the browser, CSV/JSON import and export, PNG/PDF export, printing and preflight all run in the web browser. Branch sharing and the AI wording helper need an online backend; without one they simply show as unavailable.

## Option 1 — Run on one computer
Requirements: [Node.js 22+](https://nodejs.org) (or [Bun](https://bun.sh)) and Git.

```sh
git clone <this-repository-url> sign-studio
cd sign-studio
npm install
npm run dev
```
Open http://localhost:8080 (the port is printed in the terminal).

## Option 2 — Production build
```sh
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 8080
```
Staff on your network can then open `http://<server-address>:8080`.

## Option 3 — Docker
```sh
docker build -t sign-studio .
docker run -d -p 8080:8080 --restart unless-stopped sign-studio
```

## Option 4 — Cloudflare Workers
The production build targets Cloudflare Workers. After `npm run build`, deploy with `npx wrangler deploy` from your own Cloudflare account.

## Putting it behind your library's web address
Use any reverse proxy. Example for Caddy:
```
signs.yourlibrary.org {
  reverse_proxy localhost:8080
}
```
Nginx: `location / { proxy_pass http://127.0.0.1:8080; }`.

## Optional: branch sharing and AI wording
These features need a Supabase-compatible backend. Create a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```
Apply the SQL migrations in `supabase/migrations` to your project. The AI helper also needs an AI gateway key set as a server secret (`LOVABLE_API_KEY`). Leave these out to run fully offline-friendly.

## Updating
`git pull`, then `npm install && npm run build` and restart (or rebuild the Docker image). Saved signs live in each browser, so updates do not erase them — still, export JSON backups regularly.
