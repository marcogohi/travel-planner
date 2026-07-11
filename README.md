# Verano 2026 — Dashboard de itinerario (Corea + China)

Dashboard del viaje de verano 2026 (24 jul – 16 ago): Seúl → Gyeongju → Busan → Jeonju → Seúl → Fuzhou → Kunming → Dali → Lijiang → Shangri-La → Chengdu. Pensado para consultarse desde el móvil durante el viaje.

Contrastado con la hoja de Drive **"Verano '26"** (última revisión consultada: 07/07/2026) — ver "Hallazgos al contrastar con Drive" más abajo.

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

## Backlog de funcionalidades
- [x] Proteger la URL con un token simple en query string
- [x] Selector automático de la pestaña "hoy" según la fecha del dispositivo (si es antes del 24-07, abre directamente la pestaña "Antes de salir")
- [x] Exportar el itinerario a Google Calendar / archivo .ics (botón "Exportar itinerario" → descarga `.ics` con las 24 fechas reales, zonas horarias correctas por tramo — España/Corea/China —, importable en Google Calendar/Apple Calendar/Outlook vía "Importar")
- [x] Presupuesto estimado con acumulado — en EUR únicamente (el viaje mezcla KRW y CNY), sumando solo importes con fuente clara en tu hoja (alojamiento por tramo, transporte, entradas ya fechadas). Las entradas de actividades sugeridas sin día asignado en China se muestran con precio de referencia pero no se suman al acumulado. KPI en la cabecera; ya no hay gráfico de reparto (se quitó para dejar sitio a los tips del día)
- [x] Convertir a PWA instalable — manifest + service worker con cache del app shell; el checklist en sí sigue necesitando red. El token se guarda en `localStorage` al abrir el enlace la primera vez
- [x] Clima real vía [Open-Meteo](https://open-meteo.com/) (sin API key), por tramo/ciudad, activo desde ~16 días antes de cada tramo del viaje
- [x] Pestaña "Antes de salir" — checklist de preparativos (visado, Arrival Card, T-Money, apps de Corea, VPN/mapas offline para China), separada de los días del itinerario, con la sección "A tener en cuenta" de tu hoja
- [x] Tips del día — 1-3 avisos prácticos por día (reservas con antelación, cierres, altitud, mareas de gente por festivales, etc.), en el hueco donde antes estaba el gráfico de presupuesto

## Hallazgos al contrastar con tu hoja de Drive "Verano '26"
El dashboard original solo cubría Seúl (25–29 jul) como si fuera todo el viaje. Al contrastarlo con tu hoja se detectaron y corrigieron:

1. **El viaje no termina el 29 de julio.** Ese día es un tren Seúl→Gyeongju, no una salida. El dashboard ahora cubre las 24 fechas reales (24 jul–16 ago): Seúl → Gyeongju → Busan → Jeonju → Seúl → Fuzhou → Kunming → Dali → Lijiang → Shangri-La → Chengdu.
2. **Changdeokgung estaba agendado en lunes**, día en que cierra. Se ha intercambiado con Gyeongbokgung (que cierra los martes): ahora Changdeokgung va el domingo 26-07 y Gyeongbokgung el lunes 27-07. Señalado con aviso en ambos días del dashboard.
3. **Actividades de Gyeongju/Busan/Jeonju desplazadas de ciudad** en tu hoja (aparente error de una fila al pegar el itinerario, confirmado contra tu propia sección "Tickets y entradas"):
   - Gyeonggijeon Shrine / Omokdae (reales de **Jeonju**) estaban en el día de Gyeongju → movidos al 03-08 (Jeonju).
   - Bulguksa / Seokguram / Anapji (reales de **Gyeongju**) estaban en el primer día de Busan → movidos al 30-07 (Gyeongju).
   - Haedong Yonggungsa / Haeundae Beach y Taejongdae / Geoje Island (reales de **Busan**) estaban repartidas en los días de Jeonju y de vuelta a Seúl → movidas a los días de Busan (01-08 y 02-08).
4. **Presupuesto real de tu hoja**, no inventado: alojamiento por tramo, transporte (vuelos/trenes) y entradas con precio ya anotado, todo en EUR. Nota: la fila "Parcial" de alojamiento de tu hoja (546,5€) no cuadra con la suma de los importes por hotel que lista (1.093€ — exactamente el doble); se han usado los importes por hotel (más granulares) y merece la pena que revises esa celda en tu hoja.
5. **Kunming, Dali, Lijiang y Shangri-La** no tienen actividades por día en tu hoja (columna en blanco), solo una lista de sitios en "Tickets y entradas" sin fecha asignada. El dashboard las muestra como sugerencias sin horario ni coste confirmado (marcadas explícitamente en cada día), en vez de inventar un reparto día a día.
6. Falta el coste de alojamiento de la noche en Fuzhou (hotel cápsula del aeropuerto) en tu hoja — no se ha inventado un importe.

## Notas de contexto (para retomar con Claude Code)
- Hoteles por tramo: OYO Hostel Myeongdong 3 (Seúl, 4 noches) · Gyeongju BonghwangMansion (2 noches) · Gem Stay Seomyeon (Busan, 3 noches) · Jeonju Hanok village Deoksugung (1 noche) · OMG house/Hongdae (Seúl vuelta, 1 noche) · Hotel Capsula Airport (Fuzhou) · City Comfort Inn Express Hotel (Kunming) · Weishi · Air Qieman Xiangmo Homestay (Dali, 2 noches) · Mulanyu Tangsu Hotel (Lijiang, 2 noches) · GUI CHEN QI SHE Homestay (Shangri-La, 3 noches) · Flowers Pleasing Qing Ju Hotel (Chengdu).
- Colores de los badges de línea de metro son los reales de Seúl (línea 4 = teal, línea 3 = naranja, línea 1 = azul marino, línea 2 = verde, línea 6 = marrón). Fuera de Seúl se usan badges genéricos de transporte (KTX, tren de alta velocidad, vuelo).
- El festival WATERBOMB (24–26 jul) se anota como aviso en el día de llegada a Seúl, no como bloqueo del plan.
- Posible exención de visado por estancia <15 días — anotado como aviso en tu hoja ("OJO VISADO"), pendiente de que lo confirmes antes de volar.
- En China, Google Maps y otros servicios de Google pueden no funcionar sin VPN; llevar alternativa offline (Baidu Maps o similar).
