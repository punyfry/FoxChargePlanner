import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ZodError } from "zod";

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

describe("CONFIG", () => {
  it("should load values from .env.test", () => {
    const configModule = require("../config/config");
    const { CONFIG } = configModule;

    expect(CONFIG.priceClass).toBe("SE3");
    expect(CONFIG.foxess.token).toBe("dummy_token");
    expect(CONFIG.battery.totalCapacityKWh).toBe(16.6);
  });
});

describe("CONFIG validation (invalid values)", () => {
  it("should throw if BATTERY_DOD is > 1", () => {
    process.env.BATTERY_DOD = "1.5"; // invalid

    try {
      require("../config/config");
      throw new Error("Config did not throw");
    } catch (err: any) {
      // err is ZodError
      const zodError = err as ZodError;
      const message = zodError.issues[0].message;
      const path = zodError.issues[0].path;

      expect(path).toContain("BATTERY_DOD");
      expect(message).toContain("Invalid DOD, must be <= 1");
    }
  });

  it("should throw if BATTERY_DOD is < 0", () => {
    process.env.BATTERY_DOD = "-0.1"; // invalid

    try {
      require("../config/config");
      throw new Error("Config did not throw");
    } catch (err: any) {
      // err is ZodError
      const zodError = err as ZodError;
      const message = zodError.issues[0].message;
      const path = zodError.issues[0].path;

      expect(path).toContain("BATTERY_DOD");
      expect(message).toContain("Invalid DOD, must be >= 0");
    }
  });

  it("should throw if PRICE_CLASS is invalid", () => {
    process.env.PRICE_CLASS = "SE5"; // invalid

    try {
      require("../config/config");
      throw new Error("Config did not throw");
    } catch (err: any) {
      // err is ZodError
      const zodError = err as ZodError;
      const message = zodError.issues[0].message;
      const path = zodError.issues[0].path;

      expect(path).toContain("PRICE_CLASS");
      expect(message).toContain("Invalid price class, must be one of: SE1, SE2, SE3, SE4");
    }
  });

  it("should throw if required FOXESS_TOKEN is missing", () => {
    delete process.env.FOXESS_TOKEN;

    try {
      require("../config/config");
      throw new Error("Config did not throw");
    } catch (err: any) {
      // err is ZodError
      const zodError = err as ZodError;
      const message = zodError.issues[0].message;
      const path = zodError.issues[0].path;

      expect(path).toContain("FOXESS_TOKEN");
      expect(message).toContain("Missing FOXESS_TOKEN");
    }   
  });

  it("should throw if required DEVICE_SN is missing", () => {
    jest.isolateModules(() => {
      delete process.env.DEVICE_SN;

      try {
        require("../config/config");

        throw new Error("Config did not throw");
      } catch (err: any) {
        // err is ZodError
      const zodError = err as ZodError;
      const message = zodError.issues[0].message;
      const path = zodError.issues[0].path;

      expect(path).toContain("DEVICE_SN");
      expect(message).toContain("Missing DEVICE_SN");
      }
    });
  });
});

describe("CONFIG defaults", () => {
  it("should use default values when some env vars are missing", () => {
    // Delete only the vars we want to test defaults for
    delete process.env.BATTERY_DOD;
    delete process.env.BATTERY_CYCLE_LIFE;
    delete process.env.BATTERY_EFFICIENCY;
    delete process.env.PRICE_CLASS;

    jest.isolateModules(() => {
      const configModule = require("../config/config");
      const { CONFIG } = configModule;

      // Battery defaults
      expect(CONFIG.battery.dod).toBe(0.9);
      expect(CONFIG.battery.cycleLife).toBe(10000);
      expect(CONFIG.battery.efficiency).toBe(0.95);

      // Price class default
      expect(CONFIG.priceClass).toBe("SE3");

      // FOXESS vars still loaded from .env.test
      expect(CONFIG.foxess.token).toBeDefined();
      expect(CONFIG.foxess.deviceSn).toBeDefined();
    });
  });
});
