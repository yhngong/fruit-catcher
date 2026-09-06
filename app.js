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
    { id: 'classic', name: 'Wicker Basket', icon: '🧺', price: 0, desc: 'Classic handwoven picnic basket' },
    { id: 'frog', name: 'Lil Froggy', icon: '🐸', price: 60, desc: 'Hoppy & happy pond pal' },
    { id: 'beach', name: 'Beach Bucket', icon: '🏖️', price: 90, desc: 'Sunny sandcastle pail with shovel' },
    { id: 'cat', name: 'Neko Catcher', icon: '🐱', price: 100, desc: 'Lucky calico kitty bowl with ears' },
    { id: 'coffee', name: 'Coffee Mug', icon: '☕', price: 110, desc: 'Warm turquoise mug with heart latte art' },
    { id: 'ghost', name: 'Lil Ghosty', icon: '👻', price: 120, desc: 'Friendly floating spectral sheet' },
    { id: 'cactus', name: 'Cactus Pot', icon: '🌵', price: 130, desc: 'Terracotta pot with blooming flower' },
    { id: 'mushroom', name: 'Mushroom Cap', icon: '🍄', price: 140, desc: 'Cute polka-dot red woodland toadstool' },
    { id: 'golden', name: 'Royal Gold Urn', icon: '🪙', price: 150, desc: 'Forged in solid 24k gold with ruby' },
    { id: 'penguin', name: 'Penguin Waddle', icon: '🐧', price: 160, desc: 'Tuxedo penguin with orange beak' },
    { id: 'fox', name: 'Fox Shrine', icon: '🦊', price: 180, desc: 'Kitsune fox bowl with Shinto bell' },
    { id: 'bear', name: 'Teddy Bear', icon: '🐻', price: 190, desc: 'Fuzzy chocolate bear with button eyes' },
    { id: 'pumpkin', name: 'Spooky Jack', icon: '🎃', price: 220, desc: 'Carved Halloween pumpkin with glow' },
    { id: 'avocado', name: 'Holy Guac', icon: '🥑', price: 240, desc: 'Ripe creamy avocado with glossy pit' },
    { id: 'pirate', name: 'Treasure Chest', icon: '🏴‍☠️', price: 250, desc: 'Heavy oak chest with brass fittings' },
    { id: 'donut', name: 'Donut Glaze', icon: '🍩', price: 260, desc: 'Golden dough with strawberry glaze' },
    { id: 'shark', name: 'Chompy Shark', icon: '🦈', price: 280, desc: 'Fierce cute blue shark with sharp teeth' },
    { id: 'sundae', name: 'Sundae Bowl', icon: '🍦', price: 300, desc: 'Waffle cone with strawberry & cherry' },
    { id: 'cyber', name: 'Cyber Hopper', icon: '🤖', price: 320, desc: 'Neon-infused mecha collector' },
    { id: 'burger', name: 'Burger Basket', icon: '🍔', price: 340, desc: 'Toasted brioche bun with cheese & patty' },
    { id: 'pizza', name: 'Pizza Slice', icon: '🍕', price: 360, desc: 'Cheesy pizza crust with pepperoni' },
    { id: 'bat', name: 'Night Bat', icon: '🦇', price: 380, desc: 'Gothic velvet bat with scalloped wings' },
    { id: 'rainbow', name: 'Rainbow Cloud', icon: '🌈', price: 400, desc: 'Fluffy cloud with rainbow stripes' },
    { id: 'taco', name: 'Crispy Taco', icon: '🌮', price: 420, desc: 'Crunchy corn shell with meat & salsa' },
    { id: 'arcade', name: 'Retro Arcade', icon: '👾', price: 450, desc: '8-bit CRT cabinet with joystick' },
    { id: 'lion', name: 'Lion Roar', icon: '🦁', price: 480, desc: 'Majestic golden lion with fluffy mane' },
    { id: 'sushi', name: 'Sushi Boat', icon: '🍣', price: 500, desc: 'Japanese wooden lacquer boat with nori' },
    { id: 'watermelon', name: 'Melon Bowl', icon: '🍉', price: 550, desc: 'Crisp, sweet giant watermelon' },
    { id: 'crystal', name: 'Crystal Prism', icon: '💎', price: 600, desc: 'Radiant sparkling diamond crystal' },
    { id: 'rocket', name: 'Rocket Booster', icon: '🚀', price: 650, desc: 'Retro space rocket with flame exhaust' },
    { id: 'ufo', name: 'Alien Saucer', icon: '🛸', price: 700, desc: 'Saucer with tractor beam & alien' },
    { id: 'viking', name: 'Viking Longboat', icon: '⚔️', price: 750, desc: 'Nordic warship with shields & dragon prow' },
    { id: 'thunder', name: 'Thunder Bolt', icon: '⚡', price: 800, desc: 'Electrified high-voltage battery' },
    { id: 'galaxy', name: 'Cosmic Nebula', icon: '🌌', price: 850, desc: 'Midnight nebula with stardust & ring' },
    { id: 'unicorn', name: 'Unicorn Dream', icon: '🦄', price: 950, desc: 'Pastel mane with golden spiral horn' },
    { id: 'panda', name: 'Panda Pouch', icon: '🐼', price: 1000, desc: 'Adorable panda face with ears' },
    { id: 'lava', name: 'Magma Cauldron', icon: '🌋', price: 1200, desc: 'Cracked basalt with bubbling lava' },
    { id: 'dragon', name: 'Dragon Hoard', icon: '🐉', price: 1500, desc: 'Crimson beast with golden horns' },
    { id: 'diamond', name: 'Diamond Throne', icon: '👑', price: 1800, desc: 'Apex royal platinum & sapphire throne' },
    { id: 'blackhole', name: 'Black Hole', icon: '🕳️', price: 2000, desc: 'Singularity with glowing accretion disk' },
    { id: 'phoenix', name: 'Phoenix Flame', icon: '🔥', price: 2500, desc: 'Immortal firebird blazing with radiant embers' },
    { id: 'green', name: 'Green', icon: '🟢', price: 10000, desc: 'The legendary apex final skin radiant in emerald' }
  ];

  // --- State Variables ---
  let gameState = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  let gameMode = 'NORMAL'; // 'NORMAL' | 'HARD'
  let score = 0;
  let highScore = 0;
  let highScoreNormal = 0;
  let highScoreHard = 0;
  let coins = 0;
  let totalCoinsEarned = 0;
  let coinProgress = 0; // 10 progress points = 1 coin (10x harder)
  let fruitsCaught = 0;
  const GAME_DURATION = 150; // 2 minutes 30 seconds
  let timeLeft = 150;
  let lastTickSec = 150;
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
  let itemsSinceLastBomb = 5;
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
  const hardModeBadge = document.getElementById('hardModeBadge');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const btnPause = document.getElementById('btnPause');

  const powerupBar = document.getElementById('powerupBar');
  const badgeMagnet = document.getElementById('badgeMagnet');
  const badgeSlow = document.getElementById('badgeSlow');
  const badgeShield = document.getElementById('badgeShield');
  const comboBadge = document.getElementById('comboBadge');
  const comboMultiplierText = document.getElementById('comboMultiplierText');

  // Overlays & Mode Selectors
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const btnStartGame = document.getElementById('btnStartGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnRestartFromPause = document.getElementById('btnRestartFromPause');
  const btnQuitToTitle = document.getElementById('btnQuitToTitle');
  const btnPlayAgain = document.getElementById('btnPlayAgain');

  const btnModeNormal = document.getElementById('btnModeNormal');
  const btnModeHard = document.getElementById('btnModeHard');
  const btnOverModeNormal = document.getElementById('btnOverModeNormal');
  const btnOverModeHard = document.getElementById('btnOverModeHard');

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
  const mobileControls = document.getElementById('mobileControls');

  // --- Storage & Initialization ---
  function loadPersistedData() {
    try {
      const savedHigh = localStorage.getItem('fruit_catcher_high');
      if (savedHigh) highScoreNormal = parseInt(savedHigh, 10) || 0;
      highScore = highScoreNormal;

      const savedHighHard = localStorage.getItem('fruit_catcher_high_hard');
      if (savedHighHard) highScoreHard = parseInt(savedHighHard, 10) || 0;

      const savedMode = localStorage.getItem('fruit_catcher_mode');
      if (savedMode === 'HARD' || savedMode === 'NORMAL') gameMode = savedMode;

      const savedCoins = localStorage.getItem('fruit_catcher_coins');
      if (savedCoins) coins = parseInt(savedCoins, 10) || 0;

      const savedSkins = localStorage.getItem('fruit_catcher_skins');
      if (savedSkins) unlockedSkins = JSON.parse(savedSkins);

      const activeSkin = localStorage.getItem('fruit_catcher_active_skin');
      if (activeSkin && unlockedSkins.includes(activeSkin)) {
        basket.skin = activeSkin;
      }
    } catch (e) {}

    coinsVal.textContent = coins;
    updateModeUI();
  }

  function savePersistedData() {
    try {
      localStorage.setItem('fruit_catcher_high', highScoreNormal);
      localStorage.setItem('fruit_catcher_high_hard', highScoreHard);
      localStorage.setItem('fruit_catcher_mode', gameMode);
      localStorage.setItem('fruit_catcher_coins', coins);
      localStorage.setItem('fruit_catcher_skins', JSON.stringify(unlockedSkins));
      localStorage.setItem('fruit_catcher_active_skin', basket.skin);
    } catch (e) {}
  }

  function setGameMode(mode) {
    if (gameMode === mode) return;
    gameMode = mode;
    savePersistedData();
    updateModeUI();
    playSound('powerup');
  }

  function updateModeUI() {
    const isHard = gameMode === 'HARD';

    if (btnModeNormal) {
      btnModeNormal.classList.toggle('active', !isHard);
    }
    if (btnModeHard) {
      btnModeHard.classList.toggle('active', isHard);
      btnModeHard.classList.toggle('hard', isHard);
    }
    if (btnOverModeNormal) {
      btnOverModeNormal.classList.toggle('active', !isHard);
    }
    if (btnOverModeHard) {
      btnOverModeHard.classList.toggle('active', isHard);
      btnOverModeHard.classList.toggle('hard', isHard);
    }

    if (btnStartGame) {
      btnStartGame.classList.toggle('hard-mode-btn', isHard);
      btnStartGame.textContent = isHard ? 'PLAY HARD MODE (2m 30s) 🔥' : 'PLAY NOW (2m 30s)';
    }
    if (btnPlayAgain) {
      btnPlayAgain.classList.toggle('hard-mode-btn', isHard);
      btnPlayAgain.textContent = isHard ? 'PLAY AGAIN (HARD) 🔥' : 'PLAY AGAIN';
    }

    const currentHigh = isHard ? highScoreHard : highScoreNormal;
    if (highScoreVal) highScoreVal.textContent = currentHigh;
    if (hardModeBadge) {
      if (isHard && gameState === 'PLAYING') {
        hardModeBadge.classList.remove('hidden');
      } else {
        hardModeBadge.classList.add('hidden');
      }
    }
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
    lastTickSec = GAME_DURATION;
    combo = 0;
    maxCombo = 0;
    feverMeter = 0;
    feverActive = false;
    feverTimer = 0;
    // 5-second initial cooldown before fever bar can start accumulating points
    feverCooldownTimer = 5;
    feverMeterFill.style.width = '0%';
    feverLabel.textContent = 'COOLDOWN 5s';
    feverMeterFill.style.background = 'linear-gradient(90deg, #94a3b8, #64748b)';
    if (feverMeterWrapper) feverMeterWrapper.classList.add('cooldown');
    magnetTimer = 0;
    slowTimer = 0;
    hasShield = false;
    itemsSinceLastBomb = 5;

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
    if (hardModeBadge) {
      if (gameMode === 'HARD') hardModeBadge.classList.remove('hidden');
      else hardModeBadge.classList.add('hidden');
    }
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

    let isNewRecord = false;
    if (gameMode === 'HARD') {
      if (score > highScoreHard) {
        highScoreHard = score;
        isNewRecord = true;
      }
      finalHighScoreVal.textContent = highScoreHard;
    } else {
      if (score > highScoreNormal) {
        highScoreNormal = score;
        highScore = score;
        isNewRecord = true;
      }
      finalHighScoreVal.textContent = highScoreNormal;
    }

    if (isNewRecord) {
      newHighBanner.textContent = gameMode === 'HARD' ? '🔥 NEW HARD MODE RECORD! 🔥' : '🎉 NEW HIGH SCORE! 🎉';
      newHighBanner.classList.remove('hidden');
    } else {
      newHighBanner.classList.add('hidden');
    }

    coins += totalCoinsEarned;
    savePersistedData();
    updateModeUI();

    finalScoreVal.textContent = score;
    finalFruitsVal.textContent = fruitsCaught;
    if (gameMode === 'HARD') {
      const baseCoins = Math.floor(totalCoinsEarned / 2);
      finalCoinsVal.innerHTML = `🪙 +${totalCoinsEarned} <span style="display:block;font-size:0.75rem;color:#facc15;font-weight:700;margin-top:2px;">(${baseCoins} × 2 Hard Mode)</span>`;
    } else {
      finalCoinsVal.textContent = `🪙 +${totalCoinsEarned}`;
    }

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
        feverMeterFill.style.background = 'linear-gradient(90deg, #94a3b8, #64748b)';
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

    // 3. Spawning Falling Items (Smooth, balanced pacing over 2m 30s)
    spawnCooldown -= dt;
    const timeElapsed = GAME_DURATION - timeLeft;
    const baseSpawnRate = feverActive ? 0.20 : Math.max(0.42, 0.78 - (timeElapsed / GAME_DURATION) * 0.30);
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
      if (feverActive && gameMode !== 'HARD') {
        // Invulnerable in fever mode (Normal mode only!)
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

      // Bomb explosion hit (Time penalty only - no point loss)
      timeLeft = Math.max(0, timeLeft - 3);
      combo = 0;
      updateComboBadge();
      updateTimerHUD();
      updateHUD();
      screenShake = 18;
      playSound('bomb');
      createJuiceParticles(item.x, item.y, '#334155', 25);
      addFloatingText(item.x, item.y, (feverActive && gameMode === 'HARD') ? 'FEVER HIT! -3s 💣' : 'BOMB! -3s 💣', '#ef4444');

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

    // Coins: in Hard Mode, coin awards are DOUBLED (2x Coins!)
    coinProgress += item.coins;
    if (coinProgress >= 10) {
      const baseCoins = Math.floor(coinProgress / 10);
      coinProgress %= 10;
      const earnedCoins = (gameMode === 'HARD') ? baseCoins * 2 : baseCoins;
      totalCoinsEarned += earnedCoins;
      const coinText = (gameMode === 'HARD') ? `+${earnedCoins} 🪙 (2x!)` : `+${earnedCoins} 🪙`;
      addFloatingText(basket.x + (Math.random() - 0.5) * 20, basket.y - 30, coinText, '#facc15', 1.3);
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
    } else if (feverCooldownTimer > 0 && item.type !== 'bomb') {
      addFloatingText(item.x, item.y - 25, '⏳ Cooldown', '#38bdf8', 0.95);
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
    const isHard = gameMode === 'HARD';
    feverLabel.textContent = isHard ? '⚠️ HARD FEVER (DANGER!) ⚠️' : '🌟 FEVER TIME 🌟';
    feverMeterFill.style.background = isHard
      ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
      : 'linear-gradient(90deg, #facc15, #ec4899)';
    playSound('fever');
    const feverText = isHard
      ? '🔥 FEVER TIME! 2X PTS (WATCH BOMBS!) 🔥'
      : '🔥 FEVER TIME! 2X POINTS 🔥';
    addFloatingText(basket.x, basket.y - 40, feverText, '#fde047', 1.6);
  }

  function spawnItem(width) {
    const roll = Math.random();
    let type = 'apple';

    if (feverActive) {
      if (gameMode === 'HARD') {
        // In Hard Mode, bombs continue to drop during fever and fever does NOT protect!
        const feverBombChance = 0.20;
        if (roll < feverBombChance && itemsSinceLastBomb >= 1) {
          type = 'bomb';
          itemsSinceLastBomb = 0;
        } else {
          itemsSinceLastBomb++;
          const subRoll = (roll - feverBombChance) / (1 - feverBombChance);
          type = subRoll < 0.65 ? 'golden' : (subRoll < 0.85 ? 'watermelon' : 'pineapple');
        }
      } else {
        // Normal Mode: Safe golden fruit rain
        type = roll < 0.65 ? 'golden' : (roll < 0.85 ? 'watermelon' : 'pineapple');
        itemsSinceLastBomb++;
      }
    } else {
      const isHard = gameMode === 'HARD';
      const timeElapsed = GAME_DURATION - timeLeft;

      // In Hard Mode: DOUBLE BOMBS!
      // Normal: 8% base scaling to max 13%
      // Hard: 16% base scaling to max 26% (double frequency!)
      const baseBombChance = isHard ? 0.16 : 0.08;
      const maxBombChance = isHard ? 0.26 : 0.13;
      const scaleRate = isHard ? 0.10 : 0.05;
      const bombChance = Math.min(maxBombChance, baseBombChance + (timeElapsed / GAME_DURATION) * scaleRate);

      // In Normal mode require at least 2 non-bomb items between bombs; in Hard mode require at least 1
      const minSpacing = isHard ? 1 : 2;

      if (roll < bombChance && itemsSinceLastBomb >= minSpacing) {
        type = 'bomb';
        itemsSinceLastBomb = 0;
      } else {
        itemsSinceLastBomb++;
        const subRoll = (roll - bombChance) / (1 - bombChance);
        if (subRoll < 0.04) type = 'power_magnet';
        else if (subRoll < 0.08) type = 'power_slow';
        else if (subRoll < 0.12) type = 'power_shield';
        else if (subRoll < 0.18) type = 'golden';
        else if (subRoll < 0.36) type = 'apple';
        else if (subRoll < 0.52) type = 'orange';
        else if (subRoll < 0.68) type = 'banana';
        else if (subRoll < 0.82) type = 'strawberry';
        else if (subRoll < 0.92) type = 'watermelon';
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

    // In Hard Mode: 35% chance to drop a second bomb simultaneously (tandem double bombs!)
    if (type === 'bomb' && gameMode === 'HARD' && Math.random() < 0.35) {
      const bombInfo = FRUIT_TYPES['bomb'];
      const x2 = (x > width / 2)
        ? margin + Math.random() * (width * 0.4)
        : (width * 0.55) + Math.random() * (width * 0.45 - margin);

      fallingItems.push({
        x: x2,
        y: -bombInfo.radius - 15 - Math.random() * 15,
        radius: bombInfo.radius,
        vy: 160 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 30,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4,
        type: 'bomb',
        emoji: bombInfo.emoji,
        color: bombInfo.color,
        points: bombInfo.points,
        coins: bombInfo.coins,
        isPowerup: false
      });
    }
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

      // Handles on left and right
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(-w * 0.5 - 2, 0, 7, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(w * 0.5 + 2, 0, 7, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();

      // Royal red ruby gem in center
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

    } else if (skin === 'frog') {
      // Lil Froggy
      const frogGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      frogGrad.addColorStop(0, '#4ade80');
      frogGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = frogGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [12, 12, 18, 18]);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lighter belly
      ctx.fillStyle = '#bbf7d0';
      ctx.beginPath();
      ctx.ellipse(0, 4, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Frog Eyes popping above rim
      [-w * 0.28, w * 0.28].forEach((eyeX) => {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(eyeX, -h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, -h / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(eyeX, -h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX - 1, -h / 2 - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rosy blush cheeks
      ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
      ctx.beginPath();
      ctx.arc(-w * 0.36, 2, 5, 0, Math.PI * 2);
      ctx.arc(w * 0.36, 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();

    } else if (skin === 'cat') {
      // Neko Catcher
      ctx.fillStyle = '#fffdfa';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Left pointy cat ear (ginger patch)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, -h / 2);
      ctx.lineTo(-w * 0.32, -h / 2 - 14);
      ctx.lineTo(-w * 0.20, -h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, -h / 2);
      ctx.lineTo(-w * 0.32, -h / 2 - 10);
      ctx.lineTo(-w * 0.25, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Right pointy cat ear (slate patch)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(w * 0.20, -h / 2);
      ctx.lineTo(w * 0.32, -h / 2 - 14);
      ctx.lineTo(w * 0.42, -h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(w * 0.25, -h / 2);
      ctx.lineTo(w * 0.32, -h / 2 - 10);
      ctx.lineTo(w * 0.38, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Pink nose
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(-3, -6);
      ctx.lineTo(3, -6);
      ctx.closePath();
      ctx.fill();

      // Whiskers
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(dir * 10, -4);
        ctx.lineTo(dir * 28, -8);
        ctx.moveTo(dir * 10, -1);
        ctx.lineTo(dir * 28, 1);
        ctx.stroke();
      });

      // Cheerful eyes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-w * 0.2, -6, 5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(w * 0.2, -6, 5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

    } else if (skin === 'pirate') {
      // Treasure Chest
      const woodGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      woodGrad.addColorStop(0, '#78350f');
      woodGrad.addColorStop(0.5, '#592507');
      woodGrad.addColorStop(1, '#3b1704');
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [4, 4, 10, 10]);
      ctx.fill();

      // Wood plank lines
      ctx.strokeStyle = '#291102';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -2);
      ctx.lineTo(w / 2, -2);
      ctx.stroke();

      // Brass Corner and Rim Brackets
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-w / 2, -h / 2, 10, h);
      ctx.fillRect(w / 2 - 10, -h / 2, 10, h);
      ctx.fillRect(-w / 2, -h / 2, w, 6);

      // Golden center lock latch
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(-8, -6, 16, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
      ctx.rect(-1.5, -1, 3, 5);
      ctx.fill();

      // Rivet details
      ctx.fillStyle = '#713f12';
      [-w / 2 + 5, w / 2 - 5].forEach((rx) => {
        [-h / 2 + 10, h / 2 - 8].forEach((ry) => {
          ctx.beginPath();
          ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });

    } else if (skin === 'cyber') {
      // Cyber Neon Mecha
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();

      // Cyan neon edge glow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // High-tech red/magenta center sensor strip
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillRect(-w * 0.32, -3, w * 0.64, 6);

      // Cyan circuit dots
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 4;
      [-w * 0.38, w * 0.38].forEach((cx) => {
        ctx.fillRect(cx - 3, -h / 2 + 5, 6, 6);
      });
      ctx.shadowBlur = 0;

    } else if (skin === 'rainbow') {
      // Rainbow Cloud
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-w * 0.32, 4, 16, 0, Math.PI * 2);
      ctx.arc(-w * 0.11, -2, 19, 0, Math.PI * 2);
      ctx.arc(w * 0.11, -2, 19, 0, Math.PI * 2);
      ctx.arc(w * 0.32, 4, 16, 0, Math.PI * 2);
      ctx.roundRect(-w / 2, 0, w, h / 2, [0, 0, 14, 14]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Rainbow arc rim stripes across the top
      const rainbowColors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
      const stripeHeight = 2.5;
      rainbowColors.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.fillRect(-w * 0.44 + idx * 2, -h / 2 + idx * stripeHeight, w * 0.88 - idx * 4, stripeHeight);
      });

      // Cute blush cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.6)';
      ctx.beginPath();
      ctx.arc(-w * 0.22, 6, 4, 0, Math.PI * 2);
      ctx.arc(w * 0.22, 6, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'watermelon') {
      // Watermelon rind & juicy interior
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w / 2, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 3;
      ctx.stroke();

      // White rind band
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w * 0.45, 0, Math.PI);
      ctx.fill();

      // Red sweet melon meat
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w * 0.40, 0, Math.PI);
      ctx.fill();

      // Black seeds
      ctx.fillStyle = '#0f172a';
      [[-16, 2], [0, 6], [16, 2], [-8, 11], [8, 11]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.ellipse(sx, sy, 1.8, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (skin === 'ufo') {
      // Alien Saucer
      // Tractor beam glow underneath
      ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.25, h / 2);
      ctx.lineTo(-w * 0.45, h / 2 + 14);
      ctx.lineTo(w * 0.45, h / 2 + 14);
      ctx.lineTo(w * 0.25, h / 2);
      ctx.closePath();
      ctx.fill();

      // Metallic saucer hull
      const ufoGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      ufoGrad.addColorStop(0, '#94a3b8');
      ufoGrad.addColorStop(0.5, '#e2e8f0');
      ufoGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = ufoGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, w / 2, h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Translucent green glass cockpit dome
      ctx.fillStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -2, w * 0.24, Math.PI, 0);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Little green alien head inside dome
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, -6, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(-2.5, -7, 2, 3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(2.5, -7, 2, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Blinking saucer rim lights
      const lightColors = ['#ef4444', '#facc15', '#06b6d4', '#a855f7'];
      [-w * 0.35, -w * 0.12, w * 0.12, w * 0.35].forEach((lx, i) => {
        ctx.fillStyle = lightColors[i % lightColors.length];
        ctx.beginPath();
        ctx.arc(lx, 3, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (skin === 'galaxy') {
      // Cosmic Nebula
      const cosmicGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      cosmicGrad.addColorStop(0, '#0f172a');
      cosmicGrad.addColorStop(0.35, '#581c87');
      cosmicGrad.addColorStop(0.7, '#be185d');
      cosmicGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cosmicGrad;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [8, 8, 16, 16]);
      ctx.fill();

      // Glowing cosmic rim
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Saturn-like nebula ring angled across basket
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.42, 8, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Twinkling stars
      [[-w * 0.28, -5], [w * 0.24, -8], [-w * 0.1, 7], [w * 0.15, 6], [-w * 0.35, 8]].forEach(([sx, sy]) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, 2, 2);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx + 0.5, sy - 1.5, 1, 4);
        ctx.fillRect(sx - 1.5, sy + 0.5, 4, 1);
      });

    } else if (skin === 'panda') {
      // Cute Panda basket
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 14);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Black Ears
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-w * 0.35, -h * 0.5, 9, 0, Math.PI * 2);
      ctx.arc(w * 0.35, -h * 0.5, 9, 0, Math.PI * 2);
      ctx.fill();

      // Eye patches
      ctx.beginPath();
      ctx.ellipse(-w * 0.2, -2, 6, 8, -0.25, 0, Math.PI * 2);
      ctx.ellipse(w * 0.2, -2, 6, 8, 0.25, 0, Math.PI * 2);
      ctx.fill();

      // White eye sparkles
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-w * 0.2 - 1, -4, 2, 0, Math.PI * 2);
      ctx.arc(w * 0.2 - 1, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Black nose
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'lava') {
      // Magma Cauldron
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [4, 4, 16, 16]);
      ctx.fill();

      // Glowing lava rim & surface
      const lavaGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      lavaGrad.addColorStop(0, '#ea580c');
      lavaGrad.addColorStop(0.5, '#facc15');
      lavaGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = lavaGrad;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-w * 0.44, -h / 2 + 2, w * 0.88, 10, 4);
      ctx.fill();

      // Lava crack veins
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, 0);
      ctx.lineTo(-w * 0.15, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(w * 0.2, 12);
      ctx.stroke();

      // Bubbles
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-w * 0.2, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(w * 0.18, -1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (skin === 'dragon') {
      // Dragon Hoard
      const dragonGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      dragonGrad.addColorStop(0, '#991b1b');
      dragonGrad.addColorStop(0.7, '#450a0a');
      dragonGrad.addColorStop(1, '#180202');
      ctx.fillStyle = dragonGrad;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [8, 8, 16, 16]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Golden dragon scales trim
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sweeping Golden Horns on both sides
      ctx.fillStyle = '#f59e0b';
      // Left horn
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, -h / 2);
      ctx.quadraticCurveTo(-w * 0.58, -h * 0.85, -w * 0.46, -h * 0.95);
      ctx.quadraticCurveTo(-w * 0.48, -h * 0.6, -w * 0.32, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Right horn
      ctx.beginPath();
      ctx.moveTo(w * 0.42, -h / 2);
      ctx.quadraticCurveTo(w * 0.58, -h * 0.85, w * 0.46, -h * 0.95);
      ctx.quadraticCurveTo(w * 0.48, -h * 0.6, w * 0.32, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Fiery Dragon Eye in center
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Slit pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (skin === 'ghost') {
      // Lil Ghosty
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(147, 197, 253, 0.45)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h * 0.75, [14, 14, 0, 0]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wavy ruffled bottom hem
      ctx.fillStyle = '#f8fafc';
      const waveCount = 5;
      const waveWidth = w / waveCount;
      for (let i = 0; i < waveCount; i++) {
        const startX = -w / 2 + i * waveWidth;
        ctx.beginPath();
        ctx.arc(startX + waveWidth / 2, -h / 2 + h * 0.75, waveWidth / 2, 0, Math.PI);
        ctx.fill();
      }

      // Cute big ghost eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-w * 0.18, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(w * 0.18, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-w * 0.18 - 1, -5.5, 1.5, 0, Math.PI * 2);
      ctx.arc(w * 0.18 - 1, -5.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Rosy blush cheeks
      ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
      ctx.beginPath();
      ctx.arc(-w * 0.32, 2, 4.5, 0, Math.PI * 2);
      ctx.arc(w * 0.32, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'mushroom') {
      // Mushroom Cap
      // Beige stalk base
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(-w * 0.3, 0, w * 0.6, h / 2, [0, 0, 10, 10]);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Big red toadstool dome cap
      const shroomGrad = ctx.createLinearGradient(0, -h / 2, 0, 4);
      shroomGrad.addColorStop(0, '#f87171');
      shroomGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = shroomGrad;
      ctx.beginPath();
      ctx.arc(0, 4, w / 2, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bold white polka dots
      ctx.fillStyle = '#ffffff';
      [[-w * 0.3, -h * 0.25, 6], [0, -h * 0.4, 7.5], [w * 0.3, -h * 0.25, 6], [-w * 0.15, -h * 0.1, 4.5], [w * 0.15, -h * 0.1, 4.5]].forEach(([dx, dy, dr]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cute eyes on stalk
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(8, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'fox') {
      // Fox Shrine
      const foxGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      foxGrad.addColorStop(0, '#fb923c');
      foxGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = foxGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fox Ears with black tips
      [-1, 1].forEach((dir) => {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(dir * w * 0.42, -h / 2);
        ctx.lineTo(dir * w * 0.32, -h / 2 - 15);
        ctx.lineTo(dir * w * 0.18, -h / 2);
        ctx.closePath();
        ctx.fill();

        // Black ear tip
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(dir * w * 0.36, -h / 2 - 9);
        ctx.lineTo(dir * w * 0.32, -h / 2 - 15);
        ctx.lineTo(dir * w * 0.25, -h / 2 - 9);
        ctx.closePath();
        ctx.fill();

        // White ear fluff
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(dir * w * 0.30, -h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // White cheeks / muzzle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-w * 0.22, 4, 12, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.22, 4, 12, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 4, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black button nose
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sleek fox eyes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, -4);
      ctx.quadraticCurveTo(-w * 0.16, -7, -w * 0.10, -3);
      ctx.moveTo(w * 0.24, -4);
      ctx.quadraticCurveTo(w * 0.16, -7, w * 0.10, -3);
      ctx.stroke();

      // Shinto red rope & golden bell
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h / 2 - 2);
      ctx.lineTo(w * 0.2, h / 2 - 2);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, h / 2 - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1;
      ctx.stroke();

    } else if (skin === 'pumpkin') {
      // Spooky Jack
      const pumpGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      pumpGrad.addColorStop(0, '#f97316');
      pumpGrad.addColorStop(1, '#c2410c');
      ctx.fillStyle = pumpGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [12, 12, 18, 18]);
      ctx.fill();

      // Pumpkin vertical lobe ridges
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5;
      [-w * 0.25, 0, w * 0.25].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(rx, -h / 2);
        ctx.quadraticCurveTo(rx * 1.2, 0, rx, h / 2);
        ctx.stroke();
      });

      // Twisted green stem handle
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(-5, -h / 2 - 8, 10, 10, 3);
      ctx.fill();

      // Glowing yellow carved eyes & toothy mouth
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      // Eyes
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, -6);
      ctx.lineTo(-w * 0.14, -6);
      ctx.lineTo(-w * 0.18, -12);
      ctx.closePath();
      ctx.moveTo(w * 0.22, -6);
      ctx.lineTo(w * 0.14, -6);
      ctx.lineTo(w * 0.18, -12);
      ctx.closePath();
      ctx.fill();

      // Jagged grinning mouth
      ctx.beginPath();
      ctx.moveTo(-w * 0.25, 4);
      ctx.lineTo(-w * 0.15, 10);
      ctx.lineTo(-w * 0.05, 4);
      ctx.lineTo(0, 9);
      ctx.lineTo(w * 0.05, 4);
      ctx.lineTo(w * 0.15, 10);
      ctx.lineTo(w * 0.25, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

    } else if (skin === 'sundae') {
      // Sundae Bowl
      const waffleGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      waffleGrad.addColorStop(0, '#fde68a');
      waffleGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = waffleGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 16, 16]);
      ctx.fill();

      // Waffle cross-hatch lines
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      for (let lx = -w / 2; lx <= w / 2; lx += 12) {
        ctx.beginPath();
        ctx.moveTo(lx, -h / 2);
        ctx.lineTo(lx + 10, h / 2);
        ctx.moveTo(lx + 10, -h / 2);
        ctx.lineTo(lx, h / 2);
        ctx.stroke();
      }

      // Drippy strawberry frosting
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, 8, [6, 6, 0, 0]);
      ctx.fill();
      [-w * 0.35, -w * 0.15, w * 0.1, w * 0.32].forEach((dx) => {
        ctx.beginPath();
        ctx.arc(dx, -h / 2 + 8, 4, 0, Math.PI);
        ctx.fill();
      });

      // Sprinkles
      const sprinkleCols = ['#38bdf8', '#facc15', '#4ade80', '#ffffff'];
      [[-w * 0.3, -h / 2 + 3], [-w * 0.1, -h / 2 + 4], [w * 0.05, -h / 2 + 2], [w * 0.25, -h / 2 + 4]].forEach(([sx, sy], i) => {
        ctx.fillStyle = sprinkleCols[i % sprinkleCols.length];
        ctx.fillRect(sx, sy, 3, 2);
      });

      // Cherry on top
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -h / 2 - 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 - 10);
      ctx.quadraticCurveTo(4, -h / 2 - 16, 8, -h / 2 - 14);
      ctx.stroke();

    } else if (skin === 'pizza') {
      // Pizza Slice
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 16, 16]);
      ctx.fill();

      // Cheesy melted surface
      const cheeseGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      cheeseGrad.addColorStop(0, '#fef08a');
      cheeseGrad.addColorStop(1, '#facc15');
      ctx.fillStyle = cheeseGrad;
      ctx.beginPath();
      ctx.roundRect(-w * 0.45, -h / 2 + 4, w * 0.9, h - 8, 8);
      ctx.fill();

      // Pepperoni slices
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      [[-w * 0.25, 0], [0, 4], [w * 0.25, -1]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(px - 2, py - 2, 1.5, 1.5);
        ctx.fillRect(px + 2, py + 1, 1.5, 1.5);
        ctx.fillStyle = '#b91c1c';
      });

      // Basil oregano specks
      ctx.fillStyle = '#15803d';
      [[-w * 0.12, -2], [w * 0.12, 6], [-w * 0.35, 6], [w * 0.35, 5]].forEach(([gx, gy]) => {
        ctx.fillRect(gx, gy, 2.5, 2.5);
      });

    } else if (skin === 'arcade') {
      // Retro Arcade Cabinet
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // CRT screen glowing frame
      ctx.fillStyle = '#022c22';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(-w * 0.38, -h / 2 + 3, w * 0.76, h - 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 8-bit Invader
      ctx.fillStyle = '#4ade80';
      const ix = 0;
      const iy = -4;
      ctx.fillRect(ix - 6, iy - 4, 12, 2);
      ctx.fillRect(ix - 8, iy - 2, 16, 4);
      ctx.fillRect(ix - 4, iy + 2, 8, 2);
      ctx.fillRect(ix - 8, iy + 4, 4, 2);
      ctx.fillRect(ix + 4, iy + 4, 4, 2);

      // Arcade controls
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-w * 0.25, h / 2 - 5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.20, h / 2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(w * 0.28, h / 2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'sushi') {
      // Sushi Boat
      const boatGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      boatGrad.addColorStop(0, '#d97706');
      boatGrad.addColorStop(0.5, '#fde68a');
      boatGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = boatGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w * 0.42, h / 2);
      ctx.lineTo(-w * 0.42, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nori seaweed wrap band
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(-8, -h / 2, 16, h);

      // Salmon nigiri slice
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.roundRect(-w * 0.36, -h / 2 + 2, 22, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.32, -h / 2 + 2);
      ctx.lineTo(-w * 0.32 + 5, -h / 2 + 12);
      ctx.moveTo(-w * 0.24, -h / 2 + 2);
      ctx.lineTo(-w * 0.24 + 5, -h / 2 + 12);
      ctx.stroke();

      // Tamago egg slice
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(w * 0.12, -h / 2 + 2, 20, 10, 3);
      ctx.fill();

    } else if (skin === 'crystal') {
      // Crystal Prism
      const crystalGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      crystalGrad.addColorStop(0, '#e0f2fe');
      crystalGrad.addColorStop(0.35, '#38bdf8');
      crystalGrad.addColorStop(0.7, '#0284c7');
      crystalGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = crystalGrad;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(-w * 0.35, -h / 2 + 6);
      ctx.lineTo(0, -h / 2);
      ctx.lineTo(w * 0.35, -h / 2 + 6);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w * 0.35, h / 2);
      ctx.lineTo(-w * 0.35, h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -h / 2 + 6);
      ctx.lineTo(0, h / 2);
      ctx.lineTo(w * 0.35, -h / 2 + 6);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-w * 0.18, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'thunder') {
      // Thunder Bolt
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Giant electric lightning bolt
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-4, -h / 2 + 4);
      ctx.lineTo(12, -h / 2 + 4);
      ctx.lineTo(2, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(-10, h / 2 - 4);
      ctx.lineTo(-2, -2);
      ctx.lineTo(-12, -2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-w / 2 - 3, -h / 4, 3, h / 2);
      ctx.fillRect(w / 2, -h / 4, 3, h / 2);

    } else if (skin === 'unicorn') {
      // Unicorn Dream
      const uniGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      uniGrad.addColorStop(0, '#fdf2f8');
      uniGrad.addColorStop(1, '#fce7f3');
      ctx.fillStyle = uniGrad;
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [12, 12, 18, 18]);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Golden spiral horn
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-5, -h / 2);
      ctx.lineTo(0, -h / 2 - 18);
      ctx.lineTo(5, -h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pastel flowing mane
      const maneColors = ['#f472b6', '#38bdf8', '#c084fc'];
      maneColors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-w * 0.32 + i * 4, -h / 2 + 6, 8, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
      });

      // Golden star on cheek
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.26, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'diamond') {
      // Diamond Throne
      const platGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      platGrad.addColorStop(0, '#cbd5e1');
      platGrad.addColorStop(0.5, '#ffffff');
      platGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = platGrad;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 16, 16]);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Royal sapphire cushion
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(-w * 0.42, -h / 2 + 5, w * 0.84, h - 10, 4);
      ctx.fill();

      // Sparkling diamond crown emblem
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(-14, -5);
      ctx.lineTo(-6, -1);
      ctx.lineTo(0, -7);
      ctx.lineTo(6, -1);
      ctx.lineTo(14, -5);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, -7, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'beach') {
      // Beach Bucket
      const pailGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      pailGrad.addColorStop(0, '#facc15');
      pailGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = pailGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w * 0.38, h / 2);
      ctx.lineTo(-w * 0.38, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arched blue handle
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -h / 2, w * 0.44, Math.PI, 0);
      ctx.stroke();

      // Blue toy spade shovel
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(w * 0.22, -h / 2 - 14, 4, 18);
      ctx.beginPath();
      ctx.arc(w * 0.22 + 2, -h / 2 - 14, 4, 0, Math.PI * 2);
      ctx.fill();

      // White seashell
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();

    } else if (skin === 'coffee') {
      // Coffee Mug
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w * 0.82, h, [6, 6, 12, 12]);
      ctx.fill();
      ctx.strokeStyle = '#164e63';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mug Handle
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w * 0.38, 0, 8, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();

      // Coffee surface
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(-w * 0.08, -h / 2 + 5, w * 0.35, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cream latte heart
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(-w * 0.12, -h / 2 + 5, 2.5, 0, Math.PI * 2);
      ctx.arc(-w * 0.04, -h / 2 + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Steam wisps
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      [-w * 0.15, 0].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(sx, -h / 2);
        ctx.quadraticCurveTo(sx + 4, -h / 2 - 6, sx, -h / 2 - 12);
        ctx.stroke();
      });

    } else if (skin === 'cactus') {
      // Cactus Pot
      const potGrad = ctx.createLinearGradient(0, 0, 0, h / 2);
      potGrad.addColorStop(0, '#ea580c');
      potGrad.addColorStop(1, '#9a3412');
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.roundRect(-w * 0.42, 0, w * 0.84, h / 2, [0, 0, 8, 8]);
      ctx.fill();
      ctx.fillRect(-w * 0.46, -2, w * 0.92, 5);

      // Green Saguaro Cactus Body
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.roundRect(-w * 0.22, -h / 2, w * 0.44, h * 0.65, 8);
      ctx.fill();

      // Cactus arms
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.roundRect(dir * w * 0.32, -h * 0.35, 8, 12, 3);
        ctx.fillRect(dir * w * 0.20, -h * 0.15, dir * 14, 5);
        ctx.fill();
      });

      // Needle thorns
      ctx.fillStyle = '#fef08a';
      [-w * 0.1, 0, w * 0.1].forEach((nx) => {
        [-h * 0.3, -h * 0.1].forEach((ny) => {
          ctx.fillRect(nx, ny, 1.5, 1.5);
        });
      });

      // Hot pink blooming desert flower
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -h / 2 - 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -h / 2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'penguin') {
      // Penguin Waddle
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();

      // White belly
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 4, w * 0.28, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Beady eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-w * 0.14, -6, 4, 0, Math.PI * 2);
      ctx.arc(w * 0.14, -6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-w * 0.14, -6, 2, 0, Math.PI * 2);
      ctx.arc(w * 0.14, -6, 2, 0, Math.PI * 2);
      ctx.fill();

      // Orange beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, -2);
      ctx.lineTo(5, -2);
      ctx.closePath();
      ctx.fill();

      // Orange feet
      [-w * 0.15, w * 0.15].forEach((fx) => {
        ctx.beginPath();
        ctx.arc(fx, h / 2 - 1, 5, 0, Math.PI);
        ctx.fill();
      });

    } else if (skin === 'bear') {
      // Teddy Bear
      const bearGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      bearGrad.addColorStop(0, '#a16207');
      bearGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = bearGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Round bear ears
      [-w * 0.35, w * 0.35].forEach((ex) => {
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.arc(ex, -h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(ex, -h / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Tan muzzle oval
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Button nose & smile
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 3, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Shiny button eyes
      [-w * 0.2, w * 0.2].forEach((bx) => {
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(bx, -5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx - 1, -6, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (skin === 'avocado') {
      // Holy Guac
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();

      // Creamy lime-green meat
      const avoGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      avoGrad.addColorStop(0, '#bef264');
      avoGrad.addColorStop(1, '#84cc16');
      ctx.fillStyle = avoGrad;
      ctx.beginPath();
      ctx.roundRect(-w * 0.44, -h / 2 + 4, w * 0.88, h - 8, 12);
      ctx.fill();

      // Brown avocado pit
      const pitGrad = ctx.createRadialGradient(-3, 1, 2, 0, 3, 12);
      pitGrad.addColorStop(0, '#a16207');
      pitGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = pitGrad;
      ctx.beginPath();
      ctx.arc(0, 3, 11, 0, Math.PI * 2);
      ctx.fill();

      // Glossy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'donut') {
      // Donut Glaze
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [14, 14, 18, 18]);
      ctx.fill();

      // Strawberry glaze
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.roundRect(-w * 0.46, -h / 2 + 2, w * 0.92, h * 0.65, 10);
      ctx.fill();
      [-w * 0.3, -w * 0.1, w * 0.12, w * 0.32].forEach((dx) => {
        ctx.beginPath();
        ctx.arc(dx, -h / 2 + h * 0.65, 4.5, 0, Math.PI);
        ctx.fill();
      });

      // Rainbow sprinkles
      const donutSprinkles = ['#38bdf8', '#facc15', '#4ade80', '#ffffff', '#c084fc'];
      [[-w * 0.32, -4], [-w * 0.18, 2], [0, -5], [w * 0.18, 1], [w * 0.32, -3]].forEach(([sx, sy], i) => {
        ctx.fillStyle = donutSprinkles[i % donutSprinkles.length];
        ctx.fillRect(sx, sy, 5, 2.5);
      });

    } else if (skin === 'shark') {
      // Chompy Shark
      const sharkGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      sharkGrad.addColorStop(0, '#0369a1');
      sharkGrad.addColorStop(0.5, '#0284c7');
      sharkGrad.addColorStop(1, '#075985');
      ctx.fillStyle = sharkGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [12, 12, 16, 16]);
      ctx.fill();

      // Dorsal Fin
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, -h / 2);
      ctx.lineTo(-w * 0.28, -h / 2 - 14);
      ctx.lineTo(-w * 0.16, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Sharp white teeth
      ctx.fillStyle = '#ffffff';
      const toothWidth = 8;
      for (let tx = -w * 0.36; tx <= w * 0.36; tx += toothWidth) {
        ctx.beginPath();
        ctx.moveTo(tx, -h / 2);
        ctx.lineTo(tx + toothWidth / 2, -h / 2 + 7);
        ctx.lineTo(tx + toothWidth, -h / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Shark eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(w * 0.28, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.28 - 1, -3, 1, 0, Math.PI * 2);
      ctx.fill();

    } else if (skin === 'burger') {
      // Burger Basket
      // Bottom bun
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(-w / 2, h / 2 - 8, w, 8, [0, 0, 10, 10]);
      ctx.fill();

      // Beef patty
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-w * 0.48, h / 2 - 16, w * 0.96, 8);

      // Melted cheddar cheese
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-w * 0.46, h / 2 - 16);
      ctx.lineTo(w * 0.46, h / 2 - 16);
      ctx.lineTo(w * 0.4, h / 2 - 8);
      ctx.lineTo(-w * 0.4, h / 2 - 8);
      ctx.closePath();
      ctx.fill();

      // Wavy green lettuce
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(-w * 0.48, h / 2 - 22, w * 0.96, 6, 3);
      ctx.fill();

      // Top bun
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, 14, [12, 12, 0, 0]);
      ctx.fill();

      // Sesame seeds
      ctx.fillStyle = '#fef3c7';
      [[-w * 0.3, -h / 2 + 5], [-w * 0.1, -h / 2 + 4], [w * 0.1, -h / 2 + 4], [w * 0.3, -h / 2 + 5]].forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 3, 1.5);
      });

    } else if (skin === 'bat') {
      // Night Bat
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [12, 12, 16, 16]);
      ctx.fill();

      // Violet edge glow
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Bat ears
      [-1, 1].forEach((dir) => {
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.moveTo(dir * w * 0.4, -h / 2);
        ctx.lineTo(dir * w * 0.3, -h / 2 - 14);
        ctx.lineTo(dir * w * 0.18, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(dir * w * 0.35, -h / 2);
        ctx.lineTo(dir * w * 0.3, -h / 2 - 10);
        ctx.lineTo(dir * w * 0.22, -h / 2);
        ctx.closePath();
        ctx.fill();
      });

      // Amber eyes
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-w * 0.18, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(w * 0.18, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Vampire fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-6, 5);
      ctx.lineTo(-3, 11);
      ctx.lineTo(0, 5);
      ctx.moveTo(0, 5);
      ctx.lineTo(3, 11);
      ctx.lineTo(6, 5);
      ctx.fill();

    } else if (skin === 'taco') {
      // Crispy Taco
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w / 2, 0, Math.PI);
      ctx.fill();

      // Beef filling
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(0, -h / 2, w * 0.42, 0, Math.PI);
      ctx.fill();

      // Cheese & lettuce bits
      [-w * 0.3, -w * 0.15, 0, w * 0.15, w * 0.3].forEach((tx, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#22c55e';
        ctx.fillRect(tx, -h / 2 + 2, 8, 4);
      });
      // Diced tomato
      ctx.fillStyle = '#ef4444';
      [[-w * 0.2, 0], [w * 0.1, 3], [-w * 0.05, 5]].forEach(([rx, ry]) => {
        ctx.fillRect(rx, ry, 4, 4);
      });

    } else if (skin === 'lion') {
      // Lion Roar
      ctx.fillStyle = '#78350f';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.arc(Math.cos(a) * w * 0.46, Math.sin(a) * h * 0.46, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(-w * 0.44, -h / 2, w * 0.88, h, 14);
      ctx.fill();

      // Crown
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-10, -h / 2);
      ctx.lineTo(-14, -h / 2 - 8);
      ctx.lineTo(-6, -h / 2 - 4);
      ctx.lineTo(0, -h / 2 - 10);
      ctx.lineTo(6, -h / 2 - 4);
      ctx.lineTo(14, -h / 2 - 8);
      ctx.lineTo(10, -h / 2);
      ctx.closePath();
      ctx.fill();

      // Muzzle
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, 4, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      [-w * 0.18, w * 0.18].forEach((lx) => {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(lx, -4, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (skin === 'rocket') {
      // Rocket Booster
      const rocketGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      rocketGrad.addColorStop(0, '#f8fafc');
      rocketGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = rocketGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 14, 14]);
      ctx.fill();

      // Red racing stripe
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-w / 2, -h / 2 + 6, w, 5);

      // Red wing fins
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(dir * w / 2, -h / 4);
        ctx.lineTo(dir * (w / 2 + 10), h / 2);
        ctx.lineTo(dir * w / 2, h / 2);
        ctx.closePath();
        ctx.fill();
      });

      // Circular porthole
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Exhaust flame
      const flameGrad = ctx.createLinearGradient(0, h / 2, 0, h / 2 + 12);
      flameGrad.addColorStop(0, '#fef08a');
      flameGrad.addColorStop(0.5, '#f97316');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.25, h / 2);
      ctx.lineTo(0, h / 2 + 14);
      ctx.lineTo(w * 0.25, h / 2);
      ctx.closePath();
      ctx.fill();

    } else if (skin === 'viking') {
      // Viking Longboat
      const vikGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      vikGrad.addColorStop(0, '#543d2b');
      vikGrad.addColorStop(1, '#2e1e12');
      ctx.fillStyle = vikGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 4, -h / 2);
      ctx.lineTo(w / 2 + 4, -h / 2);
      ctx.lineTo(w * 0.38, h / 2);
      ctx.lineTo(-w * 0.38, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1a110a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dragon prow
      ctx.fillStyle = '#543d2b';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.quadraticCurveTo(-w / 2 - 12, -h / 2 - 12, -w / 2 - 6, -h / 2 - 18);
      ctx.quadraticCurveTo(-w / 2 - 2, -h / 2 - 14, -w / 2 + 4, -h / 2);
      ctx.fill();

      // Shields
      const shieldCols = ['#dc2626', '#facc15', '#dc2626', '#facc15'];
      [-w * 0.28, -w * 0.1, w * 0.1, w * 0.28].forEach((sx, i) => {
        ctx.fillStyle = shieldCols[i];
        ctx.beginPath();
        ctx.arc(sx, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(sx, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (skin === 'blackhole') {
      // Black Hole
      const diskGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.55);
      diskGrad.addColorStop(0, '#000000');
      diskGrad.addColorStop(0.3, '#f43f5e');
      diskGrad.addColorStop(0.6, '#a855f7');
      diskGrad.addColorStop(0.9, '#38bdf8');
      diskGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = diskGrad;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.52, h * 0.8, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Singularity core
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Photon ring
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

    } else if (skin === 'phoenix') {
      // Phoenix Flame (Mythical Immortal Firebird)
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;

      // Blazing Molten Hull
      const fireGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      fireGrad.addColorStop(0, '#fef08a');   // Blazing yellow core
      fireGrad.addColorStop(0.3, '#f97316'); // Radiant orange
      fireGrad.addColorStop(0.7, '#dc2626'); // Crimson fire
      fireGrad.addColorStop(1, '#7f1d1d');   // Deep volcanic ember
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [6, 6, 18, 18]);
      ctx.fill();

      // Golden Flame Outer Trim
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sweeping Phoenix Wings (Flames spreading from edges)
      [-1, 1].forEach((dir) => {
        // Outer feather wing
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(dir * (w / 2), -h / 4);
        ctx.quadraticCurveTo(dir * (w / 2 + 16), -h / 2 - 6, dir * (w / 2 + 8), h / 3);
        ctx.lineTo(dir * (w / 2), h / 3);
        ctx.closePath();
        ctx.fill();

        // Inner golden feather tier
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(dir * (w / 2), -h / 8);
        ctx.quadraticCurveTo(dir * (w / 2 + 10), -h / 2, dir * (w / 2 + 5), h / 4);
        ctx.lineTo(dir * (w / 2), h / 4);
        ctx.closePath();
        ctx.fill();
      });

      // Central Golden Solar Crest (Sun / Head)
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 - 4);
      ctx.lineTo(7, -1);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, -1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ruby Phoenix Eyes
      [-w * 0.16, w * 0.16].forEach((lx) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(lx, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(lx, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(lx - 0.7, -2.7, 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Floating Flame Embers along top
      [-w * 0.32, 0, w * 0.32].forEach((ex, idx) => {
        ctx.fillStyle = idx === 1 ? '#fff' : '#fde047';
        ctx.beginPath();
        ctx.arc(ex, -h * 0.38, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

    } else if (skin === 'green') {
      // Green (The Legendary 10,000 Points Apex Skin)
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 18;

      // Radiant Emerald Hull
      const greenGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      greenGrad.addColorStop(0, '#86efac');   // Radiant mint
      greenGrad.addColorStop(0.25, '#22c55e'); // Electric lime green
      greenGrad.addColorStop(0.7, '#15803d');  // Imperial jade
      greenGrad.addColorStop(1, '#052e16');    // Deep emerald shadow
      ctx.fillStyle = greenGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [8, 8, 20, 20]);
      ctx.fill();

      // Glowing Neon Green Outer Rim
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Emerald Cyber Wing Accents
      ctx.strokeStyle = 'rgba(187, 247, 208, 0.85)';
      ctx.lineWidth = 1.5;
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(dir * (w * 0.42), -h * 0.25);
        ctx.lineTo(dir * (w * 0.28), h * 0.15);
        ctx.lineTo(dir * (w * 0.18), h * 0.15);
        ctx.stroke();
      });

      // Center Grand Emerald Power Core
      ctx.shadowColor = '#86efac';
      ctx.shadowBlur = 14;
      const gemGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
      gemGrad.addColorStop(0, '#f0fdf4');
      gemGrad.addColorStop(0.35, '#4ade80');
      gemGrad.addColorStop(0.75, '#16a34a');
      gemGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = gemGrad;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#dcfce7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Glass Sheen Reflection
      ctx.shadowBlur = 0;
      const sheen = ctx.createLinearGradient(0, -h / 2 + 2, 0, -h * 0.1);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.roundRect(-w * 0.42, -h * 0.42, w * 0.84, h * 0.26, 4);
      ctx.fill();

      // Floating Neon Corner Sparkles
      [-w * 0.44, w * 0.44].forEach((lx) => {
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(lx, -h * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

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
    const totalSec = Math.max(0, Math.ceil(timeLeft));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    timerVal.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    if (totalSec <= 10) {
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
      card.className = `skin-card ${isActive ? 'active' : ''} ${skin.id === 'green' ? 'skin-green' : ''} ${skin.id === 'phoenix' ? 'skin-phoenix' : ''}`;

      let buyBtnClass = 'skin-buy-btn';
      if (skin.id === 'green') buyBtnClass = 'skin-buy-btn skin-buy-green';
      else if (skin.id === 'phoenix') buyBtnClass = 'skin-buy-btn skin-buy-phoenix';
      const buyBtnHtml = `<button class="${buyBtnClass}" data-id="${skin.id}">🪙 ${skin.price.toLocaleString()}</button>`;

      card.innerHTML = `
        <span class="skin-preview-icon">${skin.icon}</span>
        <span class="skin-name">${skin.name}</span>
        ${skin.desc ? `<span class="skin-desc">${skin.desc}</span>` : ''}
        ${
          isOwned
            ? `<span class="skin-status-badge">${isActive ? 'Equipped' : 'Select'}</span>`
            : buyBtnHtml
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
      alert(`Not enough coins! You need 🪙 ${(skin.price - currentTotalCoins).toLocaleString()} more.`);
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

    // Touch controls on screen (Fast, Responsive & No Text Copy Glitch)
    const handleLeftStart = (e) => {
      e.preventDefault();
      keys.left = true;
      basket.targetX -= 55; // Immediate impulse on tap
    };
    const handleLeftEnd = (e) => {
      if (e && e.cancelable) e.preventDefault();
      keys.left = false;
    };

    const handleRightStart = (e) => {
      e.preventDefault();
      keys.right = true;
      basket.targetX += 55; // Immediate impulse on tap
    };
    const handleRightEnd = (e) => {
      if (e && e.cancelable) e.preventDefault();
      keys.right = false;
    };

    btnTouchLeft.addEventListener('pointerdown', handleLeftStart);
    btnTouchLeft.addEventListener('pointerup', handleLeftEnd);
    btnTouchLeft.addEventListener('pointerleave', handleLeftEnd);
    btnTouchLeft.addEventListener('pointercancel', handleLeftEnd);

    btnTouchRight.addEventListener('pointerdown', handleRightStart);
    btnTouchRight.addEventListener('pointerup', handleRightEnd);
    btnTouchRight.addEventListener('pointerleave', handleRightEnd);
    btnTouchRight.addEventListener('pointercancel', handleRightEnd);

    // Prevent context menu, callout popups, and text selection on mobile buttons
    ['contextmenu', 'selectstart', 'dragstart'].forEach((evt) => {
      btnTouchLeft.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
      btnTouchRight.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
      if (mobileControls) {
        mobileControls.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
      }
    });

    // Mode Selection Buttons
    if (btnModeNormal) btnModeNormal.addEventListener('click', () => setGameMode('NORMAL'));
    if (btnModeHard) btnModeHard.addEventListener('click', () => setGameMode('HARD'));
    if (btnOverModeNormal) btnOverModeNormal.addEventListener('click', () => setGameMode('NORMAL'));
    if (btnOverModeHard) btnOverModeHard.addEventListener('click', () => setGameMode('HARD'));

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
        navigator.serviceWorker.register('sw.js').then((reg) => {
          reg.update();
        }).catch(() => {});
      });
    }
  }

  // Start initialization
  init();
})();
