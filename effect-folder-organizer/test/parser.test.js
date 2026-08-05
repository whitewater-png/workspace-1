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

  test("neutralizes leading formula-trigger characters (CSV injection guard)", () => {
    const dangerous = ["=CMD('/bin/sh')", "+1+1", "-1+1", "@SUM(A1)"];
    for (const value of dangerous) {
      const field = parser.escapeCSVField(value);
      expect(field.startsWith("'")).toBe(true);
      expect(field).toBe(`'${value}`);
    }
  });

  test("formula guard still applies when the field also needs comma-quoting", () => {
    // The field is wrapped in double quotes per CSV syntax (it contains a
    // comma), but the leading apostrophe guard must survive inside the quotes
    // so spreadsheet apps still treat the unwrapped value as text.
    const field = parser.escapeCSVField("@SUM(1,1)");
    expect(field).toBe('"\'@SUM(1,1)"');
  });

  test("does not alter benign values that merely contain a hyphen", () => {
    expect(parser.escapeCSVField("案件A-エフェクト集")).toBe("案件A-エフェクト集");
  });
});

describe("parser.toJSON", () => {
  test("round-trips through JSON.parse", () => {
    const effects = [{ displayName: "ぼかし", category: "ぼかし", usageCount: 1, matchName: "AE.Blur" }];
    const parsed = JSON.parse(parser.toJSON(effects));
    expect(parsed).toEqual(effects);
  });
});
