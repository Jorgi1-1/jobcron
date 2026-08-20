import type { Company, NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type AshbyJob = {
  id: string;
  title: string;
  jobUrl: string;
  publishedAt?: string;
  location?: string;
};

export async function fetchAshbyJobs(company: Company): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${company.identifier}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Ashby ${company.name}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: AshbyJob[] };

  return (data.jobs ?? []).map((job) => ({
    company: company.name,
    title: job.title,
    location: job.location ?? "",
    url: job.jobUrl,
    postedAt: job.publishedAt ?? null,
    sourcePlatform: "ashby",
    externalId: job.id,
  }));
}
