# インストール手順

## 前提

- macOS 12.0 以上（Apple Silicon対応、M4 Max含む）
- Adobe Premiere Pro 2024.6 以降
- [UXP Developer Tool (UDT)](https://github.com/Adobe-CEP/UXP-Developer-Tool)
- Node.js（開発・テスト用。プラグイン本体の実行には不要）

## 手順

1. Premiere Pro を起動し、環境設定で UXP の Developer Mode を有効化します。
2. UXP Developer Tool を起動し、「Add Plugin」からこのリポジトリ内の `effect-folder-organizer/manifest.json` を選択します。
3. UDT上のプラグイン一覧から「Load」を実行します。
4. Premiere Pro のメニュー「ウィンドウ」→「拡張機能（UXP Plugins）」→「Effect Folder Organizer」を選択してパネルを開きます。
5. パネルが表示されない場合は、UDTで「Watch」を有効にしてログを確認し、`manifest.json` のホストバージョン（`minVersion`）が実際のPremiere Proバージョンと合っているか確認してください。

## 開発モードでのデバッグ

UDTの「Debug」ボタンから、Chromium DevTools 相当のデバッガに接続できます。`src/utils/logger.js` の `setDebugMode(true)` を呼び出すとコンソールに詳細ログが出力されます。

## npm 依存関係（開発用）

```bash
cd effect-folder-organizer
npm install
```

`@adobe/premierepro` の型定義と `@adobe/eslint-plugin-premierepro` を導入し、存在しないAPI名の誤用を静的解析で検出します。
