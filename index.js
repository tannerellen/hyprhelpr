// import { parseArgs } from "util";
import help from "./src/help";
import { loadConfig, getConfig } from "./src/config";
import menu from "./src/menu";
import zoom from "./src/zoom";
import toggle from "./src/toggle";
import wallpaper from "./src/wallpaper";

// const { values, positionals } = parseArgs({
//   args: Bun.argv,
//   strict: true,
//   allowPositionals: true,
// });
//
// console.log(values);
// console.log(positionals);

const args = Bun.argv;
const module = args[2];
const target = args[3];
const param = args[4];

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
      help();
  }
}
