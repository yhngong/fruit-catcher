/**
 * Fruit Catcher Arcade — Complete Game Engine
 * Pure HTML5 Canvas, Web Audio API procedural sound, and zero dependencies.
 */

(() => {
  'use strict';

  // --- Audio Synthesizer (Zero Audio Files Needed) ---
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type, param = 1) {
    if (isMuted || !audioCtx) return;
    try {
      const t = audioCtx.currentTime;

      if (type === 'catch') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        const baseFreq = 480 * Math.min(2.5, param); // Pitch goes up with combo!
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === 'golden') {
        // High sparkle arpeggio
        [880, 1174, 1568, 2093].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.04);
          gain.gain.setValueAtTime(0.2, t + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.04 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t + i * 0.04);
          osc.stop(t + i * 0.04 + 0.12);
        });
      } else if (type === 'bomb') {
        // Low explosion boom
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'powerup') {
        // Futuristic sweep
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (type === 'fever') {
        // Triumphant fanfare
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.07);
          gain.gain.setValueAtTime(0.25, t + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.07 + 0.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t + i * 0.07);
          osc.stop(t + i * 0.07 + 0.2);
        });
      } else if (type === 'tick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(param > 2 ? 880 : 1200, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'timeup') {
        [523.25, 493.88, 440, 349.23].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, t + i * 0.12);
          gain.gain.setValueAtTime(0.3, t + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.28);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t + i * 0.12);
          osc.stop(t + i * 0.12 + 0.28);
        });
      }
    } catch (e) {}
  }

  // --- Game Config & Constants ---
  const FRUIT_TYPES = {
    apple: { name: 'Apple', emoji: '🍎', points: 10, coins: 1, color: '#ef4444', radius: 18 },
    orange: { name: 'Orange', emoji: '🍊', points: 15, coins: 1, color: '#f97316', radius: 18 },
    banana: { name: 'Banana', emoji: '🍌', points: 20, coins: 2, color: '#eab308', radius: 20 },
    strawberry: { name: 'Strawberry', emoji: '🍓', points: 25, coins: 2, color: '#ec4899', radius: 17 },
    watermelon: { name: 'Watermelon', emoji: '🍉', points: 40, coins: 3, color: '#22c55e', radius: 24 },
    pineapple: { name: 'Pineapple', emoji: '🍍', points: 50, coins: 4, color: '#eab308', radius: 23 },
    golden: { name: 'Golden Star', emoji: '⭐', points: 100, coins: 8, color: '#facc15', radius: 20 },
    bomb: { name: 'Bomb', emoji: '💣', points: 0, coins: 0, color: '#334155', radius: 20 },
    power_magnet: { name: 'Magnet', emoji: '🧲', points: 30, coins: 2, color: '#38bdf8', radius: 20, isPowerup: true },
    power_slow: { name: 'Slow-Mo', emoji: '⏱️', points: 30, coins: 2, color: '#a855f7', radius: 20, isPowerup: true },
    power_shield: { name: 'Shield', emoji: '🛡️', points: 30, coins: 2, color: '#10b981', radius: 20, isPowerup: true }
  };

  const BASKET_SKINS = [
    { id: 'classic', name: 'Wicker Basket', icon: '🧺', price: 0 },
    { id: 'golden', name: 'Royal Gold Urn', icon: '🪙', price: 150 },
    { id: 'cyber', name: 'Cyber Hopper', icon: '🤖', price: 350 },
    { id: 'watermelon', name: 'Melon Bowl', icon: '🍉', price: 600 },
    { id: 'panda', name: 'Panda Pouch', icon: '🐼', price: 1000 }
  ];

  // --- State Variables ---
  let gameState = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  let score = 0;
  let highScore = 0;
  let coins = 0;
  let totalCoinsEarned = 0;
  let coinProgress = 0; // 10 progress points = 1 coin (10x harder)
  let fruitsCaught = 0;
  const GAME_DURATION = 60;
  let timeLeft = 60;
  let lastTickSec = 60;
  let combo = 0;
  let maxCombo = 0;
  let feverMeter = 0;
  let feverActive = false;
  let feverTimer = 0;
  let feverCooldownTimer = 0;

  // Power-up Timers
  let magnetTimer = 0;
  let slowTimer = 0;
  let hasShield = false;

  // Basket Player State
  const basket = {
    x: 0,
    y: 0,
    width: 90,
    height: 40,
    targetX: 0,
    vx: 0,
    tilt: 0,
    isDashing: false,
    skin: 'classic'
  };

  let unlockedSkins = ['classic'];
  let fallingItems = [];
  let particles = [];
  let floatingTexts = [];
  let screenShake = 0;
  let spawnCooldown = 0;
  let lastTime = 0;

  // Control state
  const keys = { left: false, right: false, dash: false };

  // --- DOM Elements ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const canvasContainer = document.getElementById('canvasContainer');

  const scoreVal = document.getElementById('scoreVal');
  const highScoreVal = document.getElementById('highScoreVal');
  const coinsVal = document.getElementById('coinsVal');
  const feverMeterWrapper = document.getElementById('feverMeterWrapper');
  const feverMeterFill = document.getElementById('feverMeterFill');
  const feverLabel = document.getElementById('feverLabel');
  const timerPill = document.getElementById('timerPill');
  const timerVal = document.getElementById('timerVal');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const btnPause = document.getElementById('btnPause');

  const powerupBar = document.getElementById('powerupBar');
  const badgeMagnet = document.getElementById('badgeMagnet');
  const badgeSlow = document.getElementById('badgeSlow');
  const badgeShield = document.getElementById('badgeShield');
  const comboBadge = document.getElementById('comboBadge');
  const comboMultiplierText = document.getElementById('comboMultiplierText');

  // Overlays
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const btnStartGame = document.getElementById('btnStartGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnRestartFromPause = document.getElementById('btnRestartFromPause');
  const btnQuitToTitle = document.getElementById('btnQuitToTitle');
  const btnPlayAgain = document.getElementById('btnPlayAgain');

  // Stats in Game Over
  const finalScoreVal = document.getElementById('finalScoreVal');
  const finalHighScoreVal = document.getElementById('finalHighScoreVal');
  const finalFruitsVal = document.getElementById('finalFruitsVal');
  const finalCoinsVal = document.getElementById('finalCoinsVal');
  const newHighBanner = document.getElementById('newHighBanner');

  // Shop & Modals
  const shopModal = document.getElementById('shopModal');
  const btnOpenShop = document.getElementById('btnOpenShop');
  const btnShopFromOver = document.getElementById('btnShopFromOver');
  const btnCloseShop = document.getElementById('btnCloseShop');
  const shopCoinsDisplay = document.getElementById('shopCoinsDisplay');
  const skinsGrid = document.getElementById('skinsGrid');

  const howToPlayModal = document.getElementById('howToPlayModal');
  const btnOpenHowToPlay = document.getElementById('btnOpenHowToPlay');
  const btnCloseHowToPlay = document.getElementById('btnCloseHowToPlay');

  // Mobile Touch Controls
  const btnTouchLeft = document.getElementById('btnTouchLeft');
  const btnTouchRight = document.getElementById('btnTouchRight');

  // --- Storage & Initialization ---
  function loadPersistedData() {
    try {
      const savedHigh = localStorage.getItem('fruit_catcher_high');
      if (savedHigh) highScore = parseInt(savedHigh, 10) || 0;

      const savedCoins = localStorage.getItem('fruit_catcher_coins');
      if (savedCoins) coins = parseInt(savedCoins, 10) || 0;

      const savedSkins = localStorage.getItem('fruit_catcher_skins');
      if (savedSkins) unlockedSkins = JSON.parse(savedSkins);

      const activeSkin = localStorage.getItem('fruit_catcher_active_skin');
      if (activeSkin && unlockedSkins.includes(activeSkin)) {
        basket.skin = activeSkin;
      }
    } catch (e) {}

    highScoreVal.textContent = highScore;
    coinsVal.textContent = coins;
  }

  function savePersistedData() {
    try {
      localStorage.setItem('fruit_catcher_high', highScore);
      localStorage.setItem('fruit_catcher_coins', coins);
      localStorage.setItem('fruit_catcher_skins', JSON.stringify(unlockedSkins));
      localStorage.setItem('fruit_catcher_active_skin', basket.skin);
    } catch (e) {}
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    basket.y = rect.height - basket.height - 18;
    if (basket.x === 0) {
      basket.x = rect.width / 2;
      basket.targetX = basket.x;
    }
  }

  function init() {
    loadPersistedData();
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setupInputListeners();
    renderShop();
    registerServiceWorker();

    requestAnimationFrame(gameLoop);
  }

  // --- Game Lifecycle ---
  function startGame() {
    initAudio();
    gameState = 'PLAYING';
    score = 0;
    fruitsCaught = 0;
    totalCoinsEarned = 0;
    coinProgress = 0;
    timeLeft = GAME_DURATION;
    lastTickSec = 60;
    combo = 0;
    maxCombo = 0;
    feverMeter = 0;
    feverActive = false;
    feverTimer = 0;
    feverCooldownTimer = 0;
    feverMeterFill.style.width = '0%';
    feverLabel.textContent = 'FEVER';
    feverMeterFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
    if (feverMeterWrapper) feverMeterWrapper.classList.remove('cooldown');
    magnetTimer = 0;
    slowTimer = 0;
    hasShield = false;

    fallingItems = [];
    particles = [];
    floatingTexts = [];
    screenShake = 0;
    spawnCooldown = 0;

    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');

    timerPill.classList.remove('urgent');
    updateTimerHUD();
    updateHUD();
    playSound('powerup');
  }

  function pauseGame() {
    if (gameState !== 'PLAYING') return;
    gameState = 'PAUSED';
    pauseOverlay.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'PAUSED') return;
    initAudio();
    gameState = 'PLAYING';
    pauseOverlay.classList.add('hidden');
  }

  function triggerTimeUp() {
    gameState = 'GAMEOVER';
    playSound('timeup');

    if (score > highScore) {
      highScore = score;
      newHighBanner.classList.remove('hidden');
    } else {
      newHighBanner.classList.add('hidden');
    }

    coins += totalCoinsEarned;
    savePersistedData();

    finalScoreVal.textContent = score;
    finalHighScoreVal.textContent = highScore;
    finalFruitsVal.textContent = fruitsCaught;
    finalCoinsVal.textContent = `🪙 +${totalCoinsEarned}`;

    gameOverOverlay.classList.remove('hidden');
  }
  const triggerGameOver = triggerTimeUp;

  // --- Game Loop ---
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'PLAYING') {
      update(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  // --- Update Logic ---
  function update(dt) {
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 0. Countdown Timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerHUD();
      triggerTimeUp();
      return;
    }
    updateTimerHUD();

    const currentSec = Math.ceil(timeLeft);
    if (currentSec !== lastTickSec) {
      if (currentSec <= 5 && currentSec > 0) {
        playSound('tick', currentSec);
      }
      lastTickSec = currentSec;
    }

    // 1. Update Basket Movement (Snappy & Fast)
    const speed = (basket.isDashing || keys.dash ? 1150 : 820) * dt;
    if (keys.left) basket.targetX -= speed;
    if (keys.right) basket.targetX += speed;

    basket.targetX = Math.max(basket.width / 2, Math.min(width - basket.width / 2, basket.targetX));

    // Smooth & responsive lerp
    const prevX = basket.x;
    basket.x += (basket.targetX - basket.x) * Math.min(1, dt * 30);
    basket.vx = basket.x - prevX;
    basket.tilt = Math.max(-0.25, Math.min(0.25, basket.vx * 0.03));

    // 2. Power-up & Fever Timers
    if (magnetTimer > 0) {
      magnetTimer -= dt;
      if (magnetTimer <= 0) badgeMagnet.classList.add('hidden');
      else badgeMagnet.querySelector('.timer').textContent = `${Math.ceil(magnetTimer)}s`;
    }

    if (slowTimer > 0) {
      slowTimer -= dt;
      if (slowTimer <= 0) badgeSlow.classList.add('hidden');
      else badgeSlow.querySelector('.timer').textContent = `${Math.ceil(slowTimer)}s`;
    }

    if (feverActive) {
      feverTimer -= dt;
      feverMeter = Math.max(0, (feverTimer / 8) * 100);
      feverMeterFill.style.width = `${feverMeter}%`;
      if (feverTimer <= 0) {
        feverActive = false;
        feverCooldownTimer = 5; // 5-second cooldown before points can be added
        feverMeter = 0;
        feverMeterFill.style.width = '0%';
        feverLabel.textContent = 'COOLDOWN 5s';
        if (feverMeterWrapper) feverMeterWrapper.classList.add('cooldown');
        addFloatingText(basket.x, basket.y - 40, 'Fever Ended • 5s Cooldown', '#94a3b8', 1.2);
      }
    } else if (feverCooldownTimer > 0) {
      feverCooldownTimer -= dt;
      if (feverCooldownTimer <= 0) {
        feverCooldownTimer = 0;
        feverLabel.textContent = 'FEVER';
        feverMeterFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
        if (feverMeterWrapper) feverMeterWrapper.classList.remove('cooldown');
        addFloatingText(basket.x, basket.y - 35, '⚡ FEVER READY! ⚡', '#fde047', 1.3);
        playSound('powerup');
      } else {
        feverLabel.textContent = `COOLDOWN ${Math.ceil(feverCooldownTimer)}s`;
      }
    }

    // 3. Spawning Falling Items
    spawnCooldown -= dt;
    const baseSpawnRate = feverActive ? 0.18 : Math.max(0.28, 0.75 - (score / 2500) * 0.45);
    if (spawnCooldown <= 0) {
      spawnItem(width);
      spawnCooldown = baseSpawnRate * (slowTimer > 0 ? 1.5 : 1);
    }

    // 4. Update Falling Items
    const speedMultiplier = feverActive ? 1.3 : (slowTimer > 0 ? 0.55 : 1.0);
    const basketTop = basket.y;
    const basketBottom = basket.y + basket.height;
    const basketLeft = basket.x - basket.width / 2;
    const basketRight = basket.x + basket.width / 2;

    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];

      // Magnet Attraction
      if (magnetTimer > 0 && item.type !== 'bomb') {
        const dx = basket.x - item.x;
        const dy = basket.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 260) {
          item.x += (dx / dist) * 280 * dt;
          item.y += (dy / dist) * 280 * dt;
        }
      }

      item.y += item.vy * speedMultiplier * dt;
      item.x += item.vx * dt;
      item.rotation += item.vRot * dt;

      // Check Basket Collision (Catch)
      if (
        item.y + item.radius >= basketTop &&
        item.y - item.radius <= basketBottom &&
        item.x >= basketLeft - 10 &&
        item.x <= basketRight + 10
      ) {
        handleItemCatch(item, i);
        continue;
      }

      // Reached Bottom (Missed)
      if (item.y - item.radius > height) {
        if (item.type !== 'bomb' && !item.isPowerup && !feverActive) {
          // Break combo
          if (combo > 0) {
            combo = 0;
            updateComboBadge();
          }
        }
        fallingItems.splice(i, 1);
      }
    }

    // 5. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt; // gravity
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) particles.splice(i, 1);
    }

    // 6. Update Floating Text Popups
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // 7. Screen Shake decay
    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt * 25);
    }
  }

  // --- Catch & Item Handlers ---
  function handleItemCatch(item, index) {
    fallingItems.splice(index, 1);

    if (item.type === 'bomb') {
      if (feverActive) {
        // Invulnerable in fever mode
        addFloatingText(item.x, item.y, 'BLOCKED! ⭐', '#facc15');
        createJuiceParticles(item.x, item.y, '#f59e0b', 10);
        return;
      }

      if (hasShield) {
        hasShield = false;
        badgeShield.classList.add('hidden');
        playSound('powerup');
        addFloatingText(item.x, item.y, 'SHIELD SAVED! 🛡️', '#10b981');
        createJuiceParticles(item.x, item.y, '#10b981', 14);
        return;
      }

      // Bomb explosion hit
      score = Math.max(0, score - 50);
      timeLeft = Math.max(0, timeLeft - 3);
      combo = 0;
      updateComboBadge();
      updateTimerHUD();
      updateHUD();
      screenShake = 18;
      playSound('bomb');
      createJuiceParticles(item.x, item.y, '#334155', 25);
      addFloatingText(item.x, item.y, 'BOMB! -50 pts -3s 💣', '#ef4444');

      if (timeLeft <= 0) {
        triggerTimeUp();
      }
      return;
    }

    // Power-up Catch
    if (item.isPowerup) {
      playSound('powerup');
      createJuiceParticles(item.x, item.y, item.color, 16);

      if (item.type === 'power_magnet') {
        magnetTimer = 6;
        badgeMagnet.classList.remove('hidden');
        addFloatingText(item.x, item.y, 'MAGNET! 🧲', '#38bdf8');
      } else if (item.type === 'power_slow') {
        slowTimer = 6;
        badgeSlow.classList.remove('hidden');
        timeLeft = Math.min(GAME_DURATION, timeLeft + 5);
        updateTimerHUD();
        addFloatingText(item.x, item.y, '+5s BONUS TIME! ⏱️', '#a855f7');
      } else if (item.type === 'power_shield') {
        hasShield = true;
        badgeShield.classList.remove('hidden');
        addFloatingText(item.x, item.y, 'SHIELD UP! 🛡️', '#10b981');
      }
      return;
    }

    // Fruit Catch!
    fruitsCaught++;
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    // Multiplier based on combo
    let multiplier = 1;
    if (combo >= 25) multiplier = 5;
    else if (combo >= 15) multiplier = 4;
    else if (combo >= 10) multiplier = 3;
    else if (combo >= 5) multiplier = 2;

    if (feverActive) multiplier *= 2;

    const gainedPoints = item.points * multiplier;
    score += gainedPoints;

    // Coins are 10x harder to get (10 coin progress points = 1 real coin)
    coinProgress += item.coins;
    if (coinProgress >= 10) {
      const earnedCoins = Math.floor(coinProgress / 10);
      coinProgress %= 10;
      totalCoinsEarned += earnedCoins;
      addFloatingText(basket.x + (Math.random() - 0.5) * 20, basket.y - 30, `+${earnedCoins} 🪙`, '#facc15', 1.3);
      playSound('golden');
    }

    // Fill fever meter (only when not active and 5s cooldown is complete)
    if (!feverActive && feverCooldownTimer <= 0) {
      const feverGain = item.type === 'golden' ? 25 : 6;
      feverMeter = Math.min(100, feverMeter + feverGain);
      feverMeterFill.style.width = `${feverMeter}%`;

      if (feverMeter >= 100) {
        triggerFeverMode();
      }
    }

    // Audio & Visual feedback
    if (item.type === 'golden') {
      playSound('golden');
    } else {
      playSound('catch', 1 + (multiplier - 1) * 0.25);
    }

    createJuiceParticles(item.x, item.y, item.color, 14);
    addFloatingText(
      item.x,
      item.y,
      `+${gainedPoints}${multiplier > 1 ? ` (${multiplier}x)` : ''}`,
      item.type === 'golden' ? '#fde047' : '#fff'
    );

    updateHUD();
    updateComboBadge();
  }

  function triggerFeverMode() {
    feverActive = true;
    feverTimer = 8;
    feverCooldownTimer = 0;
    if (feverMeterWrapper) feverMeterWrapper.classList.remove('cooldown');
    feverLabel.textContent = '🌟 FEVER TIME 🌟';
    feverMeterFill.style.background = 'linear-gradient(90deg, #facc15, #ec4899)';
    playSound('fever');
    addFloatingText(basket.x, basket.y - 40, '🔥 FEVER TIME! 2X POINTS 🔥', '#fde047', 1.6);
  }

  function spawnItem(width) {
    const roll = Math.random();
    let type = 'apple';

    if (feverActive) {
      // High chance of golden stars during fever
      type = roll < 0.65 ? 'golden' : (roll < 0.85 ? 'watermelon' : 'pineapple');
    } else {
      // Significantly increased bomb frequency (~25% base, scaling up to 33% as time winds down)
      const timeElapsed = GAME_DURATION - timeLeft;
      const bombChance = Math.min(0.33, 0.25 + (timeElapsed / GAME_DURATION) * 0.08);

      if (roll < bombChance) {
        type = 'bomb';
      } else {
        const subRoll = (roll - bombChance) / (1 - bombChance);
        if (subRoll < 0.04) type = 'power_magnet';
        else if (subRoll < 0.09) type = 'power_slow';
        else if (subRoll < 0.13) type = 'power_shield';
        else if (subRoll < 0.20) type = 'golden';
        else if (subRoll < 0.38) type = 'apple';
        else if (subRoll < 0.54) type = 'orange';
        else if (subRoll < 0.70) type = 'banana';
        else if (subRoll < 0.84) type = 'strawberry';
        else if (subRoll < 0.93) type = 'watermelon';
        else type = 'pineapple';
      }
    }

    const info = FRUIT_TYPES[type];
    const margin = 35;
    const x = margin + Math.random() * (width - margin * 2);

    fallingItems.push({
      x: x,
      y: -info.radius - 10,
      radius: info.radius,
      vy: 160 + Math.random() * 80 + (type === 'golden' ? 40 : 0),
      vx: (Math.random() - 0.5) * 30,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 4,
      type: type,
      emoji: info.emoji,
      color: info.color,
      points: info.points,
      coins: info.coins,
      isPowerup: !!info.isPowerup
    });
  }

  // --- Particle & Text FX ---
  function createJuiceParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 150;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        radius: 2 + Math.random() * 3.5,
        color: color,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        alpha: 1
      });
    }
  }

  function addFloatingText(x, y, text, color = '#fff', scale = 1.0) {
    floatingTexts.push({
      x: x,
      y: y - 10,
      vy: -65,
      text: text,
      color: color,
      scale: scale,
      life: 0.8,
      maxLife: 0.8,
      alpha: 1
    });
  }

  // --- Rendering ---
  function render() {
    const rect = canvasContainer.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.save();
    // Screen shake offset
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background (Orchard Sky & Rolling Grass Hills)
    drawBackground(w, h);

    // 2. Draw Falling Items
    fallingItems.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);

      if (item.type === 'golden' || feverActive) {
        // Golden glow
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 15;
      } else if (item.isPowerup) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 12;
      }

      ctx.font = `${item.radius * 1.8}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, 0, 0);

      ctx.restore();
    });

    // 3. Draw Particles
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Basket Player
    drawBasket(basket.x, basket.y, basket.width, basket.height, basket.tilt, basket.skin);

    // 5. Draw Floating Scores & Texts
    floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${Math.round(18 * ft.scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function drawBackground(w, h) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (feverActive) {
      skyGrad.addColorStop(0, '#fde047');
      skyGrad.addColorStop(0.5, '#f43f5e');
      skyGrad.addColorStop(1, '#8b5cf6');
    } else {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant Green Hills
    ctx.fillStyle = feverActive ? '#4c1d95' : '#86efac';
    ctx.beginPath();
    ctx.arc(w * 0.25, h + 100, h * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = feverActive ? '#581c87' : '#4ade80';
    ctx.beginPath();
    ctx.arc(w * 0.85, h + 80, h * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Foreground Grass Floor
    ctx.fillStyle = feverActive ? '#3b0764' : '#22c55e';
    ctx.beginPath();
    ctx.rect(0, h - 25, w, 25);
    ctx.fill();
  }

  function drawBasket(x, y, w, h, tilt, skin) {
    ctx.save();
    ctx.translate(x, y + h / 2);
    ctx.rotate(tilt);

    // Shield bubble around basket if active
    if (hasShield) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.65, h * 1.1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (skin === 'golden') {
      // Royal Gold Urn
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#facc15');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [4, 4, 16, 16]);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (skin === 'cyber') {
      // Cyber Neon Mecha
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-w * 0.3, -2, w * 0.6, 4);
    } else if (skin === 'watermelon') {
      // Watermelon rind & pink interior
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w / 2, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w * 0.44, 0, Math.PI);
      ctx.fill();
    } else if (skin === 'panda') {
      // Cute Panda basket
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = '#000000';
      // Ears
      ctx.beginPath();
      ctx.arc(-w * 0.35, -h * 0.5, 9, 0, Math.PI * 2);
      ctx.arc(w * 0.35, -h * 0.5, 9, 0, Math.PI * 2);
      ctx.fill();
      // Eyes & Nose
      ctx.beginPath();
      ctx.ellipse(-w * 0.2, -2, 5, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(w * 0.2, -2, 5, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Classic Woven Wicker Basket
      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(1, '#92400e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 16, 16]);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Weave lines
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.6)';
      ctx.lineWidth = 1.5;
      for (let lx = -w * 0.35; lx <= w * 0.35; lx += 14) {
        ctx.beginPath();
        ctx.moveTo(lx - 4, -h / 2 + 4);
        ctx.lineTo(lx + 4, h / 2 - 4);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // --- HUD Updates ---
  function updateHUD() {
    scoreVal.textContent = score;
    coinsVal.textContent = coins + totalCoinsEarned;
    updateTimerHUD();
  }

  function updateTimerHUD() {
    const displaySec = Math.ceil(timeLeft);
    timerVal.textContent = displaySec;
    if (displaySec <= 10) {
      timerPill.classList.add('urgent');
    } else {
      timerPill.classList.remove('urgent');
    }
  }

  function updateComboBadge() {
    if (combo >= 2) {
      comboBadge.classList.remove('hidden');
      const mult = combo >= 25 ? 5 : (combo >= 15 ? 4 : (combo >= 10 ? 3 : 2));
      comboMultiplierText.textContent = `${mult}x`;
    } else {
      comboBadge.classList.add('hidden');
    }
  }

  // --- Shop & Skins ---
  function renderShop() {
    shopCoinsDisplay.textContent = `🪙 ${coins + totalCoinsEarned}`;
    skinsGrid.innerHTML = '';

    BASKET_SKINS.forEach((skin) => {
      const isOwned = unlockedSkins.includes(skin.id);
      const isActive = basket.skin === skin.id;

      const card = document.createElement('div');
      card.className = `skin-card ${isActive ? 'active' : ''}`;
      card.innerHTML = `
        <span class="skin-preview-icon">${skin.icon}</span>
        <span class="skin-name">${skin.name}</span>
        ${
          isOwned
            ? `<span class="skin-status-badge">${isActive ? 'Equipped' : 'Select'}</span>`
            : `<button class="skin-buy-btn" data-id="${skin.id}">🪙 ${skin.price}</button>`
        }
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('skin-buy-btn')) {
          buySkin(skin);
        } else if (isOwned) {
          basket.skin = skin.id;
          savePersistedData();
          renderShop();
          playSound('powerup');
        }
      });

      skinsGrid.appendChild(card);
    });
  }

  function buySkin(skin) {
    const currentTotalCoins = coins + totalCoinsEarned;
    if (currentTotalCoins >= skin.price) {
      coins = currentTotalCoins - skin.price;
      totalCoinsEarned = 0;
      unlockedSkins.push(skin.id);
      basket.skin = skin.id;
      savePersistedData();
      renderShop();
      updateHUD();
      playSound('fever');
    } else {
      alert(`Not enough coins! You need 🪙 ${skin.price - currentTotalCoins} more.`);
    }
  }

  // --- Input Handlers ---
  function setupInputListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
      if (e.code === 'Space') keys.dash = true;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') pauseGame();
        else if (gameState === 'PAUSED') resumeGame();
      }
      if (e.code === 'KeyM') toggleSound();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      if (e.code === 'Space') keys.dash = false;
    });

    // Mouse / Pointer move
    canvasContainer.addEventListener('pointermove', (e) => {
      if (gameState !== 'PLAYING') return;
      const rect = canvasContainer.getBoundingClientRect();
      basket.targetX = e.clientX - rect.left;
    });

    // Touch controls on screen (Fast & Responsive)
    btnTouchLeft.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      keys.left = true;
      basket.targetX -= 55; // Immediate impulse on tap
    });
    btnTouchLeft.addEventListener('pointerup', () => { keys.left = false; });
    btnTouchLeft.addEventListener('pointerleave', () => { keys.left = false; });
    btnTouchLeft.addEventListener('pointercancel', () => { keys.left = false; });

    btnTouchRight.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      keys.right = true;
      basket.targetX += 55; // Immediate impulse on tap
    });
    btnTouchRight.addEventListener('pointerup', () => { keys.right = false; });
    btnTouchRight.addEventListener('pointerleave', () => { keys.right = false; });
    btnTouchRight.addEventListener('pointercancel', () => { keys.right = false; });

    // Buttons
    btnStartGame.addEventListener('click', startGame);
    btnPlayAgain.addEventListener('click', startGame);
    btnPause.addEventListener('click', () => {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    });
    btnResumeGame.addEventListener('click', resumeGame);
    btnRestartFromPause.addEventListener('click', startGame);
    btnQuitToTitle.addEventListener('click', () => {
      gameState = 'START';
      pauseOverlay.classList.add('hidden');
      startOverlay.classList.remove('hidden');
    });

    btnToggleSound.addEventListener('click', toggleSound);

    // Shop modal
    btnOpenShop.addEventListener('click', () => { renderShop(); shopModal.classList.remove('hidden'); });
    btnShopFromOver.addEventListener('click', () => { renderShop(); shopModal.classList.remove('hidden'); });
    btnCloseShop.addEventListener('click', () => shopModal.classList.add('hidden'));

    // How to Play modal
    btnOpenHowToPlay.addEventListener('click', () => howToPlayModal.classList.remove('hidden'));
    btnCloseHowToPlay.addEventListener('click', () => howToPlayModal.classList.add('hidden'));
  }

  function toggleSound() {
    isMuted = !isMuted;
    btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  // Start initialization
  init();
})();
