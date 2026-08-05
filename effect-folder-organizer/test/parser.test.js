require("../src/utils/logger");
const parser = require("../src/utils/parser");

describe("parser.dedupeEffects", () => {
  test("merges duplicate matchNames and counts usage", () => {
    const records = [
      { matchName: "AE.Blur", displayName: "ガウスぼかし", category: "ぼかし" },
      { matchName: "AE.Blur", displayName: "ガウスぼかし", category: "ぼかし" },
      { matchName: "AE.Glow", displayName: "グロー", category: "スタイライズ" },
    ];

    const result = parser.dedupeEffects(records);

    expect(result).toHaveLength(2);
    const blur = result.find((e) => e.matchName === "AE.Blur");
    expect(blur.usageCount).toBe(2);
    const glow = result.find((e) => e.matchName === "AE.Glow");
    expect(glow.usageCount).toBe(1);
  });

  test("falls back to displayName as dedupe key when matchName missing", () => {
    const records = [
      { matchName: "", displayName: "不明なエフェクト", category: "その他" },
      { matchName: "", displayName: "不明なエフェクト", category: "その他" },
    ];
    const result = parser.dedupeEffects(records);
    expect(result).toHaveLength(1);
    expect(result[0].usageCount).toBe(2);
  });
});

describe("parser.toCSV", () => {
  test("escapes commas, quotes and newlines", () => {
    const csv = parser.toCSV([
      { displayName: 'Text, "Fancy"', category: "スタイライズ\n改行", usageCount: 3, matchName: "AE.Text" },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("エフェクト名,カテゴリ,使用数,エフェクトID");
    expect(lines[1]).toContain('"Text, ""Fancy"""');
    expect(lines[1]).toContain('"スタイライズ\n改行"');
  });
});

describe("parser.toJSON", () => {
  test("round-trips through JSON.parse", () => {
    const effects = [{ displayName: "ぼかし", category: "ぼかし", usageCount: 1, matchName: "AE.Blur" }];
    const parsed = JSON.parse(parser.toJSON(effects));
    expect(parsed).toEqual(effects);
  });
});
