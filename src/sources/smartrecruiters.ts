import type { Company, NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type SmartRecruitersPosting = {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { fullLocation?: string; remote?: boolean };
};

/**
 * SmartRecruiters — ATS público con API documentada (ej. Ubisoft, board
 * "ubisoft2"). `identifier` es el "company identifier" del board, visible en
 * la URL careers.smartrecruiters.com/<identifier>.
 */
const PAGE_SIZE = 100; // el máximo que acepta la API
const MAX_PAGES = 10; // tope de seguridad (1000 vacantes) para no paginar sin fin

export async function fetchSmartRecruitersJobs(company: Company): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  let totalFound = Infinity;

  for (let page = 0; page < MAX_PAGES && jobs.length < totalFound; page++) {
    const url = `https://api.smartrecruiters.com/v1/companies/${company.identifier}/postings?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

    if (!res.ok) {
      throw new Error(`SmartRecruiters ${company.name}: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { totalFound?: number; content?: SmartRecruitersPosting[] };
    totalFound = data.totalFound ?? jobs.length;

    for (const posting of data.content ?? []) {
      jobs.push({
        company: company.name,
        title: posting.name,
        location: posting.location?.fullLocation ?? (posting.location?.remote ? "Remote" : ""),
        url: `https://jobs.smartrecruiters.com/${company.identifier}/${posting.id}`,
        postedAt: posting.releasedDate ?? null,
        sourcePlatform: "smartrecruiters",
        externalId: posting.id,
      });
    }

    if (!data.content || data.content.length === 0) break;
  }

  return jobs;
}
