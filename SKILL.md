---
name: statuscraft
description: Visual statusline designer for Claude Code. Opens a browser-based GUI where users visually design their statusline by clicking tokens and seeing a live preview, then automatically applies the configuration. Use this skill whenever the user mentions statusline, status line, status bar, statuscraft, or wants to customize/configure what information appears at the bottom of their Claude Code terminal. Also trigger when users say "ステータスラインを設定", "statuslineをカスタマイズ", or similar requests in Japanese. Even if they just say "I want to change what I see at the bottom of claude", use this skill.
---

# StatusCraft — Claude Code Statusline Designer

A visual tool for designing Claude Code's statusline. Users design in a browser GUI, and the skill applies the configuration automatically.

## How It Works

Claude Code's statusline is powered by a shell script that receives session data as JSON via stdin and outputs formatted text to stdout. This skill generates that script visually.

## Workflow

### Step 1: Open the Designer

1. Read the HTML template from `index.html` (relative to this skill directory)
2. Write it to `/tmp/statuscraft.html`
3. Open it: `open /tmp/statuscraft.html`
4. Tell the user:
   - EN: "I've opened the StatusCraft designer in your browser. Design your statusline by clicking tokens, then click 'Apply to Claude Code' when you're done. Come back here after that."
   - JA: "StatusCraftデザイナーをブラウザで開きました。トークンをクリックしてステータスラインを設計し、完了したら「Claude Codeに適用」ボタンを押してください。その後ここに戻ってきてください。"

### Step 2: Wait for User

Wait for the user to tell you they're done (e.g., "done", "完了", "applied", "適用した").

### Step 3: Read the Config

Look for the downloaded config file:

```bash
# Check for the most recent statuscraft_config.json in Downloads
ls -t ~/Downloads/statuscraft_config*.json 2>/dev/null | head -1
```

Read the most recent file. It contains:

```json
{
  "format": "{model} | {context_pct}% | {cost}",
  "colors": true,
  "script": "#!/bin/bash\n...(full generated bash script)...",
  "settings": {
    "statusLine": {
      "type": "command",
      "command": "~/.claude/statusline.sh",
      "padding": 2
    }
  },
  "timestamp": "2026-03-22T14:30:00Z"
}
```

The `settings.statusLine` block may additionally contain `"refreshInterval"` (added when the design uses a time-based token such as `{time}` / `{rate_5h_reset}` / `{rate_7d_reset}`) and/or `"hideVimModeIndicator": true` (added when `{vim_mode}` is used). Apply whatever keys are present verbatim — do not strip them.

### Step 4: Apply the Configuration

1. **Write the script**: Save `config.script` to `~/.claude/statusline.sh`
2. **Make executable**: `chmod +x ~/.claude/statusline.sh`
3. **Update settings.json**: Read `~/.claude/settings.json`, merge `config.settings` into it (preserve existing settings), and write back
4. **Confirm**: Tell the user the statusline is configured and they need to restart Claude Code for it to take effect

When updating settings.json:
- If the file exists, read it, parse it, add/update the `statusLine` key, and write back
- If the file doesn't exist, create it with just the statusLine config
- Preserve all existing settings — only add/update the `statusLine` key

### Step 5: Clean up

```bash
rm /tmp/statuscraft.html
```

## Edge Cases

- **No Downloads file found**: Ask the user if they clicked the "Apply" button in the browser. If they haven't, wait. If they have but the file isn't there, ask them to check ~/Downloads/ manually.
- **Multiple config files**: Always use the most recent one (by modification time).
- **Existing statusline.sh**: Overwrite it — the user is intentionally reconfiguring.
- **Empty format string**: If the downloaded config has an empty format, warn the user that no statusline will be shown and confirm before applying.

## Example Interaction

```
User: ステータスラインをカスタマイズしたい

Claude: StatusCraftデザイナーをブラウザで開きました。
        トークンをクリックしてステータスラインを設計し、
        完了したら「Claude Codeに適用」ボタンを押してください。
        その後ここに戻ってきてください。

[User designs in browser, clicks Apply]

User: 適用した

Claude: 設定ファイルを読み込みます...
        ✓ ~/.claude/statusline.sh を生成しました
        ✓ ~/.claude/settings.json を更新しました
        ✓ 実行権限を付与しました

        Claude Codeを再起動すると新しいステータスラインが反映されます。
```
