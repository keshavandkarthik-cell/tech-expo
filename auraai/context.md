# AuraAI — Project Context

Living reference for AuraAI. **Read this first in any new session. Append to the Changelog at the bottom after every change.**

## What AuraAI is

A calm, predictable AI companion web app for autistic / neurodivergent children, teens and young adults (mostly in Malaysia). Part of the Veda tech-expo repo, served at `/auraai` (veda-net.com/auraai, GitHub Pages).

- Single self-contained file: `index.html` (~5,950 lines, ~500KB; CSS, HTML and JS inline) plus `bgm.mp3` (background music).
- Dark glass aesthetic: fonts Outfit/Poppins, CSS variables `--accent` (#7cc6ff), `--bg1`, `--bg2`, `--glass`; collapsible left sidebar (`#aura-sidebar`), header (`#aura-header`), chat (`#aura-chat`).
- Related but separate from the main Veda app at the repo root. Don't mix their code or styles.

## Features

Chat companion ("Aura"), Home screen, Draw, Colour by number, Calm Bubbles, Breathe (guided breathing), Music player + customizable Spotify playlists, Journal, My interest (own lists + saved video links), Games (Snake, Brick Breaker, Memory Match, 2048, Sudoku, Wordle, Flag Quiz — nothing can be lost), themes, Account page with Comfort settings (Calm mode, Larger text, Easy-read spacing), voice / read-aloud chat, mood tracking, chat requests that open screens, calm idle check-in.

## AI / chat design

- **Optional Gemini (BYOK):** user pastes their own key in Account (`studly_key`); model in `veda_ai_model`, default `gemini-3.5-flash` (`DEFAULT_MODEL`). Called via `generativelanguage.googleapis.com` `generateContent`.
- **No-AI mode:** a local "listening layer" gives simple built-in replies when no key is set. Keep it working — it is the default experience.
- **`SYSTEM` prompt (the "superprompt")** defines Aura: plain literal language, short replies (2–4 sentences, <60 words), at most one question, no idioms/markdown, low-demand replies when overwhelmed, celebrates special interests, never claims to alert anyone.
- **Safety (highest priority):** Aura cannot contact anyone. On risk it gives Befrienders KL 03-7627 2929, Talian Kasih 15999, 999 — only these, exactly; never invent numbers. Only when the latest message shows risk; don't repeat. A safety gate sits in front of the optional Gemini use. Do not weaken any of this.
- Suggest in-app activities only by their exact names; never invent features.

## Storage (localStorage keys)

`studly_key`, `veda_ai_model`, `AuraAI_mood` / `auraMood`, `AuraAI_sidebarOpen`, `AuraAI_username` / `auraName` / `auraUserName`, `auraSpeak`, `auraMusicVol`, `auraThemes`, `themeMode`, `themeCategory`, `customThemeImage`, `journalEntries`, `journalDraft`, `auraMemoryMigrated`, `Aura_lastFalsehood`, `forceAuraAI`. Profile memory is a structured local profile (replaced raw message memory). Everything stays on-device; there is no backend.

## Conventions / gotchas

- Edit `index.html` directly; there is no build step. Commit messages follow `AuraAI: <summary>`.
- Layouts are no-scroll / paged — check game boards and screens aren't squashed at small sizes (past bugs: Sudoku, 2048, Memory Match).
- Audience is sensory-sensitive: keep motion, sound and brightness gentle; respect Calm mode.
- Test by opening the file in a browser (Chromium + Playwright available) and screenshotting.

## Changelog (newest first; append here)

- **2026-10-07** — Created `context.md`.
- Earlier history (from git): open screens from chat requests + calmer idle check-in; My interest page, paged sections, no-scroll layouts; Sudoku grid fix; 2048/Memory Match fix, Games nav, Calm Bubbles pop animation; upgraded Home, Breathe screen, structured local profile, playlist fix; superprompt, no-AI listening layer, new safety messages, header/mood cleanup, Sunway credits line; Veda's six games added (Bubble Pop+/Snake+ removed); merged "ultimate" version (Home, Calm Bubbles, draw tools, music player, Spotify playlists, voice/read-aloud, name-detection fix); optional Gemini key with safety gate + Account redesign; initial `/auraai` serving (comfort settings, colour-by-number).
