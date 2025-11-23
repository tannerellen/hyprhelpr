import { executeBash, replaceRelativeHome } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{name: string, command: string, size?: string, move?: string, processMatch?: string}} ToggleEntry */

/** @typedef {{size: string, entries: ToggleEntry[]}} Config */

/** @type {Config} */
let config;

/** @type {(configInput: ConfigInput, name: string) => void} */
export default function load(configInput, name) {
  config = createModuleConfig(configInput, getDefaults());
  run(config.entries, name);
}

/** @type {(entries: ToggleEntry[], name: string) => Promise<void>} */
async function run(entries, name) {
  const target = entries.find((entry) => {
    return entry.name === name;
  });

  if (!target) {
    return;
  }

  const pid = getAppIsRunning(target);

  if (pid) {
    // toggle workspace
    toggleSpecialWorkspace(target);
  } else {
    // launch app in new special workspace
    launchApp(target);
  }
}

/** @type {(entry: ToggleEntry) => void} */
function toggleSpecialWorkspace(entry) {
  executeBash(`hyprctl dispatch togglespecialworkspace "${entry.name}"`);
}

/** @type {(entry: ToggleEntry) => void} */
function launchApp(entry) {
  const size = entry.size || config.size;
  const move = entry.move ? `move ${entry.move}` : "center";
  if (!entry.command) {
    console.log("No command specified");
    return;
  }
  const command = configToCommand(entry.command);
  executeBash(
    `hyprctl dispatch togglespecialworkspace "${entry.name}" && hyprctl dispatch exec "[float; noanim; size ${size}; ${move};] ${command}"`,
  );
}

/** @type {(entry: ToggleEntry) => string} */
function getAppIsRunning(entry) {
  const command = entry.processMatch
    ? entry.processMatch
    : configToCommand(entry.command).replace(/['"]/g, ""); // Remove quotes as they arn'te in the process
  return executeBash(`pgrep -f "${command}"`);
}

/** @type {(command: string) => string} */
function configToCommand(command) {
  const commandParts = command.split(" ").map((part, index) => {
    // Check first item for bin path
    if (!index) {
      const appPath = executeBash(`which ${part}`);
      part = appPath ? appPath : part;
    }
    // Replace home with aboslute path
    return replaceRelativeHome(part);
  });
  return commandParts.join(" ");
}

/** @type {() => {}} */
function getDefaults() {
  const defaults = {
    size: ">25% >25%",
    entries: [],
  };

  return defaults;
}
