# AuraAI — fixes

Fixed copy of `auraai-app/AuraAI` `index.html`. The original is untouched; drop this file in to replace it.

## Bugs fixed
- A block of HTML/CSS and a second account system had been pasted inside the nav `<script>`, causing a syntax error. That script builds the mobile bottom nav, so **phones had no navigation at all**. Removed the pasted block.
- Mobile bottom-nav animation shifted the bar half off-screen; its tab list is now complete and it routes through `switchTab`.
- Draw and Coloring had sidebar buttons but **no content**. Added both (draw canvas with eraser/save; tap-to-fill mandala).
- Journal nav button was never closed, nesting the Account button and Account panel inside `<nav>`.
- Duplicate `sendAuraAIMessage` (the first was dead code and shadowed) and its duplicate Enter handler removed.
- Account stats never counted journal entries or games (hooks ran before the functions existed) or chats; fixed. Journal memories also captured an empty string.
- XSS: journal entries and the Account "memory" list inserted user text via `innerHTML`; now escaped.
- Removed dead trailing script (`generateReply`/`typeAuraReply`), stray `</html>` and stray `})();` text.

## Accessibility for neurodivergent users
- Journal autosave used to save an entry and **wipe the text box 10s after typing stopped**. It now keeps a draft, restored on reload, and only saves on Save.
- New **Comfort settings** (Account tab): calm mode (no animation/glow/movement; defaults to the OS reduced-motion setting), larger text, easy-read spacing.
- Aura's unprompted "Still here" message is now opt-in and only appears while the chat is open.
- Visible focus rings everywhere (previously suppressed in 15 places); 44px minimum touch targets.
- Game cards reachable and operable by keyboard; Escape leaves a game.
- Chat is a labelled live region; inputs have labels; current page exposed with `aria-current`.

## Not changed / worth knowing
- Chat is still rule-based (no LLM), as discussed.
- Games (Bubble Pop, Brick Breaker, Snake) still move fast; calm mode does not slow them. A speed setting would be a good next step.
- Several unused leftover blocks (Luna-style overlay script) remain; harmless but worth deleting in a cleanup pass.
