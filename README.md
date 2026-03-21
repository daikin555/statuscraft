# StatusCraft

> Visual statusline designer for Claude Code

A browser-based GUI tool that generates working bash scripts for customizing Claude Code's statusline. Design visually, get a production-ready script instantly.

## What is this?

Claude Code displays a real-time statusline at the bottom of your terminal showing session data like model name, context usage, cost, and rate limits. This data comes from a **bash script** that Claude Code executes, passing session info as JSON.

StatusCraft removes the need to write this script manually. Instead:

1. Open the visual designer
2. Click the tokens you want (model, cost, context %, etc.)
3. Customize colors per group
4. See live preview with 3 simulated states
5. Apply directly to Claude Code or download the script

The result is a working, commented bash script that handles:
- JSON parsing with `jq`
- ANSI color formatting
- Dynamic data transformation (duration formatting, number shortening, progress bars)
- Multiple output states (normal, high load, startup)

## Features

- **24 tokens** across 6 categories: Model & Session, Context Window, Cost & Activity, Rate Limits, Workspace, Advanced
- **6 built-in presets**: Minimal, Standard, Developer, Rate-aware, Visual bar, Full info
- **Live preview** with 3 load states (Normal, High load, Startup)
- **Color customization**: 8 ANSI color options per group
- **Multi-line support**: Use newline separators for multi-line statuslines
- **Language toggle**: English / Japanese UI
- **URL sharing**: Design configs are embedded in shareable URLs
- **Real bash scripts**: Not template strings—actual executable scripts with proper quoting and error handling
- **Zero dependencies**: Single HTML file, works offline
- **Dark terminal aesthetic**: Designed to match Claude Code's interface

## Quick Start

### As a Claude Code Skill

If installed as a Claude Code skill:

```bash
/statuscraft
```

This opens the designer in your browser. Design your statusline, click "Apply to Claude Code", return to the CLI. The script and settings are auto-installed.

### As a Standalone Web App

1. Clone this repo: `git clone https://github.com/YOUR_USER/statuscraft.git`
2. Open `assets/statuscraft.html` in your browser (or host on GitHub Pages)
3. Design your statusline
4. Copy the generated bash script
5. Save to `~/.claude/statusline.sh`
6. Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

7. Restart Claude Code

## How It Works

### The Claude Code Statusline Mechanism

```
Claude Code sends JSON via stdin → Your bash script reads it with jq → Script outputs formatted text → Appears in statusline
```

**Example input** (from Claude Code):

```json
{
  "model": {
    "display_name": "Opus 4.6",
    "id": "claude-opus-4-6"
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

**Your script** parses this with `jq` and outputs:

```
Opus 4.6 | 42% | $0.042
```

That's it. StatusCraft generates the full script automatically.

### Available Tokens

Tokens are grouped into 6 categories. Click any token to add it to your format string.

#### Model & Session

| Token | Description | Example |
|-------|-------------|---------|
| `{model}` | Active model display name | `Opus 4.6` |
| `{model_id}` | Full model identifier | `claude-opus-4-6` |
| `{version}` | Claude Code version | `1.0.80` |
| `{session_id}` | First 8 chars of session ID | `a1b2c3d4` |

#### Context Window

| Token | Description | Example |
|-------|-------------|---------|
| `{context_pct}` | Context usage percentage | `42` |
| `{context_remaining}` | Context remaining percentage | `58` |
| `{context_bar}` | Visual progress bar | `████░░░░` |
| `{input_tokens}` | Cumulative input tokens (formatted) | `15.2K` |
| `{output_tokens}` | Cumulative output tokens (formatted) | `4.5K` |
| `{context_size}` | Max context window (formatted) | `200K` |

#### Cost & Activity

| Token | Description | Example |
|-------|-------------|---------|
| `{cost}` | Total session cost | `$0.042` |
| `{duration}` | Session elapsed time | `12m30s` |
| `{api_duration}` | Time waiting for API | `2m15s` |
| `{lines_changed}` | Lines added/removed | `+156/-23` |

#### Rate Limits

| Token | Description | Example |
|-------|-------------|---------|
| `{rate_5h}` | 5-hour rate limit usage % | `23` |
| `{rate_7d}` | 7-day rate limit usage % | `41` |
| `{rate_5h_reset}` | Time until 5h resets | `2h15m` |
| `{rate_7d_reset}` | Time until 7d resets | `45m` |

#### Workspace

| Token | Description | Example |
|-------|-------------|---------|
| `{cwd}` | Current working directory | `~/myproject` |
| `{cwd_short}` | Folder name only | `myproject` |
| `{project_dir}` | Project root | `~/projects` |
| `{time}` | Current time (HH:MM) | `14:32` |

#### Advanced

Additional tokens for fine-grained control (context without %, raw token counts, reset timestamps, etc.)

### Presets

Quick-start templates for common use cases:

| Preset | Format | Use Case |
|--------|--------|----------|
| **Minimal** | `{model} | {cost}` | Just the essentials |
| **Standard** | `{model} | {context_pct}% | {cost}` | Most common setup |
| **Developer** | `{cwd_short} | {model} | {context_pct}% | {cost} | {duration}` | With working dir and timing |
| **Rate-aware** | `{model} | ctx:{context_pct}% | {cost} | 5h:{rate_5h}% 7d:{rate_7d}%` | Monitor rate limits |
| **Visual bar** | `{model} {context_bar} {context_pct}% | {cost}` | With progress bar |
| **Full info** | `{cwd_short} | {model} | {context_bar} {context_pct}% | {cost} | {duration} | {lines_changed}` | Everything |

## Generated Script Example

When you click "Copy Script" or apply the config, StatusCraft generates something like:

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

Every generated script is:
- Fully commented and readable
- Production-ready with proper error handling
- Uses helper functions for complex formatting
- Handles missing fields gracefully

## Configuration

### Apply via Claude Code Skill

The skill automatically:
1. Saves the script to `~/.claude/statusline.sh`
2. Makes it executable
3. Updates `~/.claude/settings.json` with the statusLine config
4. Prompts you to restart Claude Code

### Manual Setup

1. Copy the generated script to `~/.claude/statusline.sh`
2. Make executable: `chmod +x ~/.claude/statusline.sh`
3. Update `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

4. Restart Claude Code

## Requirements

### For Using Generated Scripts

- `bash` (or compatible shell)
- `jq` (JSON processor) — install via Homebrew: `brew install jq`
- Claude Code (obviously)

### For the Designer UI

- Modern browser (Chrome, Firefox, Safari, Edge)
- No build tools required—pure HTML/CSS/JavaScript

## Separators

Choose how tokens are separated:

- Pipe: ` | `
- Dot: ` • `
- Line: ` │ `
- Slash: ` / `
- Dash: ` — `
- Newline: Multi-line statusline

## Color Customization

When "Enable Colors" is toggled on, you can set ANSI colors per token group:

- No color (plain text)
- Black, Red, Green, Yellow, Blue, Magenta, Cyan, White

Colors are embedded in the generated script using ANSI escape codes and properly handled throughout the formatting pipeline.

## URL Sharing

Design configurations are encoded in the URL query string. Share your design:

```
https://your-domain.com/statuscraft.html?fmt={model}|{cost}&colors=1&cc=session:35,context:36
```

Parameters:
- `fmt`: Format string (URL-encoded)
- `colors`: `1` to enable colors
- `cc`: Per-group color codes (e.g., `session:35,context:36`)
- `lang`: `en` or `ja`

## Troubleshooting

### Statusline doesn't appear after restart

- Check `~/.claude/statusline.sh` exists and is executable
- Run it manually: `echo '{"model":{"display_name":"test"}}' | ~/.claude/statusline.sh`
- Verify `~/.claude/settings.json` has the statusLine config
- Check Claude Code logs for errors

### "jq: command not found"

Install jq:

```bash
brew install jq
```

### Colors not working

- Ensure "Enable Colors" is toggled on in the designer
- Verify your terminal supports ANSI colors (most modern terminals do)
- Try a different color combination

### Multi-line statusline isn't rendering

- Use the newline separator (bottom of separator list)
- Some terminals have limited multi-line support—test with a simpler format first

## Architecture

- **Single HTML file** (`assets/statuscraft.html`) — No build step
- **Vanilla JavaScript** — No framework dependencies
- **Embedded fonts** from Google Fonts
- **Token definitions** hardcoded for reliability
- **Live preview** updates as you edit the format string
- **Config download** via HTML5 file API

## License

MIT

## Contributing

Issues, feature requests, and PRs welcome. When reporting bugs, include:

- Your StatusCraft version (visible in the header)
- Claude Code version (`/info`)
- Exact format string you used
- Error message from the generated script (if any)

## Related

- [Claude Code](https://claude.ai/code) — The CLI tool this was built for
- [jq manual](https://stedolan.github.io/jq/) — JSON parsing in your scripts
- ANSI color codes — [Reference](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors)
