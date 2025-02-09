import { homedir } from "os";
import { replaceRelativeHome } from "../system";

/** @type {{[key: string]: any}} */
let config = {};

/** @type {() => Promise<{[key: string]: any}>} */
export async function loadConfig() {
  const homeDirectory = homedir();
  const path = `${homeDirectory}/.config/hyprhelpr/config.json`;
  try {
    const file = Bun.file(path);
    const configResult = await file.json();
    config = configResult || {};
    return configResult;
  } catch (err) {
    throw err;
  }
}

/** @type {(module?: string) => {}} */
export function getConfig(module) {
  return module ? config[module] || {} : config;
}

/** @type {(config: {[key: string]: any}, defaults: {[key: string]: any}) => any} */
export function createModuleConfig(config, defaults) {
  /** @type {{[key: string]: any}} */
  const configResult = {};

  for (const property in defaults) {
    const configValue = config[property]
      ? config[property]
      : defaults[property];

    configResult[property] =
      typeof configValue === "string"
        ? replaceRelativeHome(configValue)
        : configValue;
  }
  return configResult;
}
