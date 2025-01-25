import { executeCommand } from "../system";

// Type definitions
/** @typedef {{label: string, command: string}} LauncherEntry */
/** @typedef {{engine: string, parameters: string, entries: Array<LauncherEntry>}} MenuConfig */

const nextIndicator = "  ➜";
let config = {};

/** @type {(config: MenuConfig) => void} */
export default async function load(configInput) {
  config = configInput;
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
          executeCommand(
            ["bash", "-c", `${entry.command} > /dev/null 2>&1 &`],
            {
              stdio: ["ignore"],
            },
          );
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
  return executeCommand([
    "bash",
    "-c",
    `echo -e "${input}" | ${config.command}`,
  ]);
}

/** @type {(entries: Array<LauncherEntry>) => string} */
function getInputFromEntries(entries) {
  return entries
    .map((entry) => {
      return `${entry.label}${entry.next ? nextIndicator : ""}`;
    })
    .join("\n");
}
