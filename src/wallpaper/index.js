import { executeBash, listFiles } from "../system";
import { createModuleConfig } from "../config";

let config = {};

/** @type {(configInput: Object, action?: string, path?: string) => void} */
export default function load(configInput, action, path) {
  config = createModuleConfig(configInput, getDefaults());
  switch (action) {
    case "list":
      listWallpapers();
      break;
    case "set":
      run(path);
      break;
    default:
      run();
  }
}

function run(file) {
  const monitors = getMonitors();
  createCacheDirectory();
  copyToCache(file || pickRandom());
  setWallpaper(monitors);
}

/** @type {() => string} */
function pickRandom() {
  const wallpapers = getWallpapers();
  const index = Math.round(Math.random() * wallpapers.length);
  return wallpapers[index];
}

/** @type {(file: string) => void} */
function copyToCache(file) {
  executeBash(
    `cp ${config.directory}/${file} ${config.cacheDirectory}/${config.cacheFile}`,
  );
}

/** @type {(monitors: Array<string>) => void}*/
function setWallpaper(monitors) {
  const wallpaperToLoad = `${config.cacheDirectory}/${config.cacheFile}`;

  // Don't set the wallpaper if none exists
  if (!wallpaperToLoad) {
    console.log("Missing wallpaper in cache");
    return;
  }

  executeBash("hyprctl hyprpaper unload all");
  executeBash(`hyprctl hyprpaper preload "${wallpaperToLoad}"`);

  for (const monitor of monitors) {
    executeBash(`hyprctl hyprpaper wallpaper "${monitor},${wallpaperToLoad}"`);
  }
}

/** @type {() => Array<string>} */
function getMonitors() {
  return JSON.parse(executeBash("hyprctl -j monitors")).map((monitor) => {
    return monitor.name;
  });
}

/** @type {() => Array<string>} */
function getWallpapers() {
  return listFiles(config.directory, ["jpg", "png", "jpeg"]);
}

/** @type {() => {}} */
function listWallpapers() {
  console.log(getWallpapers().join("\n"));
}

/** @type {() => void} */
function createCacheDirectory() {
  executeBash(`mkdir -p ${config.cacheDirectory}`);
}

/** @type {() => Object} */
function getDefaults() {
  const defaults = {
    cacheDirectory: "~/.cache/hyprhelpr/wallpapers",
    cacheFile: "wallpaper",
    directory: "~/Wallpapers",
  };
  return defaults;
}
