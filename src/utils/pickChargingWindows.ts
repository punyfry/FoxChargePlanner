import { Schedule, PriceSlot } from "../types/index.js";
import { CONFIG } from "../config/config.js";
import { log } from "./logging.js";

/**
 * Finds the cheapest continuous block of given length in the price slots.
 * @param slots - array of PriceSlot
 * @param blockLength - number of consecutive slots to find
 * @returns array of PriceSlot representing the cheapest continuous block
 */
function findCheapestContinuousBlock(slots: PriceSlot[], blockLength: number): PriceSlot[] {
  let minSum = Infinity;
  let bestBlock: PriceSlot[] = [];

  for (let i = 0; i <= slots.length - blockLength; i++) {
    const block = slots.slice(i, i + blockLength);
    const sum = block.reduce((acc, p) => acc + p.SEK_per_kWh, 0);
    if (sum < minSum) {
      minSum = sum;
      bestBlock = block;
    }
  }
  return bestBlock;
}

export function pickChargingWindows(prices: PriceSlot[]): Schedule {
  const am = CONFIG.chargePeriods.am;
  const pm = CONFIG.chargePeriods.pm;

  log.info(`Picking charging windows from price slots ${prices[0].time_start} to ${prices[prices.length - 1].time_end}`);

  const parseTime = (p: PriceSlot) => new Date(p.time_start);

  const amSlots = prices
    .filter(p => parseTime(p).getHours() >= am.startHour && parseTime(p).getHours() < am.endHour);
 
  const amBlock: PriceSlot[] = findCheapestContinuousBlock(amSlots, 20);
  const amStart = parseTime(amBlock[0]);
  const amEnd = parseTime(amBlock[amBlock.length - 1]);
  amEnd.setMinutes(amEnd.getMinutes() + 15);

  const pmSlots = prices
    .filter(p => parseTime(p).getHours() >= pm.startHour && parseTime(p).getHours() < pm.endHour);
  
  const pmBlock = findCheapestContinuousBlock(pmSlots, 8);
  const pmStart = parseTime(pmBlock[0]);
  const pmEnd = parseTime(pmBlock[pmBlock.length - 1]);
  pmEnd.setMinutes(pmEnd.getMinutes() + 15);

  const result: Schedule =  {
    amWindow: {
      start: amStart,
      end: amEnd,
      prices: amBlock.map(p => p.SEK_per_kWh)
    },
    pmWindow: {
      start: pmStart,
      end: pmEnd,
      prices: pmBlock.map(p => p.SEK_per_kWh)
    }
  };

  log.info(`Picked AM window: ${amStart.toISOString()} - ${amEnd.toISOString()}, prices: [${result.amWindow.prices.map(p => p.toFixed(3)).join(", ")}]`);
  log.info(`Picked PM window: ${pmStart.toISOString()} - ${pmEnd.toISOString()}, prices: [${result.pmWindow.prices.map(p => p.toFixed(3)).join(", ")}]`);

  return result;
}