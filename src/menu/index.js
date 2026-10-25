import { executeBash } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{label: string, command: string, next?: [], prompt?: string}} LauncherEntry */

/** @typedef {{command: string, promptArgs?: string, entries: LauncherEntry[]}} Config */

const nextIndicator = "  ➜";
/** @type {Config} */
let config;

/** @type {(config: ConfigInput) => Promise<void>} */
export default async function load(configInput) {
  config = createModuleConfig(configInput, getDefaults());
  run(config.entries);
}

/** @type {(entries: LauncherEntry[]) => void} */
function run(entries) {
  const menuSelection = executeLauncher(getInputFromEntries(entries));
  launcherResult(entries, menuSelection);
}

/** @type {(entries: LauncherEntry[], menuSelection: string) => void} */
function launcherResult(entries, menuSelection) {
  for (const entry of entries) {
    if (
      menuSelection === entry.label ||
      menuSelection === entry.label + nextIndicator
    ) {
      if (entry.next?.length) {
        run(entry.next);
      } else if (entry.prompt !== undefined) {
        const promptArgs = config.promptArgs
          ? " " + config.promptArgs.replace("{prompt}", entry.prompt)
          : "";
        const userInput = executeBash(
          `${config.command}${promptArgs}`,
        );
        if (!userInput) return;
        try {
          executeBash(`nohup ${entry.command.replace("{input}", userInput)} &`);
        } catch (err) {
          throw err;
        }
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

/** @type {(entries: LauncherEntry[]) => string} */
function getInputFromEntries(entries) {
  return entries
    .map((entry) => {
      return `${entry.label}${entry.next ? nextIndicator : ""}`;
    })
    .join("\n");
}

/** @type {() => {}} */
function getDefaults() {
  const defaults = {
    command: "",
    promptArgs: "",
    entries: [],
  };

  return defaults;
}
