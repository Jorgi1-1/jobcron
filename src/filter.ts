import { locationKeywords, titleKeywords } from "../config/keywords.js";
import type { NormalizedJob } from "./types.js";

export type FilteredJob = NormalizedJob & { matchedKeywords: string[] };

/**
 * FR-3 — pasa una vacante si su título matchea >=1 keyword técnica Y su
 * ubicación matchea remoto/México (o sub-ubicaciones). Sin filtro de
 * seniority.
 */
export function filterJobs(jobs: NormalizedJob[]): FilteredJob[] {
  return jobs.reduce<FilteredJob[]>((acc, job) => {
    const titleLower = job.title.toLowerCase();
    const locationLower = job.location.toLowerCase();

    const matchedTitleKeywords = titleKeywords.filter((kw) => titleLower.includes(kw));
    const matchesLocation = locationKeywords.some((kw) => locationLower.includes(kw));

    if (matchedTitleKeywords.length > 0 && matchesLocation) {
      acc.push({ ...job, matchedKeywords: matchedTitleKeywords });
    }

    return acc;
  }, []);
}
