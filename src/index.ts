import { companies } from "../config/companies.js";
import { dedupeAndPersist, recordDigestRun } from "./dedupe.js";
import { filterJobs } from "./filter.js";
import { sendDigest } from "./notify.js";
import { fetchAppleJobs } from "./sources/apple.js";
import { fetchAshbyJobs } from "./sources/ashby.js";
import { fetchGreenhouseJobs } from "./sources/greenhouse.js";
import { fetchLeverJobs } from "./sources/lever.js";
import { fetchMiroJobs } from "./sources/miro.js";
import { fetchNetflixJobs } from "./sources/netflix.js";
import { fetchRiotJobs } from "./sources/riot.js";
import { fetchShopifyJobs } from "./sources/shopify.js";
import { fetchSmartRecruitersJobs } from "./sources/smartrecruiters.js";
import { fetchWorkdayJobs } from "./sources/workday.js";
import type { Company, NormalizedJob } from "./types.js";

// Empresas "custom" no siguen un formato común de API, así que cada una
// necesita su propio adaptador dedicado (ver src/sources/*), registrado
// aquí por nombre de empresa.
const customAdapters: Record<string, () => Promise<NormalizedJob[]>> = {
  "Riot Games": fetchRiotJobs,
  Apple: fetchAppleJobs,
  Netflix: fetchNetflixJobs,
  Shopify: fetchShopifyJobs,
  Miro: fetchMiroJobs,
};

async function fetchFromCompany(company: Company): Promise<NormalizedJob[]> {
  switch (company.platform) {
    case "greenhouse":
      return fetchGreenhouseJobs(company);
    case "lever":
      return fetchLeverJobs(company);
    case "ashby":
      return fetchAshbyJobs(company);
    case "smartrecruiters":
      return fetchSmartRecruitersJobs(company);
    case "workday":
      return fetchWorkdayJobs(company);
    case "custom": {
      const adapter = customAdapters[company.name];
      if (!adapter) {
        throw new Error(`No hay adaptador custom registrado para ${company.name}`);
      }
      return adapter();
    }
    default:
      return [];
  }
}

async function run(): Promise<void> {
  const sourcesFailed: string[] = [];
  const allJobs: NormalizedJob[] = [];

  const results = await Promise.allSettled(companies.map((company) => fetchFromCompany(company)));

  results.forEach((result, i) => {
    const company = companies[i];
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    } else {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[JobCron] Fuente falló (${company.name}): ${message}`);
      sourcesFailed.push(company.name);
    }
  });

  const jobsScanned = allJobs.length;
  const matched = filterJobs(allJobs);
  const newJobs = await dedupeAndPersist(matched);

  let emailSent = false;
  if (newJobs.length > 0) {
    await sendDigest(newJobs);
    emailSent = true;
  }

  await recordDigestRun({
    jobsScanned,
    jobsNew: newJobs.length,
    sourcesFailed,
    emailSent,
  });

  console.log(
    `[JobCron] Escaneadas: ${jobsScanned}, matchearon filtro: ${matched.length}, nuevas: ${newJobs.length}, correo enviado: ${emailSent}, fuentes fallidas: ${sourcesFailed.join(", ") || "ninguna"}`
  );
}

run().catch((error) => {
  console.error("[JobCron] Error fatal en la corrida:", error);
  process.exit(1);
});
