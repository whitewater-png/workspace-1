# Discord × Claude Bot (LM Studio 連携)

LM Studio で実行している Gemma2 12B をローカルで Discord に統合します。

## 特徴

- ✅ **完全無料** - Claude API 不要
- ✅ **オフライン対応** - ローカルで完全に動作
- ✅ **複数機能**
  - テキスト応答（質問応答）
  - コード生成（複数言語対応）
  - テキスト要約
  - テキスト翻訳
- ✅ **リアルタイム処理** - Discord コマンドで即座に実行

## セットアップ

### 1. 環境構築

```bash
# 依存パッケージをインストール
pip install -r requirements.txt
```

### 2. Discord Bot トークン取得

1. [Discord Developer Portal](https://discord.com/developers/applications) に移動
2. 「New Application」をクリック
3. Bot の名前を入力して作成
4. 「Bot」セクションで「Add Bot」をクリック
5. Token をコピー（`TOKEN` の右側の「Copy」ボタン）
6. `Intents` で以下を有効化：
   - `Message Content Intent` ✅

### 3. Bot の権限設定

1. 「OAuth2」→「URL Generator」に進む
2. スコープで「bot」を選択
3. パーミッションで以下を選択：
   - Send Messages
   - Read Messages/View Channels
   - Read Message History
4. 生成された URL で Discord サーバーに Bot を招待

### 4. 環境変数設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` を編集して Discord Token を設定：

```
DISCORD_TOKEN=your_discord_bot_token_here
LM_STUDIO_URL=http://localhost:1234/v1
```

### 5. LM Studio サーバー起動

1. LM Studio を開く
2. Gemma2 12B モデルをロード
3. 「Start Server」をクリック
4. ローカルサーバー（http://localhost:1234）が起動したことを確認

### 6. Bot 起動

```bash
python main.py
```

ターミナルに以下のメッセージが表示されたら成功：
```
✅ Bot is ready! Logged in as YourBotName#0000
✅ LM Studio に接続しました
```

## コマンド一覧

### `!ask <質問>`
質問に答えます

```
!ask Python の list comprehension について教えてください
```

### `!code [言語] <説明>`
コードを生成します。言語はデフォルト Python

```
!code python リスト内の偶数を抽出する関数
!code javascript React のカウンター コンポーネント
```

### `!summarize <テキスト>`
テキストを簡潔に要約します

```
!summarize 長い記事のテキスト...
```

### `!translate <テキスト>`
テキストを日本語に翻訳します

```
!translate Hello, how are you?
```

### `!help_claude`
コマンド一覧を表示します

## トラブルシューティング

### エラー: DISCORD_TOKEN が設定されていない

→ `.env` ファイルに `DISCORD_TOKEN` が設定されているか確認

### エラー: LM Studio に接続できません

→ LM Studio がサーバーを起動しているか確認（http://localhost:1234 にアクセス）

### Bot がメッセージに反応しない

→ Discord サーバーで Bot に適切な権限があるか確認

### 応答が遅い

→ Gemma2 12B は処理に時間がかかります。数秒待ってください。GPU での実行を推奨します。

## ファイル構成

```
.
├── main.py                 # Discord Bot メイン
├── lm_studio_handler.py    # LM Studio API ハンドラー
├── requirements.txt        # Python パッケージ
├── .env.example           # 環境変数テンプレート
└── README.md              # このファイル
```

## カスタマイズ例

### プロンプトのカスタマイズ

`lm_studio_handler.py` の `generate_code()` メソッドでプロンプトを変更：

```python
prompt = f"""Create {language} code for: {description}
Return ONLY code, no explanations."""
```

### 別のモデルを使用

LM Studio で別のモデル（Llama, Mistral など）をロードできます。Bot は自動的に認識します。

## ライセンス

MIT License

## サポート

問題が発生した場合：
1. LM Studio サーバーが起動しているか確認
2. Discord Token が正しいか確認
3. `requirements.txt` のパッケージが全てインストール済みか確認
