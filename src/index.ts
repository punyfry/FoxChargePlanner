import { fileURLToPath } from "url";
import { CONFIG } from "./config/config.js"
import { runChargePlanner } from "./foxChargePlanner.js";
import { log } from "./utils/logging.js";

function main(): void { 
  log.info(`Starting charge planner at ${new Date().toISOString()}`);

  try {
    log.info("Loading configuration...");
    CONFIG.priceClass; // Access to trigger any lazy loading
    log.info("Configuration loaded and validated.");
  } catch (err) {
    log.error(`Config validation failed: ${err}`);
    process.exit(1);
  }

  runChargePlanner().catch(err => {
    const error = err;
    log.error(`${error.message}\n${error.stack}`);
    process.exit(1);
  }).finally(() => {
    log.info(`Charge planner finished at ${new Date().toISOString()}`);
  });
}

const currentFile = fileURLToPath(import.meta.url);

if (currentFile === process.argv[1]) {
  main();
}