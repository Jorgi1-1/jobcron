# PRD — Bot de monitoreo de vacantes

**Autor:** Jorge Luis Tovar Arriaga
**Fecha:** 18 de agosto, 2026
**Estado:** Draft — listo para desarrollo
**Versión:** 1.0

---

## 1. Resumen ejecutivo

Herramienta personal, sin costo de infraestructura, que revisa dos veces al día las páginas de carreras de una lista curada de empresas (fintechs y unicornios LatAm, multinacionales con presencia remota, estudios de gaming, y empresas de herramientas de producto), filtra las vacantes que se alinean con el perfil de Jorge (Frontend / Full-Stack / UX-adyacente, remoto o CDMX/GDL/Monterrey/Puebla), y entrega un digest diario por correo con las vacantes nuevas — sin duplicados.

## 2. Problema

Revisar manualmente 20+ páginas de carreras todos los días no es sostenible. Las vacantes relevantes (Frontend, UI Engineer, Product Engineer, Design Systems) se pierden entre cientos de posiciones no relevantes, y por el tiempo en que Jorge se entera de una vacante nueva, ya hay decenas de aplicaciones.

## 3. Objetivo

Reducir a cero el tiempo de búsqueda manual, y reducir a minutos (en vez de días) el tiempo entre que una vacante relevante se publica y Jorge se entera de ella.

### Métricas de éxito
- El bot corre exitosamente ≥95% de las veces programadas (tolerancia a fallos ocasionales de GitHub Actions o de una fuente específica).
- Cero vacantes duplicadas en el digest a lo largo del tiempo.
- Agregar una empresa nueva sobre una plataforma ya soportada (Greenhouse, Lever, Ashby) toma menos de 15 minutos de trabajo.
- Costo de operación: $0 USD/mes.

## 4. Alcance

### Dentro de alcance (v1)
- Monitoreo de vacantes nuevas en la lista de empresas del Apéndice A.
- Filtro por keywords (título + ubicación).
- Deduplicación persistente entre corridas.
- Digest diario por correo electrónico.
- Ejecución automática y gratuita (sin servidor propio).

### Fuera de alcance (v1) — candidatos a v2
- Scoring de relevancia con LLM (comparar cada vacante contra el CV de Jorge).
- Notificaciones por Telegram/Slack o dashboard web.
- Tracking de status de aplicación (aplicado / en proceso / rechazado).
- Auto-aplicación a vacantes.
- Alertas en tiempo real (v1 es por digest, no push instantáneo).

## 5. Usuario

Un solo usuario: Jorge. No hay multi-tenancy, no hay autenticación de usuarios, no hay UI pública.

---

## 6. Requisitos funcionales

**FR-1 — Fuentes de datos.** El sistema debe poder extraer vacantes de al menos tres tipos de fuente:
  a. APIs públicas de ATS conocidos (Greenhouse, Lever, Ashby) vía JSON.
  b. Scraping HTML ligero (cheerio) para career sites propios que renderizan server-side (ej. Riot Games).
  c. APIs internas no documentadas cuando existan y sean accesibles sin autenticación (ej. Apple).

**FR-2 — Normalización.** Cada fuente debe transformar su formato nativo a un esquema común:
  ```
  { company, title, location, url, postedAt, sourcePlatform, externalId }
  ```

**FR-3 — Filtrado por keywords.** El sistema debe descartar vacantes cuyo título no contenga al menos una keyword técnica relevante (React, Frontend, Next.js, TypeScript, UX, UI, Design Systems, Full Stack, Product Engineer, etc.) o cuya ubicación no matchee con remoto/México/CDMX/Guadalajara/Monterrey/Puebla. Sin filtro de seniority — todas las vacantes que matcheen keywords pasan, sin importar años de experiencia pedidos.

**FR-4 — Deduplicación.** Antes de incluir una vacante en el digest, el sistema debe verificar si su URL ya existe en el almacén persistente. Si existe, se descarta. Si no, se guarda y se incluye.

**FR-5 — Digest por correo.** Una vez al día, si hay vacantes nuevas, el sistema envía un correo a Jorge con la lista (empresa, título, ubicación, link). Si no hay vacantes nuevas ese día, no se envía correo (evitar ruido).

**FR-6 — Configuración extensible.** Agregar una empresa nueva debe requerir solo una entrada de configuración (no código nuevo), salvo que la empresa use una plataforma de scraping no soportada aún.

**FR-7 — Manejo de errores por fuente.** Si una fuente falla (timeout, cambio de HTML, error 4xx/5xx), el resto de las fuentes deben seguir procesándose con normalidad. El error se registra pero no detiene la corrida completa.

---

## 7. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| Costo | $0 USD/mes — sin tarjeta de crédito requerida en ningún servicio |
| Disponibilidad | Best-effort; tolerante a que el cron de GitHub Actions se atrase o falle ocasionalmente |
| Mantenibilidad | Arquitectura por adaptadores — un módulo por tipo de fuente (Greenhouse, Lever, Ashby, scraper genérico) |
| Seguridad | Ninguna credencial (Supabase key, Resend/SMTP key) se commitea al repo; se usan GitHub Secrets |
| Ética/legal | Respetar `robots.txt` en scraping HTML, User-Agent identificable, sin bypass de login, sin redistribución de datos extraídos, volumen de requests bajo (2 corridas/día) |
| Portabilidad | Repositorio público en GitHub (Actions ilimitado y gratis en repos públicos) |

---

## 8. Arquitectura técnica

**Stack:** Node.js + TypeScript, GitHub Actions (scheduler), Supabase Postgres (almacén de dedupe), Resend o Gmail SMTP (envío de correo).

### Flujo de datos
```
GitHub Actions (cron, 2x/día)
        │
        ▼
Orchestrator script (TypeScript)
        │
        ├──► Adaptador Greenhouse ─┐
        ├──► Adaptador Lever      ─┤
        ├──► Adaptador Ashby      ─┼──► Normalizador ──► Filtro por keywords
        └──► Scraper HTML/custom ─┘                            │
                                                                 ▼
                                                    Chequeo de dedupe (Supabase)
                                                                 │
                                                    ¿Es nueva?  ─┼─ No → descartar
                                                                 │
                                                                Sí
                                                                 │
                                                    Guardar en Supabase + agregar al digest
                                                                 │
                                                                 ▼
                                                    ¿Hay vacantes nuevas hoy?
                                                                 │
                                                                Sí
                                                                 │
                                                                 ▼
                                                    Enviar digest (Resend/SMTP) → correo de Jorge
```

### Estructura de carpetas
```
/src
  /sources
    greenhouse.ts
    lever.ts
    ashby.ts
    scraper.ts        (cheerio, fallback genérico)
    riot.ts            (adaptador dedicado, HTML propio)
    apple.ts            (adaptador dedicado, API interna)
  filter.ts
  dedupe.ts             (cliente Supabase)
  notify.ts             (Resend/SMTP)
  index.ts               (orquestador)
/config
  companies.ts
.github/workflows/
  scraper.yml
```

### Configuración de empresa (`companies.ts`)
```ts
type Company = {
  name: string;
  platform: "greenhouse" | "lever" | "ashby" | "custom";
  identifier: string;       // slug del ATS o URL para scraper custom
  status: "verified" | "probable" | "unknown";
  tier: 1 | 2 | 3 | 4 | 5;
};
```

---

## 9. Modelo de datos (Supabase)

```sql
create table seen_jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  source_platform text not null,
  external_id text,
  title text not null,
  location text,
  url text not null unique,
  posted_at timestamptz,
  first_seen_at timestamptz default now(),
  matched_keywords text[]
);

create table digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz default now(),
  jobs_scanned int,
  jobs_new int,
  sources_failed text[],
  email_sent boolean
);
```

`digest_runs` existe para debugging: si un día el digest no llega, Jorge puede revisar esta tabla para saber si el bot corrió, cuántas vacantes escaneó, y qué fuentes fallaron.

---

## 10. Plan de implementación

| Fase | Contenido | Empresas cubiertas |
|---|---|---|
| Fase 0 — Setup | Scaffold del repo, proyecto Supabase, cuenta Resend o SMTP, workflow de GitHub Actions vacío | — |
| Fase 1 — MVP | Adaptadores Greenhouse/Lever/Ashby, filtro, dedupe, digest funcionando end-to-end | Notion, Linear, Figma, Webflow, Bitso, Kavak (alta confianza de plataforma) |
| Fase 2 — Scrapers custom | Adaptadores dedicados para career sites propios | Riot Games, Apple |
| Fase 3 — Cobertura completa | Investigar y agregar el resto del Apéndice A | Clip, Mercado Libre, Rappi, Konfío, Justo, Spotify, Airbnb, Uber, Globant, Scopely, Keywords Studios, Ubisoft, Blizzard/Activision, Nu México, Canva |
| Fase 4 (futuro, fuera de v1) | Scoring con LLM, canal alternativo de notificación, dashboard | — |

---

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Una empresa cambia el HTML de su career site y el scraper se rompe silenciosamente | Try/catch por fuente + columna `sources_failed` en `digest_runs`; revisar semanalmente |
| GitHub Actions desactiva el cron tras 60 días de inactividad en el repo | Recordatorio mensual para hacer un commit o revisar manualmente que el workflow siga activo |
| El endpoint interno de Apple (no documentado) cambia o se bloquea | Bajo volumen de requests (2x/día) minimiza el riesgo; fallback: quitar temporalmente el adaptador sin afectar al resto |
| Plataforma de ATS de una empresa cambia (ej. de Greenhouse a Ashby) | Config-driven — actualizar una línea en `companies.ts` |
| Falsos negativos por filtro de keywords muy estricto | Revisar mensualmente el log de vacantes descartadas y ajustar la lista de keywords |

---

## 12. Preguntas abiertas / pendientes para desarrollo

1. Confirmar plataforma real (Greenhouse/Lever/Ashby/custom) para las empresas marcadas "unknown" en el Apéndice A — se resuelve por empresa, al momento de construir su adaptador.
2. Definir la lista final de keywords técnicas y de ubicación (borrador incluido en FR-3, sujeto a ajuste).
3. Elegir Resend vs Gmail SMTP para el envío de correo (ambos gratis; Resend tiene mejor DX, Gmail SMTP no requiere crear cuenta nueva).

---

## Apéndice A — Empresas objetivo por tier

**Tier 1 — Objetivos originales**
| Empresa | Plataforma | Estado |
|---|---|---|
| Riot Games | Custom (HTML server-rendered) | Verified |
| Apple | Custom (API interna no documentada) | Verified |
| Nu México / Nubank | Custom | Unknown |

**Tier 2 — Fintechs y unicornios LatAm**
| Empresa | Plataforma | Estado |
|---|---|---|
| Bitso | Greenhouse (probable) | Probable |
| Kavak | Greenhouse (probable) | Probable |
| Clip | — | Unknown |
| Mercado Libre | Custom (probable) | Unknown |
| Rappi | Greenhouse (probable) | Probable |
| Konfío | — | Unknown |
| Justo | — | Unknown |

**Tier 3 — Multinacionales con presencia LatAm/remoto**
| Empresa | Plataforma | Estado |
|---|---|---|
| Spotify | Custom (probable) | Unknown |
| Airbnb | Greenhouse histórico / posible custom | Unknown |
| Uber | Custom (probable) | Unknown |
| Globant | Custom (probable) | Unknown |

**Tier 4 — Gaming**
| Empresa | Plataforma | Estado |
|---|---|---|
| Scopely | Greenhouse (probable) | Probable |
| Keywords Studios | Workday/custom (probable) | Unknown |
| Ubisoft | Custom (probable) | Unknown |
| Blizzard/Activision | Workday (probable) | Unknown |

**Tier 5 — Herramientas de producto remote-first**
| Empresa | Plataforma | Estado |
|---|---|---|
| Notion | Ashby | Probable (alta confianza) |
| Linear | Ashby | Probable (alta confianza) |
| Figma | Greenhouse | Probable (alta confianza) |
| Webflow | Greenhouse | Probable (alta confianza) |
| Canva | Greenhouse/custom | Unknown |
