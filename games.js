// ══════════════════════════════════════════════════════
// Veda — Games: unlock system, Bubble Pop, Word Scramble,
// Reaction Time, Snake, Flag Quiz, Sudoku, Hangman, Tetris,
// Brick Breaker, Icy Tower
// Extracted from index.html inline <script> (was lines 7665–9563,
// part of the main app script block)
// Plain global-scope script (not a module/IIFE). Referenced only via
// onclick="..." HTML attributes, which resolve at click time — so
// load position relative to other files doesn't matter here.
// Known pre-existing bug (not introduced by this split): the Sudoku
// game reuses element ids sdk-timer/sdk-mistakes/sdk-grid across its
// two difficulty templates — see index.html review notes.
// ══════════════════════════════════════════════════════

// ── GAMES ──
let activeGame = null;
let gameScore = 0;
let gameTimer = null;

let _activeCat = 'all';
function filterGames(btn, cat) {
  _activeCat = cat;
  document.querySelectorAll('.game-cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.game-cat-label').forEach(el => {
    el.style.display = (cat === 'all' || el.dataset.cat === cat) ? '' : 'none';
  });
  document.querySelectorAll('#games-menu .games-grid').forEach(el => {
    el.style.display = (cat === 'all' || el.dataset.cat === cat) ? 'grid' : 'none';
  });
}

// ── GAME UNLOCK SYSTEM ──
function getUnlockedGames() {
  try { return JSON.parse(localStorage.getItem('veda_unlocked_games') || '[]'); } catch(e) { return []; }
}
function unlockGame(type) {
  const list = getUnlockedGames();
  if (!list.includes(type)) { list.push(type); localStorage.setItem('veda_unlocked_games', JSON.stringify(list)); }
}
function isGameUnlocked(type) { return getUnlockedGames().includes(type); }
function getFreeTrial() { return localStorage.getItem('veda_free_trial') || null; }
function setFreeTrial(type) { localStorage.setItem('veda_free_trial', type); }
function hasUsedFreeTrial() { return !!localStorage.getItem('veda_free_trial'); }

function renderGameLocks() {
  document.querySelectorAll('.game-card[data-game]').forEach(card => {
    const game = card.dataset.game;
    const lockEl = card.querySelector('.game-lock');
    const cost = parseInt(card.dataset.cost || '0');
    if (isGameUnlocked(game)) {
      card.classList.add('game-unlocked');
      card.classList.remove('locked');
      if (lockEl) lockEl.textContent = 'Unlocked';
    } else if (!hasUsedFreeTrial()) {
      card.classList.remove('game-unlocked','locked');
      if (lockEl) { lockEl.innerHTML = '🎁 <span>Free trial available!</span>'; lockEl.style.color='var(--accent)'; }
    } else {
      card.classList.add('locked');
      card.classList.remove('game-unlocked');
      if (lockEl) { lockEl.innerHTML = `🔒 <span>${cost} 💎 to unlock</span>`; lockEl.style.color='#ffb400'; }
    }
  });
}

function tryStartGame(type, cost) {
  // Already unlocked — just play
  if (isGameUnlocked(type)) { startGame(type); return; }

  // Free trial available
  if (!hasUsedFreeTrial()) {
    confirm2('🎁 Free Trial', `Try any one game for free! After this, games must be unlocked with gems.\n\nYou're about to try: ${type.toUpperCase()}`, () => {
      setFreeTrial(type);
      unlockGame(type);
      renderGameLocks();
      startGame(type);
    });
    return;
  }

  // Paywall — check gems
  const a = getAcct();
  const gems = a.gems || 0;
  if (gems < cost) {
    showToast(`Not enough gems! You need ${cost} 💎 to unlock this game. Study more to earn gems!`);
    return;
  }
  confirm2(`🔓 Unlock Game`, `Spend 💎 ${cost} gems to permanently unlock this game?`, () => {
    a.gems = gems - cost;
    saveAcct(a);
    unlockGame(type);
    renderGameLocks();
    renderAcctPage();
    showToast(`🎮 ${type} unlocked! Have fun — you earned it.`);
    startGame(type);
  });
}

function startGame(type) {
  document.getElementById('games-menu').style.display = 'none';
  const area = document.getElementById('game-play-area');
  area.classList.add('active');
  area.innerHTML = '';
  activeGame = type;
  gameScore = 0;
  trackStat('games');
  if (type === 'bubble') startBubble(area);
  else if (type === 'scramble') startScramble(area);
  else if (type === 'math') startMath(area);
  else if (type === 'typing') startTyping(area);
  else if (type === 'reaction') startReaction(area);
  else if (type === 'snake') startSnake(area);
  else if (type === 'flags') startFlags(area);
  else if (type === 'sudoku') startSudoku(area);
  else if (type === 'hangman') startHangman(area);
  else if (type === 'tetris') startTetris(area);
  else if (type === 'brickbreaker') startBrickBreaker(area);
  else if (type === 'icytower') startIcyTower(area);
  else if (type === 'flappy') startFlappy(area);
  else if (type === 'spaceinvaders') startSpaceInvaders(area);
  else if (type === 'pong') startPong(area);
  else if (type === 'asteroids') startAsteroids(area);
  else if (type === 'whackamole') startWhackAMole(area);
  else if (type === 'game2048') start2048(area);
  else if (type === 'wordle') startWordle(area);
  else if (type === 'memorymatch') startMemoryMatch(area);
  else if (type === 'lightsout') startLightsOut(area);
  else if (type === 'aimtrainer') startAimTrainer(area);
  else if (type === 'simonmemory') startSimonMemory(area);
  else if (type === 'numbertouch') startNumberTouch(area);
  else if (type === 'capitals') startCapitals(area);
  else if (type === 'elements') startElements(area);
  else if (type === 'timeline') startTimeline(area);
  else if (type === 'blitz') startBlitz(area);
}

function exitGame(score, gemEarned, label) {
  clearInterval(gameTimer); gameTimer = null;
  const hiKey = 'hi_' + activeGame;
  const prev = parseInt(localStorage.getItem(hiKey) || '0');
  const newHi = Math.max(score, prev);
  localStorage.setItem(hiKey, newHi);
  // Update hi score display
  const hiEl = document.getElementById('hi-' + activeGame);
  if (hiEl) {
    if (activeGame === 'typing') hiEl.textContent = `Best: ${newHi} WPM`;
    else if (activeGame === 'sudoku') hiEl.textContent = newHi > 0 ? `Best score: ${newHi}` : 'Not solved yet';
    else hiEl.textContent = `Best: ${newHi}`;
  }
  // Award gems based on score (game-specific caps)
  let gems = 0;
  if (activeGame === 'sudoku') {
    gems = score >= 800 ? 5 : score >= 500 ? 3 : score > 0 ? 1 : 0;
  } else if (activeGame === 'reaction') {
    gems = 0; // reaction handles its own flow
  } else {
    gems = Math.min(Math.floor(score / 10), 20); // cap at 20 gems
  }
  if (gems > 0) {
    const a = getAcct();
    a.gems = (a.gems || 0) + gems;
    saveAcct(a);
    checkBadges();
  }
  const area = document.getElementById('game-play-area');
  area.innerHTML = `
    <div class="game-result">
      <div class="game-result-score">${score}</div>
      <div class="game-result-msg">${[gemEarned, label].filter(t => t && String(t).trim()).join(' — ')}</div>
      ${gems > 0 ? `<div class="game-result-gems">💎 +${gems} gems earned!</div>` : '<div class="game-result-gems">Score higher to earn gems!</div>'}
      ${score >= newHi && score > 0 ? '<div style="color:var(--teal2);font-family:var(--orb);font-size:.6rem;letter-spacing:1px;margin-bottom:12px;">🏆 NEW HIGH SCORE!</div>' : ''}
      <button class="abtn" onclick="backToGames()">Play Again</button>
    </div>`;
  activeGame = null;
  // Clean up game-specific globals so stale handlers don't linger
  ['fqCheck','selectCell','inputNum','toggleNotes','hint','cycleDiff','exitSudoku','snakeScore','_snakeInt'].forEach(k => { try { delete window[k]; } catch(e) { window[k] = undefined; } });
  renderAcctPage();
}

function backToGames() {
  document.getElementById('games-menu').style.display = '';
  const area = document.getElementById('game-play-area');
  area.classList.remove('active');
  area.innerHTML = '';
  // Restore active category filter
  const activeBtn = document.querySelector('.game-cat-btn.on');
  if (activeBtn) filterGames(activeBtn, _activeCat);
  // refresh hi scores
  [{g:'bubble'},{g:'scramble'},{g:'math'},{g:'typing'},{g:'reaction'},{g:'snake'},{g:'flags'},{g:'sudoku'},{g:'hangman'},{g:'tetris'},{g:'brickbreaker'},{g:'icytower'},{g:'flappy'},{g:'spaceinvaders'},{g:'pong'},{g:'asteroids'},{g:'whackamole'},{g:'game2048'},{g:'wordle'},{g:'memorymatch'},{g:'lightsout'},{g:'aimtrainer'},{g:'simonmemory'},{g:'numbertouch'},{g:'capitals'},{g:'elements'},{g:'timeline'},{g:'blitz'}].forEach(({g}) => {
    const el = document.getElementById('hi-'+g);
    const v = localStorage.getItem('hi_'+g) || 0;
    if (!el) return;
    if (g==='reaction') el.textContent = v ? `Best: ${v} ms` : 'Best: -- ms';
    else if (g==='sudoku') el.textContent = parseInt(v) > 0 ? `Best score: ${v}` : 'Not solved yet';
    else if (g==='typing') el.textContent = `Best: ${v} WPM`;
    else if (g==='numbertouch') el.textContent = v ? `Best: ${v}s` : 'Best: --';
    else el.textContent = `Best: ${v}`;
  });
}

// ── BUBBLE POP GAME ──
function startBubble(area) {
  let score = 0, timeLeft = 30;
  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="bp-score">0</span></div>
        <div class="gscore">Time: <span id="bp-time">30</span>s</div>
      </div>
      <button class="abtn sec" onclick="exitGame(${score},'','')">Quit</button>
    </div>
    <canvas id="bubble-canvas" height="340"></canvas>`;

  const canvas = document.getElementById('bubble-canvas');
  canvas.width = canvas.offsetWidth;
  const ctx = canvas.getContext('2d');
  const colors = ['#4d9fff','#00d4aa','#c084fc','#f472b6','#fb923c','#fbbf24'];
  let bubbles = [];

  function spawnBubble() {
    const r = 18 + Math.random() * 22;
    bubbles.push({
      x: r + Math.random() * (canvas.width - r*2),
      y: canvas.height + r,
      r, vx: (Math.random()-.5)*1.5, vy: -(1.5 + Math.random()*2),
      color: colors[Math.floor(Math.random()*colors.length)],
      alpha: 1
    });
  }

  let spawnInt = setInterval(spawnBubble, 600);
  gameTimer = setInterval(() => {
    timeLeft--;
    const tel = document.getElementById('bp-time');
    if (tel) tel.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(gameTimer); clearInterval(spawnInt);
      exitGame(score, score + ' bubbles popped!', 'Final score');
    }
  }, 1000);

  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    for (let i = bubbles.length-1; i >= 0; i--) {
      const b = bubbles[i];
      if (Math.hypot(mx-b.x, my-b.y) < b.r) {
        bubbles.splice(i, 1);
        score++;
        const sel = document.getElementById('bp-score');
        if (sel) sel.textContent = score;
        break;
      }
    }
  };

  function draw() {
    if (!document.getElementById('bubble-canvas')) { clearInterval(spawnInt); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    bubbles = bubbles.filter(b => b.y + b.r > 0);
    bubbles.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      if (b.x < b.r || b.x > canvas.width-b.r) b.vx *= -1;
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      const g = ctx.createRadialGradient(b.x-b.r*.3, b.y-b.r*.3, b.r*.1, b.x, b.y, b.r);
      g.addColorStop(0, '#fff');
      g.addColorStop(.2, b.color+'cc');
      g.addColorStop(1, b.color+'44');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  draw();
  for (let i=0;i<4;i++) spawnBubble();
}

// ── WORD SCRAMBLE GAME ──
const SCRAMBLE_WORDS = ['photosynthesis','mitochondria','algebra','democracy','hypothesis',
  'geography','chromosome','equation','literature','atmosphere','metabolism','parliament',
  'velocity','isotope','polynomial','renaissance','ecosystem','trigonometry','civilization','osmosis'];

function startScramble(area) {
  let score = 0, timeLeft = 60, currentWord = '';

  function scramble(w) {
    const a = w.split('');
    for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a.join('') === w ? scramble(w) : a.join('');
  }

  function nextWord() {
    currentWord = SCRAMBLE_WORDS[Math.floor(Math.random()*SCRAMBLE_WORDS.length)];
    const sc = scramble(currentWord);
    const sw = document.getElementById('sc-word');
    const si = document.getElementById('sc-input');
    if (sw) sw.textContent = sc.toUpperCase();
    if (si) { si.value = ''; si.focus(); }
  }

  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="sc-score">0</span></div>
        <div class="gscore">Time: <span id="sc-time">60</span>s</div>
      </div>
      <button class="abtn sec" onclick="exitGame(0,'','')">Quit</button>
    </div>
    <div class="scramble-word" id="sc-word">LOADING...</div>
    <div class="in-row">
      <input class="chat-in" id="sc-input" placeholder="Type the unscrambled word..." autocomplete="off" autocorrect="off" spellcheck="false">
      <button class="send-btn" onclick="checkScramble()">CHECK</button>
    </div>
    <div id="sc-feedback" style="text-align:center;font-family:var(--exo);font-size:.82rem;margin-top:10px;min-height:20px;"></div>
    <div style="font-family:var(--exo);font-size:.72rem;color:var(--silver);text-align:center;margin-top:8px;">Hint: <span id="sc-hint"></span></div>`;

  document.getElementById('sc-input').addEventListener('keydown', e => { if (e.key==='Enter') checkScramble(); });

  gameTimer = setInterval(() => {
    timeLeft--;
    const tel = document.getElementById('sc-time');
    if (tel) tel.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(gameTimer);
      exitGame(score, `${score} words unscrambled!`, 'Final score');
    }
  }, 1000);

  window.checkScramble = function() {
    const inp = document.getElementById('sc-input');
    const fb = document.getElementById('sc-feedback');
    if (!inp) return;
    if (inp.value.trim().toLowerCase() === currentWord) {
      score++;
      document.getElementById('sc-score').textContent = score;
      if (fb) { fb.style.color='var(--teal2)'; fb.textContent='✓ Correct!'; }
      setTimeout(nextWord, 600);
    } else {
      if (fb) { fb.style.color='#ff6680'; fb.textContent='✗ Try again...'; }
      setTimeout(()=>{ if(fb) fb.textContent=''; }, 1000);
    }
    inp.value = '';
    inp.focus();
  };

  window._currentScrambleWord = () => currentWord;
  // hint: first letter
  setTimeout(() => {
    const hint = document.getElementById('sc-hint');
    if (hint) hint.textContent = currentWord[0].toUpperCase() + '...';
  }, 100);

  nextWord();
}

// ── MATHS BLITZ ──
function startMath(area) {
  let score = 0, timeLeft = 45, answered = false;

  function genQ() {
    const ops = ['+','-','×','÷'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    let a,b,ans;
    if (op==='+'){a=Math.floor(Math.random()*50)+1;b=Math.floor(Math.random()*50)+1;ans=a+b;}
    else if(op==='-'){a=Math.floor(Math.random()*50)+20;b=Math.floor(Math.random()*a)+1;ans=a-b;}
    else if(op==='×'){a=Math.floor(Math.random()*12)+1;b=Math.floor(Math.random()*12)+1;ans=a*b;}
    else{a=Math.floor(Math.random()*11)+2;b=Math.floor(Math.random()*a)+1;ans=a;a=a*b;}
    // make 3 wrong answers
    const wrong = new Set();
    while(wrong.size<3){const w=ans+(Math.floor(Math.random()*20)-10);if(w!==ans)wrong.add(w);}
    const opts=[ans,...wrong].sort(()=>Math.random()-.5);
    return {q:`${op==='÷'?a/b*b:a} ${op} ${b}`,ans,opts};
  }

  function showQ() {
    answered = false;
    const {q,ans,opts} = genQ();
    const qel = document.getElementById('mq');
    const oel = document.getElementById('mopts');
    if (qel) qel.textContent = q + ' = ?';
    if (oel) {
      oel.innerHTML = opts.map(o =>
        `<button class="math-opt" onclick="checkMath(this,${o},${ans})">${o}</button>`
      ).join('');
    }
  }

  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="mq-score">0</span></div>
        <div class="gscore">Time: <span id="mq-time">45</span>s</div>
      </div>
      <button class="abtn sec" onclick="exitGame(0,'','')">Quit</button>
    </div>
    <div class="math-question" id="mq"></div>
    <div class="math-opts" id="mopts"></div>`;

  gameTimer = setInterval(() => {
    timeLeft--;
    const tel = document.getElementById('mq-time');
    if (tel) tel.textContent = timeLeft;
    if (timeLeft <= 0) { clearInterval(gameTimer); exitGame(score, `${score} correct answers`, 'Final score'); }
  }, 1000);

  window.checkMath = function(btn, chosen, correct) {
    if (answered) return;
    answered = true;
    if (chosen === correct) {
      btn.classList.add('correct'); score++;
      const sel = document.getElementById('mq-score');
      if (sel) sel.textContent = score;
      setTimeout(showQ, 600);
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('.math-opt').forEach(b => { if (parseInt(b.textContent)===correct) b.classList.add('correct'); });
      setTimeout(showQ, 900);
    }
  };
  showQ();
}

// ── TYPING SPEED ──
const TYPING_TEXTS = [
  'The quick brown fox jumps over the lazy dog near the river bank.',
  'Study hard today so you can live the life you want tomorrow.',
  'Knowledge is power and practice makes perfect every single day.',
  'Every expert was once a beginner who refused to give up easily.',
  'Success is not final failure is not fatal it is the courage to continue.',
];

function startTyping(area) {
  const text = TYPING_TEXTS[Math.floor(Math.random()*TYPING_TEXTS.length)];
  let typed = '', started = false, startTime = 0, finished = false;

  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">WPM: <span id="ty-wpm">0</span></div>
        <div class="gscore">Acc: <span id="ty-acc">100</span>%</div>
      </div>
      <button class="abtn sec" onclick="exitGame(0,'','')">Quit</button>
    </div>
    <div class="type-text" id="ty-display"></div>
    <input class="chat-in" id="ty-input" placeholder="Start typing to begin..." autocomplete="off" autocorrect="off" spellcheck="false">
    <div style="font-family:var(--exo);font-size:.72rem;color:var(--silver);margin-top:6px;">Type the text above as fast and accurately as you can</div>`;

  function renderDisplay() {
    const el = document.getElementById('ty-display');
    if (!el) return;
    let html = '';
    for (let i=0;i<text.length;i++) {
      if (i < typed.length) {
        html += `<span class="${typed[i]===text[i]?'correct':'wrong'}">${text[i]}</span>`;
      } else if (i === typed.length) {
        html += `<span class="current">${text[i]}</span>`;
      } else {
        html += `<span>${text[i]}</span>`;
      }
    }
    el.innerHTML = html;
  }

  document.getElementById('ty-input').oninput = function() {
    if (finished) return;
    if (!started) { started = true; startTime = Date.now(); }
    typed = this.value;
    renderDisplay();
    // WPM
    const mins = (Date.now()-startTime)/60000;
    const words = typed.trim().split(' ').length;
    const wpm = mins > 0 ? Math.round(words/mins) : 0;
    const wpmEl = document.getElementById('ty-wpm');
    if (wpmEl) wpmEl.textContent = wpm;
    // Accuracy
    let correct = 0;
    for (let i=0;i<typed.length;i++) if(typed[i]===text[i]) correct++;
    const acc = typed.length > 0 ? Math.round(correct/typed.length*100) : 100;
    const accEl = document.getElementById('ty-acc');
    if (accEl) accEl.textContent = acc;
    // Done?
    if (typed.length >= text.length) {
      finished = true;
      const finalWpm = Math.round(words/mins);
      exitGame(finalWpm, `${finalWpm} WPM with ${acc}% accuracy`, 'Words per minute');
    }
  };
  renderDisplay();
  document.getElementById('ty-input').focus();
}

// ── REACTION TIME GAME ──
function startReaction(area) {
  let state = 'waiting'; // waiting | ready | go | done
  let waitTimeout, goTimeout;
  let startTime = 0;
  let attempts = [];
  const ROUNDS = 5;

  function render() {
    area.innerHTML = `
      <div class="game-header">
        <div class="game-score-row">
          <div class="gscore">Round: <span id="rx-round">${attempts.length}</span>/${ROUNDS}</div>
          <div class="gscore" id="rx-avg">${attempts.length ? 'Avg: '+Math.round(attempts.reduce((a,b)=>a+b,0)/attempts.length)+' ms' : 'React fast!'}</div>
        </div>
        <button class="abtn sec" onclick="clearTimeout(window._rxWait);clearTimeout(window._rxGo);exitGame(0,'','')">Quit</button>
      </div>
      <div id="rx-box" style="
        width:100%;height:clamp(200px,40vh,320px);border-radius:16px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        cursor:pointer;user-select:none;transition:background .15s;
        background:${state==='go'?'linear-gradient(135deg,#00d4aa,#00ffcc)':'state'==='ready'?'rgba(255,200,0,.15)':'rgba(77,159,255,.06)'};
        border:2px solid ${state==='go'?'var(--teal)':'rgba(77,159,255,.2)'};
      " onclick="rxClick()">
        <div style="font-size:3rem;margin-bottom:12px;">${state==='go'?'🟢':state==='early'?'❌':'⏳'}</div>
        <div style="font-family:var(--orb);font-size:clamp(.7rem,1.5vw,.95rem);color:${state==='go'?'#0a2a20':'var(--text)'};letter-spacing:2px;text-align:center;padding:0 20px;">
          ${state==='waiting'?'TAP TO START ROUND '+(attempts.length+1):state==='ready'?'GET READY...':state==='go'?'TAP NOW!':state==='early'?'TOO EARLY — tap to retry':''}
        </div>
        ${attempts.length?`<div style="margin-top:16px;font-family:var(--exo);font-size:.8rem;color:${state==='go'?'#0a2a20':'var(--silver)'};">Last: ${attempts[attempts.length-1]} ms</div>`:''}
      </div>`;
  }

  window.rxClick = function() {
    if (state === 'waiting') {
      state = 'ready';
      render();
      const delay = 1500 + Math.random() * 2500;
      window._rxWait = setTimeout(() => {
        state = 'go';
        startTime = Date.now();
        render();
      }, delay);
    } else if (state === 'ready') {
      // too early
      clearTimeout(window._rxWait);
      state = 'early';
      render();
      setTimeout(() => { state = 'waiting'; render(); }, 1200);
    } else if (state === 'go') {
      const rt = Date.now() - startTime;
      attempts.push(rt);
      if (attempts.length >= ROUNDS) {
        const avg = Math.round(attempts.reduce((a,b)=>a+b,0)/attempts.length);
        const best = Math.min(...attempts);
        // For reaction time, lower = better. Store best (lowest)
        const prevBest = parseInt(localStorage.getItem('hi_reaction') || '9999');
        // Override exitGame's hi score logic — lower is better
        localStorage.setItem('hi_reaction', Math.min(best, prevBest === 9999 ? best : prevBest));
        const hiEl = document.getElementById('hi-reaction');
        if (hiEl) hiEl.textContent = `Best: ${Math.min(best, prevBest === 9999 ? best : prevBest)} ms`;
        const gems = avg < 200 ? 5 : avg < 300 ? 3 : avg < 400 ? 1 : 0;
        if (gems > 0) {
          const a = getAcct();
          a.gems = (a.gems || 0) + gems;
          saveAcct(a);
          checkBadges();
        }
        const area2 = document.getElementById('game-play-area');
        area2.innerHTML = `<div class="game-result">
          <div class="game-result-score">${avg} ms</div>
          <div class="game-result-msg">Average reaction time</div>
          <div style="font-family:var(--exo);font-size:.82rem;color:var(--silver);margin-bottom:10px;">Best: ${best} ms &nbsp;·&nbsp; ${avg < 200 ? '⚡ Lightning fast!' : avg < 300 ? '🟢 Great reflexes!' : avg < 400 ? '🟡 Pretty good!' : '🔴 Keep practising!'}</div>
          ${gems > 0 ? `<div class="game-result-gems">💎 +${gems} gems earned!</div>` : '<div class="game-result-gems">React faster to earn gems!</div>'}
          <div class="game-result-gems">Splits: ${attempts.map(t=>t+' ms').join(' · ')}</div>
          <button class="abtn" onclick="backToGames()">Back to Games</button>
        </div>`;
        activeGame = null;
        renderAcctPage();
        return;
      }
      state = 'waiting';
      render();
    } else if (state === 'early') {
      state = 'waiting'; render();
    }
  };

  state = 'waiting';
  render();
}

// ── SNAKE GAME ──
function startSnake(area) {
  const CELL = 20;
  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="sn-score">0</span></div>
        <div class="gscore" id="sn-msg">Use arrow keys or WASD</div>
      </div>
      <button class="abtn sec" onclick="window.snakeQuit()">Quit</button>
    </div>
    <canvas id="sn-canvas" style="border-radius:12px;border:1px solid var(--panel-border);background:var(--panel-col);display:block;width:100%;touch-action:none;"></canvas>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
      <button class="abtn sec" style="font-size:1.2rem;padding:10px 16px;" onclick="snDir(0,-1)">↑</button>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="abtn sec" style="font-size:1.2rem;padding:10px 16px;" onclick="snDir(-1,0)">←</button>
      </div>
      <button class="abtn sec" style="font-size:1.2rem;padding:10px 16px;" onclick="snDir(0,1)">↓</button>
      <button class="abtn sec" style="font-size:1.2rem;padding:10px 16px;" onclick="snDir(1,0)">→</button>
    </div>`;

  const canvas = document.getElementById('sn-canvas');
  const W = Math.floor(canvas.offsetWidth / CELL) * CELL;
  const COLS = Math.floor(W / CELL);
  const ROWS = 18;
  canvas.width = W; canvas.height = ROWS * CELL;
  const ctx = canvas.getContext('2d');

  let snake = [{x:5,y:9},{x:4,y:9},{x:3,y:9}];
  let dir = {x:1,y:0}, nextDir = {x:1,y:0};
  let food = placeFood();
  window.snakeScore = 0;
  let speed = 150;

  function placeFood() {
    let f;
    do { f = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)}; }
    while (snake.some(s=>s.x===f.x&&s.y===f.y));
    return f;
  }

  window.snDir = function(dx, dy) {
    if (dx !== 0 && dir.x !== 0) return;
    if (dy !== 0 && dir.y !== 0) return;
    nextDir = {x:dx, y:dy};
  };

  window.snakeQuit = function() {
    clearInterval(window._snakeInt);
    document.removeEventListener('keydown', snakeKey);
    exitGame(window.snakeScore, '', '');
  };

  document.addEventListener('keydown', snakeKey);
  function snakeKey(e) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    const map = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
                 w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    const d = map[e.key];
    if (d) { e.preventDefault(); window.snDir(d[0],d[1]); }
  }

  // Touch swipe support
  let tx=0,ty=0;
  canvas.addEventListener('touchstart', e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  canvas.addEventListener('touchend', e=>{
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>Math.abs(dy)){window.snDir(dx>0?1:-1,0);}else{window.snDir(0,dy>0?1:-1);}
  },{passive:true});

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grid
    ctx.strokeStyle='rgba(77,159,255,.05)';
    for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++){ctx.strokeRect(x*CELL,y*CELL,CELL,CELL);}
    // food
    ctx.fillStyle='#ff6680';
    ctx.shadowColor='#ff6680'; ctx.shadowBlur=10;
    ctx.beginPath();
    ctx.arc(food.x*CELL+CELL/2, food.y*CELL+CELL/2, CELL/2-2, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    // snake
    snake.forEach((s,i)=>{
      const pct = i/snake.length;
      const g = ctx.createLinearGradient(s.x*CELL,s.y*CELL,(s.x+1)*CELL,(s.y+1)*CELL);
      g.addColorStop(0, i===0?'#00ffcc':'rgba(77,159,255,'+(1-pct*.6)+')');
      g.addColorStop(1, i===0?'#00d4aa':'rgba(0,212,170,'+(1-pct*.6)+')');
      ctx.fillStyle=g;
      ctx.shadowColor= i===0?'var(--teal)':'rgba(77,159,255,.4)';
      ctx.shadowBlur= i===0?12:4;
      ctx.beginPath();
      ctx.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,4);
      ctx.fill();
    });
    ctx.shadowBlur=0;
  }

  function step() {
    dir = nextDir;
    const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    // wall wrap
    head.x = (head.x+COLS)%COLS; head.y = (head.y+ROWS)%ROWS;
    // self collision
    if (snake.some(s=>s.x===head.x&&s.y===head.y)) {
      clearInterval(window._snakeInt);
      document.removeEventListener('keydown',snakeKey);
      exitGame(window.snakeScore, `${window.snakeScore} apples eaten!`, 'Final score');
      return;
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      window.snakeScore++;
      document.getElementById('sn-score').textContent = window.snakeScore;
      food = placeFood();
      speed = Math.max(60, speed - 3);
      clearInterval(window._snakeInt);
      window._snakeInt = setInterval(step, speed);
    } else {
      snake.pop();
    }
    draw();
  }

  draw();
  window._snakeInt = setInterval(step, speed);
}

// ── FLAG QUIZ GAME ──
const FLAGS = [
  {flag:'🇬🇧',name:'United Kingdom',opts:['France','Germany','United Kingdom','Ireland']},
  {flag:'🇯🇵',name:'Japan',opts:['China','Japan','South Korea','Taiwan']},
  {flag:'🇧🇷',name:'Brazil',opts:['Argentina','Brazil','Colombia','Mexico']},
  {flag:'🇮🇳',name:'India',opts:['India','Pakistan','Bangladesh','Sri Lanka']},
  {flag:'🇩🇪',name:'Germany',opts:['Austria','Switzerland','Germany','Belgium']},
  {flag:'🇫🇷',name:'France',opts:['France','Spain','Italy','Portugal']},
  {flag:'🇺🇸',name:'United States',opts:['Canada','Australia','United States','New Zealand']},
  {flag:'🇨🇳',name:'China',opts:['China','Vietnam','Thailand','Cambodia']},
  {flag:'🇷🇺',name:'Russia',opts:['Ukraine','Russia','Belarus','Poland']},
  {flag:'🇮🇹',name:'Italy',opts:['Greece','Italy','Croatia','Slovenia']},
  {flag:'🇰🇷',name:'South Korea',opts:['Japan','North Korea','South Korea','Mongolia']},
  {flag:'🇿🇦',name:'South Africa',opts:['Kenya','Nigeria','South Africa','Ghana']},
  {flag:'🇲🇽',name:'Mexico',opts:['Mexico','Colombia','Brazil','Venezuela']},
  {flag:'🇸🇦',name:'Saudi Arabia',opts:['Saudi Arabia','UAE','Qatar','Kuwait']},
  {flag:'🇦🇺',name:'Australia',opts:['New Zealand','Australia','Fiji','Papua New Guinea']},
  {flag:'🇪🇬',name:'Egypt',opts:['Egypt','Libya','Tunisia','Morocco']},
  {flag:'🇳🇬',name:'Nigeria',opts:['Ghana','Cameroon','Nigeria','Senegal']},
  {flag:'🇵🇰',name:'Pakistan',opts:['Pakistan','Afghanistan','Iran','India']},
  {flag:'🇹🇷',name:'Turkey',opts:['Turkey','Greece','Bulgaria','Romania']},
  {flag:'🇦🇷',name:'Argentina',opts:['Chile','Argentina','Uruguay','Paraguay']},
  {flag:'🇰🇪',name:'Kenya',opts:['Ethiopia','Kenya','Tanzania','Uganda']},
  {flag:'🇵🇭',name:'Philippines',opts:['Philippines','Indonesia','Malaysia','Vietnam']},
  {flag:'🇳🇱',name:'Netherlands',opts:['Netherlands','Belgium','Luxembourg','Denmark']},
  {flag:'🇨🇦',name:'Canada',opts:['Canada','United States','Greenland','Iceland']},
  {flag:'🇸🇬',name:'Singapore',opts:['Singapore','Malaysia','Brunei','Thailand']},
  {flag:'🇲🇾',name:'Malaysia',opts:['Malaysia','Indonesia','Brunei','Philippines']},
  {flag:'🇵🇹',name:'Portugal',opts:['Spain','Portugal','Brazil','Mozambique']},
  {flag:'🇬🇷',name:'Greece',opts:['Greece','Cyprus','Bulgaria','Albania']},
  {flag:'🇸🇪',name:'Sweden',opts:['Norway','Sweden','Finland','Denmark']},
  {flag:'🇳🇴',name:'Norway',opts:['Norway','Sweden','Iceland','Denmark']},
];

function startFlags(area) {
  let score = 0, qNum = 0, answered = false;
  const TOTAL = 15;
  const pool = [...FLAGS].sort(()=>Math.random()-.5).slice(0,TOTAL);

  function showQ() {
    if (qNum >= TOTAL) {
      exitGame(score, `${score}/${TOTAL} correct`, 'Final score');
      return;
    }
    answered = false;
    const q = pool[qNum];
    const shuffled = [...q.opts].sort(()=>Math.random()-.5);
    area.innerHTML = `
      <div class="game-header">
        <div class="game-score-row">
          <div class="gscore">Score: <span id="fq-score">${score}</span></div>
          <div class="gscore">Q${qNum+1}/${TOTAL}</div>
        </div>
        <button class="abtn sec" onclick="exitGame(${score},'${score}/${TOTAL} correct','Final score')">Quit</button>
      </div>
      <div style="text-align:center;padding:clamp(20px,4vh,40px) 0;">
        <div style="font-size:clamp(4rem,12vw,8rem);line-height:1;margin-bottom:16px;filter:drop-shadow(0 4px 20px rgba(0,0,0,.4));">${q.flag}</div>
        <div style="font-family:var(--orb);font-size:.55rem;color:var(--silver);letter-spacing:2px;margin-bottom:24px;">WHICH COUNTRY IS THIS FLAG?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:420px;margin:0 auto;" id="fq-opts">
          ${shuffled.map(opt=>`
            <button class="math-opt" style="font-family:var(--raj);font-size:.9rem;padding:14px;" onclick="fqCheck(this,'${opt}','${q.name}')">${opt}</button>
          `).join('')}
        </div>
        <div id="fq-feedback" style="margin-top:16px;font-family:var(--exo);font-size:.85rem;min-height:24px;"></div>
      </div>`;
  }

  window.fqCheck = function(btn, chosen, correct) {
    if (answered) return;
    answered = true;
    const fb = document.getElementById('fq-feedback');
    if (chosen === correct) {
      btn.classList.add('correct');
      score++;
      document.getElementById('fq-score').textContent = score;
      if (fb) { fb.style.color='var(--teal2)'; fb.textContent='✓ Correct!'; }
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('#fq-opts .math-opt').forEach(b => {
        if (b.textContent.trim() === correct) b.classList.add('correct');
      });
      if (fb) { fb.style.color='#ff6680'; fb.textContent=`✗ It was ${correct}`; }
    }
    qNum++;
    setTimeout(showQ, 1000);
  };

  showQ();
}

// ── SUDOKU GAME (dead duplicate removed — see note below) ──
// NOTE: this used to contain a second, older startSudoku(area) implementation
// (static hardcoded puzzles, no generator) that duplicated the function name
// below. In JS, the second declaration silently wins, so the old one was
// 100% unreachable dead code — it also caused the sdk-timer/sdk-mistakes/
// sdk-grid element IDs to be defined twice in the file. Removed entirely
// rather than just renamed, since it was never actually running.

// ── SUDOKU ──
function startSudoku(area) {
  // Difficulty: easy=35 givens, medium=28, hard=22
  let difficulty = 'medium';
  let puzzle = [], solution = [], selected = null, mistakes = 0, startTime = Date.now(), timerInt = null;
  let notes = {}; // notes[r][c] = Set of numbers

  // --- Puzzle generation ---
  function generateSolution() {
    const grid = Array.from({length:9}, () => Array(9).fill(0));
    solveSudoku(grid);
    return grid;
  }

  function solveSudoku(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const nums = shuffle([1,2,3,4,5,6,7,8,9]);
          for (const n of nums) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (solveSudoku(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3;
    for (let r = br; r < br+3; r++)
      for (let c = bc; c < bc+3; c++)
        if (grid[r][c] === num) return false;
    return true;
  }

  function shuffle(arr) { return arr.sort(() => Math.random() - .5); }

  function makePuzzle(sol, givens) {
    const p = sol.map(r => [...r]);
    let toRemove = 81 - givens;
    const cells = shuffle([...Array(81).keys()]);
    for (const idx of cells) {
      if (toRemove <= 0) break;
      const r = Math.floor(idx/9), c = idx%9;
      p[r][c] = 0;
      toRemove--;
    }
    return p;
  }

  function initGame() {
    const givens = {easy:38, medium:30, hard:23}[difficulty];
    solution = generateSolution();
    puzzle = makePuzzle(solution, givens);
    selected = null; mistakes = 0; startTime = Date.now();
    notes = {};
    for (let r=0;r<9;r++) { notes[r]={}; for(let c=0;c<9;c++) notes[r][c]=new Set(); }
    buildGivenMask();
    render();
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
      const el = document.getElementById('sdk-timer');
      if (!el) { clearInterval(timerInt); return; }
      const s = Math.floor((Date.now()-startTime)/1000);
      el.textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    }, 1000);
  }

  let notesMode = false;

  function render() {
    const numCounts = {};
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      const v = puzzle[r][c]; if (v) numCounts[v] = (numCounts[v]||0)+1;
    }
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0;user-select:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;width:min(360px,90vw);">
          <button class="abtn sec" onclick="exitSudoku()" style="padding:7px 14px;font-size:.75rem;">← Back</button>
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="font-family:var(--exo);font-size:.75rem;color:var(--silver);">❌ <span id="sdk-mistakes">${mistakes}</span>/3</div>
            <div style="font-family:var(--orb);font-size:.85rem;color:var(--accent2);" id="sdk-timer">00:00</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="abtn sec" id="sdk-diff-btn" onclick="cycleDiff()" style="padding:6px 12px;font-size:.7rem;text-transform:uppercase;letter-spacing:1px;">${difficulty}</button>
            <button class="abtn sec" onclick="initGame()" style="padding:6px 12px;font-size:.7rem;">🔄 New</button>
          </div>
        </div>

        <div id="sdk-grid" style="
          display:grid;grid-template-columns:repeat(9,1fr);
          width:min(360px,90vw);height:min(360px,90vw);
          border:2px solid rgba(77,159,255,.5);border-radius:8px;overflow:hidden;
          background:var(--panel-col);gap:0;
        ">${buildGrid(numCounts)}</div>

        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:min(360px,90vw);">
          ${[1,2,3,4,5,6,7,8,9].map(n => `
            <button onclick="inputNum(${n})" style="
              width:calc(min(360px,90vw)/10 - 4px);aspect-ratio:1;
              background:${numCounts[n]>=9?'rgba(255,255,255,.03)':'rgba(77,159,255,.1)'};
              border:1px solid ${numCounts[n]>=9?'rgba(255,255,255,.08)':'rgba(77,159,255,.3)'};
              border-radius:8px;color:${numCounts[n]>=9?'rgba(255,255,255,.2)':'var(--accent2)'};
              font-family:var(--orb);font-size:clamp(.9rem,3vw,1.2rem);font-weight:700;
              cursor:${numCounts[n]>=9?'default':'pointer'};transition:all .12s;
            ">${n}</button>
          `).join('')}
        </div>

        <div style="display:flex;gap:8px;justify-content:center;">
          <button id="sdk-notes-btn" onclick="toggleNotes()" style="
            padding:7px 16px;border-radius:8px;font-family:var(--exo);font-size:.75rem;
            background:${notesMode?'rgba(0,212,170,.15)':'rgba(255,255,255,.04)'};
            border:1px solid ${notesMode?'var(--teal)':'rgba(77,159,255,.2)'};
            color:${notesMode?'var(--teal2)':'var(--silver2)'};cursor:pointer;transition:all .15s;
          ">✏️ Notes ${notesMode?'ON':'OFF'}</button>
          <button onclick="inputNum(0)" style="
            padding:7px 16px;border-radius:8px;font-family:var(--exo);font-size:.75rem;
            background:rgba(255,85,102,.07);border:1px solid rgba(255,85,102,.2);
            color:#ff8899;cursor:pointer;transition:all .15s;
          ">⌫ Erase</button>
          <button onclick="hint()" style="
            padding:7px 16px;border-radius:8px;font-family:var(--exo);font-size:.75rem;
            background:rgba(77,159,255,.08);border:1px solid rgba(77,159,255,.2);
            color:var(--accent2);cursor:pointer;transition:all .15s;
          ">💡 Hint</button>
        </div>
      </div>`;
    startTimer();
  }

  function buildGrid(numCounts) {
    let html = '';
    for (let r=0;r<9;r++) {
      for (let c=0;c<9;c++) {
        const val = puzzle[r][c];
        const isGiven = solution[r][c] && puzzle[r][c] !== 0 && isOriginalGiven(r,c);
        const isSel = selected && selected[0]===r && selected[1]===c;
        const isHighlight = selected && !isSel && (selected[0]===r || selected[1]===c || (Math.floor(selected[0]/3)===Math.floor(r/3)&&Math.floor(selected[1]/3)===Math.floor(c/3)));
        const isSameNum = selected && val && val === puzzle[selected[0]][selected[1]];
        const isWrong = val && val !== solution[r][c];
        const isComplete = val && numCounts[val] >= 9;

        const borderR = (c+1)%3===0&&c!==8 ? '2px solid rgba(77,159,255,.45)' : '1px solid rgba(77,159,255,.12)';
        const borderB = (r+1)%3===0&&r!==8 ? '2px solid rgba(77,159,255,.45)' : '1px solid rgba(77,159,255,.12)';

        let bg = 'transparent';
        if (isSel) bg = 'rgba(77,159,255,.25)';
        else if (isSameNum) bg = 'rgba(77,159,255,.18)';
        else if (isHighlight) bg = 'rgba(77,159,255,.06)';

        const cellNotes = notes[r][c];
        const noteHtml = !val && cellNotes.size > 0 ? `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);width:100%;height:100%;padding:1px;">
            ${[1,2,3,4,5,6,7,8,9].map(n=>`<div style="display:flex;align-items:center;justify-content:center;font-family:var(--exo);font-size:clamp(.35rem,.9vw,.5rem);color:${cellNotes.has(n)?'var(--accent2)':'transparent'};line-height:1;">${n}</div>`).join('')}
          </div>` : '';

        html += `<div onclick="selectCell(${r},${c})" style="
          display:flex;align-items:center;justify-content:center;
          border-right:${borderR};border-bottom:${borderB};
          background:${bg};cursor:pointer;transition:background .1s;
          font-family:var(--orb);font-size:clamp(.9rem,2.5vw,1.3rem);font-weight:700;
          color:${isWrong?'#ff6680':isComplete?'rgba(77,159,255,.35)':isGiven?'var(--text)':'var(--accent2)'};
          position:relative;
        ">${val ? val : noteHtml}</div>`;
      }
    }
    return html;
  }

  // Track which cells were originally given (not editable)
  const givenMask = [];
  function buildGivenMask() {
    for (let r=0;r<9;r++) { givenMask[r]=[]; for(let c=0;c<9;c++) givenMask[r][c]=puzzle[r][c]!==0; }
  }
  function isOriginalGiven(r,c) { return givenMask[r] && givenMask[r][c]; }

  window.selectCell = function(r,c) {
    selected = [r,c];
    render();
  };

  window.inputNum = function(n) {
    if (!selected) return;
    const [r,c] = selected;
    if (isOriginalGiven(r,c)) return;
    if (notesMode && n !== 0) {
      if (notes[r][c].has(n)) notes[r][c].delete(n);
      else notes[r][c].add(n);
      render(); return;
    }
    notes[r][c].clear();
    if (n === 0) { puzzle[r][c] = 0; render(); return; }
    puzzle[r][c] = n;
    if (n !== solution[r][c]) {
      mistakes++;
      if (mistakes >= 3) { clearInterval(timerInt); showGameOver(); return; }
    }
    if (checkWin()) { clearInterval(timerInt); showWin(); return; }
    render();
  };

  window.toggleNotes = function() { notesMode = !notesMode; render(); };

  window.hint = function() {
    if (!selected) { showToast('Select a cell first!'); return; }
    const [r,c] = selected;
    if (isOriginalGiven(r,c) || puzzle[r][c]===solution[r][c]) { showToast('Pick an empty cell!'); return; }
    notes[r][c].clear();
    puzzle[r][c] = solution[r][c];
    if (checkWin()) { clearInterval(timerInt); showWin(); return; }
    render();
  };

  window.cycleDiff = function() {
    const order = ['easy','medium','hard'];
    difficulty = order[(order.indexOf(difficulty)+1)%3];
    initGame();
  };

  window.exitSudoku = function() { clearInterval(timerInt); backToGames(); };

  function checkWin() {
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (puzzle[r][c]!==solution[r][c]) return false;
    return true;
  }

  function showWin() {
    const elapsed = Math.floor((Date.now()-startTime)/1000);
    const mins = Math.floor(elapsed/60), secs = elapsed%60;
    const timeStr = `${mins}m ${secs}s`;
    const score = Math.max(0, Math.floor(1000 - elapsed*2 - mistakes*50));
    exitGame(score, `Solved in ${timeStr} with ${mistakes} mistake${mistakes!==1?'s':''}`, 'Puzzle complete! 🎉');
  }

  function showGameOver() {
    area.innerHTML = `
      <div class="game-result">
        <div style="font-size:2.5rem;margin-bottom:12px;">💔</div>
        <div class="game-result-score">Game Over</div>
        <div class="game-result-msg">3 mistakes — puzzle failed</div>
        <div class="game-result-gems">Keep practicing!</div>
        <button class="abtn" onclick="initGame()" style="margin-bottom:10px;">Try Again</button>
        <button class="abtn sec" onclick="backToGames()">← Back to Games</button>
      </div>`;
  }

  // Init
  initGame();

  // Keyboard support
  function onKey(e) {
    if (!document.getElementById('sdk-grid')) { document.removeEventListener('keydown',onKey); return; }
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (!selected) return;
    const [r,c] = selected;
    if (e.key>='1'&&e.key<='9') { window.inputNum(parseInt(e.key)); }
    else if (e.key==='Backspace'||e.key==='Delete'||e.key==='0') { window.inputNum(0); }
    else if (e.key==='ArrowUp') { selected=[Math.max(0,r-1),c]; render(); }
    else if (e.key==='ArrowDown') { selected=[Math.min(8,r+1),c]; render(); }
    else if (e.key==='ArrowLeft') { selected=[r,Math.max(0,c-1)]; render(); }
    else if (e.key==='ArrowRight') { selected=[r,Math.min(8,c+1)]; render(); }
    else if (e.key==='n'||e.key==='N') { window.toggleNotes(); }
  }
  document.addEventListener('keydown', onKey);
}

// ── HANGMAN GAME ──
const HANGMAN_WORDS = [
  {word:'photosynthesis',hint:'Plants use sunlight to make food'},
  {word:'democracy',hint:'Government by the people'},
  {word:'mitochondria',hint:'Powerhouse of the cell'},
  {word:'hypothesis',hint:'A testable scientific prediction'},
  {word:'renaissance',hint:'European cultural rebirth period'},
  {word:'atmosphere',hint:'Layer of gases around Earth'},
  {word:'algorithm',hint:'Step-by-step problem-solving procedure'},
  {word:'parliament',hint:'Legislative body of government'},
  {word:'chromosome',hint:'Carries genetic information'},
  {word:'metabolism',hint:'Chemical processes in living organisms'},
  {word:'calculus',hint:'Branch of mathematics'},
  {word:'evolution',hint:'Gradual change in species over time'},
  {word:'tectonic',hint:'Related to Earth\u2019s crust movement'},
  {word:'inflation',hint:'Rise in prices over time'},
  {word:'velocity',hint:'Speed with direction'},
  {word:'polynomial',hint:'Algebraic expression with multiple terms'},
  {word:'osmosis',hint:'Water moving through a membrane'},
  {word:'frequency',hint:'Number of cycles per second'},
  {word:'symmetry',hint:'Mirror-like balance in shape'},
  {word:'periodic',hint:'Repeating pattern — like the element table'},
];

function startHangman(area) {
  const MAX_WRONG = 6;
  let wrong = 0, guessed = new Set(), score = 0, round = 1;
  let wordObj, gameOver = false;

  function pickWord() {
    wordObj = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    wrong = 0; guessed = new Set(); gameOver = false;
  }

  function hangmanSVG(w) {
    const parts = [
      `<line x1="60" y1="180" x2="140" y2="180" stroke="var(--accent)" stroke-width="3"/>`,
      `<line x1="100" y1="180" x2="100" y2="20" stroke="var(--accent)" stroke-width="3"/>`,
      `<line x1="100" y1="20" x2="150" y2="20" stroke="var(--accent)" stroke-width="3"/>`,
      `<line x1="150" y1="20" x2="150" y2="40" stroke="var(--accent)" stroke-width="2"/>`,
      `<circle cx="150" cy="55" r="15" stroke="#ff6680" stroke-width="2.5" fill="none"/>`,
      `<line x1="150" y1="70" x2="150" y2="120" stroke="#ff6680" stroke-width="2.5"/>`,
      `<line x1="150" y1="85" x2="130" y2="105" stroke="#ff6680" stroke-width="2.5"/>`,
      `<line x1="150" y1="85" x2="170" y2="105" stroke="#ff6680" stroke-width="2.5"/>`,
      `<line x1="150" y1="120" x2="130" y2="150" stroke="#ff6680" stroke-width="2.5"/>`,
      `<line x1="150" y1="120" x2="170" y2="150" stroke="#ff6680" stroke-width="2.5"/>`,
    ];
    return `<svg viewBox="0 0 220 200" width="180" height="160" style="margin:0 auto;display:block;">
      ${parts.slice(0, 3 + w).join('')}
    </svg>`;
  }

  function render() {
    const word = wordObj.word;
    const display = word.split('').map(l => guessed.has(l) ? `<span style="color:var(--teal2)">${l.toUpperCase()}</span>` : '_').join(' ');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const won = word.split('').every(l => guessed.has(l));
    const lost = wrong >= MAX_WRONG;

    area.innerHTML = `
      <div class="game-header">
        <div class="game-score-row">
          <div class="gscore">Score: <span id="hm-score">${score}</span></div>
          <div class="gscore">Round: ${round}</div>
          <div class="gscore" style="color:${wrong>=4?'#ff6680':'var(--accent2)'}">❌ ${wrong}/${MAX_WRONG}</div>
        </div>
        <button class="abtn sec" onclick="exitGame(${score},'${score} words guessed','Final score')">Quit</button>
      </div>
      ${hangmanSVG(wrong)}
      <div style="text-align:center;font-family:var(--orb);font-size:clamp(1.1rem,3vw,1.6rem);letter-spacing:8px;color:var(--text);margin:8px 0 4px;">${display}</div>
      <div style="text-align:center;font-family:var(--exo);font-size:.75rem;color:var(--silver);margin-bottom:12px;">💡 ${wordObj.hint}</div>
      ${won ? `<div style="text-align:center;margin-bottom:10px;"><span style="color:var(--teal2);font-family:var(--orb);font-size:.9rem;">✓ Correct! +1</span></div><button class="abtn" onclick="hmNext()" style="display:block;margin:0 auto;">Next Word →</button>` : ''}
      ${lost ? `<div style="text-align:center;margin-bottom:10px;"><span style="color:#ff6680;font-family:var(--orb);font-size:.9rem;">The word was: ${word.toUpperCase()}</span></div><button class="abtn" onclick="exitGame(${score},'${score} words guessed','Game over!')" style="display:block;margin:0 auto;">See Results</button>` : ''}
      ${!won && !lost ? `<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-width:360px;margin:0 auto;">
        ${alphabet.map(l => `<button onclick="hmGuess('${l}')" ${guessed.has(l)?'disabled':''} style="width:36px;height:36px;border-radius:8px;border:1px solid ${guessed.has(l)?(wordObj.word.includes(l)?'rgba(0,212,170,.4)':'rgba(255,102,128,.3)'):'rgba(77,159,255,.25)'};background:${guessed.has(l)?(wordObj.word.includes(l)?'rgba(0,212,170,.1)':'rgba(255,102,128,.08)'):'rgba(255,255,255,.04)'};color:${guessed.has(l)?(wordObj.word.includes(l)?'var(--teal2)':'#ff6680aa'):'var(--text)'};font-family:var(--orb);font-size:.75rem;cursor:${guessed.has(l)?'default':'pointer'};transition:all .12s;">${l.toUpperCase()}</button>`).join('')}
      </div>` : ''}`;
  }

  window.hmGuess = function(letter) {
    if (guessed.has(letter) || gameOver) return;
    guessed.add(letter);
    if (!wordObj.word.includes(letter)) wrong++;
    const won = wordObj.word.split('').every(l => guessed.has(l));
    if (won) { score++; document.getElementById('hm-score') && (document.getElementById('hm-score').textContent = score); }
    render();
  };

  window.hmNext = function() { round++; pickWord(); render(); };

  // Keyboard support
  function hmKey(e) {
    if (!document.getElementById('hm-score')) { document.removeEventListener('keydown', hmKey); return; }
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    const l = e.key.toLowerCase();
    if (/^[a-z]$/.test(l)) window.hmGuess(l);
  }
  document.addEventListener('keydown', hmKey);

  pickWord();
  render();
}

// ── TETRIS GAME ──
function startTetris(area) {
  const COLS = 10, ROWS = 20, CELL = 28;
  const COLORS = {
    I:'#00d4aa', O:'#fbbf24', T:'#c084fc',
    S:'#4ade80', Z:'#f87171', J:'#60a5fa', L:'#fb923c'
  };
  const PIECES = {
    I:[[1,1,1,1]],
    O:[[1,1],[1,1]],
    T:[[0,1,0],[1,1,1]],
    S:[[0,1,1],[1,1,0]],
    Z:[[1,1,0],[0,1,1]],
    J:[[1,0,0],[1,1,1]],
    L:[[0,0,1],[1,1,1]]
  };

  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="tet-score">0</span></div>
        <div class="gscore">Lines: <span id="tet-lines">0</span></div>
        <div class="gscore">Level: <span id="tet-level">1</span></div>
      </div>
      <button class="abtn sec" onclick="tetQuit()">Quit</button>
    </div>
    <div style="display:flex;gap:14px;justify-content:center;align-items:flex-start;">
      <canvas id="tet-canvas" width="${COLS*CELL}" height="${ROWS*CELL}" style="border:1px solid var(--panel-border);border-radius:8px;background:var(--panel-col);display:block;"></canvas>
      <div style="display:flex;flex-direction:column;gap:10px;min-width:90px;">
        <div style="font-family:var(--exo);font-size:.65rem;color:var(--silver);letter-spacing:1px;text-transform:uppercase;">Next</div>
        <canvas id="tet-next" width="90" height="80" style="border:1px solid rgba(77,159,255,.2);border-radius:8px;background:var(--panel-col);"></canvas>
        <div style="font-family:var(--exo);font-size:.65rem;color:var(--silver);margin-top:8px;">Controls:</div>
        <div style="font-family:var(--exo);font-size:.62rem;color:var(--silver2);line-height:1.9;">← → Move<br>↑ Rotate<br>↓ Soft drop<br>Space Hard drop</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap;">
      <button class="abtn sec" style="padding:10px 18px;font-size:1.1rem;" onclick="tetMove(-1,0)">←</button>
      <button class="abtn sec" style="padding:10px 18px;font-size:1.1rem;" onclick="tetRotate()">↻</button>
      <button class="abtn sec" style="padding:10px 18px;font-size:1.1rem;" onclick="tetMove(1,0)">→</button>
      <button class="abtn sec" style="padding:10px 18px;font-size:1.1rem;" onclick="tetDrop()">↓</button>
      <button class="abtn sec" style="padding:10px 14px;font-size:.75rem;" onclick="tetHardDrop()">Hard ↓</button>
    </div>`;

  const canvas = document.getElementById('tet-canvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('tet-next');
  const nctx = nextCanvas.getContext('2d');

  let board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  let score = 0, lines = 0, level = 1, gameRunning = true;
  let piece, next, px, py;

  const keys = Object.keys(PIECES);
  function randPiece() { return keys[Math.floor(Math.random()*keys.length)]; }

  function newPiece() {
    const type = next || randPiece();
    next = randPiece();
    piece = PIECES[type].map(r=>[...r]);
    window._tetType = type;
    window._tetNextType = next;
    px = Math.floor((COLS - piece[0].length) / 2);
    py = 0;
    if (collides(piece, px, py)) { tetEnd(); }
    drawNext();
  }

  function collides(p, x, y) {
    for (let r=0;r<p.length;r++)
      for (let c=0;c<p[r].length;c++)
        if (p[r][c]) {
          const nx=x+c, ny=y+r;
          if (nx<0||nx>=COLS||ny>=ROWS) return true;
          if (ny>=0 && board[ny][nx]) return true;
        }
    return false;
  }

  function rotate(p) {
    return p[0].map((_,i)=>p.map(r=>r[i]).reverse());
  }

  window.tetMove = function(dx, dy) {
    if (!gameRunning) return;
    if (!collides(piece, px+dx, py+dy)) { px+=dx; py+=dy; draw(); }
  };
  window.tetRotate = function() {
    if (!gameRunning) return;
    const rot = rotate(piece);
    if (!collides(rot, px, py)) { piece = rot; draw(); }
    else if (!collides(rot, px+1, py)) { piece=rot; px++; draw(); }
    else if (!collides(rot, px-1, py)) { piece=rot; px--; draw(); }
  };
  window.tetDrop = function() { window.tetMove(0,1); };
  window.tetHardDrop = function() {
    if (!gameRunning) return;
    while (!collides(piece, px, py+1)) py++;
    lock();
  };

  function lock() {
    const type = window._tetType;
    for (let r=0;r<piece.length;r++)
      for (let c=0;c<piece[r].length;c++)
        if (piece[r][c] && py+r>=0) board[py+r][px+c] = COLORS[type];
    // Clear lines
    let cleared = 0;
    for (let r=ROWS-1;r>=0;r--) {
      if (board[r].every(c=>c)) {
        board.splice(r,1); board.unshift(Array(COLS).fill(null));
        cleared++; r++;
      }
    }
    if (cleared) {
      const pts = [0,40,100,300,1200][cleared] * level;
      score += pts; lines += cleared;
      level = Math.floor(lines/10)+1;
      document.getElementById('tet-score').textContent = score;
      document.getElementById('tet-lines').textContent = lines;
      document.getElementById('tet-level').textContent = level;
      clearInterval(window._tetInt);
      window._tetInt = setInterval(tick, delay());
    }
    newPiece();
    draw();
  }

  function drawNext() {
    nctx.clearRect(0,0,90,80);
    const p = PIECES[window._tetNextType];
    const color = COLORS[window._tetNextType];
    const offX = Math.floor((4-p[0].length)/2), offY = Math.floor((4-p.length)/2);
    const cs = 18;
    p.forEach((row,r)=>row.forEach((v,c)=>{
      if (!v) return;
      nctx.fillStyle = color;
      nctx.shadowColor = color; nctx.shadowBlur = 6;
      nctx.fillRect((offX+c)*cs+5,(offY+r)*cs+5,cs-2,cs-2);
      nctx.shadowBlur = 0;
    }));
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Grid
    ctx.strokeStyle='rgba(77,159,255,.06)';
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) ctx.strokeRect(c*CELL,r*CELL,CELL,CELL);
    // Board
    board.forEach((row,r)=>row.forEach((color,c)=>{
      if(!color) return;
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=6;
      ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);
      ctx.shadowBlur=0;
    }));
    // Ghost
    let ghostY = py;
    while (!collides(piece, px, ghostY+1)) ghostY++;
    piece.forEach((row,r)=>row.forEach((v,c)=>{
      if (!v) return;
      ctx.fillStyle='rgba(255,255,255,.06)';
      ctx.fillRect((px+c)*CELL+1,(ghostY+r)*CELL+1,CELL-2,CELL-2);
    }));
    // Active piece
    const color = COLORS[window._tetType];
    piece.forEach((row,r)=>row.forEach((v,c)=>{
      if(!v||py+r<0) return;
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
      ctx.fillRect((px+c)*CELL+1,(py+r)*CELL+1,CELL-2,CELL-2);
      ctx.shadowBlur=0;
    }));
  }

  function tetEnd() {
    gameRunning = false;
    clearInterval(window._tetInt);
    document.removeEventListener('keydown', tetKey);
    exitGame(score, `${lines} lines cleared · Level ${level}`, 'Game Over');
  }

  window.tetQuit = function() { gameRunning=false; clearInterval(window._tetInt); document.removeEventListener('keydown',tetKey); exitGame(score,'',''); };

  function tetKey(e) {
    if (!document.getElementById('tet-canvas')) { document.removeEventListener('keydown',tetKey); return; }
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (e.key==='ArrowLeft'  || e.key==='a' || e.key==='A') { e.preventDefault(); window.tetMove(-1,0); }
    else if (e.key==='ArrowRight' || e.key==='d' || e.key==='D') { e.preventDefault(); window.tetMove(1,0); }
    else if (e.key==='ArrowDown'  || e.key==='s' || e.key==='S') { e.preventDefault(); window.tetDrop(); }
    else if (e.key==='ArrowUp'    || e.key==='w' || e.key==='W') { e.preventDefault(); window.tetRotate(); }
    else if (e.key===' ') { e.preventDefault(); window.tetHardDrop(); }
  }
  document.addEventListener('keydown', tetKey);

  newPiece(); draw();
  function tick() { if (!gameRunning) return; if (!collides(piece,px,py+1)) { py++; draw(); } else { lock(); } }
  const delay = () => Math.max(80, 500 - (level-1)*40);
  window._tetInt = setInterval(tick, delay());
}

// ── BRICK BREAKER GAME ──
function startBrickBreaker(area) {
  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Score: <span id="bb-score">0</span></div>
        <div class="gscore">Lives: <span id="bb-lives">3</span></div>
        <div class="gscore">Level: <span id="bb-level">1</span></div>
      </div>
      <button class="abtn sec" onclick="bbQuit()">Quit</button>
    </div>
    <canvas id="bb-canvas" style="border:1px solid var(--panel-border);border-radius:8px;background:var(--panel-col);display:block;width:100%;cursor:none;touch-action:none;"></canvas>
    <div style="text-align:center;font-family:var(--exo);font-size:.72rem;color:var(--silver);margin-top:6px;">Move mouse or touch to control paddle · Click/tap to launch ball</div>`;

  const canvas = document.getElementById('bb-canvas');
  canvas.width = canvas.offsetWidth;
  canvas.height = Math.min(420, canvas.offsetWidth * 0.75);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const PAD_W = W * 0.18, PAD_H = 12, BALL_R = 8;
  const ROWS = 5, BRICK_COLS = 10;
  const BRICK_W = (W - 20) / BRICK_COLS, BRICK_H = 20, BRICK_MARGIN = 2;
  const COLORS = ['#ff6680','#fb923c','#fbbf24','#4ade80','#60a5fa'];

  let score = 0, lives = 3, level = 1, running = true, launched = false;
  let padX = W/2, ballX = W/2, ballY = H-60, ballDX = 3, ballDY = -4;
  let bricks = [];

  function initBricks() {
    bricks = [];
    for (let r=0;r<ROWS;r++)
      for (let c=0;c<BRICK_COLS;c++)
        bricks.push({x:10+c*BRICK_W, y:50+r*(BRICK_H+BRICK_MARGIN), w:BRICK_W-BRICK_MARGIN, h:BRICK_H, color:COLORS[r%COLORS.length], alive:true, hp: level>2?2:1});
  }

  function resetBall() {
    ballX=padX; ballY=H-60; launched=false;
    ballDX=3+level*0.3; ballDY=-(4+level*0.2);
  }

  function launch() {
    if (!launched) { launched=true; ballDY=-(4+level*0.2); }
  }

  canvas.addEventListener('mousemove', e=>{
    const rect=canvas.getBoundingClientRect();
    padX=Math.max(PAD_W/2, Math.min(W-PAD_W/2, (e.clientX-rect.left)*(W/rect.width)));
    if(!launched) { ballX=padX; }
  });
  canvas.addEventListener('touchmove', e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    padX=Math.max(PAD_W/2, Math.min(W-PAD_W/2, (e.touches[0].clientX-rect.left)*(W/rect.width)));
    if(!launched) ballX=padX;
  },{passive:false});
  canvas.addEventListener('click', launch);
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); launch(); },{passive:false});

  initBricks(); resetBall();

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Bricks
    bricks.forEach(b=>{
      if(!b.alive) return;
      ctx.fillStyle=b.color; ctx.shadowColor=b.color; ctx.shadowBlur=b.hp>1?10:4;
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,4); ctx.fill();
      ctx.shadowBlur=0;
      if(b.hp>1){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(b.x+2,b.y+2,b.w-4,b.h-4,3);ctx.stroke();}
    });
    // Paddle
    const g=ctx.createLinearGradient(padX-PAD_W/2,0,padX+PAD_W/2,0);
    g.addColorStop(0,'#4d9fff'); g.addColorStop(1,'#00d4aa');
    ctx.fillStyle=g; ctx.shadowColor='#4d9fff'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.roundRect(padX-PAD_W/2,H-PAD_H-10,PAD_W,PAD_H,PAD_H/2); ctx.fill();
    ctx.shadowBlur=0;
    // Ball
    const bg=ctx.createRadialGradient(ballX-2,ballY-2,1,ballX,ballY,BALL_R);
    bg.addColorStop(0,'#fff'); bg.addColorStop(1,'#00d4aa');
    ctx.fillStyle=bg; ctx.shadowColor='#00d4aa'; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.arc(ballX,ballY,BALL_R,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    if(!launched){
      ctx.fillStyle='rgba(255,255,255,.5)';ctx.font=`${W*.03}px var(--raj)`;
      ctx.textAlign='center'; ctx.fillText('Click / Tap to launch!',W/2,H/2+30);
    }
  }

  function update() {
    if(!running||!launched) return;
    ballX+=ballDX; ballY+=ballDY;
    // Walls
    if(ballX-BALL_R<0){ballX=BALL_R;ballDX=Math.abs(ballDX);}
    if(ballX+BALL_R>W){ballX=W-BALL_R;ballDX=-Math.abs(ballDX);}
    if(ballY-BALL_R<0){ballY=BALL_R;ballDY=Math.abs(ballDY);}
    // Paddle
    if(ballY+BALL_R>H-PAD_H-10 && ballY+BALL_R<H-10+5 && ballX>padX-PAD_W/2-BALL_R && ballX<padX+PAD_W/2+BALL_R){
      ballDY=-Math.abs(ballDY);
      ballDX += (ballX-padX)/(PAD_W/2)*2.5;
      ballDX = Math.max(-8,Math.min(8,ballDX));
    }
    // Bottom
    if(ballY>H+BALL_R){
      lives--; document.getElementById('bb-lives').textContent=lives;
      if(lives<=0){running=false;clearInterval(window._bbInt);exitGame(score,'Bricks smashed!','Game Over');}
      else resetBall();
    }
    // Bricks
    for(const b of bricks){
      if(!b.alive) continue;
      if(ballX+BALL_R>b.x && ballX-BALL_R<b.x+b.w && ballY+BALL_R>b.y && ballY-BALL_R<b.y+b.h){
        b.hp--; if(b.hp<=0){b.alive=false;score+=10*level;document.getElementById('bb-score').textContent=score;}
        const fromLeft=Math.abs(ballX-(b.x+b.w)), fromRight=Math.abs(ballX-b.x);
        const fromTop=Math.abs(ballY-(b.y+b.h)), fromBottom=Math.abs(ballY-b.y);
        const minDist=Math.min(fromLeft,fromRight,fromTop,fromBottom);
        if(minDist===fromTop||minDist===fromBottom) ballDY*=-1; else ballDX*=-1;
        break;
      }
    }
    // Level clear
    if(bricks.every(b=>!b.alive)){
      level++; document.getElementById('bb-level').textContent=level;
      score+=level*50; document.getElementById('bb-score').textContent=score;
      initBricks(); resetBall();
    }
  }

  window.bbQuit = function(){running=false;clearInterval(window._bbInt);exitGame(score,'','');};
  window._bbInt = setInterval(()=>{ update(); draw(); },16);
}

// ── ICY TOWER GAME ──
function startIcyTower(area) {
  const W = Math.min(380, window.innerWidth - 60), H = 520;
  area.innerHTML = `
    <div class="game-header">
      <div class="game-score-row">
        <div class="gscore">Floor: <span id="it-floor">0</span></div>
        <div class="gscore">Best: <span id="it-best">0</span></div>
        <div class="gscore" id="it-combo" style="color:var(--teal2);display:none;">Combo x<span id="it-comboval">1</span></div>
      </div>
      <button class="abtn sec" onclick="itQuit()">Quit</button>
    </div>
    <div style="display:flex;justify-content:center;">
      <canvas id="it-canvas" width="${W}" height="${H}" style="border:1px solid var(--panel-border);border-radius:12px;background:linear-gradient(180deg,#050810 0%,#0a1428 100%);display:block;touch-action:none;"></canvas>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:8px;">
      <button class="abtn sec" style="padding:12px 28px;font-size:1.2rem;" id="it-left" onpointerdown="itKey(&quot;left&quot;,true)" onpointerup="itKey(&quot;left&quot;,false)">←</button>
      <button class="abtn sec" style="padding:12px 28px;font-size:1.2rem;" id="it-jump" onpointerdown="itJumpBtn()">↑ Jump</button>
      <button class="abtn sec" style="padding:12px 28px;font-size:1.2rem;" id="it-right" onpointerdown="itKey(&quot;right&quot;,true)" onpointerup="itKey(&quot;right&quot;,false)">→</button>
    </div>
    <div style="text-align:center;font-family:var(--exo);font-size:.7rem;color:var(--silver);margin-top:6px;">Arrow keys or A/D to move · Space / W / ↑ to jump</div>`;

  const canvas = document.getElementById('it-canvas');
  const ctx = canvas.getContext('2d');

  const PLAT_H = 14, GRAVITY = 0.3, JUMP_F = -15, MAX_FALL = 8;
  const PLAYER_W = 32, PLAYER_H = 38;
  const COLORS_PLAT = ['#4d9fff','#00d4aa','#c084fc','#f472b6','#fb923c'];

  let platforms = [], player, camY, floor, bestFloor, combo, comboTimer, gameOver, running;
  const keys = {left:false, right:false, jump:false};

  function initGame() {
    platforms = [];
    // Ground platform
    platforms.push({x:0, y:H-30, w:W, color:'#4d9fff', landed:true});
    // Generate initial platforms
    for(let i=1;i<=40;i++) genPlatform(i);
    player = {x:W/2-PLAYER_W/2, y:H-30-PLAYER_H, vx:0, vy:0, onGround:false, facing:1, run:0};
    camY = 0; floor = 0; bestFloor = parseInt(localStorage.getItem('hi_icytower')||'0');
    combo = 1; comboTimer = 0; gameOver = false; running = true;
    document.getElementById('it-best').textContent = bestFloor;
  }

  function genPlatform(floorNum) {
    const spacing = 90 + Math.random()*30;
    const y = H - 30 - floorNum * spacing;
    const minW = Math.max(60, 180 - floorNum*4);
    const maxW = Math.max(80, 240 - floorNum*3);
    const w = minW + Math.random()*(maxW-minW);
    const x = Math.random()*(W-w);
    platforms.push({x, y, w, color:COLORS_PLAT[floorNum%COLORS_PLAT.length], landed:false, floorNum});
  }

  function jump() {
    if (!player.onGround || gameOver) return;
    const speedBonus = Math.min(Math.abs(player.vx) * 0.6, 4);
    player.vy = JUMP_F - speedBonus;
    player.onGround = false;
    combo++;
    comboTimer = 90;
    if (combo > 1) {
      document.getElementById('it-combo').style.display = '';
      document.getElementById('it-comboval').textContent = combo;
    }
  }

  window.itKey = function(dir, down) { keys[dir] = down; };
  window.itJumpBtn = function() { jump(); };

  function itKeyDown(e) {
    if (!document.getElementById('it-canvas')) { document.removeEventListener('keydown',itKeyDown); document.removeEventListener('keyup',itKeyUp); return; }
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keys.left=true;
    if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') keys.right=true;
    if (e.key==='ArrowUp'||e.key===' '||e.key==='w'||e.key==='W') { e.preventDefault(); jump(); }
  }
  function itKeyUp(e) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keys.left=false;
    if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') keys.right=false;
  }
  document.addEventListener('keydown', itKeyDown);
  document.addEventListener('keyup', itKeyUp);

  function update() {
    if (gameOver || !running) return;

    // Movement
    const accel = 0.9, friction = 0.78, maxSpeed = 7;
    if (keys.left) { player.vx -= accel; player.facing = -1; player.run++; }
    else if (keys.right) { player.vx += accel; player.facing = 1; player.run++; }
    else { player.vx *= friction; player.run = 0; }
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

    // Horizontal wrap
    player.x += player.vx;
    if (player.x + PLAYER_W < 0) player.x = W;
    if (player.x > W) player.x = -PLAYER_W;

    // Gravity
    player.vy = Math.min(player.vy + GRAVITY, MAX_FALL);
    player.y += player.vy;
    player.onGround = false;

    // Platform collision -- all coords in world space; camY only used for drawing
    if (player.vy >= 0) {
      for (const p of platforms) {
        if (player.x + PLAYER_W > p.x + 4 && player.x < p.x + p.w - 4 &&
            player.y + PLAYER_H >= p.y && player.y + PLAYER_H <= p.y + PLAT_H + player.vy + 2) {
          player.y = p.y - PLAYER_H;
          player.vy = 0;
          player.onGround = true;
          if (!p.landed && p.floorNum) {
            p.landed = true;
            if (p.floorNum > floor) {
              floor = p.floorNum;
              const flEl = document.getElementById('it-floor');
              if (flEl) flEl.textContent = floor;
              if (floor > bestFloor) {
                bestFloor = floor;
                localStorage.setItem('hi_icytower', bestFloor);
                const beEl = document.getElementById('it-best');
                if (beEl) beEl.textContent = bestFloor;
              }
              // Extend platforms upward safely (no spread operator on large arrays)
              let topFloor = 0;
              for (const pl of platforms) if (pl.floorNum && pl.floorNum > topFloor) topFloor = pl.floorNum;
              while (topFloor < floor + 50) { topFloor++; genPlatform(topFloor); }
            }
          }
          break;
        }
      }
    }

    // Camera: smoothly follow player both UP and DOWN
    const targetCamY = H * 0.45 - player.y;
    camY += (targetCamY - camY) * 0.1;

    // Combo timer
    if (comboTimer > 0) { comboTimer--; }
    else if (combo > 1) {
      combo = 1;
      const cel = document.getElementById('it-combo');
      if (cel) cel.style.display = 'none';
    }

    // Fall death -- player falls well below the ground platform world Y
    if (player.y > H - 30 + 300) {
      gameOver = true; running = false;
      clearInterval(window._itInt);
      document.removeEventListener('keydown',itKeyDown);
      document.removeEventListener('keyup',itKeyUp);
      exitGame(floor, `Reached floor ${floor}!`, 'You fell! Game Over');
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background stars
    ctx.fillStyle='rgba(77,159,255,.12)';
    for(let i=0;i<30;i++){
      const sx=(i*137+Math.floor(camY/10)*13)%W;
      const sy=(i*97+Math.floor(camY/10)*7)%H;
      ctx.beginPath();ctx.arc(sx,sy,1,0,Math.PI*2);ctx.fill();
    }

    // Platforms
    platforms.forEach(p => {
      const screenY = p.y + camY;
      if (screenY < -PLAT_H || screenY > H + 50) return;
      // Icy platform with glow
      const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY+PLAT_H);
      grad.addColorStop(0, p.color+'ee');
      grad.addColorStop(1, p.color+'66');
      ctx.fillStyle = grad;
      ctx.shadowColor = p.color; ctx.shadowBlur = p.landed ? 4 : 12;
      ctx.beginPath(); ctx.roundRect(p.x, screenY, p.w, PLAT_H, 4); ctx.fill();
      ctx.shadowBlur = 0;
      // Shine
      ctx.fillStyle='rgba(255,255,255,.25)';
      ctx.beginPath();ctx.roundRect(p.x+4,screenY+2,Math.max(20,p.w-8),4,2);ctx.fill();
      // Floor label
      if (p.floorNum && p.w > 60) {
        ctx.fillStyle='rgba(255,255,255,.4)';ctx.font=`bold 9px var(--exo)`;ctx.textAlign='center';
        ctx.fillText(p.floorNum, p.x+p.w/2, screenY+PLAT_H-2);
      }
    });

    // Player — convert world Y to screen Y using camY
    const px = player.x, py = player.y + camY;
    const run = Math.floor(player.run/8)%2;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath();ctx.ellipse(px+PLAYER_W/2,py+PLAYER_H+2,PLAYER_W/2,5,0,0,Math.PI*2);ctx.fill();
    // Body
    const bodyGrad = ctx.createLinearGradient(px,py,px,py+PLAYER_H);
    bodyGrad.addColorStop(0,'#60a5fa'); bodyGrad.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=bodyGrad;ctx.shadowColor='#60a5fa';ctx.shadowBlur=8;
    ctx.beginPath();ctx.roundRect(px+4,py+12,PLAYER_W-8,PLAYER_H-12,6);ctx.fill();ctx.shadowBlur=0;
    // Head
    ctx.fillStyle='#fde68a';ctx.beginPath();ctx.ellipse(px+PLAYER_W/2,py+8,10,11,0,0,Math.PI*2);ctx.fill();
    // Hat
    ctx.fillStyle='#1e3a8a';ctx.beginPath();ctx.roundRect(px+PLAYER_W/2-10,py-4,20,9,3);ctx.fill();
    ctx.fillStyle='#2563eb';ctx.beginPath();ctx.roundRect(px+PLAYER_W/2-13,py+4,26,4,2);ctx.fill();
    // Eyes
    const eyeX = player.facing > 0 ? px+PLAYER_W/2+3 : px+PLAYER_W/2-3;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.arc(eyeX,py+8,2.5,0,Math.PI*2);ctx.fill();
    // Legs (animated)
    ctx.fillStyle='#1e40af';
    if (player.onGround && (keys.left || keys.right)) {
      ctx.fillRect(px+5+(run?4:0),py+PLAYER_H-6,8,8);
      ctx.fillRect(px+PLAYER_W-13-(run?4:0),py+PLAYER_H-6,8,8);
    } else {
      ctx.fillRect(px+6,py+PLAYER_H-8,8,10);
      ctx.fillRect(px+PLAYER_W-14,py+PLAYER_H-8,8,10);
    }
    // Scarf
    ctx.fillStyle='#f87171';ctx.beginPath();ctx.roundRect(px+4,py+18,PLAYER_W-8,5,3);ctx.fill();

    // HUD floor indicator at top
    if(floor>0){
      ctx.fillStyle='rgba(77,159,255,.15)';ctx.beginPath();ctx.roundRect(W/2-50,8,100,24,6);ctx.fill();
      ctx.fillStyle='var(--accent2)';ctx.font='bold 13px var(--orb)';ctx.textAlign='center';
      ctx.fillText(`Floor ${floor}`,W/2,25);
    }
  }

  window.itQuit = function(){
    running=false;clearInterval(window._itInt);
    document.removeEventListener('keydown',itKeyDown);
    document.removeEventListener('keyup',itKeyUp);
    exitGame(floor,'','');
  };

  initGame();
  window._itInt = setInterval(()=>{ update(); draw(); }, 16);
}
