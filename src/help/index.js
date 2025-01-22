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
  "		actions: set, list",
  "		path: the path to an image file is setting a specific image, leave blank for random",
];

/** @type {() => void} */
export function showHelp() {
  for (const line of helpLines) {
    console.log(line);
  }
}

export async function showVersion() {
  try {
    const file = Bun.file("./package.json", {
      type: "application/json",
    });
    const packageJson = await file.json();
    console.log(`v${packageJson.version}`);
  } catch (err) {
    console.log(`The version number could not be read: ${err.message}`);
  }
}
