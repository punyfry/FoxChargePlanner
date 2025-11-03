import * as dotenv from "dotenv";
import { z } from "zod";

// --- Validation schema
const configSchema = z.object({
  PRICE_CLASS: z.enum(["SE1", "SE2", "SE3", "SE4"], "Invalid price class, must be one of: SE1, SE2, SE3, SE4").default("SE3"),

  BATTERY_CAPACITY_KWH: z.coerce.number().min(0, "Invalid battery capacity, must be >= 0").default(16.6),
  BATTERY_COST_PER_KWH: z.coerce.number().min(0, "Invalid battery cost, must be >= 0").default(10000),
  BATTERY_DOD: z.coerce.number().min(0, "Invalid DOD, must be >= 0").max(1, "Invalid DOD, must be <= 1").default(0.9),
  BATTERY_CYCLE_LIFE: z.coerce.number().min(0, "Invalid battery cycle life, must be >= 0").default(10000),
  BATTERY_EFFICIENCY: z.coerce.number().min(0, "Invalid battery efficiency, must be >= 0").default(0.95),

  AM_CHARGE_START_HOUR: z.coerce.number().min(0, "Invalid AM charge start hour, must be >= 0").max(12, "Invalid AM charge start hour, must be <= 12").default(0),
  AM_CHARGE_END_HOUR: z.coerce.number().min(0, "Invalid AM charge end hour, must be >= 0").max(12, "Invalid AM charge end hour, must be <= 12").default(7),
  PM_CHARGE_START_HOUR: z.coerce.number().min(12, "Invalid PM charge start hour, must be >= 12").max(23, "Invalid PM charge start hour, must be <= 23").default(12),
  PM_CHARGE_END_HOUR: z.coerce.number().min(12, "Invalid PM charge end hour, must be >= 12").max(23, "Invalid PM charge end hour, must be <= 23").default(17),

  AM_DISCHARGE_START_HOUR: z.coerce.number().min(0, "Invalid AM discharge start hour, must be >= 0").max(12, "Invalid AM discharge start hour, must be <= 12").default(7),
  AM_DISCHARGE_END_HOUR: z.coerce.number().min(0, "Invalid AM discharge end hour, must be >= 0").max(12, "Invalid AM discharge end hour, must be <= 12").default(9),
  PM_DISCHARGE_START_HOUR: z.coerce.number().min(13, "Invalid PM discharge start hour, must be >= 13").max(23, "Invalid PM discharge start hour, must be <= 23").default(17),
  PM_DISCHARGE_END_HOUR: z.coerce.number().min(13, "Invalid PM discharge end hour, must be >= 13").max(23, "Invalid PM discharge end hour, must be <= 23").default(21),

  FOXESS_TOKEN: z.string("Missing FOXESS_TOKEN").min(1, "Missing FOXESS_TOKEN"),
  DEVICE_SN: z.string("Missing DEVICE_SN").min(1, "Missing DEVICE_SN"),
});

if (process.env.NODE_ENV !== "production") dotenv.config();

// --- Parse and validate
const env = configSchema.parse(process.env);

// --- Build final CONFIG object
export const CONFIG = {
  priceClass: env.PRICE_CLASS,
  battery: {
    totalCapacityKWh: env.BATTERY_CAPACITY_KWH,
    costPerKWh: env.BATTERY_COST_PER_KWH,
    dod: env.BATTERY_DOD,
    cycleLife: env.BATTERY_CYCLE_LIFE,
    efficiency: env.BATTERY_EFFICIENCY,
  },
  chargePeriods: {
    pm: {
      startHour: env.PM_CHARGE_START_HOUR,
      endHour: env.PM_CHARGE_END_HOUR,
    },
    am: {
      startHour: env.AM_CHARGE_START_HOUR,
      endHour: env.AM_CHARGE_END_HOUR,
    },
  },
  dischargePeriods: {
    pm: {
      startHour: env.PM_DISCHARGE_START_HOUR,
      endHour: env.PM_DISCHARGE_END_HOUR,
    },
    am: {
      startHour: env.AM_DISCHARGE_START_HOUR,
      endHour: env.AM_DISCHARGE_END_HOUR,
    },
  },
  foxess: {
    token: env.FOXESS_TOKEN,
    deviceSn: env.DEVICE_SN,
    baseUrl: "https://www.foxesscloud.com/c/v0/",
    pathSetChargeWindows: "/op/v0/device/battery/forceChargeTime/set",
  },
};

export type AppConfig = typeof CONFIG;