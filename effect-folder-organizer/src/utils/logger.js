/* global window, module */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});

  let debugMode = false;

  function setDebugMode(value) {
    debugMode = Boolean(value);
  }

  function info(...args) {
    if (debugMode) console.log("[EFO]", ...args);
  }

  function warn(...args) {
    console.warn("[EFO]", ...args);
  }

  function error(...args) {
    console.error("[EFO]", ...args);
  }

  const logger = { setDebugMode, info, warn, error };
  EFO.logger = logger;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = logger;
  }
})(typeof window !== "undefined" ? window : global);
