// ══════════════════════════════════════════════════════
// Veda — App Features: Notifications, Exam Countdown,
// Daily Challenge, Timetable Importer, PDF Export
// Extracted from index.html inline <script> (was lines 12911–13419)
// Plain global-scope script (not a module/IIFE) — must load BEFORE
// leaderboard.js, which calls showToast()/showNotif() defined here.
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// VEDA FEATURES: Exam Countdown, Daily Challenge,
// Timetable Importer, Notifications, PDF Export
// ══════════════════════════════════════════════════════

// ── NOTIFICATION SYSTEM ──
let notifActionCb = null;
function showNotif(text, actionLabel, actionCb) {
  const bar = document.getElementById('veda-notif-bar');
  const txt = document.getElementById('veda-notif-text');
  const btn = document.getElementById('veda-notif-action');
  if (!bar || !txt) return;
  txt.textContent = text;
  if (actionLabel && actionCb) {
    btn.textContent = actionLabel;
    btn.style.display = 'inline-block';
    notifActionCb = actionCb;
  } else {
    btn.style.display = 'none';
    notifActionCb = null;
  }
  bar.style.display = 'flex';
}
function dismissNotif() {
  const bar = document.getElementById('veda-notif-bar');
  if (bar) bar.style.display = 'none';
}
function handleNotifAction() {
  if (notifActionCb) notifActionCb();
  dismissNotif();
}
function checkNotifications() {
  const today = new Date(); today.setHours(0,0,0,0);
  const msgs = [];

  // Exam countdown nudges
  try {
    const exams = getExams();
    exams.forEach(ex => {
      const d = new Date(ex.date); d.setHours(0,0,0,0);
      const diff = Math.round((d - today) / 86400000);
      if (diff === 0)      msgs.push({ text: `📅 ${ex.subject} exam is TODAY — good luck!`, action: null });
      else if (diff === 1) msgs.push({ text: `⚡ ${ex.subject} exam tomorrow. Review your notes tonight.`, action: 'Open Notes', cb: () => go('notes') });
      else if (diff <= 5)  msgs.push({ text: `📚 ${ex.subject} exam in ${diff} days. Keep revising!`, action: null });
    });
  } catch(e) {}

  // SM-2 due packs
  try {
    const packs = JSON.parse(localStorage.getItem('studly_packs') || '[]');
    const todayStr = new Date().toISOString().slice(0,10);
    let dueCount = 0, dueTopic = '';
    packs.forEach(pack => {
      if (!pack.cards) return;
      const due = pack.cards.filter(c => !c.nextReview || c.nextReview <= todayStr).length;
      if (due > 0) { dueCount += due; if (!dueTopic) dueTopic = pack.topic || 'your packs'; }
    });
    if (dueCount > 0) msgs.push({ text: `🧠 ${dueCount} card${dueCount>1?'s':''} due for review in ${dueTopic}`, action: 'Study Now', cb: () => go('study') });
  } catch(e) {}

  if (msgs.length > 0) {
    const m = msgs[0];
    showNotif(m.text, m.action || null, m.cb || null);
  }
}

// ── EXAM COUNTDOWN ──
function getExams() { try { return JSON.parse(localStorage.getItem('veda_exams')||'[]'); } catch { return []; } }
function saveExams(a) { localStorage.setItem('veda_exams', JSON.stringify(a)); }

function openExamModal() {
  const ov = document.getElementById('exam-modal-overlay');
  if (!ov) return;
  const d = new Date(); d.setDate(d.getDate() + 14);
  document.getElementById('exam-modal-date').value = d.toISOString().slice(0,10);
  document.getElementById('exam-modal-notes').value = '';
  ov.style.display = 'flex';
}
function closeExamModal() {
  const ov = document.getElementById('exam-modal-overlay');
  if (ov) ov.style.display = 'none';
}
function saveExam() {
  const subject = document.getElementById('exam-modal-subject').value;
  const date    = document.getElementById('exam-modal-date').value;
  const notes   = document.getElementById('exam-modal-notes').value.trim();
  if (!date) { showToast('⚠️ Pick a date'); return; }
  const exams = getExams();
  exams.push({ id: Date.now().toString(), subject, date, notes });
  exams.sort((a,b) => a.date.localeCompare(b.date));
  saveExams(exams);
  closeExamModal();
  renderExamCountdown();
  checkNotifications();
  showToast('📅 Exam added!');
}
function deleteExam(id) {
  saveExams(getExams().filter(e => e.id !== id));
  renderExamCountdown();
}
function renderExamCountdown() {
  const list = document.getElementById('exam-countdown-list');
  const emptyMsg = document.getElementById('exam-empty-msg');
  if (!list) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const future = getExams().filter(e => {
    const d = new Date(e.date); d.setHours(0,0,0,0);
    return d >= new Date(today.getTime() - 86400000);
  });
  saveExams(future);
  if (future.length === 0) {
    list.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';
  list.innerHTML = future.map(ex => {
    const exDate = new Date(ex.date); exDate.setHours(0,0,0,0);
    const diff = Math.round((exDate - today) / 86400000);
    const color = diff === 0 ? '#ff5566' : diff <= 3 ? '#fbbf24' : diff <= 7 ? '#fb923c' : 'var(--teal)';
    const label = diff === 0 ? 'TODAY' : diff === 1 ? 'Tomorrow' : diff + ' days';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,.025);border:1px solid rgba(77,159,255,.1);border-radius:8px;">
      <div style="font-family:var(--orb);font-size:.85rem;font-weight:900;color:${color};min-width:54px;text-align:center;line-height:1.15;">
        <div>${label}</div>
        <div style="font-size:.45rem;letter-spacing:1px;color:var(--silver);font-weight:400;">${ex.date}</div>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--raj);font-size:.8rem;color:var(--text);font-weight:600;">${ex.subject}</div>
        ${ex.notes ? `<div style="font-family:var(--exo);font-size:.62rem;color:var(--silver);opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ex.notes}</div>` : ''}
      </div>
      <button onclick="deleteExam('${ex.id}')" style="background:none;border:none;color:var(--silver);font-size:.8rem;cursor:pointer;opacity:.35;padding:0 2px;" title="Remove">✕</button>
    </div>`;
  }).join('');
}

// ── DAILY CHALLENGE ──
function getDCState() { try { return JSON.parse(localStorage.getItem('veda_daily_challenge')||'null'); } catch { return null; } }
function saveDCState(s) { localStorage.setItem('veda_daily_challenge', JSON.stringify(s)); }
let dcTimer = null, dcSecsLeft = 60;
const DC_SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','History','Geography','English','Computer Science','Economics'];

// Simple fuzzy match — normalises case, punctuation, leading/trailing whitespace
function dcFuzzyMatch(userAns, correctAns) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim().replace(/^(the|a|an) /,'');
  const u = norm(userAns), c = norm(correctAns);
  if (u === c) return true;
  if (c.includes(' ') && (u.includes(c) || c.includes(u))) return true;
  const maxDist = Math.floor(c.length / 6);
  if (maxDist > 0 && levenshtein(u, c) <= maxDist) return true;
  return false;
}
function levenshtein(a, b) {
  const dp = Array.from({length: a.length + 1}, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

// Calculate streak based purely on saved state — single source of truth
function calcStreak(prevState, correct) {
  if (!correct) return 0;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const hadYesterday = prevState?.date === yesterday && prevState?.completed && (prevState?.streak || 0) > 0;
  return hadYesterday ? (prevState.streak + 1) : 1;
}

async function initDailyChallenge() {
  const loading = document.getElementById('dc-loading');
  const qWrap   = document.getElementById('dc-question-wrap');
  const rWrap   = document.getElementById('dc-result-wrap');
  const noKey   = document.getElementById('dc-no-key-msg');
  const badge   = document.getElementById('dc-streak-badge');
  if (!qWrap) return;

  const today = new Date().toDateString();
  const state = getDCState();

  // Update streak badge from saved state
  if (badge) {
    const streak = state?.streak || 0;
    badge.textContent = streak > 0 ? '🔥 ' + streak + ' day streak' : '';
    badge.style.display = streak > 0 ? 'inline' : 'none';
  }

  if (!API_KEY) { if (noKey) noKey.style.display = 'block'; return; }

  // Already completed today — show result with a "next challenge" countdown
  if (state?.date === today && state?.completed) {
    showDCResult(state, true);
    return;
  }

  // Question already generated today, just re-show it (don't re-generate)
  if (state?.date === today && state?.question) {
    showDCQuestion(state);
    return;
  }

  // New day — generate a fresh question
  if (loading) loading.style.display = 'block';
  [qWrap, rWrap, noKey].forEach(el => { if(el) el.style.display = 'none'; });

  // Rotate subject by day so it's predictable, not random — prefer the student's own subjects
  const dayIndex = Math.floor(Date.now() / 86400000);
  const sprofile = getStudentProfile();
  const subjectPool = (sprofile.subjects && sprofile.subjects.length) ? sprofile.subjects : DC_SUBJECTS;
  const subject = subjectPool[dayIndex % subjectPool.length];

  // Scale difficulty by gem count
  const acctForDC = getAcct();
  const gemCount = acctForDC.gems || 0;
  let dcDifficulty, dcDiffLabel;
  if (gemCount >= 2000) { dcDifficulty = 'very hard (university/A-level difficulty, complex multi-step reasoning required)'; dcDiffLabel = '🔴 Expert'; }
  else if (gemCount >= 1000) { dcDifficulty = 'hard (A-level / advanced high school)'; dcDiffLabel = '🟠 Hard'; }
  else if (gemCount >= 500) { dcDifficulty = 'medium-hard (upper high school, requires some depth)'; dcDiffLabel = '🟡 Medium'; }
  else if (gemCount >= 100) { dcDifficulty = 'medium (standard high school)'; dcDiffLabel = '🟢 Standard'; }
  else { dcDifficulty = 'easy (introductory high school, one clear fact)'; dcDiffLabel = '🔵 Starter'; }

  // Show difficulty badge in subject tag
  try {
    const subTag = document.getElementById('dc-subject-tag');
    if (subTag) subTag.textContent = '📚 ' + subject + '  ·  ' + dcDiffLabel;
  } catch(e) { /* non-critical */ }

  try {
    const raw = await gemini(`Generate a single short-answer study question about ${subject}. Difficulty: ${dcDifficulty}. Return ONLY valid JSON, no markdown: {"question":"...","answer":"...","hint":"...","subject":"${subject}","difficulty":"${dcDiffLabel}"}. The answer must be 1-4 words only. Keep the question factual and specific.`);
    const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gm,'').trim());
    // Preserve previous state for streak calculation — don't recalculate streak at generate time
    const ns = { date: today, question: parsed.question, answer: parsed.answer, hint: parsed.hint, subject: parsed.subject || subject, diffLabel: dcDiffLabel, completed: false, streak: state?.streak || 0, prevState: state };
    saveDCState(ns);
    if (loading) loading.style.display = 'none';
    showDCQuestion(ns);
  } catch(e) {
    if (loading) loading.style.display = 'none';
    if (noKey) { noKey.style.display = 'block'; noKey.textContent = '⚠️ Could not load today\'s challenge — check your API key'; }
  }
}

function showDCQuestion(state) {
  const qWrap = document.getElementById('dc-question-wrap');
  const rWrap = document.getElementById('dc-result-wrap');
  const noKey = document.getElementById('dc-no-key-msg');
  if (!qWrap) return;
  if (rWrap) rWrap.style.display = 'none';
  if (noKey) noKey.style.display = 'none';
  qWrap.style.display = 'block';
  const subTag = document.getElementById('dc-subject-tag');
  const qEl   = document.getElementById('dc-question');
  const ansIn = document.getElementById('dc-answer-in');
  if (subTag) subTag.textContent = '📚 ' + (state.subject || '') + (state.diffLabel ? '  ·  ' + state.diffLabel : '');
  if (qEl)   qEl.textContent = state.question || '';
  if (ansIn) { ansIn.value = ''; ansIn.disabled = false; setTimeout(() => ansIn.focus(), 100); }
  startDCTimer(60);
}

let dcCountdownTimer = null;
function showDCResult(state, showCountdown = false) {
  const qWrap = document.getElementById('dc-question-wrap');
  const rWrap = document.getElementById('dc-result-wrap');
  if (!rWrap) return;
  if (qWrap) qWrap.style.display = 'none';
  rWrap.style.display = 'block';
  stopDCTimer();
  if (dcCountdownTimer) { clearInterval(dcCountdownTimer); dcCountdownTimer = null; }

  const icon  = document.getElementById('dc-result-icon');
  const msg   = document.getElementById('dc-result-msg');
  const expl  = document.getElementById('dc-explanation');
  const badge = document.getElementById('dc-streak-badge');
  const nextEl = document.getElementById('dc-next-label');

  if (icon) icon.textContent = state.correct ? '✅' : '❌';
  if (msg)  msg.textContent  = state.correct ? 'Correct! +5 gems 💎' : 'Incorrect — Answer: ' + state.answer;
  if (expl) expl.textContent = state.explanation || (state.correct ? 'Great work! Come back tomorrow for the next one.' : 'Keep studying — you\'ll get it next time!');

  const streak = state.streak || 0;
  if (badge) {
    badge.textContent = streak > 0 ? '🔥 ' + streak + ' day streak' : '';
    badge.style.display = streak > 0 ? 'inline' : 'none';
  }

  // Show countdown to midnight for next challenge
  if (showCountdown && nextEl) {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now); midnight.setHours(24,0,0,0);
      const diff = Math.max(0, midnight - now);
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
      nextEl.textContent = `Next challenge in ${h}h ${m}m ${s}s`;
    };
    tick();
    dcCountdownTimer = setInterval(tick, 1000);
    nextEl.style.display = 'block';
  } else if (nextEl) {
    nextEl.style.display = 'none';
  }
}

function startDCTimer(secs) {
  stopDCTimer();
  dcSecsLeft = secs;
  updateDCTimerUI();
  dcTimer = setInterval(() => {
    dcSecsLeft--;
    updateDCTimerUI();
    if (dcSecsLeft <= 0) { stopDCTimer(); submitDailyChallenge(true); }
  }, 1000);
}
function stopDCTimer() { if (dcTimer) { clearInterval(dcTimer); dcTimer = null; } }
function updateDCTimerUI() {
  const bar   = document.getElementById('dc-timer-bar');
  const label = document.getElementById('dc-timer-label');
  if (bar)   bar.style.width = Math.max(0, (dcSecsLeft / 60) * 100) + '%';
  if (label) label.textContent = dcSecsLeft > 0 ? dcSecsLeft + 's remaining' : "Time\'s up!";
}

function showDCHint() {
  const state = getDCState();
  const hintEl = document.getElementById('dc-hint-text');
  if (!hintEl || !state) return;
  hintEl.textContent = state.hint ? '💡 Hint: ' + state.hint : '💡 No hint available for this one!';
  hintEl.style.display = 'block';
}

async function submitDailyChallenge(timedOut = false) {
  const ansIn = document.getElementById('dc-answer-in');
  const state = getDCState();
  if (!state || state.completed) return;
  stopDCTimer();

  const userAns = timedOut ? '' : (ansIn ? ansIn.value.trim() : '');
  if (ansIn) ansIn.disabled = true;

  const loading = document.getElementById('dc-loading');
  const qWrap   = document.getElementById('dc-question-wrap');
  if (qWrap) qWrap.style.display = 'none';
  if (loading) { loading.style.display = 'block'; loading.innerHTML = '<span class="dots"><span>·</span><span>·</span><span>·</span></span> Checking...'; }

  // Grade locally first — no API call needed for short answers
  let correct = !timedOut && userAns ? dcFuzzyMatch(userAns, state.answer) : false;
  let explanation = '';

  // Only call API if local match fails and user gave a non-trivial answer
  // (catches synonyms, alternate valid forms, etc.)
  if (!correct && !timedOut && userAns && userAns.length > 1) {
    try {
      const raw = await gemini(`Question: "${state.question}"\nCorrect answer: "${state.answer}"\nStudent answered: "${userAns}"\nIs the student's answer correct or close enough? Respond ONLY with JSON: {"correct":true/false,"explanation":"1 sentence"}`);
      const result = JSON.parse(raw.replace(/^```(?:json)?|```$/gm,'').trim());
      correct = result.correct;
      explanation = result.explanation || '';
    } catch(e) {
      // fallback: stick with local result
    }
  }

  if (loading) loading.style.display = 'none';

  // Calculate streak once at submit time — single source of truth
  const newStreak = calcStreak(state.prevState || getDCState(), correct);
  const updated = { ...state, completed: true, correct, explanation, userAnswer: userAns, streak: newStreak, prevState: undefined };
  saveDCState(updated);

  if (correct && typeof awardGems === 'function') awardGems(5, 'Daily challenge!');

  // Update streak badge immediately
  const badge = document.getElementById('dc-streak-badge');
  if (badge) {
    badge.textContent = newStreak > 0 ? '🔥 ' + newStreak + ' day streak' : '';
    badge.style.display = newStreak > 0 ? 'inline' : 'none';
  }

  showDCResult(updated, true);
}

// ── SMART TIMETABLE IMPORTER ──
let ttImageData = null;
function openTimetableImporter() {
  const ov = document.getElementById('tt-modal-overlay');
  if (!ov) return;
  document.getElementById('tt-text-in').value = '';
  document.getElementById('tt-img-name').textContent = 'Choose image...';
  document.getElementById('tt-status').textContent = '';
  ttImageData = null;
  const d = new Date(), day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  document.getElementById('tt-week-start').value = mon.toISOString().slice(0,10);
  ov.style.display = 'flex';
}
function closeTimetableImporter() {
  const ov = document.getElementById('tt-modal-overlay');
  if (ov) ov.style.display = 'none';
}
function handleTimetableImage(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('tt-img-name').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => { ttImageData = { base64: e.target.result.split(',')[1], mimeType: file.type }; };
  reader.readAsDataURL(file);
}
async function runTimetableImport() {
  const text = document.getElementById('tt-text-in').value.trim();
  const weekStart = document.getElementById('tt-week-start').value;
  const status = document.getElementById('tt-status');
  if (!text && !ttImageData) { showToast('⚠️ Paste text or upload an image first'); return; }
  if (!weekStart) { showToast('⚠️ Pick a starting week'); return; }
  if (!API_KEY) { showToast('⚠️ Add a Gemini API key in Settings first'); return; }

  status.textContent = '⏳ Parsing timetable...';
  status.style.color = 'var(--teal)';

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const start = new Date(weekStart);
  const dateMap = days.map((d,i) => { const dt = new Date(start); dt.setDate(start.getDate()+i); return `${d}: ${dt.toISOString().slice(0,10)}`; }).join(', ');

  const colorMap = { 'Mathematics':'#4d9fff','English':'#c084fc','Science':'#00d4aa','Biology':'#00d4aa','Chemistry':'#00d4aa','Physics':'#00d4aa','History':'#fbbf24','Geography':'#fbbf24','Computer Science':'#4d9fff','Economics':'#fbbf24','Languages':'#c084fc','Art & Design':'#f472b6','Music':'#f472b6','Physical Education':'#f472b6','Break / Lunch':'#22c55e','Revision':'#fb923c','Other':'#6366f1' };
  const classMap = { 'Mathematics':'ec-maths','English':'ec-english','Science':'ec-science','Biology':'ec-science','Chemistry':'ec-science','Physics':'ec-science','History':'ec-history','Geography':'ec-history','Computer Science':'ec-maths','Economics':'ec-history','Languages':'ec-english','Art & Design':'ec-sport','Music':'ec-sport','Physical Education':'ec-sport','Break / Lunch':'ec-break','Revision':'ec-revision','Other':'ec-other' };

  try {
    const prompt = `You are parsing a school timetable. Week starting ${weekStart}. Day-to-date: ${dateMap}. ${text ? 'Timetable:\n' + text : 'Extract from the attached image.'}\n\nReturn ONLY a JSON array, no markdown. Each item: {"subject":"...","date":"YYYY-MM-DD","startTime":"HH:MM","duration":60,"notes":""}. Subject must be one of: Mathematics, English, Science, Biology, Chemistry, Physics, History, Geography, Computer Science, Economics, Languages, Art & Design, Music, Physical Education, Break / Lunch, Revision, Other.`;
    const raw = await gemini(prompt, ttImageData);
    const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gm,'').trim());
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('No sessions found');
    const events = getPlannerEvents();
    parsed.forEach(s => {
      if (!s.date || !s.subject || !s.startTime) return;
      events.push({ id: Date.now().toString() + Math.random().toString(36).slice(2), subject: s.subject, date: s.date, startTime: s.startTime, dur: s.duration || 60, notes: s.notes || '', cc: classMap[s.subject]||'ec-other', color: colorMap[s.subject]||'#6366f1', repeatDays: [] });
    });
    savePlannerEvents(events);
    if (typeof renderPlanner === 'function') renderPlanner();
    status.textContent = '✅ Imported ' + parsed.length + ' session' + (parsed.length !== 1 ? 's' : '') + '!';
    status.style.color = 'var(--teal)';
    setTimeout(() => { closeTimetableImporter(); go('planner'); }, 1200);
  } catch(e) {
    status.textContent = '❌ ' + (e.message || 'Import failed. Try pasting more detail.');
    status.style.color = '#ff6680';
  }
}

// ── PDF EXPORT FOR NOTES ──
function exportNotesPDF() {
  const out = document.getElementById('notes-out');
  if (!out || !out.textContent.trim()) { showToast('⚠️ Generate some notes first'); return; }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Veda Notes</title>
  <style>
    body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#111;line-height:1.75;font-size:15px;}
    h1,h2,h3{color:#1a1a2e;margin-top:1.5em;}
    pre,code{background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:13px;}
    ul,ol{padding-left:1.6em;}
    blockquote{border-left:3px solid #4d9fff;padding-left:14px;color:#555;margin-left:0;}
    table{border-collapse:collapse;width:100%;}
    td,th{border:1px solid #ddd;padding:7px 11px;}
    @media print{body{margin:20px;}@page{margin:1.5cm;}}
  </style></head><body>
  <h1 style="font-size:22px;border-bottom:2px solid #4d9fff;padding-bottom:10px;">Veda Study Notes</h1>
  <p style="font-size:12px;color:#888;margin-bottom:24px;">${new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
  ${out.innerHTML}
  
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { showToast('⚠️ Allow popups to export PDF'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ── EXPORT: JOURNAL → PDF ──
function exportJournalPDF() {
  const entries = JSON.parse(localStorage.getItem('studly_journal') || '[]');
  if (!entries.length) { showToast('⚠️ No journal entries to export'); return; }
  const bodyHtml = entries.map(e => {
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-GB', {weekday:'long',year:'numeric',month:'long',day:'numeric'}) + ' · ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    const safeTitle = (e.title||'Untitled Entry').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const safeBody = (e.body||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    return `<div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;"><h2 style="font-size:15px;margin:0 0 4px;color:#111;">${safeTitle}</h2><div style="font-size:11px;color:#888;margin-bottom:10px;">${dateStr}</div><div style="font-size:14px;line-height:1.75;color:#333;">${safeBody}</div></div>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Veda Journal Export</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;color:#111;font-size:15px;}h1{font-size:22px;border-bottom:2px solid #4d9fff;padding-bottom:8px;color:#1a1a2e;}@media print{body{margin:20px;}@page{margin:1.5cm;}}</style></head><body><h1>📓 Veda Journal</h1><p style="font-size:12px;color:#888;margin-bottom:24px;">Exported ${new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · ${entries.length} entr${entries.length===1?'y':'ies'}</p>${bodyHtml}</body></html>`;
  const w = window.open('','_blank');
  if (!w) { showToast('⚠️ Allow popups to export'); return; }
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => w.print(), 400);
  showToast('📤 Journal export opened — use Print → Save as PDF');
}

// ── EXPORT: FLASHCARDS → PDF ──
function exportFlashcardsPDF() {
  if (!cards || !cards.length) { showToast('⚠️ Generate flashcards first'); return; }
  const topic = document.getElementById('study-in')?.value.trim() || 'Flashcards';
  const safeTopic = topic.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const rows = cards.map((c,i) => {
    const sf = (c.front||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const sb = (c.back||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<tr style="background:${i%2?'#f9fafb':'#fff'};"><td style="padding:10px 14px;font-weight:600;border:1px solid #e5e7eb;width:45%;">${sf}</td><td style="padding:10px 14px;color:#374151;border:1px solid #e5e7eb;">${sb}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Veda Flashcards — ${safeTopic}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;font-size:14px;color:#111;}h1{font-size:20px;border-bottom:2px solid #4d9fff;padding-bottom:8px;color:#1a1a2e;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#1a3a6e;color:#fff;padding:10px 14px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;}@media print{body{margin:20px;}@page{margin:1.5cm;}}</style></head><body><h1>🃏 ${safeTopic}</h1><p style="font-size:12px;color:#888;margin-bottom:4px;">${cards.length} flashcard${cards.length===1?'':'s'} · Exported ${new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})}</p><table><thead><tr><th>Front</th><th>Back / Answer</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const w = window.open('','_blank');
  if (!w) { showToast('⚠️ Allow popups to export'); return; }
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => w.print(), 400);
  showToast('📤 Flashcard export opened — use Print → Save as PDF');
}

