import { executeBash } from "../system";
import { createModuleConfig } from "../config";

// Type definitions
/** @typedef {{}} ConfigInput */

/** @typedef {{default: number | string, animate: boolean, duration: number, fps: number}} Config */

/** @type {Config} */
let config;

/** @type {(configInput: ConfigInput, target: string) => void} */
export default function load(configInput, target) {
  config = createModuleConfig(configInput, getDefaults());
  const changeValue = !target ? 0 : parseFloat(target);
  run(changeValue);
}

/** @type {(changeValue: number) => void} */
function run(changeValue) {
  // Default toggle zoom behavior if no change value is given
  const zoomFactor = getZoomFactor();

  if (!changeValue) {
    changeValue =
      zoomFactor !== 1
        ? 1 - zoomFactor
        : typeof config.default === "number"
          ? config.default
          : parseFloat(config.default);
  }

  if (config.animate) {
    const targetZoomFactor = Math.max(zoomFactor + changeValue, 1);
    animateZoom(zoomFactor, targetZoomFactor, targetZoomFactor - zoomFactor);
  } else {
    setZoomFactor(Math.max(zoomFactor + changeValue, 1));
  }
}

/** @type {(startingZoomFactor: number, endingZoomFactor: number, delta: number) => void} */
function animateZoom(currentZoomFactor, endingZoomFactor, delta) {
  const animationTime = config.duration * 1000;
  const fps = config.fps;
  const frameDelay = 1000 / fps; // Tick time
  const animationStepAmount = delta / (animationTime / frameDelay);

  if (delta >= 0) {
    currentZoomFactor = Math.min(
      currentZoomFactor + animationStepAmount,
      endingZoomFactor,
    );
  } else {
    currentZoomFactor = Math.max(
      currentZoomFactor + animationStepAmount,
      endingZoomFactor,
    );
  }

  setZoomFactor(currentZoomFactor);

  if (currentZoomFactor !== endingZoomFactor) {
    setTimeout(() => {
      animateZoom(currentZoomFactor, endingZoomFactor, delta);
    }, frameDelay);
  }
}

/** @type {() => number} */
function getZoomFactor() {
  const commandResult = executeBash("hyprctl getoption cursor:zoom_factor");
  return parseFloat(commandResult.split("\n")[0].split(": ")[1]);
}

/** @type {(zoomFactor: number) => void} */
function setZoomFactor(zoomFactor) {
  executeBash(`hyprctl keyword cursor:zoom_factor ${zoomFactor}`);
}

/** @type {() => {}} */
function getDefaults() {
  const defaults = {
    default: 0.5,
    fps: 60,
    duration: 0.2,
    animate: false,
  };
  return defaults;
}
