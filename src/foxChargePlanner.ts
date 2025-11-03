import { log } from "./utils/logging.js";
import { getDayPrices } from "./services/elpriset.js";
import { getTomorrowDate } from "./utils/time.js";
import { setChargeWindowsOnFoxEss } from "./services/foxesscloud.js";
import { pickChargingWindows } from "./utils/pickChargingWindows.js";
import { isChargingWorthIt } from "./utils/evaluateChargeBlocks.js";

export async function runChargePlanner(): Promise<void> {
  log.info("Fetching tomorrow's prices...");

  const date = new Date();
  let tomorrow: Date;

  if (date.getHours() < 14) {
    log.info("It's before 2 PM, can't proceed with charge planning.");
    tomorrow = date;
    //return;
  } else {
    tomorrow = getTomorrowDate();
  }

  const prices = await getDayPrices(tomorrow);

  const chargingWindows = pickChargingWindows(prices);
  log.info(`Calculated charging windows: ${JSON.stringify(chargingWindows)}`);

  if (!isChargingWorthIt(prices, chargingWindows)) {
    log.info("Charging is not economically worth it tomorrow. Disabling charge windows.");
    await setChargeWindowsOnFoxEss({
      enable1: false,
      enable2: false,
      startTime1: { hour: 0, minute: 0 },
      endTime1: { hour: 0, minute: 0 },
      startTime2: { hour: 0, minute: 0 },
      endTime2: { hour: 0, minute: 0 }
    });
  }

  await setChargeWindowsOnFoxEss({
    enable1: true,
    enable2: true,
    startTime1: { hour: chargingWindows.amWindow.start.getHours(), minute: chargingWindows.amWindow.start.getMinutes() },
    endTime1: { hour: chargingWindows.amWindow.end.getHours(), minute: chargingWindows.amWindow.end.getMinutes() },
    startTime2: { hour: chargingWindows.pmWindow.start.getHours(), minute: chargingWindows.pmWindow.start.getMinutes() },
    endTime2: { hour: chargingWindows.pmWindow.end.getHours(), minute: chargingWindows.pmWindow.end.getMinutes() }
  });

  log.info("Successfully updated charging windows on Fox ESS.");
}