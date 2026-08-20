import type { NormalizedJob } from "../types.js";
import { scrapeJobs } from "./scraper.js";

/**
 * Apple — no tiene una API interna documentada accesible sin autenticación;
 * en su lugar, jobs.apple.com/en-us/search es server-rendered y soporta
 * filtro por ubicación vía query param (verificado manualmente: 16/16
 * resultados con location=mexico-MEXC caen dentro de México). Estructura:
 * cada vacante es un div.job-title.job-list-item con el título en
 * .job-title-link a y la ubicación en .job-title-location.
 */
export async function fetchAppleJobs(): Promise<NormalizedJob[]> {
  return scrapeJobs({
    company: "Apple",
    url: "https://jobs.apple.com/en-us/search?location=mexico-MEXC",
    baseUrl: "https://jobs.apple.com",
    jobSelector: "div.job-title.job-list-item",
    titleSelector: ".job-title-link a",
    linkSelector: ".job-title-link a",
    locationSelector: ".job-title-location .table--advanced-search__location-sub",
  });
}
