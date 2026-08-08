// ══════════════════════════════════════════════
// Veda — Forum module (Firebase Firestore backend)
// Extracted from index.html inline <script> (was lines 13764–14177)
// Self-contained IIFE. Exposes: forumHandleFileInput, forumHandlePaste,
// forumRemoveAttachment, renderForumCats, loadForumFeed, openForumCompose,
// editForumPost, closeForumCompose, forumSetType, submitForumPost,
// openForumThread, closeForumThread, submitForumReply, flagPost, flagReply
// on window. Depends on window._fbUser (set by the main auth module) and
// loads the Firebase SDK itself from CDN — no other file dependency.
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// FORUM — Firebase Firestore backend
// ══════════════════════════════════════════════
(function() {

// ── Firebase config ──
const FB_CFG = {
  apiKey: "AIzaSyAH7cP8gWGszWPezWotHAYtf4hJM1mH1Ng",
  authDomain: "forum-veda.firebaseapp.com",
  projectId: "forum-veda",
  storageBucket: "forum-veda.firebasestorage.app",
  messagingSenderId: "330516813475",
  appId: "1:330516813475:web:d2f8ca339c9e44d8d6d116"
};

// ── Subjects ──
const FORUM_SUBJECTS = ['All','Maths','Physics','Chemistry','Biology','English','History','Geography','Computer Science','Economics','Psychology','Art','Music','Other'];

// ── Profanity list (expandable) ──
const BAD_WORDS = ['fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','cock','nigger','nigga','faggot','retard','whore','slut'];
function censorText(text) {
  let out = text;
  BAD_WORDS.forEach(w => {
    const re = new RegExp('\\b' + w + '\\b', 'gi');
    out = out.replace(re, m => m[0] + '*'.repeat(m.length - 1));
  });
  return out;
}

// ── State ──
let _db = null, _forumCat = 'All', _forumType = 'question', _currentPostId = null, _unsubFeed = null;

// ── Init Firebase lazily ──
async function forumGetDB() {
  if (_db) return _db;
  // Load Firebase from CDN
  if (!window.firebase) {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
  }
  if (!window.firebase.apps.length) window.firebase.initializeApp(FB_CFG);
  _db = window.firebase.firestore();
  return _db;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector('script[src="' + src + '"]')) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ── Attachments (paste or file picker) ──
let _forumAttachment = null; // { base64, mimeType }

function forumCompressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl, mimeType: 'image/jpeg' });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function forumSetAttachmentFromFile(file) {
  if (!file || !file.type.startsWith('image/')) { showToast('⚠️ Only images can be attached'); return; }
  try {
    const compressed = await forumCompressImage(file, 900, 0.65);
    if (compressed.base64.length > 700000) { showToast('⚠️ Image still too large after compression'); return; }
    _forumAttachment = compressed;
    const preview = document.getElementById('forum-compose-preview');
    const img = document.getElementById('forum-compose-preview-img');
    img.src = compressed.base64;
    preview.style.display = 'block';
  } catch (e) { showToast('⚠️ Could not read image'); }
}

window.forumHandleFileInput = function(input) {
  if (input.files && input.files[0]) forumSetAttachmentFromFile(input.files[0]);
  input.value = '';
};

window.forumHandlePaste = function(e) {
  const items = e.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      forumSetAttachmentFromFile(item.getAsFile());
      return;
    }
  }
};

window.forumRemoveAttachment = function() {
  _forumAttachment = null;
  document.getElementById('forum-compose-preview').style.display = 'none';
  document.getElementById('forum-compose-preview-img').src = '';
};

// ── Current username ──
function forumUsername() {
  try { const a = getAcct(); return a.name || a.username || 'Student'; } catch { return 'Student'; }
}
function forumUid() {
  return (window._fbUser && window._fbUser.uid) || null;
}

// ── Subjects filter bar ──
window.renderForumCats = function renderForumCats() {
  const el = document.getElementById('forum-cats');
  if (!el) return;
  el.innerHTML = FORUM_SUBJECTS.map(s =>
    `<button class="forum-cat-btn${s === _forumCat ? ' on' : ''}" onclick="window._forumSetCat('${s}')">${s}</button>`
  ).join('');
}

window._forumSetCat = function(cat) {
  _forumCat = cat;
  renderForumCats();
  loadForumFeed();
};

// ── Load feed ──
window.loadForumFeed = async function loadForumFeed() {
  const feed = document.getElementById('forum-feed');
  if (!feed) return;
  feed.innerHTML = '<div style="text-align:center;padding:40px 0;font-family:var(--exo);color:var(--silver);opacity:.5;">Loading...</div>';

  try {
    const db = await forumGetDB();
    if (_unsubFeed) { _unsubFeed(); _unsubFeed = null; }

    let q = db.collection('posts').orderBy('createdAt', 'desc').limit(40);
    if (_forumCat !== 'All') q = db.collection('posts').where('subject', '==', _forumCat).orderBy('createdAt', 'desc').limit(40);

    _unsubFeed = q.onSnapshot(snap => {
      if (snap.empty) {
        feed.innerHTML = '<div style="text-align:center;padding:40px 0;font-family:var(--exo);color:var(--silver);opacity:.5;">No posts yet — be the first!</div>';
        return;
      }
      feed.innerHTML = '';
      snap.forEach(doc => {
        const p = doc.data();
        if ((p.flags || 0) >= 3) return; // hidden
        const card = document.createElement('div');
        card.className = 'forum-post-card';
        const ago = timeAgo(p.createdAt?.toDate ? p.createdAt.toDate() : new Date());
        card.innerHTML = `
          <span class="forum-post-type ${p.type}">${p.type === 'question' ? '❓ Question' : '💡 Tip'}</span>
          <div class="forum-post-title">${escHtml(p.title)}${p.edited ? ' <span style="font-size:.65rem;opacity:.5;font-weight:400;">(edited)</span>' : ''}</div>
          ${p.image ? `<img src="${p.image}" style="max-height:140px;border-radius:8px;margin:6px 0;display:block;">` : ''}
          <div class="forum-post-meta">
            <span>👤 ${escHtml(p.author)}</span>
            <span>📚 ${escHtml(p.subject)}</span>
            <span>🕐 ${ago}</span>
            <span>💬 ${p.replyCount || 0} replies</span>
          </div>`;
        card.onclick = () => openForumThread(doc.id, p);
        feed.appendChild(card);
      });
    }, err => {
      feed.innerHTML = '<div style="text-align:center;padding:30px;font-family:var(--exo);color:#ff6680;">Failed to load posts. Check connection.</div>';
    });
  } catch(e) {
    feed.innerHTML = `<div style="text-align:center;padding:30px;font-family:var(--exo);color:#ff6680;">Couldn't load the forum. ${e && e.message ? escHtml(e.message) : 'Check your connection and try again.'}</div>`;
  }
}

// ── Compose ──
let _editingPostId = null;

window.openForumCompose = function() {
  _editingPostId = null;
  const modal = document.getElementById('forum-compose-modal');
  if (!modal) return;
  document.getElementById('forum-compose-heading').textContent = '// NEW POST';
  document.getElementById('forum-compose-submit-btn').textContent = 'Post';
  // Populate subject dropdown
  const sel = document.getElementById('forum-compose-subject');
  sel.innerHTML = FORUM_SUBJECTS.filter(s => s !== 'All').map(s => `<option value="${s}">${s}</option>`).join('');
  if (_forumCat !== 'All') sel.value = _forumCat;
  modal.style.display = 'flex';
};

window.editForumPost = function(postId, post) {
  _editingPostId = postId;
  const modal = document.getElementById('forum-compose-modal');
  if (!modal) return;
  document.getElementById('forum-compose-heading').textContent = '// EDIT POST';
  document.getElementById('forum-compose-submit-btn').textContent = 'Save changes';
  const sel = document.getElementById('forum-compose-subject');
  sel.innerHTML = FORUM_SUBJECTS.filter(s => s !== 'All').map(s => `<option value="${s}">${s}</option>`).join('');
  sel.value = post.subject;
  document.getElementById('forum-compose-title').value = post.title;
  document.getElementById('forum-compose-body').value = post.body;
  _forumType = post.type;
  document.querySelectorAll('.forum-type-btn').forEach(b => b.classList.toggle('on', b.dataset.type === post.type));
  if (post.image) {
    _forumAttachment = { base64: post.image, mimeType: 'image/jpeg' };
    document.getElementById('forum-compose-preview-img').src = post.image;
    document.getElementById('forum-compose-preview').style.display = 'block';
  }
  closeForumThread();
  modal.style.display = 'flex';
};

window.closeForumCompose = function() {
  const modal = document.getElementById('forum-compose-modal');
  if (modal) modal.style.display = 'none';
  document.getElementById('forum-compose-title').value = '';
  document.getElementById('forum-compose-body').value = '';
  forumRemoveAttachment();
  _editingPostId = null;
};

window.forumSetType = function(btn, type) {
  _forumType = type;
  document.querySelectorAll('.forum-type-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
};

window.submitForumPost = async function() {
  const title = censorText(document.getElementById('forum-compose-title').value.trim());
  const body  = censorText(document.getElementById('forum-compose-body').value.trim());
  const subject = document.getElementById('forum-compose-subject').value;

  if (!title) { showToast('⚠️ Add a title'); return; }
  if (!body)  { showToast('⚠️ Write something in the body'); return; }

  try {
    const db = await forumGetDB();
    const payload = {
      title, body, subject,
      type: _forumType,
      image: _forumAttachment ? _forumAttachment.base64 : null,
    };
    if (_editingPostId) {
      payload.edited = true;
      payload.editedAt = window.firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('posts').doc(_editingPostId).update(payload);
      showToast('✅ Post updated!');
    } else {
      payload.author = forumUsername();
      payload.uid = forumUid();
      payload.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();
      payload.replyCount = 0;
      payload.flags = 0;
      payload.flaggedBy = [];
      await db.collection('posts').add(payload);
      showToast('✅ Post published!');
    }
    closeForumCompose();
  } catch(e) {
    showToast('❌ ' + e.message);
  }
};

// ── Thread view ──
window.openForumThread = async function(postId, post) {
  _currentPostId = postId;
  window._currentThreadPost = post;
  const modal = document.getElementById('forum-thread-modal');
  const content = document.getElementById('forum-thread-content');
  const label = document.getElementById('forum-thread-label');
  if (!modal || !content) return;

  const isOwner = post.uid && forumUid() && post.uid === forumUid();
  label.textContent = post.subject + ' · ' + (post.type === 'question' ? 'QUESTION' : 'TIP');
  content.innerHTML = `
    <div style="border-bottom:1px solid rgba(255,255,255,.07);padding-bottom:14px;margin-bottom:4px;">
      <span class="forum-post-type ${post.type}">${post.type === 'question' ? '❓ Question' : '💡 Tip'}</span>
      <div class="forum-post-title" style="font-size:1rem;">${escHtml(post.title)}${post.edited ? ' <span style="font-size:.65rem;opacity:.5;font-weight:400;">(edited)</span>' : ''}</div>
      <div style="font-family:var(--exo);font-size:.8rem;color:var(--text);line-height:1.7;margin:10px 0;">${escHtml(post.body)}</div>
      ${post.image ? `<img src="${post.image}" style="max-width:100%;border-radius:10px;margin-bottom:10px;display:block;">` : ''}
      <div class="forum-post-meta">
        <span>👤 ${escHtml(post.author)}</span>
        <span>${timeAgo(post.createdAt?.toDate ? post.createdAt.toDate() : new Date())}</span>
        ${isOwner ? `<button class="forum-flag-btn" onclick="editForumPost(_currentPostId, window._currentThreadPost)">✏️ Edit</button>` : ''}
        <button class="forum-flag-btn" onclick="flagPost('${postId}')">🚩 Flag</button>
      </div>
    </div>
    <div id="forum-replies-list" style="display:flex;flex-direction:column;gap:10px;">
      <div style="font-family:var(--exo);font-size:.72rem;color:var(--silver);opacity:.5;">Loading replies...</div>
    </div>`;

  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';

  // Load replies live
  try {
    const db = await forumGetDB();
    db.collection('posts').doc(postId).collection('replies')
      .orderBy('createdAt', 'asc').limit(60)
      .onSnapshot(snap => {
        const list = document.getElementById('forum-replies-list');
        if (!list) return;
        if (snap.empty) {
          list.innerHTML = '<div style="font-family:var(--exo);font-size:.75rem;color:var(--silver);opacity:.5;text-align:center;padding:20px 0;">No replies yet — be the first!</div>';
          return;
        }
        list.innerHTML = '';
        snap.forEach(doc => {
          const r = doc.data();
          if ((r.flags || 0) >= 3) return;
          const card = document.createElement('div');
          card.className = 'forum-reply-card';
          card.innerHTML = `
            <div style="font-family:var(--exo);font-size:.78rem;color:var(--text);line-height:1.6;">${escHtml(r.body)}</div>
            <div class="forum-post-meta" style="margin-top:8px;">
              <span>👤 ${escHtml(r.author)}</span>
              <span>${timeAgo(r.createdAt?.toDate ? r.createdAt.toDate() : new Date())}</span>
              <button class="forum-flag-btn" onclick="flagReply('${postId}','${doc.id}')">🚩 Flag</button>
            </div>`;
          list.appendChild(card);
        });
      });
  } catch(e) {}
};

window.closeForumThread = function() {
  const modal = document.getElementById('forum-thread-modal');
  if (modal) modal.style.display = 'none';
  _currentPostId = null;
};

window.submitForumReply = async function() {
  const inp = document.getElementById('forum-reply-in');
  const body = censorText((inp?.value || '').trim());
  if (!body || !_currentPostId) return;
  try {
    const db = await forumGetDB();
    const batch = db.batch();
    const replyRef = db.collection('posts').doc(_currentPostId).collection('replies').doc();
    batch.set(replyRef, {
      body, author: forumUsername(), uid: forumUid(),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      flags: 0, flaggedBy: []
    });
    batch.update(db.collection('posts').doc(_currentPostId), {
      replyCount: window.firebase.firestore.FieldValue.increment(1)
    });
    await batch.commit();
    inp.value = '';
  } catch(e) {
    showToast('❌ ' + e.message);
  }
};

// ── Flag system ──
window.flagPost = async function(postId) {
  const me = forumUsername();
  try {
    const db = await forumGetDB();
    const ref = db.collection('posts').doc(postId);
    const snap = await ref.get();
    const data = snap.data();
    if ((data.flaggedBy || []).includes(me)) { showToast('⚠️ You already flagged this'); return; }
    const newFlags = (data.flags || 0) + 1;
    await ref.update({ flags: newFlags, flaggedBy: window.firebase.firestore.FieldValue.arrayUnion(me) });
    if (newFlags >= 3) { showToast('🚩 Post hidden after 3 flags'); closeForumThread(); }
    else showToast('🚩 Flagged — ' + (3 - newFlags) + ' more needed to hide');
  } catch(e) { showToast('❌ ' + e.message); }
};

window.flagReply = async function(postId, replyId) {
  const me = forumUsername();
  try {
    const db = await forumGetDB();
    const ref = db.collection('posts').doc(postId).collection('replies').doc(replyId);
    const snap = await ref.get();
    const data = snap.data();
    if ((data.flaggedBy || []).includes(me)) { showToast('⚠️ Already flagged'); return; }
    await ref.update({ flags: (data.flags || 0) + 1, flaggedBy: window.firebase.firestore.FieldValue.arrayUnion(me) });
    showToast('🚩 Reply flagged');
  } catch(e) { showToast('❌ ' + e.message); }
};

// ── Helpers ──
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

// ── Hook into go() for forum init ──
// (forum init is handled by the smart nav go() hook above)

})();

