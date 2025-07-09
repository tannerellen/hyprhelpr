import { parseArgs } from "util";
import { showHelp, showVersion } from "./src/help";
import { loadConfig, getConfig } from "./src/config";
import menu from "./src/menu";
import zoom from "./src/zoom";
import toggle from "./src/toggle";
import wallpaper from "./src/wallpaper";
import indicator from "./src/indicator";
import screencast from "./src/screencast";
import screenshare from "./src/screenshare";

// Parse arguments
const { values, positionals } = parseArgs({
  args: Bun.argv,
  strict: false,
  allowPositionals: true,
  options: {
    help: {
      type: "boolean",
    },
    version: {
      type: "boolean",
    },
    savecommand: {
      type: "string",
    },
    content: {
      type: "string",
    },
  },
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
    case "indicator":
      indicator(moduleConfig, target, param, values);
      break;
    case "screencast":
      screencast(moduleConfig, target, param, values);
      break;
    case "screenshare":
      screenshare(moduleConfig);
      break;
    default:
      processNamedArgs(values);
  }
}

/** @type {(args: {[key: string]: any}) => void} */
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
