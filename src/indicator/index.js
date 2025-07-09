import { executeBash, replaceRelativeHome } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{name: string, content: string, animation: string[], frameDelay: number} | undefined} Entry */

/** @typedef {{cacheDirectory: string, cacheFilePath: string, indicatorDisplayFile: string, onInterfaceUpdateCommand: string, entries: Entry[]}} Config */

/** @typedef {{content?: string}} Args*/

/** @type {Config} */
let config;
/** @type {Args} */
let args;
/** @type {Entry} */
let entry;

/** @type {(configInput: ConfigInput, action: string, entryId: string, argsInput: any) => Promise<void>} */
export default async function load(configInput, action, entryId, argsInput) {
  args = argsInput;
  config = createModuleConfig(configInput, getDefaults());
  switch (action) {
    case "stop":
      stop();
      break;
    default:
      start(entryId);
  }
}

/** @type {(entryId: string) => void} */
function start(entryId) {
  if (getTimerInstance()) {
    return;
  }

  entry = config.entries.find((/** @type{Entry} */ element) => {
    return element?.name === entryId;
  });

  if (!entry) {
    return;
  }

  createCacheDirectory();
  timer();
}

/** @type {() => void} */
function stop() {
  if (!getTimerInstance()) {
    return;
  }

  killTimer();
  // Clear ui
  executeBash(`: > "${config.indicatorDisplayFile}"`);
  if (config.onInterfaceUpdateCommand) {
    executeBash(`echo "" | ${config.onInterfaceUpdateCommand}`);
  }
  // Give time for the timer app to finish closing before cleaning up
  setTimeout(() => {
    // Clear old cache files in case they exist
    cleanCacheFolder();
  }, 500);
}

/** @type {() => void} */
function createCacheDirectory() {
  executeBash(`mkdir -p ${replaceRelativeHome(config.cacheDirectory)}`);
}

/** @type {() => void} */
function cleanCacheFolder() {
  executeBash(`rm -r ${config.cacheDirectory}`);
}

/** @type {() => string} */
function getTimerInstance() {
  return executeBash(`pgrep -f "## hyprhelpr indicator timer ##"`);
}

/** @type {() => void} */
function killTimer() {
  const timer = getTimerInstance();
  executeBash(`kill ${timer}`);
}

/** @type {() => void} */
function timer() {
  const lines = [
    `## hyprhelpr indicator timer ##`,
    `prefix="${args.content || entry?.content} "`,
    `display_file="${config.indicatorDisplayFile}"`,
    `animation_elements=("${entry?.animation ? entry.animation.join('" "') : []}")`,
    `animation_index=0`,
    `animation_count=${entry?.animation?.length || 0}`,

    `while true; do`,
    'display="$prefix${animation_elements[$animation_index]}"',
    'echo "$display" > "$display_file"',
    `echo "$display" | ${config.onInterfaceUpdateCommand}`,
    `sleep ${entry?.frameDelay || 1}`,
    `((animation_index++))`,
    `if (( animation_index >= animation_count )); then`,
    `animation_index=0`,
    `fi`,
    `done`,
  ];
  const proc = Bun.spawn(["bash", "-c", `${lines.join("\n")}`]);
  proc.unref();
}

/** @type {() => {}} */
function getDefaults() {
  /** @type {{[key: string]: any}} */
  const defaults = {
    onInterfaceUpdateCommand: "",
    cacheDirectory: "~/.cache/hyprhelpr/indicator",
    entries: [],
  };

  defaults.indicatorDisplayFile = `${defaults.cacheDirectory}/indicator-display`;

  return defaults;
}
