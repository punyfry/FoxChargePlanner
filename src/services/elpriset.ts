import fetch from "node-fetch";
import { formatDate } from "../utils/time.js";
import { PriceSlot } from "../types/index.js";
import { log } from "../utils/logging.js";
import { CONFIG } from "../config/config.js";

export async function getDayPrices(date: Date): Promise<PriceSlot[]> {
  const { year, month, day } = formatDate(date);

  const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${month}-${day}_${CONFIG.priceClass}.json`;

  log.info(`Fetching prices from URL: ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.statusText}`);

  const prices = await res.json() as PriceSlot[]; // array of price slots
  log.info(`Fetched ${prices.length} price slots for ${date.toDateString()} from price class ${CONFIG.priceClass}`);
  return prices;
}
