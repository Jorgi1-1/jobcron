import type { NormalizedJob } from "../types.js";
import { scrapeJobs } from "./scraper.js";

/**
 * Riot Games — career site propio, HTML server-rendered (verificado
 * manualmente: /en/work-with-us/jobs devuelve <li class="job-row job-row--body">
 * por vacante, con .job-row__col--primary = título y el último
 * .job-row__col--secondary = ubicación). robots.txt solo bloquea /*\/search,
 * esta ruta no aplica.
 */
export async function fetchRiotJobs(): Promise<NormalizedJob[]> {
  return scrapeJobs({
    company: "Riot Games",
    url: "https://www.riotgames.com/en/work-with-us/jobs",
    baseUrl: "https://www.riotgames.com",
    jobSelector: "li.job-row.job-row--body",
    titleSelector: ".job-row__col--primary",
    locationSelector: ".job-row__col--secondary:last-child",
  });
}
