import { executeCommand, listFiles, replaceRelativeHome } from "../system";

const defaults = {
  cacheDirectory: "~/.cache/wallpapers",
  cacheFile: "wallpaper",
};

let config = {};

/** @type {(configInput: Object, action?: string, path?: string) => void} */
export default function load(configInput, action, path) {
  config = configInput;
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
  executeCommand([
    "bash",
    "-c",
    `cp ${config.directory}/${file} ${defaults.cacheDirectory}/${defaults.cacheFile}`,
  ]);
}

/** @type {(monitors: Array<string>) => void}*/
function setWallpaper(monitors) {
  const wallpaperToLoad = `${defaults.cacheDirectory}/${defaults.cacheFile}`;

  // Don't set the wallpaper if none exists
  if (!wallpaperToLoad) {
    console.log("Missing wallpaper in cache");
    return;
  }

  executeCommand(["hyprctl", "hyprpaper", "unload", "all"]);
  executeCommand([
    "bash",
    "-c",
    `hyprctl hyprpaper preload "${wallpaperToLoad}"`,
  ]);

  for (const monitor of monitors) {
    executeCommand([
      "bash",
      "-c",
      `hyprctl hyprpaper wallpaper "${monitor},${wallpaperToLoad}"`,
    ]);
  }
}

/** @type {() => Array<string>} */
function getMonitors() {
  const commandArgs = ["hyprctl", "-j", "monitors"];
  return JSON.parse(executeCommand(commandArgs)).map((monitor) => {
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
  executeCommand(["mkdir", "-p", replaceRelativeHome(defaults.cacheDirectory)]);
}
