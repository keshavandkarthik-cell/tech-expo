# Veda — Project Context Prompt

Paste this at the start of a new conversation when working on Veda, so I don't have to re-discover the codebase from scratch.

## What Veda is

Veda is an AI-powered study companion web app, live at **veda-net.com**, hosted as a static site (GitHub Pages, CNAME configured) with a Firebase backend (Firestore + one Cloud Function for guardian-alert emails). It's built for students and covers a lot of ground: a homework helper ("Ask Veda"), an AI Companion chat, a Journal with voice notes, a Forum, a Leaderboard, 9 built-in games, Notes, Smart Study, a To-Do list, an AI art tool ("Muse"), a Vault, Exam Papers, a Paper Tracker, a Study Planner, and a Spotify-based Playlist Manager. It also has a genuinely thoughtful safety feature: if the Companion chat detects signs of self-harm or serious distress, it notifies a guardian — transparently, telling the student first, with real crisis resources included.

The AI features run on a **bring-your-own-key (BYOK)** model: each student pastes their own free Gemini API key, stored in `localStorage`. This is intentional and should not be changed — it prevents bot abuse and keeps Anthropic— sorry, Google's API costs off the developer entirely, since there's no shared quota to burn through.

The visual identity is a dark navy/tech "systems panel" aesthetic — CSS variables `--navy`, `--accent` (#4d9fff), `--teal` (#00d4aa), `--silver`, fonts Syne/Plus Jakarta Sans/DM Mono — with several alternate themes (ivory/light, hacker, glass, synthwave) layered on top via `body.style-*` and `html[data-theme=*]` overrides. Any visual work should work with this existing system, not replace it.

## What's been done so far

The app started as a single 16,647-line `index.html` file. Work so far, roughly in order:

1. **Code review** — found real issues: no accessibility support, a Sudoku bug, some structural mess.
2. **File split** — pulled the monolith apart into `styles.css`, `games.js`, `forum.js`, `features.js`, `leaderboard.js`, `playlist-manager.js`, bringing `index.html` down to ~10,700 lines. Load order matters between these files (documented in each file's header comment).
3. **Fixed a regression the split itself caused** — a function (`getStudentProfile`) relied on being hoisted across what used to be one giant `<script>` tag. Splitting broke that silently. Lesson: any code that runs *immediately* at page load (not just via `onclick`) needs to physically live in a script block that loads before its caller — not just "somewhere in the file."
4. **Sudoku fix** — there were two entire `startSudoku()` functions; the second silently overwrote the first, leaving 158 lines dead and causing duplicate element IDs.
5. **Accessibility pass** — alt text added to all images, `aria-label`s added to 78 icon-only buttons, each one derived from what the button's `onclick` actually does.
6. **Found and fixed a real XSS bug** — student-typed text was going into chat bubbles via `innerHTML`, completely unescaped. Fixed with a shared `escapeHtml()` at every user-input call site, while leaving the legitimate developer-authored HTML (like AI response formatting) alone.
7. **Guided API-key setup flow** — the old "no key" error was a dead-end. Now it's an actionable link that jumps straight to the right Settings panel and highlights it.
8. **Settings overhaul** — Settings and Profile used to be two separate, confusing tabs with a stray legacy comment admitting as much. Merged into one tab, grouped into "Account" and "Preferences," removed a redundant sidebar entry.
9. **Visual redesign of Settings** — the merge alone didn't make it look better, so did a real pass on cards, chips, and status indicators, and verified it by actually rendering the page in a headless browser and screenshotting it (not just reading the CSS and assuming).
10. **A Veda-branded business card** (pptx), using the actual app logo.
11. **Home screen redesign** — replaced the long scrolling widget stack with a fixed hero/brief zone plus a Today/Focus/More tab switcher (no page scroll). Fixed two real rendering bugs along the way: a stray inline `display:flex` duplicating mobile widgets on desktop, and a CSS Grid + `overflow:hidden` interaction that was silently clipping widget content (fixed with `align-items:start` + removing the unneeded `overflow:hidden`). Also caught a `grid-auto-flow:dense` side effect where widgets jumped visually above their own zone label — scoped the dense-packing to per-zone sub-grids instead of the whole page.
12. **Cache/deployment gotchas** — the app's service worker aggressively caches `styles.css`/`index.html`, so fixes kept appearing "not applied" when the real issue was a stale cached copy. Bumped `sw.js`'s cache version and cache-busted the stylesheet link. Worth remembering for any future CSS/JS change — a fix that "isn't working" in testing may just be cached.
13. **AI-powered custom languages (beta)** — added a "type any language" option below the 5 built-in ones. Gemini translates the full string set once and caches it — and, a real bug caught live, corrects typos/casing in the language name itself before caching (so "Tamik" resolves to "Tamil" instead of permanently mislabeling a button), remembering the typo as an alias so it resolves instantly next time with no new API call. Added a delete button per custom language and a loading state matching the app's existing animated-dots pattern.
14. **Full app-wide i18n coverage** — previously only nav labels and a few tab titles were translated; everything else defaulted to English regardless of language selected. Wired all ~761 keys × 5 languages across every tab. Found the same underlying bug class repeatedly: local variables literally named `t` shadowing the global translator function, and handlers resetting UI to hardcoded English on *every* repeated use, not just first render — including one that reset the sidebar nav to English on almost every navigation, silently undoing the whole translation effort each time. All fixed.
15. **Ivory theme overhaul** — pushed it from "just a recolor" into an actual alternate mode: unified calm typography, a reusable line-icon set replacing emoji on high-visibility surfaces, and the Homework tab collapsed to a plain chat interface (subject chips/response-style/quick-starters hidden, not deleted — default theme unaffected). Caught that the theme had drifted to a purple accent and a light/white background; both restored to match the default dark-blue theme exactly, since only density/typography/icons were meant to differ.
16. **Calculator fully removed** — it had resurfaced via a new home-widget shortcut despite being deliberately removed earlier. Deleted the tab, all 8 JS functions, the keyboard-shortcut listener, and every dead nav/translation reference.
17. **`manifest.json` bug** — hardcoded absolute `veda-net.com` URLs for `start_url`/`scope`/icons/shortcuts, which breaks whenever the app isn't served from that exact origin (locally, in previews, anywhere but prod). Switched to relative paths.
18. **Learning-memory personalization** — the app already tracked plenty of usage history (journal, chat, quiz/exam scores, notes) but never used it. Built a compact summarizer that folds real patterns (recurring weak subjects, mood trends, frequently-asked topics) into every AI prompt, with a visible "based on your last couple weeks" tag on the Daily Brief when there's enough history to personalize from — degrades gracefully to nothing for new users.

**Workflow note:** several of the above (Home redesign, i18n split by tab group, Ivory overhaul) were done via parallel background agents on isolated git worktrees to avoid file-edit collisions, then merged back with `git apply --reject` + manual reconciliation where two agents touched the same shared block (e.g. `LANGS`). This worked well, but if reusing the pattern: flag it clearly, and treat the reconciliation step as real work needing real verification — script-syntax check + key-parity check + live browser check — not just "the patch applied cleanly."

## How I want you to talk to me

- Be direct. Skip the throat-clearing and get to the actual work.
- When something's ambiguous, make a reasonable call and say what you assumed, rather than stopping to ask unless it genuinely could go a wrong direction.
- If you find something broken or risky while working on something else, tell me — but don't go fix it unprompted unless it's small and directly in the file you're already touching.
- If you get something wrong, say so plainly, explain the actual root cause, and fix it. No over-apologizing.
- I'd rather see a real screenshot or a real test result than a claim that something "should work."

## Most important: don't burn credits looping

This is the thing to actually watch. A few concrete rules:

- **Match the verification effort to the actual risk.** A one-line CSS tweak needs a syntax check, not a full simulation. A change to script load order or navigation logic needs a real check. Don't reach for the heaviest tool by default.
- **Don't build custom infrastructure to solve a problem you could sidestep.** At one point I built a whole AST-based static analyzer to catch cross-script-tag reference bugs, when actually just loading the real files into a headless browser and looking at the console would've caught it faster and more reliably. If a lightweight, direct check exists (parse it, run it, load it in a browser), use that before writing a bespoke analysis tool.
- **Don't re-run the same class of check after every micro-edit.** If I've already confirmed the HTML parses and the JS is syntactically valid, I don't need to re-prove that after adding one `aria-label`. Batch changes, then verify once.
- **If a fix isn't working after two attempts, stop and change approach entirely** rather than iterating small variations of the same fix. That's usually a sign the mental model is wrong, not that the fix needs more tweaking.
- **Trust a clean result.** If a check comes back clean, move on — don't re-verify out of caution alone.
- **When stuck, say so and simplify**, rather than escalating to more elaborate tooling. If I catch myself building a bigger and bigger rig to answer a small question, that's the signal to stop and just ship with a clear note about what still needs a human's eyes (usually: "test this specific flow live before shipping").

The standing rule for any hand-off: I do the deepest verification that's actually justified by the risk of the change, then say plainly what's left for you to check live — never both over-build the verification *and* still ask you to redo it.
