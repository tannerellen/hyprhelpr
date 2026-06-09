import { executeBash, replaceRelativeHome, dependencyExists } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{[key: string]: string}} OnSaveCommands */

/** @typedef {{cacheDirectory: string, cacheFilePath: string, directory: string, fileName: string, filePath: string, concatListFile: string, recordingTimeFile: string, recordingStateFile: string, recorderExec: string, recorderArgs: [], recordingIcon: string, pauseIcon: string, format: string, recordingDisplayFile: string, onInterfaceUpdateCommand: string, onSaveCommands: OnSaveCommands, silent: boolean}} Config */

/** @typedef {{region: string}} State */

/** @typedef {{savecommand?: string, silent?: boolean, audio?: boolean}} Args*/

/** @type {Config} */
let config;
/** @type {State} */
let state;
/** @type {Args} */
let args;

/** @type {(configInput: ConfigInput, action?: string, selection?: string, argsInput?: any) => Promise<void>} */
export default async function load(configInput, action, selection, argsInput) {
  args = argsInput;
  config = createModuleConfig(configInput, getDefaults());
  state = await getState();
  // Check external dependency
  if (!dependencyExists(config.recorderExec)) {
    console.log(
      `Recorder app ${config.recorderExec} does not exist on this system`,
    );
    return;
  }
  switch (action) {
    case "stop":
      stop();
      break;
    case "pause":
      pause();
      break;
    default:
      start(selection);
  }
}

/** @type {(selection?: string) => void} */
function start(selection) {
  // If recording is already happening stop that and exit
  if (isRecording()) {
    stop();
    return;
  }

  if (selection === "portal" && config.recorderExec !== "gpu-screen-recorder") {
    console.log(
      `${config.recorderExec} does not support portal capture, use gpu-screen-recorder for portal mode`,
    );
    return;
  }

  createCacheDirectory();

  const commandArgs = [config.recorderExec];

  let region = state.region;
  if (selection === "region") {
    region = executeBash("slurp");
  }

  // Create arguments for recorder app
  commandArgs.push(
    ...recorderArguments(config.recorderExec, selection, region),
  );

  // Start recording
  executeBash(`nohup ${commandArgs.join(" ")} &`);

  saveState({ region });

  // Start timer and bar display
  timer();
}

/** @type {(selection?: string) => void} */
function pause(selection) {
  // If recording isn't already happening start that and exit
  if (!isRecording()) {
    start(selection);
    return;
  }

  killRecorder(`${config.pauseIcon} paused`);

  // Move temp cache file to named file
  executeBash(
    `mv "${config.cacheFilePath}.${config.format}" "${config.cacheDirectory}/${config.fileName}.${config.format}"`,
  );
  executeBash(
    `find "${config.cacheDirectory}" -iname "*.${config.format}" |  sort |  sed 's:\ :\\\ :g'| sed 's/^/file /' > "${config.concatListFile}"`,
  );
}

/** @type {() => void} */
function stop() {
  killRecorder(`${config.recordingIcon} processing`);

  // Give a bit of time for the recording to write to disk
  globalThis.setTimeout(() => {
    // Save the video
    save();
    // Run save commands
    runOnSaveCommands(args.savecommand);
    // Clear recording ui
    executeBash(`: > "${config.recordingDisplayFile}"`);
    if (config.onInterfaceUpdateCommand) {
      executeBash(`echo "" | ${config.onInterfaceUpdateCommand}`);
    }
    // Clear old cache files in case they exist
    cleanCacheFolder();
  }, 1000);
}

/** @type {() => Promise<void>} */
async function save() {
  // Make directory to store final screencast if necessary
  executeBash(`mkdir -p ${config.directory}`);

  if (concatFileExists()) {
    // Make directory to store final screencast if necessary
    executeBash(
      `mv "${config.cacheFilePath}.${config.format}" "${config.cacheDirectory}/${config.fileName}.${config.format}"`,
    );
    // Find all video files in temp directory and add them to the concat list
    executeBash(
      `find "${config.cacheDirectory}" -iname "*.${config.format}" |  sort |  sed 's:\ :\\\ :g'| sed 's/^/file /' > "${config.concatListFile}"`,
    );
    // Use ffmpeg to concatenate individual files into one
    executeBash(
      `ffmpeg -f concat -safe 0 -i "${config.concatListFile}" -c copy "${config.cacheDirectory}/concat.${config.format}"`,
    );
    // Copy temporary file to final location
    executeBash(
      `cp "${config.cacheDirectory}/concat.${config.format}" "${config.filePath}.${config.format}"`,
    );
  } else {
    // Copy single file to final location
    executeBash(
      `cp "${config.cacheFilePath}.${config.format}" "${config.filePath}.${config.format}"`,
    );
  }
}

/** @type {(uiContent: string) => void} */
function killRecorder(uiContent) {
  executeBash(`killall ${config.recorderExec}`);
  killTimer();
  executeBash(`echo "${uiContent}" > "${config.recordingDisplayFile}"`);
  if (config.onInterfaceUpdateCommand) {
    executeBash(`echo "${uiContent}" | ${config.onInterfaceUpdateCommand}`);
  }
}

/** @type {(name?: string) => void} */
function runOnSaveCommands(name) {
  if (!config.onSaveCommands) {
    return;
  }

  const commands = name
    ? { [name]: config.onSaveCommands[name] }
    : config.onSaveCommands;

  for (const name in commands) {
    executeBash(
      `echo "${config.filePath}.${config.format}" | ${replaceRelativeHome(commands[name])}`,
    );
  }
}

/** @type {() => string} */
function isRecording() {
  return executeBash(`pgrep -f "${config.recorderExec}"`);
}

/** @type {() => void} */
function createCacheDirectory() {
  executeBash(`mkdir -p ${replaceRelativeHome(config.cacheDirectory)}`);
}

/** @type {() => void} */
function cleanCacheFolder() {
  executeBash(`rm -r ${config.cacheDirectory}`);
}

/** @type {() => void} */
function killTimer() {
  const timer = executeBash(`pgrep -f "## hyprhelpr screencast timer ##"`);
  executeBash(`kill ${timer}`);
}

/** @type {() => void} */
function timer() {
  const lines = [
    `## hyprhelpr screencast timer ##`,
    `prefix="${config.recordingIcon} "`,
    `display_file=${config.recordingDisplayFile}`,
    `time_file=${config.recordingTimeFile}`,
    `cache_dir=$(dirname "$display_file")`,
    `mkdir -p "$cache_dir"`,
    `# Initialize the elapsed time`,
    `if [[ -f "$time_file" ]]; then`,
    `# Read the contents of the file into a variable`,
    `offset=$(<"$time_file")`,
    `else`,
    `offset=0`,
    `fi`,
    `elapsed_time=$offset`,
    `start_time=$(($(date +%s) + offset))`,

    `# Function to display the elapsed time`,
    `display_time() {`,
    `if [[ ! -d "$cache_dir" ]]; then`,
    `exit 0`,
    `fi`,
    `display=$(printf "$prefix%02d:%02d:%02d" $((elapsed_time / 3600)) $(( (elapsed_time % 3600) / 60 )) $((elapsed_time % 60)))`,
    `printf "$display" > "$display_file"`,
    `echo "$elapsed_time" > "$time_file"`,
    `echo "$display" | ${config.onInterfaceUpdateCommand}`,
    `}`,
    `while true; do`,
    `current_time=$(($(date +%s) + offset))`,
    `if [[ $((start_time - current_time)) != elapsed_time ]]; then`,
    `display_time`,
    `fi`,
    `sleep 0.25`,
    `elapsed_time=$((current_time - start_time + offset))`,
    `done`,
  ];
  const proc = Bun.spawn(["bash", "-c", `${lines.join("\n")}`]);
  proc.unref();
}

/** @type {(date: Date) => string} */
function dateToString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

/** @type {(value: string | number) => string} */
function pad(value) {
  return `00${value}`.slice(-2);
}

/** @type {() => Promise<any>} */
async function getState() {
  try {
    const stateJson = Bun.file(config.recordingStateFile);
    return await stateJson.json();
  } catch (err) {
    return {};
  }
}

/** @type {(state: State) => Promise<void>} */
async function saveState(state) {
  try {
    await Bun.write(config.recordingStateFile, JSON.stringify(state));
  } catch (err) {
    throw err;
  }
}

/** @type {() => boolean} */
function concatFileExists() {
  const concatFileExists = executeBash(
    [`if [[ -f "${config.concatListFile}" ]]; then`, `echo true`, `fi`].join(
      "\n",
    ),
  );
  return concatFileExists === "true";
}

/** @type {(region?: string) => string} */
function slurpRegionToGsrRegion(region) {
  if (!region) {
    return "";
  }

  // slurp format: "x,y widthxheight"
  const slurpRegionMatch = region.match(/^(\d+),(\d+)\s+(\d+)x(\d+)$/);
  if (slurpRegionMatch) {
    const [, x, y, width, height] = slurpRegionMatch;
    return `${width}x${height}+${x}+${y}`;
  }

  // If already in gpu-screen-recorder format then use as-is.
  const gsrRegionMatch = region.match(/^\d+x\d+\+\d+\+\d+$/);
  return gsrRegionMatch ? region : "";
}

/** @type {(recorderExec: string, selection?: string, region?: string) => string[]} */
function recorderArguments(recorderExec, selection, region) {
  /** @type {{[key: string]: string[]}} */
  const defaults = {};

  // Recorder defaults
  defaults["wf-recorder"] = [
    `--codec "libx264"`,
    `--audio -C "aac"`,
    `-p preset="superfast"`,
    `-p vprofile="high"`,
    `-p level="42"`,
    `--file="${config.cacheFilePath}.${config.format}"`,
    selection === "region" && region ? `-g "${region}"` : `-g screen`,
  ];

  defaults["wl-screenrec"] = [
    `--audio`,
    `--filename "${config.cacheFilePath}.${config.format}"`,
    selection === "region" && region
      ? `--geometry "${region}"`
      : `--geometry screen`,
  ];

  const gsrRegion = slurpRegionToGsrRegion(region);
  defaults["gpu-screen-recorder"] = [
    selection === "portal"
      ? `-w portal`
      : selection === "region"
        ? `-w region`
        : `-w screen`,
    ...(selection === "region" && gsrRegion ? [`-region ${gsrRegion}`] : []),
    `-f 15`,
    `-k h264`,
    `-a default_output`,
    `-ac aac`,
    `-q very_high`,
    `-o "${config.cacheFilePath}.${config.format}"`,
  ];
  const recorderArgs = config.recorderArgs
    ? config.recorderArgs
    : (defaults[recorderExec] ?? []);

  return (config.silent && !args.audio) || args.silent
    ? recorderArgs.filter((/** @type{string} */ arg) => {
        return !arg.startsWith("--audio") && !arg.startsWith("-a ");
      })
    : recorderArgs;
}

/** @type {() => {}} */
function getDefaults() {
  /** @type {{[key: string]: any}} */
  const defaults = {
    recorderExec: "wf-recorder",
    filePrefix: "screen-recording",
    silent: false,
    recordingIcon: " ",
    pauseIcon: "󰏤",
    format: "mp4",
    onSaveCommands: "",
    onInterfaceUpdateCommand: "",
    cacheDirectory: "~/.cache/hyprhelpr/screencasts",
    directory: "~/Videos/Screencasts",
  };

  defaults.cacheFilePath = `${defaults.cacheDirectory}/${defaults.filePrefix}`;
  defaults.recordingDisplayFile = `${defaults.cacheDirectory}/recording-display`;
  defaults.recordingTimeFile = `${defaults.cacheDirectory}/recording-time`;
  defaults.concatListFile = `${defaults.cacheDirectory}/concat-list`;
  defaults.recordingStateFile = `${defaults.cacheDirectory}/recording-state`;

  defaults.fileName = `${defaults.filePrefix}_${dateToString(new Date())}`;
  defaults.filePath = `${defaults.directory}/${defaults.fileName}`;

  return defaults;
}
