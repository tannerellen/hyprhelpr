import { executeBash } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{menuCommand: string, cacheDirectory: string, cacheFile: string, debounceDuration: number}} Config */

/** @type {Config} */
let config;

/** @type {(configInput: ConfigInput) => void} */
export default function load(configInput) {
  config = createModuleConfig(configInput, getDefaults());
  run();
}

/** @type {() => Promise<void>} */
async function run() {
  createCacheDirectory();
  try {
    const cacheFile = Bun.file(`${config.cacheDirectory}/${config.cacheFile}`);
    const cache = await cacheFile.json();
    if (cache.timestamp > Date.now() - config.debounceDuration * 1000) {
      console.log(cache.output);
    } else {
      selectSource();
    }
  } catch (err) {
    selectSource();
  }
}

/** @type {() => Promise<void>} */
async function selectSource() {
  const selectionListMap = generateSelectionList();
  const selection = showSelectionList(
    Array.from(selectionListMap.keys()).join("\n"),
  );

  const output = generateOutput(selectionListMap.get(selection));
  if (!output) {
    console.log("");
    return;
  }

  const cacheData = { timestamp: Date.now(), output: output };
  await Bun.write(
    `${config.cacheDirectory}/${config.cacheFile}`,
    JSON.stringify(cacheData),
  );
  console.log(output);
}

/** @type {(selectedOption: {type: string, value: string} | undefined) => string} */
function generateOutput(selectedOption) {
  if (!selectedOption) {
    return "";
  }
  const { type, value } = selectedOption;

  switch (type) {
    case "screen":
      return `[SELECTION]/screen:${value}`;
    case "region":
      return `[SELECTION]/region:${executeBash('slurp -f "%o@%x,%y,%w,%h"')}`;
    case "window":
      return `[SELECTION]/window:${value}`;
    default:
      return "";
  }
}

/** @type {() => {id: string, name: string}[]} */
function getMonitors() {
  /** @type {{name: string, description: string}[]} */
  let monitors;
  try {
    monitors = JSON.parse(executeBash("hyprctl -j monitors"));
  } catch (err) {
    return [];
  }

  return monitors.map((monitor) => {
    return {
      id: monitor.name,
      name: `${monitor.description} (${monitor.name})`,
    };
  });
}

/** @type {() => {id: string, app: string, name: string}[]} */
function getWindows() {
  const windows = [];
  const windowPayload = Bun.env.XDPH_WINDOW_SHARING_LIST?.trim();
  if (!windowPayload) {
    return [];
  }
  // Each record from xdph is formatted as:
  //   id[HC>]class[HT>]title[HE>]mappingId[HA>]
  // with no separator before the next record's id, so split on the
  // trailing "[HA>]" first to isolate whole records.
  const entries = windowPayload.split("[HA>]");
  for (const windowEntry of entries) {
    try {
      if (!windowEntry) {
        continue;
      }
      const [beforeMappingId] = windowEntry.split("[HE>]");
      const explodeId = beforeMappingId.split("[HC>]");
      const id = explodeId[0];
      const explodeApp = explodeId[1].split("[HT>]");
      const app = explodeApp[0];
      const name = explodeApp[1];
      windows.push({ id, app, name });
    } catch (err) {
      continue;
    }
  }
  return windows;
}

/** @type {() => Map<string, {type: string, value: string}>} */
function generateSelectionList() {
  const selectionList = new Map();
  const monitors = getMonitors();
  const windows = getWindows();
  for (const monitor of monitors) {
    selectionList.set(`Screen: ${monitor.name}`, {
      type: "screen",
      value: monitor.id,
    });
  }
  selectionList.set("Selection: Region", { type: "region", value: "region" });
  for (const window of windows) {
    selectionList.set(`Window: ${window.app} - ${window.name}`, {
      type: "window",
      value: window.id,
    });
  }

  return selectionList;
}

/** @type {(list: string) => string} */
function showSelectionList(list) {
  return executeBash(`echo "${list}" | ${config.menuCommand}`);
}

/** @type {() => void} */
function createCacheDirectory() {
  executeBash(`mkdir -p ${config.cacheDirectory}`);
}

/** @type {() => Config} */
function getDefaults() {
  const defaults = {
    menuCommand: "",
    cacheDirectory: "~/.cache/hyprhelpr/screenshare",
    cacheFile: "debounce",
    debounceDuration: 5,
  };
  return defaults;
}
