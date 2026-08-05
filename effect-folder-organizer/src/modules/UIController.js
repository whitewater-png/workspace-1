/* global window, document, module */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});
  const logger = EFO.logger;

  function createUIController({ projectAnalyzer, storage, clipboard }) {
    const organizeAssistant = EFO.OrganizeAssistant.create();
    let effectListManager = null;
    let currentSort = { key: "displayName", direction: "asc" };

    const el = {
      status: document.getElementById("status-message"),
      scanButton: document.getElementById("scan-button"),
      progressWrap: document.getElementById("scan-progress"),
      progressFill: document.getElementById("scan-progress-fill"),
      progressLabel: document.getElementById("scan-progress-label"),
      searchInput: document.getElementById("search-input"),
      categoryFilter: document.getElementById("category-filter"),
      tableBody: document.getElementById("effect-table-body"),
      exportCsvButton: document.getElementById("export-csv-button"),
      exportJsonButton: document.getElementById("export-json-button"),
      caseNameInput: document.getElementById("case-name-input"),
      generateChecklistButton: document.getElementById("generate-checklist-button"),
      copyChecklistButton: document.getElementById("copy-checklist-button"),
      saveProfileButton: document.getElementById("save-profile-button"),
      loadProfileButton: document.getElementById("load-profile-button"),
      checklistOutput: document.getElementById("checklist-output"),
    };

    function setStatus(message, kind) {
      el.status.textContent = message || "";
      el.status.className = "status-message" + (kind ? ` ${kind}` : "");
    }

    function setControlsEnabled(enabled) {
      [el.exportCsvButton, el.exportJsonButton, el.generateChecklistButton, el.saveProfileButton].forEach(
        (btn) => (btn.disabled = !enabled)
      );
    }

    function renderCategoryOptions() {
      const categories = effectListManager.getCategories();
      el.categoryFilter.innerHTML = '<option value="">すべてのカテゴリ</option>';
      for (const category of categories) {
        const opt = document.createElement("option");
        opt.value = category;
        opt.textContent = category;
        el.categoryFilter.appendChild(opt);
      }
    }

    function currentFilteredSorted() {
      const filtered = effectListManager.query({
        keyword: el.searchInput.value,
        category: el.categoryFilter.value,
      });
      return effectListManager.sort(filtered, currentSort.key, currentSort.direction);
    }

    function renderTable() {
      const rows = currentFilteredSorted();
      el.tableBody.innerHTML = "";

      if (rows.length === 0) {
        const tr = document.createElement("tr");
        tr.className = "empty-row";
        tr.innerHTML = '<td colspan="3">該当するエフェクトがありません</td>';
        el.tableBody.appendChild(tr);
        return;
      }

      for (const effect of rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHTML(effect.displayName)}</td>
          <td>${escapeHTML(effect.category)}</td>
          <td>${effect.usageCount}</td>
        `;
        el.tableBody.appendChild(tr);
      }
    }

    function escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = String(str ?? "");
      return div.innerHTML;
    }

    async function handleScan() {
      el.scanButton.disabled = true;
      el.progressWrap.classList.remove("hidden");
      el.progressFill.style.width = "0%";
      el.progressLabel.textContent = "スキャン中...";
      setStatus("プロジェクトを解析しています...");

      try {
        const records = await projectAnalyzer.scanActiveProject(({ processedClips, done }) => {
          el.progressLabel.textContent = done ? "完了" : `${processedClips} クリップ処理済み`;
          if (done) el.progressFill.style.width = "100%";
        });

        effectListManager = EFO.EffectListManager.create(records);
        renderCategoryOptions();
        renderTable();
        setControlsEnabled(effectListManager.count > 0);
        setStatus(`スキャン完了: ${effectListManager.count} 件のエフェクトを検出しました`, "success");
      } catch (err) {
        logger.error(err);
        setStatus(err.message || "スキャン中にエラーが発生しました", "error");
      } finally {
        el.scanButton.disabled = false;
        el.progressWrap.classList.add("hidden");
      }
    }

    async function handleExport(format) {
      if (!effectListManager) return;
      const rows = currentFilteredSorted();
      const content = format === "csv" ? effectListManager.toCSV(rows) : effectListManager.toJSON(rows);
      const fileName = `effects.${format}`;
      try {
        const saved = await effectListManager.exportToFile(storage, { fileName, content });
        setStatus(saved ? `${fileName} を保存しました` : "保存をキャンセルしました", saved ? "success" : undefined);
      } catch (err) {
        logger.error(err);
        setStatus(err.message || "エクスポート中にエラーが発生しました", "error");
      }
    }

    function handleGenerateChecklist() {
      if (!effectListManager) return;
      const caseName = el.caseNameInput.value.trim();
      const checklist = organizeAssistant.buildChecklist(caseName, currentFilteredSorted());
      el.checklistOutput.textContent = checklist;
      el.checklistOutput.classList.remove("hidden");
      el.copyChecklistButton.disabled = false;
    }

    async function handleCopyChecklist() {
      try {
        await organizeAssistant.copyToClipboard(clipboard, el.checklistOutput.textContent);
        setStatus("チェックリストをクリップボードにコピーしました", "success");
      } catch (err) {
        logger.error(err);
        setStatus(err.message || "コピーに失敗しました", "error");
      }
    }

    async function handleSaveProfile() {
      if (!effectListManager) return;
      const caseName = el.caseNameInput.value.trim() || "無題の案件";
      const profile = organizeAssistant.buildProfile(caseName, currentFilteredSorted());
      const content = organizeAssistant.serializeProfile(profile);
      try {
        const saved = await effectListManager.exportToFile(storage, {
          fileName: `${caseName}.efoprofile.json`,
          content,
        });
        setStatus(saved ? "プロファイルを保存しました" : "保存をキャンセルしました", saved ? "success" : undefined);
      } catch (err) {
        logger.error(err);
        setStatus(err.message || "プロファイル保存に失敗しました", "error");
      }
    }

    async function handleLoadProfile() {
      if (!storage || !storage.localFileSystem) {
        setStatus("ファイル読込機能を利用できません", "error");
        return;
      }
      try {
        const file = await storage.localFileSystem.getFileForOpening({ types: ["json"] });
        if (!file) return;
        const text = await file.read();
        const profile = organizeAssistant.parseProfile(text);
        el.caseNameInput.value = profile.caseName || "";
        const checklist = organizeAssistant.buildChecklist(profile.caseName, profile.effects.map((e) => ({ ...e, usageCount: e.usageCount || 0 })));
        el.checklistOutput.textContent = checklist;
        el.checklistOutput.classList.remove("hidden");
        el.copyChecklistButton.disabled = false;
        setStatus(`プロファイル「${profile.caseName}」を読み込みました`, "success");
      } catch (err) {
        logger.error(err);
        setStatus(err.message || "プロファイル読込に失敗しました", "error");
      }
    }

    function bindSortHeaders() {
      document.querySelectorAll("#effect-table th[data-sort-key]").forEach((th) => {
        th.addEventListener("click", () => {
          const key = th.getAttribute("data-sort-key");
          if (currentSort.key === key) {
            currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
          } else {
            currentSort = { key, direction: "asc" };
          }
          if (effectListManager) renderTable();
        });
      });
    }

    function init() {
      el.scanButton.addEventListener("click", handleScan);
      el.searchInput.addEventListener("input", () => effectListManager && renderTable());
      el.categoryFilter.addEventListener("change", () => effectListManager && renderTable());
      el.exportCsvButton.addEventListener("click", () => handleExport("csv"));
      el.exportJsonButton.addEventListener("click", () => handleExport("json"));
      el.generateChecklistButton.addEventListener("click", handleGenerateChecklist);
      el.copyChecklistButton.addEventListener("click", handleCopyChecklist);
      el.saveProfileButton.addEventListener("click", handleSaveProfile);
      el.loadProfileButton.addEventListener("click", handleLoadProfile);
      bindSortHeaders();
      setStatus("スキャンを開始してください");
    }

    return { init };
  }

  EFO.UIController = { create: createUIController };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = EFO.UIController;
  }
})(typeof window !== "undefined" ? window : global);
