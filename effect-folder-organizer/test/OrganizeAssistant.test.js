const OrganizeAssistant = require("../src/modules/OrganizeAssistant");

describe("OrganizeAssistant", () => {
  const effects = [
    { matchName: "AE.Blur", displayName: "ガウスぼかし", category: "ぼかし", usageCount: 3 },
    { matchName: "AE.Glow", displayName: "グロー", category: "スタイライズ", usageCount: 1 },
  ];

  test("buildChecklist includes case name and each effect", () => {
    const assistant = OrganizeAssistant.create();
    const checklist = assistant.buildChecklist("案件A", effects);
    expect(checklist).toContain("案件A");
    expect(checklist).toContain("ガウスぼかし");
    expect(checklist).toContain("グロー");
    expect(checklist).toContain("合計 2 件");
  });

  test("buildProfile / serializeProfile / parseProfile round-trip", () => {
    const assistant = OrganizeAssistant.create();
    const profile = assistant.buildProfile("案件A", effects);
    const json = assistant.serializeProfile(profile);
    const parsed = assistant.parseProfile(json);

    expect(parsed.caseName).toBe("案件A");
    expect(parsed.effects).toHaveLength(2);
    expect(parsed.effects[0].matchName).toBe("AE.Blur");
  });

  test("parseProfile rejects malformed data", () => {
    const assistant = OrganizeAssistant.create();
    expect(() => assistant.parseProfile(JSON.stringify({ foo: "bar" }))).toThrow("プロファイル形式");
  });

  test("copyToClipboard uses the injected clipboard module", async () => {
    const assistant = OrganizeAssistant.create();
    const writes = [];
    const clipboard = { writeText: async (text) => writes.push(text) };

    await assistant.copyToClipboard(clipboard, "hello");

    expect(writes).toEqual(["hello"]);
  });

  test("copyToClipboard throws when no clipboard is available", async () => {
    const assistant = OrganizeAssistant.create();
    await expect(assistant.copyToClipboard(null, "hello")).rejects.toThrow("クリップボード");
  });
});
