/* global window, module, require */
(function (global) {
  "use strict";

  const EFO = (global.EFO = global.EFO || {});
  const logger = EFO.logger || { info() {}, warn() {}, error() {} };

  // Heuristic category classification. Premiere's UXP API does not expose an
  // effect "category" field (VideoFilterFactory.getMatchNames() returns only
  // matchNames), so we classify by keyword match against known Premiere
  // category names. Unmatched effects fall back to "その他".
  const CATEGORY_KEYWORDS = [
    ["Blur", "ぼかし"],
    ["Distort", "ディストーション"],
    ["Generate", "生成"],
    ["Keying", "キーイング"],
    ["Lighting", "照明"],
    ["Perspective", "遠近"],
    ["Stylize", "スタイライズ"],
    ["Time", "時間"],
    ["Transition", "トランジション"],
    ["Adjust", "調整"],
    ["Audio", "オーディオ"],
    ["Reverb", "オーディオ"],
    ["Compressor", "オーディオ"],
    ["EQ", "オーディオ"],
  ];

  function classifyCategory(displayName, matchName) {
    const haystack = `${displayName} ${matchName}`;
    for (const [keyword, category] of CATEGORY_KEYWORDS) {
      if (haystack.toLowerCase().includes(keyword.toLowerCase())) {
        return category;
      }
    }
    return "その他";
  }

  /**
   * Reads all trackItems from a single track, tolerating differences in the
   * verified getTrackItems(type, includeEmpty) signature across API versions.
   */
  async function getAllTrackItems(track, trackItemTypeConstant) {
    if (typeof track.getTrackItems !== "function") return [];
    const result = await track.getTrackItems(trackItemTypeConstant, false);
    // UXP returns an array-like collection; normalize to a real array.
    return Array.isArray(result) ? result : Array.from(result || []);
  }

  /**
   * Extracts component (effect) records from a single trackItem's component
   * chain. The exact accessor shape of the chain object isn't pinned down by
   * the verified API reference beyond "getComponentChain() エフェクト鎖を取得",
   * so this defensively supports the array-like and indexed-accessor shapes.
   */
  async function getComponentsFromTrackItem(trackItem) {
    if (typeof trackItem.getComponentChain !== "function") return [];
    const chain = await trackItem.getComponentChain();
    if (!chain) return [];

    if (typeof chain.getComponentCount === "function" && typeof chain.getComponentAtIndex === "function") {
      const count = await chain.getComponentCount();
      const components = [];
      for (let i = 0; i < count; i++) {
        components.push(await chain.getComponentAtIndex(i));
      }
      return components;
    }

    if (Array.isArray(chain.components)) return chain.components;
    if (Array.isArray(chain)) return chain;

    return [];
  }

  function createProjectAnalyzer(pproModule) {
    const ppro = pproModule;

    async function resolveSequences(project) {
      // project.sequences is not present in the real-machine-verified API
      // table (only project.getActiveSequence() is confirmed). We try it
      // opportunistically and fall back to the active sequence only.
      if (Array.isArray(project.sequences) && project.sequences.length > 0) {
        return project.sequences;
      }
      const active = await project.getActiveSequence();
      if (!active) {
        throw new Error("開いているシーケンスが見つかりません。プロジェクト内でシーケンスを開いてから再度スキャンしてください。");
      }
      logger.warn("複数シーケンスの列挙APIが確認できないため、アクティブシーケンスのみをスキャンします。");
      return [active];
    }

    async function scanActiveProject(onProgress) {
      if (!ppro) {
        throw new Error("Premiere Pro UXP APIを初期化できませんでした。Premiere Pro内でこのパネルを実行してください。");
      }

      const project = await ppro.Project.getActiveProject();
      if (!project) {
        throw new Error("開いているプロジェクトが見つかりません。Premiere Proでプロジェクトを開いてから再度お試しください。");
      }

      const sequences = await resolveSequences(project);
      const trackItemType = ppro.constants && ppro.constants.TrackItemType ? ppro.constants.TrackItemType.CLIP : undefined;

      const records = [];
      let processedClips = 0;

      for (const sequence of sequences) {
        const videoTrackCount = (await sequence.getVideoTrackCount?.()) || 0;
        const audioTrackCount = (await sequence.getAudioTrackCount?.()) || 0;

        const tracks = [];
        for (let i = 0; i < videoTrackCount; i++) {
          tracks.push(await sequence.getVideoTrack(i));
        }
        for (let i = 0; i < audioTrackCount; i++) {
          tracks.push(await sequence.getAudioTrack(i));
        }

        for (const track of tracks) {
          const trackItems = await getAllTrackItems(track, trackItemType);

          for (const trackItem of trackItems) {
            const components = await getComponentsFromTrackItem(trackItem);

            for (const component of components) {
              const matchName = component.matchName || "";
              const displayName = component.displayName || matchName || "不明なエフェクト";
              records.push({
                matchName,
                displayName,
                category: classifyCategory(displayName, matchName),
              });
            }

            processedClips += 1;
            // Yield to the UI thread periodically on large projects instead
            // of awaiting every single clip synchronously in a tight loop.
            if (processedClips % 25 === 0) {
              if (onProgress) onProgress({ processedClips });
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }
      }

      if (onProgress) onProgress({ processedClips, done: true });

      return records;
    }

    return { scanActiveProject, classifyCategory };
  }

  EFO.ProjectAnalyzer = { create: createProjectAnalyzer, classifyCategory };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = EFO.ProjectAnalyzer;
  }
})(typeof window !== "undefined" ? window : global);
