import { pickChargingWindows } from "../utils/pickChargingWindows.js";
import { PriceSlot } from "../types/index.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

/**
 * Helper to create 15-minute slots with linear or custom pricing.
 */
function makeSlots(
  startHour: number,
  endHour: number,
  basePrice: number,
  step: number
): PriceSlot[] {
  const slots: PriceSlot[] = [];
  const now = new Date("2025-08-12T00:00:00+02:00");

  for (let hour = startHour; hour < endHour; hour++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const time = new Date(now);
      time.setHours(hour, quarter * 15, 0, 0);
      slots.push({
        SEK_per_kWh: basePrice + step * (hour * 4 + quarter),
        EUR_per_kWh: 0,
        EXR: 11,
        time_start: time.toISOString(),
        time_end: new Date(time.getTime() + 15 * 60 * 1000).toISOString(),
      });
    }
  }

  return slots;
}

describe("pickChargingWindows", () => {
    // --- Read .env.test once ---
const envPath = path.resolve(__dirname, "../../.env.test");
const envContent = fs.readFileSync(envPath, "utf-8");
const parsedEnv = dotenv.parse(envContent);

beforeEach(() => {
    // Clear process.env completely
    for (const key of Object.keys(process.env)) {
        delete process.env[key];
    }

    // Load the .env.test variables fresh
    for (const [key, value] of Object.entries(parsedEnv)) {
        process.env[key] = value;
    }

    // Reset modules so config.ts is imported fresh
    jest.resetModules();
  });

  it("finds the cheapest 5-hour block at night and 2-hour block in afternoon", () => {
    // 00:00–07:00 and 11:00–18:00 ranges exist in data
    const nightSlots = makeSlots(0, 7, 0.20, 0.001);
    const afternoonSlots = makeSlots(11, 18, 0.30, -0.001); // gets cheaper later in the day

    const allSlots = [...nightSlots, ...afternoonSlots];

    const result = pickChargingWindows(allSlots);

    // 5 h × 4 quarters = 20 slots → cheapest are at the beginning of the night
    expect(result.amWindow.start.getHours()).toBe(0);
    expect(result.amWindow.start.getMinutes()).toBe(0);
    expect(result.amWindow.end.getHours()).toBe(5);
    expect(result.amWindow.end.getMinutes()).toBe(0);

    // 2 h × 4 quarters = 8 slots → cheapest are at the end of the afternoon
    expect(result.pmWindow.start.getHours()).toBe(15);
    expect(result.pmWindow.start.getMinutes()).toBe(0);
    expect(result.pmWindow.end.getHours()).toBe(17);
    expect(result.pmWindow.end.getMinutes()).toBe(0);
  });

  it("handles exactly 20 night slots gracefully", () => {
    const slots = makeSlots(0, 5, 0.1, 0); // 20 slots total (5h)
    const result = pickChargingWindows(slots);

    expect(result.amWindow.start.getHours()).toBe(0);
    expect(result.amWindow.start.getMinutes()).toBe(0);
    expect(result.amWindow.end.getHours()).toBe(5);
    expect(result.amWindow.end.getMinutes()).toBe(0);
  });
});

it("only picks continuous blocks, not scattered cheap slots", () => {
  const slots: PriceSlot[] = [];
  const baseDate = new Date("2025-08-12T00:00:00+02:00");

  // Create 00:00–07:00 range (28 slots)
  for (let i = 0; i < 28; i++) {
    const time = new Date(baseDate.getTime() + i * 15 * 60 * 1000);
    // Default price
    let price = 0.50;
    // Make every 3rd slot very cheap — but not continuous
    if (i % 3 === 0) price = 0.05;

    slots.push({
      SEK_per_kWh: price,
      EUR_per_kWh: 0,
      EXR: 11,
      time_start: time.toISOString(),
      time_end: new Date(time.getTime() + 15 * 60 * 1000).toISOString(),
    });
  }

  const result = pickChargingWindows(slots);

  // The cheapest slots (every 3rd one) are not continuous,
  // so the function should pick the lowest continuous 5h (20-slot) region,
  // which will still start early (00:00) since they’re evenly distributed.
  expect(result.amWindow.start.getHours()).toBe(0);

  // Ensure it didn’t "jump" around or pick disjoint times
  const endHour = result.amWindow.end.getHours();
  const endMinute = result.amWindow.end.getMinutes();
  const totalMinutes = endHour * 60 + endMinute;
  const startMinutes = result.amWindow.start.getHours() * 60 + result.amWindow.start.getMinutes();
  expect(totalMinutes - startMinutes).toBe(5 * 60); // 5 hours continuous
});

