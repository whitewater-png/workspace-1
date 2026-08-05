/* global window, document, require */
(function (global) {
  "use strict";

  const EFO = global.EFO || {};

  function bootstrap() {
    let ppro = null;
    let uxpStorage = null;
    let uxpClipboard = null;

    try {
      ppro = require("premierepro");
    } catch (err) {
      EFO.logger && EFO.logger.warn("premierepro モジュールを読み込めませんでした（Premiere Pro外で実行中の可能性）", err);
    }

    try {
      const uxp = require("uxp");
      uxpStorage = uxp.storage;
      uxpClipboard = uxp.clipboard;
    } catch (err) {
      EFO.logger && EFO.logger.warn("uxp モジュールを読み込めませんでした", err);
    }

    const projectAnalyzer = EFO.ProjectAnalyzer.create(ppro);
    const uiController = EFO.UIController.create({
      projectAnalyzer,
      storage: uxpStorage,
      clipboard: uxpClipboard,
    });
    uiController.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})(window);
