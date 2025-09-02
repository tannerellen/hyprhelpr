import packageJson from "../../package.json";
const helpLines = [
  "A tool to help with some hyprland functions.",
  "Usage: hyprhelpr [MODULE] [ARGUMENT] [ARGUMENT]",
  "	Modules:",
  "	- menu",
  "	- toggle <name>",
  "		name: the name that matches in the toggle config",
  "	- zoom <change-value>",
  "		change-value: a numeric value to change the zoom level by",
  "	- wallpaper <action> <path>",
  "		actions: set, random, list",
  "		path: the path to an image file is setting a specific image.",
  "	- screencast <action> <selection> --savecommand",
  "		actions: start, pause, stop",
  "		selection: screen (default), region",
  "		--savecommand: specifies user defined save command to run (default runs all)",
  "		--silent: will not record audio regardless of config",
  "		--audio: will record audio regardless of config",
];

/** @type {() => void} */
export function showHelp() {
  for (const line of helpLines) {
    console.log(line);
  }
}

export async function showVersion() {
  try {
    const version = packageJson.version;
    console.log(`v${version}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : err;
    console.log(`The version number could not be read: ${message}`);
  }
}
