import { executeBash } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{label: string, command: string}} LauncherEntry */
/** @typedef {{engine: string, parameters: string, entries: Array<LauncherEntry>}} MenuConfig */

const nextIndicator = "  ➜";
let config = {};

/** @type {(config: MenuConfig) => void} */
export default async function load(configInput) {
  config = createModuleConfig(configInput, getDefaults());
  run(config.entries);
}

/** @type {(entries: LauncherEntry) => void} */
function run(entries) {
  const menuSelection = executeLauncher(getInputFromEntries(entries));
  launcherResult(entries, menuSelection);
}

/** @type {(entries: Array<LauncherEntry>, menuSelection: string) => void} */
function launcherResult(entries, menuSelection) {
  for (const entry of entries) {
    if (
      menuSelection === entry.label ||
      menuSelection === entry.label + nextIndicator
    ) {
      if (entry.next?.length) {
        run(entry.next);
      } else {
        try {
          // Run the command
          executeBash(`nohup ${entry.command} &`);
        } catch (err) {
          throw err;
        }
      }
      return;
    }
  }
}

/** @type {(input: string) => string} */
function executeLauncher(input) {
  return executeBash(`echo -e "${input}" | ${config.command}`);
}

/** @type {(entries: Array<LauncherEntry>) => string} */
function getInputFromEntries(entries) {
  return entries
    .map((entry) => {
      return `${entry.label}${entry.next ? nextIndicator : ""}`;
    })
    .join("\n");
}

/** @type {() => Object} */
function getDefaults() {
  const defaults = {
    command: "",
    entries: [],
  };

  return defaults;
}
