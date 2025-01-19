import { homedir } from "os";

let config = {};

/** @type {() => Promise<unknown{}>} */
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

/** @type {(module?: string) => Object<unknown>} */
export function getConfig(module) {
  return module ? config[module] || {} : config;
}
