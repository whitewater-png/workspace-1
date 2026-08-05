require("../src/utils/logger");
const ProjectAnalyzer = require("../src/modules/ProjectAnalyzer");

function makeComponent(matchName, displayName) {
  return { matchName, displayName };
}

function makeTrackItem(components) {
  return { getComponentChain: async () => components };
}

function makeTrack(trackItems) {
  return { getTrackItems: async () => trackItems };
}

function makeMockPpro({ videoTracks = [], audioTracks = [], sequence = null, project = null } = {}) {
  const seq = sequence || {
    getVideoTrackCount: async () => videoTracks.length,
    getVideoTrack: async (i) => videoTracks[i],
    getAudioTrackCount: async () => audioTracks.length,
    getAudioTrack: async (i) => audioTracks[i],
  };
  const proj = project || { getActiveSequence: async () => seq };
  return {
    Project: { getActiveProject: async () => proj },
    constants: { TrackItemType: { CLIP: "CLIP" } },
  };
}

describe("ProjectAnalyzer.classifyCategory", () => {
  test("classifies known keywords", () => {
    expect(ProjectAnalyzer.classifyCategory("Gaussian Blur", "AE.ADBE Gaussian Blur 2")).toBe("ぼかし");
    expect(ProjectAnalyzer.classifyCategory("Reverb", "AE.Reverb")).toBe("オーディオ");
  });

  test("falls back to その他 for unknown effects", () => {
    expect(ProjectAnalyzer.classifyCategory("Mystery FX", "third.party.mystery")).toBe("その他");
  });
});

describe("ProjectAnalyzer.scanActiveProject", () => {
  test("collects components across video and audio tracks", async () => {
    const videoTrack = makeTrack([
      makeTrackItem([makeComponent("AE.Blur", "Gaussian Blur"), makeComponent("AE.Glow", "Glow")]),
      makeTrackItem([makeComponent("AE.Blur", "Gaussian Blur")]),
    ]);
    const audioTrack = makeTrack([makeTrackItem([makeComponent("AE.Reverb", "Reverb")])]);

    const ppro = makeMockPpro({ videoTracks: [videoTrack], audioTracks: [audioTrack] });
    const analyzer = ProjectAnalyzer.create(ppro);

    const records = await analyzer.scanActiveProject();

    expect(records).toHaveLength(4);
    expect(records.filter((r) => r.matchName === "AE.Blur")).toHaveLength(2);
  });

  test("reports progress via onProgress callback", async () => {
    const items = Array.from({ length: 30 }, () => makeTrackItem([makeComponent("AE.Blur", "Gaussian Blur")]));
    const ppro = makeMockPpro({ videoTracks: [makeTrack(items)], audioTracks: [] });
    const analyzer = ProjectAnalyzer.create(ppro);

    const progressCalls = [];
    await analyzer.scanActiveProject((p) => progressCalls.push(p));

    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[progressCalls.length - 1].done).toBe(true);
  });

  test("throws a friendly error when no project is open", async () => {
    const ppro = { Project: { getActiveProject: async () => null }, constants: {} };
    const analyzer = ProjectAnalyzer.create(ppro);
    await expect(analyzer.scanActiveProject()).rejects.toThrow("プロジェクトが見つかりません");
  });

  test("throws a friendly error when no sequence is open", async () => {
    const project = { getActiveSequence: async () => null };
    const ppro = { Project: { getActiveProject: async () => project }, constants: {} };
    const analyzer = ProjectAnalyzer.create(ppro);
    await expect(analyzer.scanActiveProject()).rejects.toThrow("シーケンスが見つかりません");
  });

  test("throws when premierepro module is unavailable", async () => {
    const analyzer = ProjectAnalyzer.create(null);
    await expect(analyzer.scanActiveProject()).rejects.toThrow("Premiere Pro UXP API");
  });
});
