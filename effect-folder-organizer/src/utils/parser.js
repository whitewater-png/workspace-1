/* global window, module */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});

  /**
   * Normalizes a raw UXP component object (from trackItem.getComponentChain())
   * into a plain, serializable record used throughout the UI and exports.
   */
  function componentToRecord(component, categoryLookup) {
    const matchName = component.matchName || "";
    const displayName = component.displayName || matchName || "不明なエフェクト";
    const category = (categoryLookup && categoryLookup.get(matchName)) || "その他";

    return {
      matchName,
      displayName,
      category,
    };
  }

  /**
   * Deduplicates a flat list of effect records, counting usage across clips.
   * Two records are considered the same effect when matchName matches
   * (falling back to displayName when matchName is unavailable).
   */
  function dedupeEffects(records) {
    const byKey = new Map();

    for (const record of records) {
      const key = record.matchName || record.displayName;
      if (!byKey.has(key)) {
        byKey.set(key, {
          matchName: record.matchName,
          displayName: record.displayName,
          category: record.category,
          usageCount: 0,
        });
      }
      byKey.get(key).usageCount += 1;
    }

    return Array.from(byKey.values());
  }

  function toCSV(effects) {
    const header = ["エフェクト名", "カテゴリ", "使用数", "エフェクトID"];
    const rows = effects.map((e) => [
      escapeCSVField(e.displayName),
      escapeCSVField(e.category),
      String(e.usageCount),
      escapeCSVField(e.matchName),
    ]);
    return [header, ...rows].map((r) => r.join(",")).join("\r\n");
  }

  // Characters that Excel/Numbers/Sheets interpret as the start of a formula.
  // Effect display names originate from the opened .prproj (including
  // third-party plugin names), so a crafted project handed off by another
  // party could otherwise smuggle a formula into the exported CSV.
  const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@", "\t", "\r"];

  function escapeCSVField(value) {
    let str = String(value ?? "");
    if (FORMULA_TRIGGER_CHARS.some((c) => str.startsWith(c))) {
      // A leading apostrophe forces text interpretation in spreadsheet apps
      // without altering the visible cell value.
      str = `'${str}`;
    }
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function toJSON(effects) {
    return JSON.stringify(effects, null, 2);
  }

  const parser = { componentToRecord, dedupeEffects, toCSV, toJSON, escapeCSVField };

  EFO.parser = parser;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = parser;
  }
})(typeof window !== "undefined" ? window : global);
