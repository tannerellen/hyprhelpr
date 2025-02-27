import { homedir } from "os";
// import { Glob } from "bun";

/** @type {(command: string[], options?: {}) => string} */
export function executeCommand(command, options) {
  try {
    const { stdout } = options
      ? Bun.spawnSync(command, options)
      : Bun.spawnSync(command);
    return stdout.toString().trim();
  } catch (err) {
    throw err;
  }
}

/** @type {(command: string, options?: {}) => string} */
export function executeBash(command, options) {
  const commandArgs = ["bash", "-c", command];
  return executeCommand(commandArgs, options);
}

/** @type {(dependency: string) => boolean} */
export function dependencyExists(dependency) {
  return !!executeBash(`which ${dependency}`);
}

/** @type {(directory: string, fileTypes: string[]) => string[]} */
export function listFiles(directory, fileTypes) {
  const typeFilter = fileTypes
    .map((type) => {
      return `-iname "*.${type}"`;
    })
    .join(" -o ");

  return executeBash(
    `find -L "${replaceRelativeHome(directory)}" -type f ${typeFilter} | sed 's|.*/||'`,
  ).split("\n");

  // I can't use bytcode compilation with the glob function so swap it out for
  // a bash find request
  // const glob = new Glob(`*.{${fileTypes.join(",")}}`);
  // const files = glob.scanSync(replaceRelativeHome(directory));
  //
  // const result = [];
  //
  // // The result of scansync doesn't appear to be an array or a map or a set
  // // a for of loop will iterate through the result though so using that to build an array
  // // The bun documentation doesn't state what the return value of scansync is
  // for (const file of files) {
  //   if (file) {
  //     result.push(file);
  //   }
  // }
  // return result;
}

/** @type {(path: string) => string} */
export function replaceRelativeHome(path) {
  if (path.includes("~/")) {
    return path.replace("~/", `${homedir}/`);
  } else {
    return path;
  }
}
