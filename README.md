# Verano 2026 — Dashboard de itinerario (Corea + China)

Dashboard del viaje de verano 2026 (24 jul – 16 ago): Seúl → Gyeongju → Busan → Jeonju → Seúl → Fuzhou → Kunming → Dali → Lijiang → Shangri-La → Chengdu. Pensado para consultarse desde el móvil durante el viaje.

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
- [x] Presupuesto estimado con acumulado — en EUR únicamente (el viaje mezcla KRW y CNY), sumando solo importes con fuente clara (alojamiento por tramo, transporte, entradas ya fechadas). Las entradas de actividades sugeridas sin día asignado en China se muestran con precio de referencia pero no se suman al acumulado. Se ve por día en cada panel (hoy + acumulado); no hay un KPI de total en la cabecera ni gráfico de reparto
- [x] Convertir a PWA instalable — manifest + service worker con cache del app shell; el checklist en sí sigue necesitando red. El token se guarda en `localStorage` al abrir el enlace la primera vez
- [x] Clima real vía [Open-Meteo](https://open-meteo.com/) (sin API key), por tramo/ciudad, activo desde ~16 días antes de cada tramo del viaje
- [x] Pestaña "Antes de salir" — checklist de preparativos (visado, Arrival Card, T-Money, apps de Corea, VPN/mapas offline para China), separada de los días del itinerario
- [x] Tips del día — 1-3 avisos prácticos por día (reservas con antelación, cierres, altitud, mareas de gente por festivales, etc.)
- [x] Recomendaciones de restaurantes por día ("🍜 Dónde comer") — sitios y platos típicos que suelen aparecer en blogs de viaje para la zona de ese día, al final del plan de cada día
- [x] Mini-mapa por día ([Leaflet](https://leafletjs.com/) + tiles oscuros de [CARTO](https://carto.com/), sin API key) con los puntos de esa jornada numerados en orden y una línea de ruta entre ellos. Las coordenadas son aproximadas (de conocimiento general, no geocodificadas/verificadas una por una). El mapa se carga de forma perezosa, solo al abrir la pestaña de ese día
- [x] Más granularidad en los días con más contenido (52 → 62 bloques): actividades compuestas como el Jardín Secreto de Changdeokgung, el cambio de guardia de Gyeongbokgung o las sugerencias sueltas de Kunming/Chengdu ahora son bloques propios, con descripciones mucho más largas (contexto histórico + qué ver dentro de cada parada). Las descripciones largas se colapsan a 3 líneas con un botón "Ver más/Ver menos" que solo aparece cuando el texto realmente se corta
- [x] Contraste con fuentes reales (jul 2026) de restaurantes, precios y datos prácticos añadidos — 4 rondas de verificación por zona. Correcciones encontradas: Seokguram Grotto ya es gratis desde 2023 (ya no cobra 6.000 KRW), "Onion Ikseon" se llama en realidad Onion Anguk, el perímetro del lago Erhai y el precio de las Three Pagodas estaban desactualizados, la altitud de Blue Moon Valley confundía el valle con la cima del teleférico, y la descripción de Chen Mapo Doufu se matizó (el local original no sobrevivió a una riada de 1947, hoy son herederos del nombre)
- [x] Ampliado el día de Gyeongju (29-31 jul): Hwangnidan-gil, Daereungwon Tomb Complex, Cheomseongdae Observatory y el Museo Nacional de Gyeongju como bloques propios con descripción larga, contrastados con fuentes online. Se detectó y corrigió una mezcla de ciudades en la lista original (Gyeonggijeon Shrine y Omokdae están en Jeonju, no en Gyeongju — ya estaban recogidos en el día de Jeonju, no se duplicaron) y una ruta de bus desactualizada (el bus 700 a Bulguksa se eliminó en 2024; ahora se indica bus 10/11 + transbordo bus 12)
- [x] Ampliado Busan (31 jul-2 ago) con un plan por zonas más detallado: Seomyeon (centro comercial subterráneo, Fashion Street, Jeonpo Café Street) el día de llegada; Cheongsapo, Haeundae Blue Line Park (Sky Capsule/Beach Train) y Gwangalli Beach (con su espectáculo de drones de los sábados) el sábado de costa este; BIFF Square, Gukje Market y Yongdusan Park/Busan Tower el domingo de Nampo-dong. Restaurantes nuevos verificados: Songjeong Samdae Gukbap, Matchandeul Wang Sogeum Gui, Geumsubokguk, Haeundae Gaya Milmyeon
- [x] Ampliada la tarde de llegada a Kunming (6 ago) con una ruta a pie norte-sur por el centro histórico: Yuantong Temple, Green Lake Park, Laojie + Mercado de Flores y Pájaros, Nanping St/Zhengyi Rd/Jinma Biji Fang y las pagodas gemelas (Dongsi Ta/Xisi Ta). Se descartó el Stone Forest opcional (no cabía con la ruta nueva) y se aclaró que el mercado de flores viable es el de la calle Jingxing, no el mayorista de Dounan (a 18 km, cerrado por la tarde)
- [x] Reorganizados los 2 días de Dali (7-8 ago) tras contrastar con una guía externa: día 1 ahora incluye Three Pagodas + templo Chongsheng junto a la Ciudad Antigua (precio corregido a 121 CNY, la cifra de 75 CNY de la guía estaba desactualizada); día 2 pasa a ser un día completo en la zona del lago Erhai visitando Xizhou (Sifang Street, Mansión de la Familia Yan) y Shuanglang (villas de Yang Liping), con aviso de que Didi es poco fiable para esos trayectos rurales y conviene un conductor privado o tour compartido
- [x] Ajuste en vivo durante el viaje (9 ago): no dio tiempo a Three Pagodas el día 7, así que se movió al 9 ago por la mañana antes del tren a Lijiang (retrasado de 10:00 a 12:00 — hay salidas cada 1,5-2h, sin problema). Se corrigió también la distancia real Ciudad Antigua↔estación de Dali: está en Xiaguan, a ~19 km y 35-45 min, no al lado como tenía el pin del mapa
- [x] Revisado el equilibrio de los 3 días de Shangri-La (11-13 ago): se resolvió el aviso pendiente sobre Tiger Leaping Gorge — la parada del traslado (día 1) es solo un mirador de 1,5-2h junto a la carretera, el día completo (día 2) es el trekking real desde un punto de entrada distinto (Qiaotou), no se solapan. Se ajustó también la expectativa sobre Napa Lake el día 3: Potatso ya ocupa la mayor parte del día, así que es poco probable que quede tiempo para Napa Lake después, aunque se deja como opción por si acaso

## Notas de la fuente del itinerario
El itinerario se construyó a partir de la hoja de Drive "Verano '26" del usuario, con algunas correcciones aplicadas sobre el orden/asignación original (días de cierre de palacios en Seúl, actividades de Gyeongju/Busan/Jeonju reasignadas a la ciudad correcta) y presupuesto tomado de los importes reales de la hoja (alojamiento por tramo, transporte, entradas con precio anotado). El dashboard ya no anota estas correcciones en la interfaz — se trata como el itinerario definitivo. La fila "Parcial" de alojamiento de la hoja original (546,5€) no cuadraba con la suma de los importes por hotel listados (1.093€, exactamente el doble); se usaron los importes por hotel.

## Notas de contexto (para retomar con Claude Code)
- Hoteles por tramo: OYO Hostel Myeongdong 3 (Seúl, 4 noches) · Gyeongju BonghwangMansion (2 noches) · Gem Stay Seomyeon (Busan, 3 noches) · Jeonju Hanok village Deoksugung (1 noche) · OMG house/Hongdae (Seúl vuelta, 1 noche) · Hotel Capsula Airport (Fuzhou) · City Comfort Inn Express Hotel (Kunming) · Weishi · Air Qieman Xiangmo Homestay (Dali, 2 noches) · Mulanyu Tangsu Hotel (Lijiang, 2 noches) · GUI CHEN QI SHE Homestay (Shangri-La, 3 noches) · Flowers Pleasing Qing Ju Hotel (Chengdu).
- Colores de los badges de línea de metro son los reales de Seúl (línea 4 = teal, línea 3 = naranja, línea 1 = azul marino, línea 2 = verde, línea 6 = marrón). Fuera de Seúl se usan badges genéricos de transporte (KTX, tren de alta velocidad, vuelo).
- El festival WATERBOMB (24–26 jul) se anota como aviso en el día de llegada a Seúl, no como bloqueo del plan.
- Posible exención de visado por estancia <15 días — anotado como aviso en tu hoja ("OJO VISADO"), pendiente de que lo confirmes antes de volar.
- En China, Google Maps y otros servicios de Google pueden no funcionar sin VPN; llevar alternativa offline (Baidu Maps o similar).
