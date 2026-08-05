require("../src/utils/logger");
require("../src/utils/parser");
const EffectListManager = require("../src/modules/EffectListManager");

function sampleRecords() {
  return [
    { matchName: "AE.Blur", displayName: "ガウスぼかし", category: "ぼかし" },
    { matchName: "AE.Blur", displayName: "ガウスぼかし", category: "ぼかし" },
    { matchName: "AE.Glow", displayName: "グロー", category: "スタイライズ" },
    { matchName: "AE.Reverb", displayName: "リバーブ", category: "オーディオ" },
  ];
}

describe("EffectListManager", () => {
  test("dedupes on creation and exposes count", () => {
    const manager = EffectListManager.create(sampleRecords());
    expect(manager.count).toBe(3);
  });

  test("getCategories returns unique sorted categories", () => {
    const manager = EffectListManager.create(sampleRecords());
    expect(manager.getCategories()).toEqual(expect.arrayContaining(["ぼかし", "スタイライズ", "オーディオ"]));
  });

  test("query filters by keyword and category", () => {
    const manager = EffectListManager.create(sampleRecords());
    expect(manager.query({ keyword: "グロー" })).toHaveLength(1);
    expect(manager.query({ category: "オーディオ" })).toHaveLength(1);
    expect(manager.query({ keyword: "存在しない" })).toHaveLength(0);
  });

  test("sort orders by usageCount descending", () => {
    const manager = EffectListManager.create(sampleRecords());
    const sorted = manager.sort(manager.getAll(), "usageCount", "desc");
    expect(sorted[0].matchName).toBe("AE.Blur");
    expect(sorted[0].usageCount).toBe(2);
  });

  test("exportToFile writes content and returns true", async () => {
    const manager = EffectListManager.create(sampleRecords());
    const writtenFiles = [];
    const storage = {
      localFileSystem: {
        getFileForSaving: async (fileName) => ({
          write: async (content) => writtenFiles.push({ fileName, content }),
        }),
      },
    };

    const result = await manager.exportToFile(storage, { fileName: "effects.csv", content: manager.toCSV() });

    expect(result).toBe(true);
    expect(writtenFiles).toHaveLength(1);
    expect(writtenFiles[0].fileName).toBe("effects.csv");
  });

  test("exportToFile returns false when user cancels the save dialog", async () => {
    const manager = EffectListManager.create(sampleRecords());
    const storage = { localFileSystem: { getFileForSaving: async () => null } };
    const result = await manager.exportToFile(storage, { fileName: "effects.csv", content: "x" });
    expect(result).toBe(false);
  });

  test("exportToFile throws a friendly error when storage API is unavailable", async () => {
    const manager = EffectListManager.create(sampleRecords());
    await expect(manager.exportToFile(null, { fileName: "x.csv", content: "x" })).rejects.toThrow();
  });
});
