# StatusCraft

> Claude Code 用のビジュアル・ステータスライン・デザイナー

[English](README.md) · **日本語**

**▶ [デザイナーを開く](https://daikin555.github.io/statuscraft/)** — ブラウザ内で完結、インストール不要。

Claude Code のステータスラインをカスタマイズするための、実際に動作する bash スクリプトを生成するブラウザベースの GUI ツールです。ビジュアルに設計して、本番投入できるスクリプトをその場で手に入れられます。

## これは何？

Claude Code はターミナル下部に、モデル名・コンテキスト使用量・コスト・レート制限などのセッション情報をリアルタイムで表示するステータスラインを備えています。このデータは、Claude Code が JSON としてセッション情報を渡しながら実行する **bash スクリプト** から生成されます。

StatusCraft を使えば、このスクリプトを手書きする必要がなくなります。代わりに次の手順で完結します。

1. ビジュアルデザイナーを開く
2. 表示したいトークン（モデル、コスト、コンテキスト % など）をクリックする
3. グループごとに色をカスタマイズする
4. 3 つの状態をシミュレートしたライブプレビューを確認する
5. Claude Code に直接適用するか、スクリプトをダウンロードする

生成されるのは、コメント付きで動作する bash スクリプトで、次の処理を扱います。

- `jq` による JSON パース
- ANSI カラーの整形
- 動的なデータ変換（経過時間の整形、数値の短縮表記、プログレスバー）
- 複数の出力状態（通常・高負荷・起動時）

## 特徴

- **その場で使える**: [ホスト版デザイナー](https://daikin555.github.io/statuscraft/) がブラウザで動作 — インストール不要・クローン不要
- **34 トークン** を 6 カテゴリで提供: Model & Session、Context Window、Cost & Activity、Rate Limits、Workspace、Advanced
- **6 個の組み込みプリセット**: Minimal、Standard、Developer、Rate-aware、Visual bar、Full info
- **ライブプレビュー**（通常・高負荷・起動時の 3 状態）
- **カラーカスタマイズ**: グループごとに 8 種類の ANSI カラー
- **複数行サポート**: 改行セパレーターで複数行ステータスラインに対応
- **言語切替**: 英語 / 日本語の UI
- **URL 共有**: デザイン設定を共有可能な URL に埋め込み
- **本物の bash スクリプト**: テンプレート文字列ではなく、適切なクォートとエラーハンドリングを備えた実行可能スクリプト
- **依存ゼロ**: 単一の HTML ファイルで、オフラインでも動作
- **ダークなターミナル基調のデザイン**: Claude Code のインターフェースに調和

## クイックスタート

### その場で使う（ホスト版）

デザイナーは GitHub Pages でホストされています。開くだけで設計を始められます:

**▶ https://daikin555.github.io/statuscraft/**

すべてブラウザ内で完結します（クライアントサイド処理で、何もアップロードされません）。ステータスラインを設計し、**生成スクリプトをコピー** または **設定をダウンロード** して、画面の手順に従ってください。

### Claude Code スキルとして使う

Claude Code のスキルとしてインストール済みの場合:

```bash
/statuscraft
```

これでブラウザにデザイナーが開きます。ステータスラインを設計し、「Claude Code に適用（Apply to Claude Code）」をクリックして CLI に戻ってください。スクリプトと設定が自動でインストールされます。

### スタンドアロンの Web アプリとして使う

1. リポジトリをクローン: `git clone https://github.com/YOUR_USER/statuscraft.git`
2. ブラウザで `index.html` を開く（または GitHub Pages 等でホスティング）
3. ステータスラインを設計する
4. 生成された bash スクリプトをコピーする
5. `~/.claude/statusline.sh` に保存する
6. `~/.claude/settings.json` に追記する:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

> **条件付きフィールド:** 時刻系トークン（`{time}`、`{rate_5h_reset}`、`{rate_7d_reset}`）を使うデザインでは、セッションがアイドル中でも値が更新され続けるよう、StatusCraft が自動的に `"refreshInterval": 60` を追加します。また `{vim_mode}` を使う場合は（モードが二重表示されないよう）`"hideVimModeIndicator": true` を追加します。時刻系・vim を使わない静的なステータスラインでは、上記の最小構成のままになります。

7. Claude Code を再起動する

## 仕組み

### Claude Code のステータスライン機構

```
Claude Code が stdin で JSON を送信 → bash スクリプトが jq で読み取る → スクリプトが整形済みテキストを出力 → ステータスラインに表示
```

**入力例**（Claude Code から）:

```json
{
  "model": {
    "display_name": "Opus",
    "id": "claude-opus-4-8"
  },
  "context_window": {
    "used_percentage": 42,
    "total_input_tokens": 15200
  },
  "cost": {
    "total_cost_usd": 0.042,
    "total_duration_ms": 750000
  }
}
```

**スクリプト** はこれを `jq` でパースして次を出力します:

```
Opus | 42% | $0.042
```

これだけです。StatusCraft が完全なスクリプトを自動生成します。

### 利用可能なトークン

トークンは 6 カテゴリに分類されています。どのトークンもクリックすればフォーマット文字列に追加できます。

#### Model & Session（モデル & セッション）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{model}` | 使用中モデルの表示名 | `Opus` |
| `{model_id}` | モデル識別子 | `claude-opus-4-8` |
| `{version}` | Claude Code のバージョン | `1.0.80` |
| `{session_id}` | セッション ID の先頭 8 文字 | `a1b2c3d4` |
| `{session_name}` | カスタムセッション名（`--name` / `/rename`） | `my-session` |

#### Context Window（コンテキストウィンドウ）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{context_pct}` | コンテキスト使用率 | `42` |
| `{context_remaining}` | コンテキスト残量率 | `58` |
| `{context_bar}` | ビジュアルプログレスバー | `████░░░░` |
| `{input_tokens}` | 現在のコンテキスト入力トークン数（整形済み） | `15.2K` |
| `{output_tokens}` | 現在のコンテキスト出力トークン数（整形済み） | `4.5K` |
| `{context_size}` | 最大コンテキストウィンドウ（整形済み） | `200K` |

#### Cost & Activity（コスト & アクティビティ）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{cost}` | セッション合計コスト | `$0.042` |
| `{duration}` | セッション経過時間 | `12m30s` |
| `{api_duration}` | API 応答待ち時間 | `2m15s` |
| `{lines_changed}` | 追加 / 削除行数 | `+156/-23` |

#### Rate Limits（レート制限）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{rate_5h}` | 5 時間レート制限の使用率 % | `23` |
| `{rate_7d}` | 7 日間レート制限の使用率 % | `41` |
| `{rate_5h_reset}` | 5h リセットまでの残り時間 | `2h15m` |
| `{rate_7d_reset}` | 7d リセットまでの残り時間 | `45m` |

> **注意:** レート制限トークンは Claude.ai の Pro/Max アカウントでのみ、かつセッション内で最初の API 応答が返ってきた後にのみ値が入ります。API キー / Console プランでは `—` と表示されます。

#### Workspace（ワークスペース）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{cwd}` | 現在の作業ディレクトリ | `~/myproject` |
| `{cwd_short}` | フォルダ名のみ | `myproject` |
| `{project_dir}` | プロジェクトルート | `~/projects` |
| `{repo}` | リポジトリの owner/name（git origin より） | `anthropics/claude-code` |
| `{time}` | 現在時刻（HH:MM） | `14:32` |

#### Advanced（アドバンスド）

| トークン | 説明 | 例 |
|-------|-------------|---------|
| `{vim_mode}` | 現在の vim モード | `NORMAL` |
| `{agent}` | 実行中のエージェント名 | `reviewer` |
| `{worktree}` | Worktree 名（`--worktree` セッション時のみ） | `my-feature` |
| `{worktree_branch}` | 使用中 worktree のブランチ | `worktree-my-feature` |
| `{git_worktree}` | 任意の git worktree 名 | `feature-xyz` |
| `{effort}` | 推論 effort（`low`〜`max`） | `xhigh` |
| `{thinking}` | 拡張 thinking のインジケーター | `thinking` |
| `{output_style}` | 使用中の出力スタイル（`default` のときは非表示） | `Explanatory` |
| `{pr_number}` | 現在ブランチのオープン PR | `#1234` |
| `{pr_review}` | PR のレビュー状態 | `pending` |

### プリセット

よくあるユースケース向けのクイックスタート用テンプレートです。

| プリセット | フォーマット | 用途 |
|--------|--------|----------|
| **Minimal** | `{model} | {cost}` | 必要最小限だけ |
| **Standard** | `{model} | {context_pct}% | {cost}` | 最も一般的な構成 |
| **Developer** | `{cwd_short} | {model} | {context_pct}% | {cost} | {duration}` | 作業ディレクトリと時間付き |
| **Rate-aware** | `{model} | ctx:{context_pct}% | {cost} | 5h:{rate_5h}% 7d:{rate_7d}%` | レート制限を監視 |
| **Visual bar** | `{model} {context_bar} {context_pct}% | {cost}` | プログレスバー付き |
| **Full info** | `{cwd_short} | {model} | {context_bar} {context_pct}% | {cost} | {duration} | {lines_changed}` | 全部入り |

## 生成スクリプトの例

「Copy Script」をクリックするか設定を適用すると、StatusCraft は次のようなスクリプトを生成します。

```bash
#!/bin/bash
# StatusCraft-generated statusline script for Claude Code
# Do not edit this file directly—regenerate with StatusCraft

# Helpers
fmt_duration() {
  local ms=${1:-0}
  local total_sec=$((ms / 1000))
  local h=$((total_sec / 3600))
  local m=$(( (total_sec % 3600) / 60 ))
  local s=$((total_sec % 60))
  if [ "$h" -gt 0 ]; then
    printf "%dh%dm" "$h" "$m"
  else
    printf "%dm%ds" "$m" "$s"
  fi
}

# Read input
INPUT=$(cat)

# Parse with jq
model=$(echo "$INPUT" | jq -r '.model.display_name // "—"')
ctx_pct=$(echo "$INPUT" | jq '(.context_window.used_percentage // 0 | floor)')
cost_raw=$(echo "$INPUT" | jq '(.cost.total_cost_usd // 0)')
dur_ms=$(echo "$INPUT" | jq '(.cost.total_duration_ms // 0)')

# Format output
cost=$(printf '$%.3f' "$cost_raw")
duration=$(fmt_duration "$dur_ms")

# Build statusline
echo "${model} | ${ctx_pct}% | ${cost} | ${duration}"
```

生成されるスクリプトはすべて次の性質を備えています。

- 全体にコメントが付き、読みやすい
- 適切なエラーハンドリングを備え、本番投入できる
- 複雑な整形にはヘルパー関数を使用
- 欠落フィールドを優雅に処理

## 設定

### Claude Code スキル経由で適用

スキルは自動的に次を行います。

1. スクリプトを `~/.claude/statusline.sh` に保存
2. 実行権限を付与
3. `~/.claude/settings.json` の statusLine 設定を更新
4. Claude Code の再起動を促す

### 手動セットアップ

1. 生成スクリプトを `~/.claude/statusline.sh` にコピー
2. 実行権限を付与: `chmod +x ~/.claude/statusline.sh`
3. `~/.claude/settings.json` を更新:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

> StatusCraft は `"refreshInterval"`（時刻系トークン用）や `"hideVimModeIndicator"`（`{vim_mode}` 用）も出力することがあります。詳細は [クイックスタート](#スタンドアロンの-web-アプリとして使う) の注意書きを参照してください。

4. Claude Code を再起動

## 必要要件

### 生成スクリプトの実行に必要なもの

- `bash`（または互換シェル）
- `jq`（JSON プロセッサ）— Homebrew でインストール: `brew install jq`
- Claude Code（当然ながら）

> **Windows:** 生成スクリプトは Bash です。Git Bash または WSL から実行し、`settings.json` の `command` パスはスラッシュ（`/`）で記述してください（Git Bash はパス中のバックスラッシュを黙って削除します）。

### デザイナー UI に必要なもの

- モダンブラウザ（Chrome、Firefox、Safari、Edge）
- ビルドツール不要 — 純粋な HTML/CSS/JavaScript

## セパレーター

トークンの区切り方を選べます。

- パイプ: ` | `
- ドット: ` • `
- ライン: ` │ `
- スラッシュ: ` / `
- ダッシュ: ` — `
- 改行: 複数行ステータスライン

## カラーカスタマイズ

「Enable Colors」をオンにすると、トークングループごとに ANSI カラーを設定できます。

- 色なし（プレーンテキスト）
- 黒、赤、緑、黄、青、マゼンタ、シアン、白

色は ANSI エスケープコードとして生成スクリプトに埋め込まれ、整形パイプライン全体で適切に処理されます。

## URL 共有

デザイン設定は URL のクエリ文字列にエンコードされます。デザインを共有するには:

```
https://daikin555.github.io/statuscraft/?fmt={model}|{cost}&colors=1&cc=session:35,context:36
```

パラメーター:

- `fmt`: フォーマット文字列（URL エンコード済み）
- `colors`: 色を有効にするには `1`
- `cc`: グループごとの色コード（例: `session:35,context:36`）
- `lang`: `en` または `ja`

## トラブルシューティング

### 再起動してもステータスラインが表示されない

- `~/.claude/statusline.sh` が存在し、実行可能か確認する
- 手動で実行してみる: `echo '{"model":{"display_name":"test"}}' | ~/.claude/statusline.sh`
- `~/.claude/settings.json` に statusLine 設定があるか確認する
- Claude Code のログでエラーを確認する

### 「jq: command not found」

jq をインストールしてください:

```bash
brew install jq
```

### 色が反映されない

- デザイナーで「Enable Colors」がオンになっているか確認する
- ターミナルが ANSI カラーに対応しているか確認する（多くのモダンターミナルは対応済み）
- 別の色の組み合わせを試す

### 複数行ステータスラインが表示されない

- 改行セパレーター（セパレーター一覧の最下部）を使う
- 一部のターミナルは複数行サポートが限定的です。まずシンプルなフォーマットで試してください

## アーキテクチャ

- **単一 HTML ファイル**（`index.html`）— ビルド工程なし
- **バニラ JavaScript** — フレームワーク依存なし
- **埋め込みフォント**（Google Fonts より）
- **トークン定義** は信頼性のためハードコード
- **ライブプレビュー** はフォーマット文字列の編集に合わせて更新
- **設定ダウンロード** は HTML5 File API 経由

## ライセンス

MIT

## コントリビュート

Issue・機能要望・PR を歓迎します。バグ報告の際は次を含めてください。

- StatusCraft のバージョン（ヘッダーに表示）
- Claude Code のバージョン（`/info`）
- 使用した正確なフォーマット文字列
- 生成スクリプトのエラーメッセージ（あれば）

## 関連リンク

- [Claude Code](https://claude.ai/code) — 本ツールが対象とする CLI
- [jq マニュアル](https://stedolan.github.io/jq/) — スクリプト内での JSON パース
- ANSI カラーコード — [リファレンス](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors)
