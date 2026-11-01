# wenkaishui-plants-fe

"Thirsty Plants": helps decide when to water my plants. An interactive, user-editable dashboard over the Zigbee soil-sensor readings (no hardcoded charts).
Frontend only for now (no `-be` repo yet). Live at https://thirstyplants.kaishui.dev; linked from the hub (`wenkaishui-frontend`, slot 2, shown as "soon").

## Data
- Supabase project `supabase-zephyra` (ref `kjqhxfaydkimiccltnqg`), table `public.sensor_readings`. Never use the movies project here.
- Columns: `id`, `recorded_at` (timestamptz, UTC), `sensor_id`, `soil_moisture`, `humidity`, `temperature`, `battery`, `dry` (bool), `linkquality`.
- Rows are written by Zigbee2MQTT, not by this repo. This repo only reads.
- Readings arrive in near-duplicate pairs (~1s apart), roughly hourly. Early rows use the raw Zigbee address `0xa4c13867d87f46d8` as `sensor_id`; later ones use `pothos-msensor-1` (likely the same device, renamed).
- No plant column in `sensor_readings`: the `sensor_id` -> plant name mapping lives in `public.sensor_plants` (`sensor_id` PK, `plant_name`; seeded with `pothos-msensor-1` and `0xa4c13867d87f46d8` -> "Pothos"). The page joins it client-side into a `plant` column and falls back to `sensor_id` for unmapped sensors.
- RLS is enabled. The frontend uses the anon key; read-only `select` policies for `anon` exist on `sensor_readings` and `sensor_plants`.
- These were applied by hand in the Supabase SQL editor; there are no migration files in this repo (deliberately removed).
- Decided to stay on the raw table (no cleaned/thinned view): Perspective can bucket and aggregate time in the viewer, and the data is small. PostgREST returns max 1000 rows per request, so `index.astro` pages through with `.range()`.

## Stack
Astro 5, Tailwind 4, supabase-js, Netlify (same as `wenkaishui-movie-fe`, which was the template).
- `package-lock.json` was copied from movie-fe on purpose: fresh installs pull newer Vite versions that break `astro check` (type mismatch with Astro's Vite). Keep `@tailwindcss/vite` / `tailwindcss` on 4.1.x.
- Timestamps are stored in UTC and displayed in the browser's time zone (a deliberate choice, not `Asia/Taipei`).

## Dashboard (FINOS Perspective)
- Single page `src/pages/index.astro`: a client-side script loads all rows via supabase-js into a Perspective table (`sensor_readings`, indexed by `id`) and mounts `<perspective-viewer>` (theme `Pro Dark`). Views are edited in the viewer UI.
- Packages: `@perspective-dev/{client,server,viewer,viewer-datagrid,viewer-charts}` (all 5.6.x). WASM files are imported with `?url` and passed to `init_server` / `init_client`; `astro.config.ts` sets `vite.build.target = 'esnext'` (top-level await). Use `viewer.load(worker)` + `restore({table})`, not the deprecated `load(table)`.
- Default view (`defaultLayout`): Y Line, group by `recorded_at`, split by `plant`, average `soil_moisture`.
- Layouts: `viewer.save()` JSON is stored in `localStorage` key `plants-fe:layout` (single slot, per browser and domain). Buttons: Save layout / Load layout / Reset (clears it). The JSON records the Perspective version, so upgrades may invalidate old layouts.
- Header bar: "Thirsty Plants", "N readings in total, last reading at <browser-local date/time>", and the three buttons; dark green on pale green, compact, wraps to two rows at <=600px.
- If no env vars are set, the page shows generated sample data (useful for UI work without Supabase).
- Grafana was ruled out: Grafana Cloud free can't embed, and embeds are view-only.
- Bundle: ~209 kB gzip JS plus ~4.2 MB of WASM (Netlify serves it uncompressed).

## Deploy
- Netlify site `wenkaishui-plants-fe` (team Wenkaishui Labs, id `00cfc049-5579-4392-808f-070b32788f57`), custom domain `thirstyplants.kaishui.dev` (CNAME to `wenkaishui-plants-fe.netlify.app`).
- Linked to GitHub `fidelinside104/wenkaishui-plants-fe`, branch `main`: every push to `main` deploys to production. Env vars `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set in Netlify (they are inlined at build time).
- Manual deploy: `netlify deploy --build --prod` from this folder.
- Leftover from the movie-fe template: `netlify.toml` still has `required-extensions = ["supabase"]`; unused here.
- The free-plan "Powered by Netlify" badge is injected by Netlify and is switched off in the dashboard (Project configuration > General), not in code.

## Commands
- `npm run dev`, `npm run build` (runs `astro check` first). Other local dev servers may hold port 4321; pass `-- --port 4322`. A browser tab that cached another project's page on the same `localhost` port can cause confusing 404s: hard-reload.

## Open decisions
- Public vs. protected site (the anon read policy makes the data public).
- Possible next steps: named layouts, export/import of layout JSON, shareable layout links.

## Rules
- Never read, print, or commit `.env` files or secret keys. Only the anon key belongs in this frontend; never a service/secret key.
- Env vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (zephyra project values; see `.env-example`).
- Ask before anything that writes to Supabase (policies, schema) or pushes to a remote. I can't write to the zephyra DB (read-only MCP): give the SQL to run in the SQL editor.
- Match the surrounding code's style; don't add dependencies without asking.
