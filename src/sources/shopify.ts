import type { NormalizedJob } from "../types.js";
import { scrapeJobs } from "./scraper.js";

/**
 * Shopify — career site propio, HTML server-rendered (verificado
 * manualmente: /careers embebe cada vacante como <a class="... compact-list-layout ...">
 * con el título en <h4> y la ubicación en .location span). No hay reglas de
 * robots.txt que bloqueen /careers.
 */
export async function fetchShopifyJobs(): Promise<NormalizedJob[]> {
  return scrapeJobs({
    company: "Shopify",
    url: "https://www.shopify.com/careers",
    baseUrl: "https://www.shopify.com",
    jobSelector: "a.compact-list-layout",
    titleSelector: "h4",
    locationSelector: ".location span",
  });
}
