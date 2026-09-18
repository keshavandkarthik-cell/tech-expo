# Veda — Project Context Prompt

Paste this at the start of a new conversation when working on Veda, so I don't have to re-discover the codebase from scratch.

## What Veda is

Veda is an AI-powered study companion web app, live at **veda-net.com**, hosted as a static site (GitHub Pages, CNAME configured) with a Firebase backend (Firestore + one Cloud Function for guardian-alert emails). It's built for students and covers a lot of ground: a homework helper ("Ask Veda"), an AI Companion chat, a Journal with voice notes, a Forum, a Leaderboard, 9 built-in games, Notes, Smart Study, a To-Do list, an AI art tool ("Muse"), a Vault, Exam Papers, a Paper Tracker, a Study Planner, and a Spotify-based Playlist Manager. It also has a genuinely thoughtful safety feature: if the Companion chat detects signs of self-harm or serious distress, it notifies a guardian — transparently, telling the student first, with real crisis resources included.

The AI features run on a **bring-your-own-key (BYOK)** model: each student pastes their own free Gemini API key, stored in `localStorage`. This is intentional and should not be changed — it prevents bot abuse and keeps Google's API costs off the developer entirely, since there's no shared quota to burn through.

The visual identity is a dark navy/tech "systems panel" aesthetic — CSS variables `--navy`, `--accent` (#4d9fff), `--teal` (#00d4aa), `--silver`, fonts Syne/Plus Jakarta Sans/DM Mono — with several alternate themes (ivory/light, hacker, glass, synthwave) layered on top via `body.style-*` and `html[data-theme=*]` overrides. Any visual work should work with this existing system, not replace it.

Repo lives at `~/Downloads/digital-expo ` (note the **trailing space** in the folder name — always quote the path). `index.html` + `styles.css` + `games.js`/`forum.js`/`features.js`/`leaderboard.js`/`playlist-manager.js` at the repo root; load order between those JS files matters (documented in each file's header comment).

## What's been done so far

The app started as a single 16,647-line `index.html` file. Work so far, roughly in order:

1. **Code review** — found real issues: no accessibility support, a Sudoku bug, some structural mess.
2. **File split** — pulled the monolith apart into `styles.css`, `games.js`, `forum.js`, `features.js`, `leaderboard.js`, `playlist-manager.js`, bringing `index.html` down to ~10,700 lines.
3. **Fixed a regression the split itself caused** — `getStudentProfile` relied on being hoisted across what used to be one giant `<script>` tag. Lesson: code that runs *immediately* at page load (not just via `onclick`) needs to physically live in a script block that loads before its caller.
4. **Sudoku fix** — two entire `startSudoku()` functions existed; the second silently overwrote the first.
5. **Accessibility pass** — alt text on all images, `aria-label`s on 78 icon-only buttons.
6. **Fixed a real XSS bug** — student-typed text was going into chat bubbles via unescaped `innerHTML`. Fixed with a shared `escapeHtml()` at every user-input call site.
7. **Guided API-key setup flow** — the "no key" error now jumps straight to the right Settings panel.
8. **Settings overhaul** — merged the separate Settings/Profile tabs into one, grouped into "Account" and "Preferences."
9. **Visual redesign of Settings** — verified by actually rendering in a headless browser and screenshotting, not just reading CSS.
10. **A Veda-branded business card** (pptx), using the actual app logo.
11. **Home screen redesign** — fixed hero/brief zone plus a Today/Focus/More tab switcher. Fixed a stray inline `display:flex` and a CSS Grid + `overflow:hidden` clipping bug along the way.
12. **Cache/deployment gotchas** — the service worker aggressively caches `styles.css`/`index.html`. **Standing rule: bump `sw.js`'s `CACHE_NAME`/`RUNTIME_CACHE` version on every shipped change**, or fixes will silently appear "not applied" against a stale cached copy.
13. **AI-powered custom languages (beta)** — type-any-language option; Gemini translates and caches the full string set, self-corrects typos in the language name (aliased so it resolves instantly next time).
14. **Full app-wide i18n coverage** — wired all ~761 keys × 5 languages across every tab. Recurring bug class: local variables named `t` shadowing the global translator, and handlers resetting UI to hardcoded English on every re-render, not just first load.
15. **Ivory theme overhaul** — unified typography, line-icon set replacing emoji, Homework tab collapsed to a plain chat interface in this theme only.
16. **Calculator fully removed** — deleted the tab, all 8 JS functions, keyboard shortcut, and dead nav/translation references.
17. **`manifest.json` bug** — hardcoded absolute `veda-net.com` URLs broke local/preview use; switched to relative paths.
18. **Learning-memory personalization** — a compact summarizer folds real usage patterns (weak subjects, mood trends, frequent topics) into AI prompts, with a visible "based on your last couple weeks" tag once there's enough history.
19. **Custom wallpaper (Settings → Appearance → Wallpapers)** — a "+ Add Custom" tile lets a student upload their own photo as the app background. Implementation notes worth keeping in mind:
    - Upload is auto-downscaled to max 1600px and re-encoded as JPEG (~0.78 quality) via an offscreen canvas before it ever touches `localStorage`, since raw phone photos can be several MB and localStorage's quota (~5–10MB) is shared across every key.
    - Stored as `veda_custom_wallpaper` and also embedded as `.img` inside the active `studly_theme` object (reuses the existing `applyBg()`/wallpaper-tile pattern — no changes needed to `applyBg` itself).
    - **Important:** `studly_theme` is one of the keys the Firebase cloud-sync snapshot (`nwSnapshot()`) uploads on every sync. A custom wallpaper's data-URL would otherwise get embedded in that payload and bloat every device's sync. Fixed by stripping `.img` out of `studly_theme` specifically when `.custom === true` before it's synced (`nwSnapshot`), and skipping re-apply of an imageless custom entry on restore (`nwRestore`) — the "you have a custom wallpaper" preference syncs, the photo itself stays device-local and needs re-uploading per device. If touching the sync code again, preserve this stripping.
    - `resetTheme()` also clears `veda_custom_wallpaper` now, so a theme reset doesn't leave an orphaned photo sitting in the tile grid.
    - Verified live in a headless browser: upload → apply → tile shows a thumbnail with ↻ replace / ✕ remove → remove falls back to the first Vibes theme. `nwSnapshot()` confirmed to produce a ~90-byte stripped record regardless of the actual photo's size.
20. **Mobile top-bar / bottom-"chin" safe-area bug — diagnosed, not yet fixed.** Confirmed via code read + a live screenshot from a real notched iPhone (solid black band under the home-indicator area). Root causes, ready to fix next session:
    - `#hdr` (`styles.css:265`, mobile override `:326`) has **no `padding-top: env(safe-area-inset-top)`** despite `viewport-fit=cover` + `apple-mobile-web-app-status-bar-style: black-translucent` in `index.html` — in installed-PWA mode on a notched device, header content can render under the status bar/notch.
    - `#app` (`styles.css:262`) uses `height: 100vh` instead of `100dvh` (with a `100vh` fallback) — can misjudge height against mobile Safari's dynamic toolbar.
    - `#mobile-fab-list`'s `max-height: calc(100vh - 145px)` (`styles.css:415`) has the same `100vh` issue; its `bottom: 84px` (line 413) doesn't add a safe-area inset (the FAB *button* itself, `#mobile-fab-wrap`, already does this correctly — copy that pattern).
    - `body.mobile-mode #content`/`.tab` bottom padding (`styles.css:335-336`, flat `90px`) isn't safe-area-aware — works by coincidence of being generous, not a real `calc(90px + env(safe-area-inset-bottom))`.
    - This can't be visually verified in a desktop/headless browser — `env(safe-area-inset-*)` always evaluates to 0 there. Needs a real notched-device check (or at minimum, trust the code fix and note it as unverified-live in the hand-off).

**Workflow note:** several of the above (Home redesign, i18n split by tab group, Ivory overhaul) were done via parallel background agents on isolated git worktrees to avoid file-edit collisions, then merged back with `git apply --reject` + manual reconciliation where two agents touched the same shared block. Treat reconciliation as real work needing real verification (script-syntax check + key-parity check + live browser check), not just "the patch applied cleanly."

## Digital Expo materials (separate from the app itself)

A large amount of work has also gone into **expo/pitch collateral**, all living in the same repo root as loose files (not part of the deployed site): `Veda-Expo-Deck.pptx`/`.html` (7-slide pitch deck, "Deep Ocean" palette — teal `#00D4AA` / blue `#38BDF8` on navy, distinct from the app's own `--accent`/`--teal`), `Veda-Foamboards.pdf`/`.html` (2× A1 portrait boards using Veda's real brand fonts — Syne/Plus Jakarta Sans/DM Mono), `Veda-Hero.html` (1:1 recreation of a landing hero mockup), `Veda-Badges.pdf` (9 named lanyard-badge squircles), `Veda-Brochure.pdf`, `Veda-Presentation-Script.docx`, plus SDG tile images and various Muse-generated art assets (constellation doodles, sparkles, network graphics). These are built with standalone Node generator scripts (pptxgenjs / inline SVG+HTML rendered to PDF via headless Chrome) that live only in ephemeral scratchpad dirs, not committed — if one needs regenerating, expect to rebuild the generator from scratch (assets can usually be regenerated: logo from `image_2.png`, SDG tiles from the `SDG*.png.jpeg` files in the repo root, QR via the `qrcode` npm package). This material is iterated on very frequently based on visual feedback (screenshots, "too small," "too plain," "add X") — treat it as design work, not engineering, and expect several fast visual-feedback loops per session.

## How I want you to talk to me

- Be direct. Skip the throat-clearing and get to the actual work.
- When something's ambiguous, make a reasonable call and say what you assumed, rather than stopping to ask unless it genuinely could go a wrong direction.
- If you find something broken or risky while working on something else, tell me — but don't go fix it unprompted unless it's small and directly in the file you're already touching.
- If you get something wrong, say so plainly, explain the actual root cause, and fix it. No over-apologizing.
- I'd rather see a real screenshot or a real test result than a claim that something "should work."

## Most important: don't burn credits looping

This is the thing to actually watch. A few concrete rules:

- **Match the verification effort to the actual risk.** A one-line CSS tweak needs a syntax check, not a full simulation. A change to script load order or navigation logic needs a real check. Don't reach for the heaviest tool by default.
- **Don't build custom infrastructure to solve a problem you could sidestep.** If a lightweight, direct check exists (parse it, run it, load it in a browser), use that before writing a bespoke analysis tool.
- **Don't re-run the same class of check after every micro-edit.** Batch changes, then verify once.
- **If a fix isn't working after two attempts, stop and change approach entirely** rather than iterating small variations of the same fix. That's usually a sign the mental model is wrong, not that the fix needs more tweaking.
- **Trust a clean result.** If a check comes back clean, move on — don't re-verify out of caution alone.
- **When stuck, say so and simplify**, rather than escalating to more elaborate tooling. If I catch myself building a bigger and bigger rig to answer a small question, that's the signal to stop and just ship with a clear note about what still needs a human's eyes (usually: "test this specific flow live before shipping").

The standing rule for any hand-off: I do the deepest verification that's actually justified by the risk of the change, then say plainly what's left for you to check live — never both over-build the verification *and* still ask you to redo it.
