import type { Company, NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type WorkdayJobPosting = {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
};

/**
 * Workday — ATS público con API JSON (CXS) que alimenta su propio buscador,
 * sin autenticación (ej. Blizzard). `identifier` tiene el formato
 * "<tenant>.<host>:<site>" (ej. "xboxgaming.wd1:Blizzard_External_Careers"),
 * tomado de la URL del career site: https://<tenant>.<host>.myworkdayjobs.com/<site>
 */
const PAGE_SIZE = 20; // el máximo que acepta la API antes de responder 400
const MAX_PAGES = 10; // tope de seguridad (200 vacantes) para no paginar sin fin

export async function fetchWorkdayJobs(company: Company): Promise<NormalizedJob[]> {
  const [tenantHost, site] = company.identifier.split(":");
  const [tenant, host] = tenantHost.split(".");
  if (!tenant || !host || !site) {
    throw new Error(`Workday ${company.name}: identifier inválido "${company.identifier}"`);
  }

  const base = `https://${tenant}.${host}.myworkdayjobs.com`;
  const endpoint = `${base}/wday/cxs/${tenant}/${site}/jobs`;
  const jobs: NormalizedJob[] = [];
  let total = Infinity;

  for (let page = 0; page < MAX_PAGES && jobs.length < total; page++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        searchText: "",
      }),
    });

    if (!res.ok) {
      throw new Error(`Workday ${company.name}: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { total?: number; jobPostings?: WorkdayJobPosting[] };
    total = data.total ?? jobs.length;

    for (const job of data.jobPostings ?? []) {
      jobs.push({
        company: company.name,
        title: job.title,
        location: job.locationsText ?? "",
        url: `${base}/${site}${job.externalPath}`,
        postedAt: null,
        sourcePlatform: "workday",
        externalId: job.bulletFields?.[0] ?? job.externalPath,
      });
    }

    if (!data.jobPostings || data.jobPostings.length === 0) break;
  }

  return jobs;
}
