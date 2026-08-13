// ══════════════════════════════════════════════════════
// Veda — Leaderboard System
// Extracted from index.html inline <script> (was lines 13420–13758)
// Plain global-scope script (not a module/IIFE). Calls showToast()/
// showNotif() from features.js — must load AFTER features.js.
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// ── LEADERBOARD SYSTEM ──
// ══════════════════════════════════════════════════════

let lbTab   = 'gems';    // gems | streak | games
let lbScope = 'friends'; // friends | global

// ── Generate or retrieve a persistent friend code ──
function lbGetMyCode() {
  let code = localStorage.getItem('veda_friend_code');
  if (!code) {
    // 6-char alphanumeric
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    localStorage.setItem('veda_friend_code', code);
  }
  return code;
}

// ── Push current user's stats to Firestore ──
async function lbPushStats() {
  if (window._isGuest || !window._fbUser) return;
  if (!window._fbUser) return;
  const uid  = window._fbUser.uid;
  const code = lbGetMyCode();
  const acct = getAcct();
  const visible = localStorage.getItem('veda_lb_visible') !== 'false'; // default true
  const hiSnake  = parseInt(localStorage.getItem('hi_snake')  || 0);
  const hiTyping = parseInt(localStorage.getItem('hi_typing') || 0);
  const hiMath   = parseInt(localStorage.getItem('hi_math')   || 0);
  const topGame  = Math.max(hiSnake, hiTyping, hiMath);
  const name = acct.name || window._fbUser.displayName || 'Scholar';
  const title = typeof getSelectedTitle === 'function' ? getSelectedTitle(acct) : null;
  try {
    await window._fb.saveLeaderboard(uid, {
      lbCode:    code,
      lbName:    name,
      lbAvatar:  acct.avatar  || '🎓',
      lbGems:    acct.gems    || 0,
      lbStreak:  acct.streak  || 0,
      lbGames:   topGame,
      lbVisible: visible,
      lbTitle:      title ? title.name  : '',
      lbTitleEmoji: title ? title.emoji : '',
      lbUpdated: Date.now(),
    });
  } catch(e) { /* silent */ }
}

// ── Get friends list (array of UIDs) ──
function lbGetFriends() {
  try { return JSON.parse(localStorage.getItem('veda_friends') || '[]'); } catch { return []; }
}
function lbSaveFriends(arr) {
  localStorage.setItem('veda_friends', JSON.stringify(arr));
}

// ── Copy own code ──
function lbCopyCode() {
  const code = lbGetMyCode();
  navigator.clipboard.writeText(code).then(() => showToast('📋 Friend code copied!')).catch(() => {
    // fallback
    const el = document.getElementById('lb-my-code');
    if (el) { const r = document.createRange(); r.selectNode(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); }
    showToast('📋 Code selected — Ctrl+C to copy');
  });
}

// ── Add friend by code ──
async function lbAddFriend() {
  const inp = document.getElementById('lb-add-code-in');
  const status = document.getElementById('lb-add-status');
  const code = (inp ? inp.value.trim().toUpperCase() : '');
  if (!status) return;
  if (code.length !== 6) { status.style.color='#ff6680'; status.textContent='⚠️ Codes are 6 characters'; return; }
  if (code === lbGetMyCode()) { status.style.color='#ff6680'; status.textContent='⚠️ That\'s your own code!'; return; }
  if (!window._fbUser) { status.style.color='#ff6680'; status.textContent='⚠️ Sign in with Google first'; return; }

  status.style.color = 'var(--teal)'; status.textContent = '🔍 Searching...';

  try {
    // Query Firestore for a user whose lbCode matches
    const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const db = getFirestore();
    const q  = query(collection(db, 'users'), where('lbCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) { status.style.color='#ff6680'; status.textContent='❌ No user found with that code'; return; }
    const friendDoc = snap.docs[0];
    const friendUid = friendDoc.id;
    const friends = lbGetFriends();
    if (friends.includes(friendUid)) { status.style.color='var(--silver)'; status.textContent='Already friends!'; return; }
    friends.push(friendUid);
    lbSaveFriends(friends);
    const friendName = friendDoc.data().lbName || 'Scholar';
    status.style.color = 'var(--teal2)';
    status.textContent = `✅ Added ${friendName}!`;
    if (inp) inp.value = '';
    setTimeout(() => { if (status) status.textContent = ''; }, 3000);
    lbRender();
  } catch(e) {
    status.style.color = '#ff6680';
    status.textContent = '❌ Error — check connection';
  }
}

// ── Tab / scope switchers ──
function lbSetTab(tab, el) {
  lbTab = tab;
  document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('on'));
  if (el) el.classList.add('on');
  lbRender();
}
function lbSetScope(scope, el) {
  lbScope = scope;
  document.querySelectorAll('.lb-scope-btn').forEach(b => b.classList.remove('on'));
  if (el) el.classList.add('on');
  lbRender();
}

// ── Visibility toggle ──
function lbToggleVisibility() {
  const current = localStorage.getItem('veda_lb_visible') !== 'false';
  localStorage.setItem('veda_lb_visible', current ? 'false' : 'true');
  lbUpdateVisibilityBtn();
  lbPushStats();
  showToast(current ? '🔒 Hidden from global leaderboard' : '🌐 Now visible on global leaderboard');
}
function lbUpdateVisibilityBtn() {
  const btn = document.getElementById('lb-visibility-btn');
  if (!btn) return;
  const visible = localStorage.getItem('veda_lb_visible') !== 'false';
  btn.textContent = visible ? '✅ Visible' : '🔒 Hidden';
  btn.style.color = visible ? 'var(--teal2)' : 'var(--silver)';
  btn.style.borderColor = visible ? 'rgba(0,212,170,.4)' : 'rgba(77,159,255,.2)';
}

// ── Fetch user data from Firestore by UID ──
async function lbFetchUser(uid) {
  try { return await window._fb.loadLeaderboard(uid); } catch { return null; }
}

// ── Get the sort value based on current tab ──
function lbVal(userData) {
  if (lbTab === 'gems')   return userData.lbGems   || 0;
  if (lbTab === 'streak') return userData.lbStreak  || 0;
  if (lbTab === 'games')  return userData.lbGames   || 0;
  return 0;
}
function lbValLabel(userData) {
  if (lbTab === 'gems')   return (userData.lbGems   || 0) + ' 💎';
  if (lbTab === 'streak') return (userData.lbStreak  || 0) + ' 🔥';
  if (lbTab === 'games')  return (userData.lbGames   || 0) + ' pts';
  return '0';
}

// ── Main render ──
async function lbRender() {
  const wrap = document.getElementById('lb-list-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div style="text-align:center;padding:32px;font-family:var(--exo);font-size:.8rem;color:var(--silver);opacity:.5;"><span class="dots"><span>·</span><span>·</span><span>·</span></span> Loading...</div>`;

  if (!window._fbUser) {
    wrap.innerHTML = `<div class="lb-empty">Sign in with Google to use the leaderboard.<br><span style="opacity:.6;font-size:.72rem;">Your profile stays private unless you enable global visibility.</span></div>`;
    return;
  }

  // Always push our own fresh stats first
  await lbPushStats();

  const myUid  = window._fbUser.uid;
  const myData = await lbFetchUser(myUid);

  let entries = []; // [{uid, data}]

  if (lbScope === 'friends') {
    const friends = lbGetFriends();
    // Always include self + friends
    const uids = [...new Set([myUid, ...friends])];
    const results = await Promise.all(uids.map(async uid => {
      if (uid === myUid) return myData ? {uid, data:myData} : null;
      const d = await lbFetchUser(uid);
      return d ? {uid, data:d} : null;
    }));
    entries = results.filter(Boolean);
  } else {
    // Global — fetch top 50 visible users
    try {
      const { getFirestore, collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const db = getFirestore();
      const field = lbTab === 'gems' ? 'lbGems' : lbTab === 'streak' ? 'lbStreak' : 'lbGames';
      const q = query(collection(db,'leaderboardPublic'), where('lbVisible','==',true), orderBy(field,'desc'), limit(50));
      const snap = await getDocs(q);
      entries = snap.docs.map(d => ({uid:d.id, data:d.data()}));
      // Inject self if not visible but user wants to see their rank
      if (!entries.find(e => e.uid === myUid) && myData) {
        entries.push({uid:myUid, data:myData});
      }
    } catch(e) {
      wrap.innerHTML = `<div class="lb-empty">❌ Could not load global board.<br><span style="font-size:.72rem;opacity:.6;">${e.message||'Check connection'}</span></div>`;
      return;
    }
  }

  // Sort
  entries.sort((a,b) => lbVal(b.data) - lbVal(a.data));

  if (entries.length === 0) {
    wrap.innerHTML = `<div class="lb-empty">No data yet — keep studying to climb the board! 🚀</div>`;
    return;
  }

  const html = entries.map((entry, i) => {
    const rank = i + 1;
    const isMe = entry.uid === myUid;
    const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const rankIcon  = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const name = entry.data.lbName   || 'Scholar';
    const avatar = entry.data.lbAvatar || '🎓';
    const val  = lbValLabel(entry.data);
    const meTag = isMe ? ' <span style="font-family:var(--exo);font-size:.62rem;color:var(--teal2);letter-spacing:1px;">YOU</span>' : '';
    // Title gets its own line under the name — cramming it onto the name row
    // alongside the YOU tag pushed YOU past the name's ellipsis on mobile.
    const titleTag = entry.data.lbTitle ? `<span class="lb-title-tag">${entry.data.lbTitleEmoji || ''} ${entry.data.lbTitle}</span>` : '';
    const subLine = titleTag || (isMe ? 'Your score' : (entry.data.lbCode || ''));
    return `<div class="lb-row ${isMe?'lb-me':''}">
      <div class="lb-rank ${rankClass}">${rankIcon}</div>
      <div class="lb-avatar">${avatar}</div>
      <div class="lb-info">
        <div class="lb-name">${name}${meTag}</div>
        <div class="lb-sub">${subLine}</div>
      </div>
      <div class="lb-val">${val}</div>
    </div>`;
  }).join('');

  wrap.innerHTML = html;

  // If only self on friends board, nudge to add friends
  if (lbScope === 'friends' && lbGetFriends().length === 0) {
    wrap.innerHTML += `<div class="lb-empty" style="padding:16px 0 4px;font-size:.72rem;">👆 That's just you! Share your code to add friends.</div>`;
  }

  // Update my rank display
  const myRank = entries.findIndex(e => e.uid === myUid) + 1;
  // also refresh home widget
  lbRefreshHomeWidget(entries, myUid);
}

// ── Refresh the home dashboard mini-widget ──
function lbRefreshHomeWidget(entries, myUid) {
  const list = document.getElementById('lb-home-list');
  const rankWrap = document.getElementById('lb-home-rank');
  const rankVal  = document.getElementById('lb-home-rank-val');
  if (!list) return;

  const top3 = entries.slice(0, 3);
  if (top3.length === 0) {
    list.innerHTML = `<div style="font-family:var(--exo);font-size:.72rem;color:var(--silver);opacity:.5;text-align:center;padding:8px 0;">Add friends to see the board</div>`;
    return;
  }

  list.innerHTML = top3.map((entry, i) => {
    const icon = ['🥇','🥈','🥉'][i] || (i+1);
    const name  = entry.data.lbName || 'Scholar';
    const isMe  = entry.uid === myUid;
    const val   = lbValLabel(entry.data);
    return `<div class="lb-mini-row">
      <div class="lb-mini-rank">${icon}</div>
      <div class="lb-mini-name" style="${isMe?'color:var(--teal2);':''}">${name}${isMe?' ✦':''}</div>
      <div class="lb-mini-val">${val}</div>
    </div>`;
  }).join('');

  const myRank = entries.findIndex(e => e.uid === myUid) + 1;
  if (myRank > 0 && rankWrap && rankVal) {
    rankWrap.style.display = 'block';
    rankVal.textContent = '#' + myRank + ' of ' + entries.length;
  }
}

// ── Init leaderboard when tab is opened (wired into go() via DOMContentLoaded below) ──

// ── APPEARANCE SUBNAV ──
function apGo(id, btn) {
  const scope = btn ? (btn.closest('.tab') || document) : document;
  scope.querySelectorAll('.ap-panel').forEach(p => p.classList.remove('on'));
  scope.querySelectorAll('.ap-tab').forEach(t => t.classList.remove('on'));
  const panel = document.getElementById('ap-' + id);
  if (panel) panel.classList.add('on');
  if (btn) btn.classList.add('on');
}


function lbOnOpen() {
  const codeEl = document.getElementById('lb-my-code');
  if (codeEl) codeEl.textContent = lbGetMyCode();
  lbUpdateVisibilityBtn();
  lbRender();
}

// ── Load home widget on page ready ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    if (!window._fbUser) return;
    await lbPushStats();
    const myUid = window._fbUser.uid;
    const friends = lbGetFriends();
    const uids = [...new Set([myUid, ...friends])];
    const results = await Promise.all(uids.map(async uid => {
      const d = await window._fb.loadLeaderboard(uid);
      return d ? {uid, data:d} : null;
    }));
    const entries = results.filter(Boolean).sort((a,b) => (b.data.lbGems||0) - (a.data.lbGems||0));
    lbRefreshHomeWidget(entries, myUid);
  }, 2500);
});


document.addEventListener('DOMContentLoaded', () => {
  // Wrap doNotes to show PDF export button after notes are generated
  if (typeof window.doNotes === 'function') {
    const __dn = window.doNotes;
    window.doNotes = async function(mode) {
      await __dn(mode);
      setTimeout(() => {
        const pdfBtn = document.getElementById('notes-pdf-btn');
        const outEl = document.getElementById('notes-out');
        if (pdfBtn && outEl && outEl.textContent.trim()) pdfBtn.style.display = 'block';
      }, 500);
    };
  }

  renderExamCountdown();
  initDailyChallenge();
  setTimeout(checkNotifications, 1500);

  // Re-check countdown and challenge when navigating home
  if (typeof go === 'function') {
    const __go = go;
    window.go = function(name) {
      __go(name);
      if (name === 'home') { renderExamCountdown(); initDailyChallenge(); }
      if (name === 'leaderboard') { lbOnOpen(); }
    };
  }
});
