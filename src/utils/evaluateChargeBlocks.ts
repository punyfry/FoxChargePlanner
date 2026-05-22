import { PriceSlot, ScheduleWindow, TimePeriodHour } from "../types/index.js";
import { CONFIG } from "../config/config.js";
import { log } from "./logging.js";

/**
 * Determines if charging a battery in a given window is economically worth it.
 * @param prices - full day 15-min slots
 * @param chargingWindow - object with start and end Dates for charging
 * @returns true if profitable, false otherwise
 */
export function isChargingWorthIt(
  prices: PriceSlot[],
  chargingWindow: ScheduleWindow,
  dischargeWindow: TimePeriodHour
): boolean {
  const dischargeSlots = getDischargePriceSlots(prices, dischargeWindow);
  if (dischargeSlots.length === 0) return false;

  const expectedDischargePrice =
    dischargeSlots.reduce((sum, s) => sum + s.SEK_per_kWh, 0) / dischargeSlots.length;

  log.info(`Expected average discharge price: ${expectedDischargePrice.toFixed(4)} SEK/kWh`);

  const chargeSlots = [...chargingWindow.prices];
  if (chargeSlots.length === 0) return false;

  const avgChargePrice =
    chargeSlots.reduce((sum, s) => sum + s, 0) / chargeSlots.length;

  log.info(`Average charge price in selected windows: ${avgChargePrice.toFixed(4)} SEK/kWh`);

  // Determine if charging is profitable
  const degradationCost = calculateDegradationFromCostPerKwh();

  log.info(`Degradation cost per delivered kWh: ${degradationCost.toFixed(4)} SEK/kWh`);

  return expectedDischargePrice - avgChargePrice - degradationCost > 0;
}

function getDischargePriceSlots(prices: PriceSlot[], dischargeWindow: TimePeriodHour): PriceSlot[] {
  return prices.filter(slot => {
    const t = new Date(slot.time_start);
    return (t.getHours() >= dischargeWindow.startHour && t.getHours() < dischargeWindow.endHour);
  });
}

/**
 * Beräknar degraderingskostnad per levererad kWh från batteriet.
 * @returns degradation cost per delivered kWh (SEK/kWh)
 */
function calculateDegradationFromCostPerKwh(): number {
  const batteryCostPerKwh = CONFIG.battery.costPerKWh;
  const totalCapacity_kWh = CONFIG.battery.totalCapacityKWh;
  const DoD = CONFIG.battery.dod;
  const cycleLife = CONFIG.battery.cycleLife;
  const roundTripEfficiency = CONFIG.battery.efficiency;

  if (batteryCostPerKwh <= 0) throw new Error("batteryCostPerKwh must be > 0");
  if (totalCapacity_kWh <= 0 || DoD <= 0 || cycleLife <= 0) throw new Error("invalid inputs");

  const batteryReplacementCost = batteryCostPerKwh * totalCapacity_kWh;
  const usableCapacity = totalCapacity_kWh * DoD; // kWh per full cycle
  const costPerKWh = batteryReplacementCost / (cycleLife * usableCapacity);
  const degradationCost = costPerKWh / roundTripEfficiency; // SEK/kWh delivered
  console.log(`Degradation cost per delivered kWh: ${degradationCost.toFixed(4)} SEK/kWh`);

  return degradationCost;
}
