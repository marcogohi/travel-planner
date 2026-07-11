# Seúl 2026 — Dashboard de itinerario

Dashboard de la ruta por Seúl (25–29 jul 2026), pensado para consultarse desde el móvil durante el viaje.

## Stack
- Frontend: HTML/CSS/JS vanilla (sin build step), `index.html` en la raíz.
- Backend: 1 función serverless (`api/checklist.js`) sobre Vercel Functions.
- Persistencia: **Vercel KV** (Redis gestionado, vía Upstash) — el checklist se guarda con una única key compartida (`seul-2026-checklist`), así que se sincroniza entre todos los dispositivos que abran la URL.
- Acceso: protegido con un token compartido en la query string (`?t=...`), validado en `api/checklist.js` antes de leer/escribir en KV. Sin el token correcto, el endpoint responde 401 y el dashboard cae a modo solo lectura.

## Puesta en marcha
```bash
npm install
vercel login
vercel link          # crea/vincula el proyecto en tu cuenta de Vercel
```
Luego, desde el dashboard de Vercel: **Storage → Create Database → KV**, y conéctala al proyecto. Vercel inyecta automáticamente las env vars que necesita `@vercel/kv` (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) — no hace falta tocar nada más.

Configura además la variable de entorno `DASHBOARD_TOKEN` (Project Settings → Environment Variables) con un valor largo y aleatorio, por ejemplo:
```bash
openssl rand -hex 20
```
Comparte el dashboard únicamente con la URL que incluye el token, por ejemplo `https://tu-proyecto.vercel.app/?t=<DASHBOARD_TOKEN>`. Sin `DASHBOARD_TOKEN` configurado, la API deniega todas las peticiones (falla cerrado).

```bash
vercel dev           # probar en local (localhost:3000)
vercel --prod         # desplegar a producción
```
Para probar en local, añade `DASHBOARD_TOKEN=lo-que-sea` a un `.env` (no versionado) y abre `http://localhost:3000/?t=lo-que-sea`.

## Estructura
```
seoul-dashboard/
├─ index.html          # dashboard completo (UI + lógica de tabs/checklist/gráfico/PWA)
├─ manifest.json        # manifest de la PWA
├─ sw.js                 # service worker (cache del app shell, la API nunca se cachea)
├─ icons/
│  ├─ icon-192.png
│  └─ icon-512.png
├─ api/
│  └─ checklist.js      # GET/POST del checklist contra Vercel KV (protegido con token)
├─ package.json
└─ .gitignore
```

## Backlog de funcionalidades (pendiente, para seguir iterando)
- [x] Proteger la URL con un token simple en query string (ahora mismo es pública)
- [x] Selector automático de la pestaña "hoy" según la fecha del dispositivo
- [x] Exportar el itinerario a Google Calendar / archivo .ics (botón "Exportar itinerario" → descarga `.ics`, importable en Google Calendar/Apple Calendar/Outlook vía "Importar")
- [x] Presupuesto estimado por día (KRW/EUR) con acumulado (coste aproximado por bloque, KPI de total y línea por día con acumulado; cambio fijo orientativo 1€≈1.550₩)
- [x] Convertir a PWA instalable (útil para usarlo sin datos/con mala cobertura durante el viaje) — manifest + service worker con cache del app shell (HTML/iconos); el checklist en sí sigue necesitando red, no se cachea. El token se guarda en `localStorage` al abrir el enlace la primera vez, para que la app instalada siga autenticada sin repetir `?t=` cada vez.
- [x] Actualizar el clima real conforme se acerque la fecha (hoy son estimaciones a 2 semanas vista) — a partir de ~16 días antes del viaje, se consulta [Open-Meteo](https://open-meteo.com/) (sin API key) desde el cliente y sustituye la estimación estática por la previsión real, tanto en el KPI general como por día; si falla la petición o el viaje queda fuera de ese horizonte, se mantiene la estimación estática original.

## Notas de contexto (para retomar con Claude Code)
- Hotel base: OYO Hostel Myeongdong 3, Myeongdong → todas las estimaciones de tiempo/metro parten de ahí.
- Colores de los badges de línea de metro son los reales de Seúl (línea 4 = teal, línea 3 = naranja, línea 1 = azul marino, línea 2 = verde, línea 6 = marrón).
- El festival WATERBOMB (24–26 jul) y el Hangang Summer Festival (finales de julio) están anotados como avisos, no como bloqueos del plan.
