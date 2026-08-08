// ══════════════════════════════════════════════════════
// Veda — Playlist Manager / Music Tab (Spotify integration)
// Extracted from index.html inline <script> (was lines 6831–7127,
// part of the main app script block)
// Plain global-scope script (not a module/IIFE). Referenced from
// elsewhere only via onclick="..." HTML attributes (click-time,
// order-independent) — no top-level synchronous callers outside
// this block.
// ══════════════════════════════════════════════════════

// ── PLAYLIST MANAGER ──
let musicSource = localStorage.getItem('studly_music_src') || 'spotify';

// ── Spotify presets ──
const PL_PRESETS = [
  { name:'Lo-fi',              id:'69AaAkdktFGnk9POmHENkT', type:'album',    cat:'Study' },
  { name:'Focus Flow',         id:'37i9dQZF1DX8Uebhn9wzrS', type:'playlist', cat:'Study' },
  { name:'Deep Work',          id:'37i9dQZF1DWZeKCadgRdKQ', type:'playlist', cat:'Study' },
  { name:'Peaceful Piano',     id:'37i9dQZF1DX4sWSpwq3LiO', type:'playlist', cat:'Study' },
  { name:'Jazz Vibes',         id:'37i9dQZF1DXbITWG1ZJKYt', type:'playlist', cat:'Study' },
  { name:'Classical Focus',    id:'37i9dQZF1DWWEJlAGA9g88', type:'playlist', cat:'Study' },
  { name:'Rain & Ambience',    id:'37i9dQZF1DX4PP3DA4J0N8', type:'playlist', cat:'Study' },
  { name:'Hip-Hop Focus',      id:'37i9dQZF1DWZZbwlv3Vmtr', type:'playlist', cat:'Study' },
  { name:'Dhurandhar',              id:'2e7HNQJ0BcMoqwsVDwDhK8', type:'album',    cat:'Bollywood' },
  { name:'Dhurandhar: The Revenge', id:'4jlyYLklV3kTBA6trX3bpj', type:'album',    cat:'Bollywood' },
  { name:'Interstellar OST',   id:'7a78GiEowpaCa7ZJs44xUU', type:'album',    cat:'Soundtrack' },
  { name:'Coldplay · Moon Music',id:'5SGtrmYbIo0Dsg4kJ4qjM6',type:'album',   cat:'Pop' },
];


// ── Source switching ──
function getPlaylists() {
  try { return JSON.parse(localStorage.getItem('studly_playlists') || 'null') ||
    PL_PRESETS.filter(p => ['69AaAkdktFGnk9POmHENkT','37i9dQZF1DX8Uebhn9wzrS','2e7HNQJ0BcMoqwsVDwDhK8','7a78GiEowpaCa7ZJs44xUU'].includes(p.id));
  } catch { return PL_PRESETS.slice(0,4); }
}
function savePlaylists(arr) { localStorage.setItem('studly_playlists', JSON.stringify(arr)); }


// ── Source switching ──

// ── MUSIC TAB ──
function openMusicPlayer() {
  const btn = document.getElementById('nb-music');
  if (!btn) return;

  // Reveal nav button with a slide-in animation
  btn.style.display = 'flex';
  btn.style.opacity = '0';
  btn.style.transform = 'translateX(-12px)';
  btn.style.transition = 'opacity .35s ease, transform .35s cubic-bezier(.34,1.4,.64,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    btn.style.opacity = '1';
    btn.style.transform = 'translateX(0)';
  }));

  // Navigate to the music tab after a short delay so the animation is visible
  setTimeout(() => go('music'), 200);
}


let musicTabSource = 'spotify';
let musicInitialized = false; // Fix 7: guard against re-initialization

function initMusicTab() {
  if (musicInitialized) return; // Fix 7: skip if already set up
  musicInitialized = true;
  // Render playlist tabs
  renderMusicTabPlaylists();
  // Set source buttons
  setMusicTabSource(musicTabSource, true);
  // Show nudge if not dismissed
  if (!localStorage.getItem('studly_nudge_dismissed')) {
    const n = document.getElementById('music-tab-nudge');
    if (n) n.style.display = 'flex';
  }
}

function setMusicTabSource(src, skipSave) {
  musicTabSource = 'spotify';
  if (!skipSave) localStorage.setItem('studly_music_src', 'spotify');
  const spPl = document.getElementById('music-tab-spotify-player');
  if (spPl) spPl.style.display = 'block';
}

function renderMusicTabPlaylists() {
  const container = document.getElementById('music-tab-pl-tabs');
  if (!container) return;
  // Copy rendered tabs from the home widget and rewire them
  const src = document.getElementById('music-pl-tabs');
  if (!src || !src.innerHTML.trim()) {
    // No playlists yet
    const empty = document.getElementById('music-tab-empty');
    if (empty) empty.style.display = 'block';
    return;
  }
  container.innerHTML = src.innerHTML;

  container.querySelectorAll('[data-plid]').forEach(btn => {
    btn.onclick = () => {
      try {
        const playlists = JSON.parse(localStorage.getItem('studly_playlists') || '[]');
        const pl = playlists.find(p => p.id == btn.getAttribute('data-plid'));
        if (pl) {
          const fr = document.getElementById('music-tab-spotify-frame');
          if (fr) fr.src = `https://open.spotify.com/embed/${pl.type||'playlist'}/${pl.id}?utm_source=generator&theme=0`;
          setMusicTabSource('spotify');
          // also sync home widget
          const homeFr = document.getElementById('spotify-frame');
          if (homeFr) homeFr.src = fr.src;
        }
      } catch(e) {}
      container.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    };
  });

  // Load currently active playlist
  const activeSp = src.querySelector('[data-plid].on');
  if (activeSp) {
    const fr = document.getElementById('music-tab-spotify-frame');
    const mainFr = document.getElementById('spotify-frame');
    if (fr && mainFr && mainFr.src !== 'about:blank') fr.src = mainFr.src;
    setMusicTabSource('spotify', true);
    container.querySelector(`[data-plid="${activeSp.getAttribute('data-plid')}"]`)?.classList.add('on');
  }
}


function setMusicSource(src) {
  musicSource = 'spotify';
  localStorage.setItem('studly_music_src', 'spotify');
  const spPl  = document.getElementById('spotify-player');
  const nudge = document.getElementById('spotify-nudge');
  if (spPl) spPl.style.display = 'block';
  if (nudge && !localStorage.getItem('studly_nudge_dismissed')) nudge.style.display = 'flex';
  renderPlTabs();
}

function dismissSpotifyNudge() {
  localStorage.setItem('studly_nudge_dismissed','1');
  const el = document.getElementById('spotify-nudge');
  if (el) el.style.display = 'none';
}

// ── Spotify URL parser ──
function parseSpotifyUrl(url) {
  url = url.trim();
  const webMatch = url.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([A-Za-z0-9]+)/);
  if (webMatch) return { type: webMatch[1], id: webMatch[2] };
  const uriMatch = url.match(/spotify:(playlist|album|track|artist):([A-Za-z0-9]+)/);
  if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] };
  if (/^[A-Za-z0-9]{22}$/.test(url)) return { type: 'playlist', id: url };
  return null;
}

// ── Add custom Spotify playlist ──
function addCustomPlaylist() {
  const nameIn = document.getElementById('pl-name-in');
  const urlIn  = document.getElementById('pl-url-in');
  const errEl  = document.getElementById('pl-add-err');
  errEl.style.display = 'none';
  const name = nameIn.value.trim(), url = urlIn.value.trim();
  if (!name) { errEl.textContent = '⚠️ Give it a name.'; errEl.style.display='block'; return; }
  if (!url)  { errEl.textContent = '⚠️ Paste a Spotify link.'; errEl.style.display='block'; return; }
  const parsed = parseSpotifyUrl(url);
  if (!parsed) { errEl.textContent = "⚠️ Couldn't read that URL. Use Share → Copy link in Spotify."; errEl.style.display='block'; return; }
  const playlists = getPlaylists();
  if (playlists.find(p => p.id === parsed.id)) { errEl.textContent = '⚠️ Already saved.'; errEl.style.display='block'; return; }
  if (playlists.length >= 20) { errEl.textContent = '⚠️ Max 20 — delete some first.'; errEl.style.display='block'; return; }
  playlists.push({ name, id: parsed.id, type: parsed.type, custom: true });
  savePlaylists(playlists);
  nameIn.value = ''; urlIn.value = '';
  renderPlTabs(); renderPlSavedList();
  showToast(`🎵 "${name}" added!`);
  playPlaylist(playlists[playlists.length-1]);
}

// ── Add preset helpers ──
function addPresetPlaylist(preset) {
  const playlists = getPlaylists();
  if (playlists.find(p => p.id === preset.id)) { showToast('Already in your list!'); return; }
  playlists.push({ ...preset, custom: true });
  savePlaylists(playlists);
  renderPlTabs(); renderPlSavedList(); renderPresets();
  showToast(`🎵 "${preset.name}" added!`);
}

// ── Delete / rename ──
function deletePlaylist(id) {
  let list = getPlaylists().filter(p => p.id !== id);
  savePlaylists(list);
  renderPlTabs(); renderPlSavedList(); renderPresets();
  if (list.length) playPlaylist(list[0]);
  else document.getElementById('spotify-frame').src = 'about:blank';
  showToast('🗑 Removed');
}

function renamePlaylist(id) {
  const list = getPlaylists(), pl = list.find(p => p.id === id);
  if (!pl) return;
  const n = prompt('Rename:', pl.name);
  if (!n || !n.trim()) return;
  pl.name = n.trim().slice(0,24); savePlaylists(list);
  renderPlTabs(); renderPlSavedList(); showToast('✏️ Renamed!');
}

// ── Play functions ──
function playPlaylist(pl) {
  if (!pl) return;
  const frame = document.getElementById('spotify-frame');
  if (frame) frame.src = `https://open.spotify.com/embed/${pl.type}/${pl.id}?utm_source=generator&theme=0`;
  document.getElementById('music-empty').style.display = 'none';
  document.querySelectorAll('.music-pl-btn').forEach(b => b.classList.toggle('on', b.dataset.plid === pl.id));
  localStorage.setItem('studly_last_pl', pl.id);
  setMusicSource('spotify');
}

// ── Render tabs (shared row) ──
function renderPlTabs() {
  const container = document.getElementById('music-pl-tabs');
  if (!container) return;

  if (musicSource === 'spotify') {
    const list = getPlaylists();
    const lastId = localStorage.getItem('studly_last_pl');
    if (!list.length) { container.innerHTML = ''; document.getElementById('music-empty').style.display = 'block'; return; }
    document.getElementById('music-empty').style.display = 'none';
    container.innerHTML = list.map(pl => `
      <button class="music-pl-btn ${pl.id===lastId?'on':''}" data-plid="${pl.id}"
        onclick="playPlaylist(${JSON.stringify(pl).replace(/"/g,'&quot;')})" title="${pl.name}">${pl.name}</button>`).join('');
    const toLoad = list.find(p => p.id===lastId) || list[0];
    const frame = document.getElementById('spotify-frame');
    if (toLoad && frame && (frame.src==='about:blank'||!frame.src)) {
      frame.src = `https://open.spotify.com/embed/${toLoad.type}/${toLoad.id}?utm_source=generator&theme=0`;
    }
    // Show nudge if not dismissed
    const nudge = document.getElementById('spotify-nudge');
    if (nudge && !localStorage.getItem('studly_nudge_dismissed')) nudge.style.display = 'flex';
  }
}

// ── Render saved lists ──
function renderPlSavedList() {
  const el = document.getElementById('pl-saved-list'); if (!el) return;
  const list = getPlaylists();
  if (!list.length) { el.innerHTML = '<div style="font-family:var(--exo);font-size:.8rem;color:var(--silver);opacity:.5;padding:8px 0;">None yet.</div>'; return; }
  el.innerHTML = list.map(pl => `
    <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(77,159,255,.12);border-radius:10px;padding:9px 12px;">
      <div style="font-size:.95rem;flex-shrink:0;">${pl.type==='album'?'💿':pl.type==='track'?'🎵':'🎶'}</div>
      <div style="flex:1;min-width:0;"><div style="font-family:var(--raj);font-size:.82rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pl.name}</div><div style="font-family:var(--exo);font-size:.65rem;color:var(--silver);opacity:.6;text-transform:capitalize;">${pl.type}</div></div>
      <button onclick="playPlaylist(${JSON.stringify(pl).replace(/"/g,'&quot;')});closePlaylistManager()" title="Play" style="${btnStyle('#4d9fff')}">▶</button>
      <button onclick="renamePlaylist('${pl.id}')" title="Rename" style="${btnStyle('var(--silver)')}">✎</button>
      <button onclick="deletePlaylist('${pl.id}')" title="Remove" style="${btnStyle('#ff6680')}">✕</button>
    </div>`).join('');
}

function btnStyle(col) {
  return `background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:4px 9px;color:${col};font-family:var(--exo);font-size:.7rem;cursor:pointer;flex-shrink:0;transition:all .15s;`;
}

// ── Render preset lists ──
function renderPresets() {
  const el = document.getElementById('pl-presets'); if (!el) return;
  const existing = getPlaylists().map(p => p.id);
  const cats = {};
  PL_PRESETS.forEach(p => { const c = p.cat||'Other'; if(!cats[c]) cats[c]=[]; cats[c].push(p); });
  el.innerHTML = Object.entries(cats).map(([cat, presets]) => `
    <div style="font-family:var(--exo);font-size:.63rem;color:var(--teal);letter-spacing:1.5px;text-transform:uppercase;margin:10px 0 5px;opacity:.8;">${cat}</div>
    ${presets.map(p => {
      const added = existing.includes(p.id);
      return `<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.02);border:1px solid rgba(77,159,255,.1);border-radius:9px;padding:7px 12px;margin-bottom:4px;">
        <div style="flex-shrink:0;">${p.type==='album'?'💿':'🎶'}</div>
        <div style="flex:1;font-family:var(--raj);font-size:.82rem;color:${added?'var(--silver)':'var(--text)'};">${p.name}</div>
        <button onclick="addPresetPlaylist(${JSON.stringify(p).replace(/"/g,'&quot;')})" ${added?'disabled':''} style="background:${added?'rgba(255,255,255,.04)':'rgba(77,159,255,.12)'};border:1px solid ${added?'rgba(255,255,255,.1)':'rgba(77,159,255,.3)'};border-radius:7px;padding:4px 11px;color:${added?'var(--silver)':'var(--accent2)'};font-family:var(--exo);font-size:.7rem;cursor:${added?'default':'pointer'};flex-shrink:0;transition:all .15s;">${added?'✓':'+ Add'}</button>
      </div>`;
    }).join('')}`).join('');
}

// ── Manager tab toggle ──
function setManagerTab(src) {
  const spPanel = document.getElementById('mgr-spotify-panel');
  if (spPanel) spPanel.style.display = '';
  renderPlSavedList(); renderPresets();
}

function openPlaylistManager() {
  document.getElementById('pl-manager-overlay').style.display = 'block';
  document.getElementById('pl-manager').style.display = 'block';
  setManagerTab('spotify');
}

function closePlaylistManager() {
  document.getElementById('pl-manager-overlay').style.display = 'none';
  document.getElementById('pl-manager').style.display = 'none';
  // If music tab is open, refresh its playlist tabs
  if (document.getElementById('tab-music')?.classList.contains('on')) {
    renderMusicTabPlaylists();
  }
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    setMusicSource(musicSource);
  }, 300);
});
