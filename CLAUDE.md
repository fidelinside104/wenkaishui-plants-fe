# wenkaishui-plants-fe

Plants dashboard: helps decide when to water my plants. An interactive, user-editable dashboard over the Zigbee soil-sensor readings (no hardcoded charts).
Frontend only for now (no `-be` repo yet). Linked from the hub (`wenkaishui-frontend`) via its own button, not added yet.

## Data
- Supabase project `supabase-zephyra` (ref `kjqhxfaydkimiccltnqg`), table `public.sensor_readings`. Never use the movies project here.
- Columns: `id`, `recorded_at` (timestamptz, UTC), `sensor_id`, `soil_moisture`, `humidity`, `temperature`, `battery`, `dry` (bool), `linkquality`.
- Rows are written by Zigbee2MQTT, not by this repo. This repo only reads.
- Readings arrive in near-duplicate pairs (~1s apart), roughly hourly. Early rows use the raw Zigbee address `0xa4c13867d87f46d8` as `sensor_id`; later ones use `pothos-msensor-1` (likely the same device, renamed).
- No plant column in `sensor_readings`: the `sensor_id` -> plant name mapping lives in `public.sensor_plants` (`sensor_id` PK, `plant_name`; seeded with `pothos-msensor-1` and `0xa4c13867d87f46d8` -> "Pothos"). The page joins it client-side into a `plant` column and falls back to `sensor_id` for unmapped sensors.
- RLS is enabled. The frontend uses the anon key; read-only `select` policies for `anon` exist on `sensor_readings` and `sensor_plants`.
- These were applied by hand in the Supabase SQL editor; there are no migration files in this repo (deliberately removed).

## Stack
Astro 5, Tailwind 4, supabase-js, Netlify (same as `wenkaishui-movie-fe`; use it as the template). Dashboard/visualization tool: see "Open decisions".
Timestamps are stored in UTC; display in `Asia/Taipei`.

## Commands
- `npm run dev`, `npm run build` (runs `astro check` first).

## Dashboard approach
Decided: FINOS Perspective (`<perspective-viewer>`, in-browser WASM pivot/filter/chart UI) fed by supabase-js, so views are edited on the fly without hardcoded charts. Grafana was ruled out: Grafana Cloud free can't embed, and embeds are view-only.
Status: spike (check WASM loads in Astro dev + Netlify build, save/restore of layouts, bundle size).

## Open decisions
- Public vs. protected site (anon read policy makes the data public).

## Rules
- Never read, print, or commit `.env` files or secret keys. Only the anon key belongs in this frontend; never a service/secret key.
- Env vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (zephyra project values; see `.env-example`).
- Ask before anything that writes to Supabase (policies, schema) or pushes to a remote. I can't write to the zephyra DB (read-only MCP): give the SQL to run in the SQL editor.
- Match the surrounding code's style; don't add dependencies without asking.
