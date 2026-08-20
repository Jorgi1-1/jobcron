import type { Company } from "../src/types.js";

/**
 * Agregar una empresa nueva sobre Greenhouse/Lever/Ashby: solo agrega una
 * entrada aquí con el slug correcto (FR-6). Para plataformas "custom" se
 * necesita además un adaptador dedicado en src/sources/.
 *
 * `identifier`:
 *  - greenhouse: slug del board (ej. en boards-api.greenhouse.io/v1/boards/<slug>/jobs)
 *  - lever: slug de la compañía (ej. en api.lever.co/v0/postings/<slug>)
 *  - ashby: slug del job board (ej. en jobs.ashbyhq.com/<slug>)
 *  - smartrecruiters: "company identifier" (ej. en careers.smartrecruiters.com/<identifier>)
 *  - workday: "<tenant>.<host>:<site>" tomado de https://<tenant>.<host>.myworkdayjobs.com/<site>
 *  - custom: no usado por el orquestador genérico; el adaptador dedicado sabe qué hacer
 */
export const companies: Company[] = [
  // Fase 1 — MVP (alta confianza de plataforma)
  { name: "Notion", platform: "ashby", identifier: "notion", status: "probable", tier: 5 },
  { name: "Linear", platform: "ashby", identifier: "linear", status: "probable", tier: 5 },
  { name: "Figma", platform: "greenhouse", identifier: "figma", status: "probable", tier: 5 },
  { name: "Webflow", platform: "greenhouse", identifier: "webflow", status: "probable", tier: 5 },
  { name: "Bitso", platform: "greenhouse", identifier: "bitso", status: "verified", tier: 2 },
  { name: "Scopely", platform: "greenhouse", identifier: "scopely", status: "verified", tier: 4 },

  // Agregadas — verificadas contra la API pública antes de agregarse (HTTP 200)
  { name: "Stripe", platform: "greenhouse", identifier: "stripe", status: "verified", tier: 3 },
  { name: "Cloudflare", platform: "greenhouse", identifier: "cloudflare", status: "verified", tier: 3 },
  { name: "Reddit", platform: "greenhouse", identifier: "reddit", status: "verified", tier: 3 },
  { name: "Vercel", platform: "ashby", identifier: "vercel", status: "verified", tier: 5 },
  { name: "GitLab", platform: "greenhouse", identifier: "gitlab", status: "verified", tier: 3 },
  { name: "Deel", platform: "ashby", identifier: "deel", status: "verified", tier: 3 },

  // Nu / Nubank — NO usa un career site custom como asumía el PRD: tiene un
  // board público en Ashby (verificado: 112 vacantes activas, varias en CDMX).
  { name: "Nu", platform: "ashby", identifier: "nubank", status: "verified", tier: 1 },

  // Fase 2 — adaptadores dedicados en src/sources/*.ts (invocados por nombre
  // desde src/index.ts; `identifier` no se usa para estas entradas)
  { name: "Riot Games", platform: "custom", identifier: "riot", status: "verified", tier: 1 },
  { name: "Apple", platform: "custom", identifier: "apple", status: "verified", tier: 1 },
  { name: "Netflix", platform: "custom", identifier: "netflix", status: "verified", tier: 3 },
  { name: "Shopify", platform: "custom", identifier: "shopify", status: "verified", tier: 3 },
  { name: "Miro", platform: "custom", identifier: "miro", status: "verified", tier: 5 },

  // Multinacionales / gaming — verificadas contra su ATS público
  { name: "Spotify", platform: "lever", identifier: "spotify", status: "verified", tier: 3 },
  { name: "Airbnb", platform: "greenhouse", identifier: "airbnb", status: "verified", tier: 3 },
  { name: "Ubisoft", platform: "smartrecruiters", identifier: "ubisoft2", status: "verified", tier: 4 },
  {
    name: "Blizzard",
    platform: "workday",
    identifier: "xboxgaming.wd1:Blizzard_External_Careers",
    status: "verified",
    tier: 4,
  },

  // Fase 3 — el slug de Greenhouse asumido en el PRD no respondió (404 al
  // verificar); quedan fuera hasta encontrar la plataforma/slug real.
  // Kavak: boards-api.greenhouse.io/v1/boards/kavak -> 404
  // Rappi: boards-api.greenhouse.io/v1/boards/rappi -> 404

  // Investigadas y descartadas por ahora — bloquean requests automatizados
  // con protección anti-bot (403/406); no se intenta evadirla.
  // Uber: HTTP 406 (bot-detection) en /us/en/careers/list/
  // Canva: HTTP 403 en /careers/jobs/
  // Globant: HTTP 403 ya en /robots.txt

  // Investigadas — career site es una SPA sin datos accesibles vía HTML
  // simple (cheerio) ni API pública encontrada; requerirían un navegador
  // headless, fuera del alcance de v1 (NFR de costo/simplicidad).
  // Mercado Libre: careers-meli.mercadolibre.com/en/positions
  // Clip: clip.mx/unete-a-clip
  // Konfío: konfio.mx/vacantes

  // Activision — tiene Workday (xboxgaming.wd1/CentralTech) pero ese site
  // solo cubre el equipo "Central Technology" (3 vacantes), no el board
  // completo; falta encontrar el site correcto antes de agregarlo.

  // Jüsto — no se encontró una página oficial de carreras con ATS propio;
  // sus vacantes solo aparecen en bolsas de trabajo de terceros (LinkedIn,
  // Indeed, Glassdoor), que están fuera de alcance (v1 no agrega scrapers
  // de agregadores de empleo genéricos).

  // Keywords Studios — no se encontró ATS ni API en /en/careers/browse-careers/;
  // pendiente de investigar más a fondo.
];
