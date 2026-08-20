import type { Company, NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location?: { name?: string };
};

export async function fetchGreenhouseJobs(company: Company): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.identifier}/jobs?content=false`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Greenhouse ${company.name}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };

  return (data.jobs ?? []).map((job) => ({
    company: company.name,
    title: job.title,
    location: job.location?.name ?? "",
    url: job.absolute_url,
    postedAt: job.updated_at ?? null,
    sourcePlatform: "greenhouse",
    externalId: String(job.id),
  }));
}
