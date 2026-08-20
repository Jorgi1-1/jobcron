# JobCron

Bot personal que revisa a diario (9:00 am y 4:00 pm CDMX) las páginas de carreras de una lista de empresas, filtra vacantes relevantes (Desarrollo/Frontend/Full-Stack/UX, remoto o CDMX/GDL/MTY/Puebla) y envía un digest diario por correo — sin duplicados y sin costo de infraestructura. Ver [PRD](./PRD-bot-vacantes.md) si lo copias al repo.

## Setup

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Supabase** (gratis, sin tarjeta)
   - Crea un proyecto en https://supabase.com.
   - En el SQL editor, corre [`supabase/schema.sql`](./supabase/schema.sql).
   - Copia `Project URL` y una `service_role` key (Settings → API).

3. **Correo** — elige uno:
   - **Resend** (recomendado, mejor DX): crea cuenta en https://resend.com, genera un API key. Para enviar desde tu propio dominio necesitas verificarlo; si no, usa el remitente de pruebas `onboarding@resend.dev`.
   - **Gmail SMTP**: activa verificación en 2 pasos en tu cuenta de Gmail y genera un [App Password](https://myaccount.google.com/apppasswords).

4. **Variables de entorno** — copia `.env.example` a `.env` y llena los valores para correr localmente:
   ```bash
   cp .env.example .env
   ```

5. **Probar localmente**
   ```bash
   npm run start
   ```

6. **GitHub Actions** — en el repo (público, para Actions gratis ilimitado):
   - Settings → Secrets and variables → Actions → agrega cada variable de `.env.example` como Secret.
   - El workflow [`scraper.yml`](./.github/workflows/scraper.yml) ya corre a diario a las 9:00 am y 4:00 pm CDMX vía cron y también se puede disparar manualmente (`workflow_dispatch`).

## Agregar una empresa nueva

Si usa Greenhouse, Lever o Ashby: agrega una línea en [`config/companies.ts`](./config/companies.ts) con el slug correcto — no requiere código nuevo (FR-6).

Para encontrar el slug:
- Greenhouse: la URL del board público suele ser `job-boards.greenhouse.io/<slug>`.
- Lever: `jobs.lever.co/<slug>`.
- Ashby: `jobs.ashbyhq.com/<slug>`.

Si la empresa usa un career site propio ("custom"), hay que construir un adaptador dedicado en `src/sources/` usando el helper [`scrapeJobs`](./src/sources/scraper.ts) (respeta `robots.txt` automáticamente) y registrarlo en `src/index.ts`.

## Ajustar el filtro

Edita [`config/keywords.ts`](./config/keywords.ts) — `titleKeywords` y `locationKeywords`. Una vacante pasa el filtro solo si matchea al menos una keyword de cada lista (FR-3).

## Debugging

Si un día no llega el digest, revisa la tabla `digest_runs` en Supabase: cuántas vacantes escaneó esa corrida, cuántas eran nuevas, y qué fuentes fallaron.

## Alcance v1

No incluye: scoring con LLM, notificaciones por Telegram/Slack, tracking de status de aplicación, auto-aplicación, ni alertas en tiempo real. Ver sección 4 del PRD.
