/* global window, module, require */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});

  /**
   * OrganizeAssistant does NOT create folders inside Premiere's Effects
   * panel or place effects there automatically: no verified UXP, CEP, or QE
   * API exposes that capability (see plan doc). Instead it produces a
   * human-readable checklist for manual drag-and-drop organizing, and lets
   * the user save/restore a named "case profile" (the effect selection tied
   * to a project name) so repeat work doesn't require re-scanning.
   */
  function createOrganizeAssistant() {
    function buildChecklist(caseName, effects) {
      const title = caseName ? `【${caseName}】整理チェックリスト` : "整理チェックリスト";
      const lines = [
        title,
        "Premiereの「エフェクト」パネルで右クリック → 新規カスタムビン を作成し、",
        "以下のエフェクトを1件ずつドラッグして追加してください。",
        "",
        ...effects.map((e, i) => `[ ] ${i + 1}. ${e.displayName} (${e.category}) — 使用数: ${e.usageCount}`),
        "",
        `合計 ${effects.length} 件`,
      ];
      return lines.join("\n");
    }

    function buildProfile(caseName, effects) {
      return {
        caseName,
        savedAt: new Date().toISOString(),
        effects: effects.map((e) => ({
          matchName: e.matchName,
          displayName: e.displayName,
          category: e.category,
        })),
      };
    }

    function serializeProfile(profile) {
      return JSON.stringify(profile, null, 2);
    }

    function parseProfile(json) {
      const data = JSON.parse(json);
      if (!data || !Array.isArray(data.effects)) {
        throw new Error("プロファイル形式が不正です。");
      }
      return data;
    }

    async function copyToClipboard(clipboardModule, text) {
      if (clipboardModule && typeof clipboardModule.writeText === "function") {
        await clipboardModule.writeText(text);
        return true;
      }
      if (global.navigator && global.navigator.clipboard) {
        await global.navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error("クリップボードにアクセスできません。");
    }

    return { buildChecklist, buildProfile, serializeProfile, parseProfile, copyToClipboard };
  }

  EFO.OrganizeAssistant = { create: createOrganizeAssistant };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = EFO.OrganizeAssistant;
  }
})(typeof window !== "undefined" ? window : global);
