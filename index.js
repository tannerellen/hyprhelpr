import { parseArgs } from "util";
import { showHelp, showVersion } from "./src/help";
import { loadConfig, getConfig } from "./src/config";
import menu from "./src/menu";
import zoom from "./src/zoom";
import toggle from "./src/toggle";
import wallpaper from "./src/wallpaper";

// Parse arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  strict: false,
  allowPositionals: true,
});

const module = positionals[2];
const target = positionals[3];
const param = positionals[4];

// Initialize menu
loadConfig()
  .then(() => {
    run();
  })
  .catch((err) => {
    console.log(`Config error: ${err.message}`);
  });

function run() {
  const moduleConfig = getConfig(module);
  switch (module) {
    case "menu":
      menu(moduleConfig);
      break;
    case "toggle":
      toggle(moduleConfig, target);
      break;
    case "zoom":
      zoom(moduleConfig, target);
      break;
    case "wallpaper":
      wallpaper(moduleConfig, target, param);
      break;
    default:
      processNamedArgs(values);
  }
}

/** @type {(args: Object{unknown}) => void} */
function processNamedArgs(args) {
  if (!args) {
    return;
  }
  if (args.version) {
    showVersion();
  } else {
    showHelp();
  }
}
