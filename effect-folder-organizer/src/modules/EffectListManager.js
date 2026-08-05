/* global window, module, require */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});
  const parser = EFO.parser;

  function createEffectListManager(rawRecords) {
    let effects = parser.dedupeEffects(rawRecords || []);

    function getAll() {
      return effects.slice();
    }

    function getCategories() {
      const categories = new Set(effects.map((e) => e.category));
      return Array.from(categories).sort((a, b) => a.localeCompare(b, "ja"));
    }

    function query({ keyword = "", category = "" } = {}) {
      const lowerKeyword = keyword.trim().toLowerCase();
      return effects.filter((e) => {
        const matchesKeyword =
          !lowerKeyword ||
          e.displayName.toLowerCase().includes(lowerKeyword) ||
          e.matchName.toLowerCase().includes(lowerKeyword);
        const matchesCategory = !category || e.category === category;
        return matchesKeyword && matchesCategory;
      });
    }

    function sort(list, sortKey, direction = "asc") {
      const sorted = list.slice().sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return av - bv;
        return String(av).localeCompare(String(bv), "ja");
      });
      return direction === "desc" ? sorted.reverse() : sorted;
    }

    function toCSV(list = effects) {
      return parser.toCSV(list);
    }

    function toJSON(list = effects) {
      return parser.toJSON(list);
    }

    /**
     * Writes text content to a file the user picks via the UXP file-save
     * dialog. `storage` is the injected `require('uxp').storage` module so
     * this stays unit-testable without a live UXP runtime.
     */
    async function exportToFile(storage, { fileName, content }) {
      if (!storage || !storage.localFileSystem) {
        throw new Error("ファイル保存機能を利用できません（UXP storage APIが見つかりません）。");
      }
      const file = await storage.localFileSystem.getFileForSaving(fileName);
      if (!file) {
        // User cancelled the save dialog.
        return false;
      }
      await file.write(content);
      return true;
    }

    return {
      getAll,
      getCategories,
      query,
      sort,
      toCSV,
      toJSON,
      exportToFile,
      get count() {
        return effects.length;
      },
    };
  }

  EFO.EffectListManager = { create: createEffectListManager };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = EFO.EffectListManager;
  }
})(typeof window !== "undefined" ? window : global);
