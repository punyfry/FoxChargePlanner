import crypto from "crypto";
import { FoxEssScheduleModel, Schedule } from "../types/index.js";
import { log } from "../utils/logging.js";
import { CONFIG } from "../config/config.js";

const DEVICE_SN = CONFIG.foxess.deviceSn;
const FOXESS_TOKEN = CONFIG.foxess.token;

function makeAuthHeaders(path: string): Record<string, string> {
  const timestamp = String(Date.now());
  const raw = `${path}\r\n${FOXESS_TOKEN}\r\n${timestamp}`;
  const signature = crypto.createHash("md5").update(raw).digest("hex");

  return {
    token: FOXESS_TOKEN!,
    timestamp,
    signature,
    lang: "en",
    "User-Agent": "FoxChargePlanner/1.0"
  };
}

export async function setChargeWindowsOnFoxEss(schedule: FoxEssScheduleModel) {
    if (!FOXESS_TOKEN || !DEVICE_SN) {
        console.error("Missing FOXESS_TOKEN or DEVICE_SN in env");
        process.exit(1);
    }

    const path = CONFIG.foxess.pathSetChargeWindows;
    const url = `${CONFIG.foxess.baseUrl}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...makeAuthHeaders(path)
  };

  const body = {
    sn: DEVICE_SN,
    enable1: schedule.enable1,
    enable2: schedule.enable2,
    startTime1: schedule.startTime1,
    endTime1: schedule.endTime1,
    startTime2: schedule.startTime2,
    endTime2: schedule.endTime2
  };

  log.info(`Sending schedule to Fox ESS: ${JSON.stringify(body)}`);

  // const res = await fetch(url, {
  //   method: "POST",
  //   headers,
  //   body: JSON.stringify(body)
  // });

  const res = { ok: true, status: 200, text: () => Promise.resolve("OK"), json: async () => ({ success: true }) }; // Mocked response for illustration

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fox ESS API error: ${res.status} ${text}`);
  }

  const respJson = await res.json();
  log.info(`Fox ESS response: ${JSON.stringify(respJson)}`);
  return respJson;
}