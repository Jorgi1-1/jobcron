import * as cheerio from "cheerio";
import type { NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";
const PAGE_URL = "https://miro.com/careers/open-positions/";

type MiroJob = {
  id: number;
  title: string;
  location: string;
};

type MiroNextData = {
  props?: { pageProps?: { jobs?: MiroJob[] } };
};

/**
 * Miro — career site propio construido en Next.js sobre datos de Greenhouse,
 * pero sin un slug de board público resoluble vía boards-api.greenhouse.io.
 * En vez de eso, la página server-renderiza el listado completo dentro del
 * script `__NEXT_DATA__` (verificado manualmente). robots.txt no bloquea
 * /careers/.
 */
export async function fetchMiroJobs(): Promise<NormalizedJob[]> {
  const res = await fetch(PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Miro: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const raw = $("#__NEXT_DATA__").html();
  if (!raw) {
    throw new Error("Miro: no se encontró __NEXT_DATA__ en la página");
  }

  const data = JSON.parse(raw) as MiroNextData;
  const jobs = data.props?.pageProps?.jobs ?? [];

  return jobs.map((job) => ({
    company: "Miro",
    title: job.title,
    location: job.location,
    url: `https://miro.com/careers/vacancy/${job.id}?gh_jid=${job.id}`,
    postedAt: null,
    sourcePlatform: "custom",
    externalId: String(job.id),
  }));
}
