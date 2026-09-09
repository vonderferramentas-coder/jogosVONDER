(() => {
  const CARD_NAMES = [
    'disco_corte', 'trena', 'lavadora', 'spray',
    'mascote', 'mochila', 'parafusadeira', 'logo_vonder'
  ];
  const GAME_SECONDS = 30;

  const screens = {
    intro: document.getElementById('screen-intro'),
    game: document.getElementById('screen-game'),
    win: document.getElementById('screen-win'),
    lose: document.getElementById('screen-lose'),
  };
  const board = document.getElementById('board');
  const timerText = document.getElementById('timer-text');
  const timerPill = document.querySelector('.timer-pill');

  let flippedCards = [];
  let matchedCount = 0;
  let lockBoard = false;
  let secondsLeft = GAME_SECONDS;
  let timerId = null;

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildBoard() {
    board.innerHTML = '';
    const deck = shuffle([...CARD_NAMES, ...CARD_NAMES]);

    deck.forEach(name => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.name = name;
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-back">?</div>
          <div class="card-face card-front">
            <img src="../assets/cards/${name}.png" alt="${name}">
          </div>
        </div>
      `;
      card.addEventListener('click', () => onCardClick(card));
      board.appendChild(card);
    });
  }

  function onCardClick(card) {
    if (lockBoard) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      lockBoard = true;
      checkMatch();
    }
  }

  function checkMatch() {
    const [a, b] = flippedCards;
    const isMatch = a.dataset.name === b.dataset.name;

    if (isMatch) {
      a.classList.add('matched');
      b.classList.add('matched');
      matchedCount++;
      flippedCards = [];
      lockBoard = false;
      if (matchedCount === CARD_NAMES.length) {
        endGame(true);
      }
    } else {
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        flippedCards = [];
        lockBoard = false;
      }, 700);
    }
  }

  function startTimer() {
    secondsLeft = GAME_SECONDS;
    updateTimerText();
    timerPill.classList.remove('warning');
    clearInterval(timerId);
    timerId = setInterval(() => {
      secondsLeft--;
      updateTimerText();
      if (secondsLeft <= 10) timerPill.classList.add('warning');
      if (secondsLeft <= 0) {
        clearInterval(timerId);
        endGame(false);
      }
    }, 1000);
  }

  function updateTimerText() {
    const m = String(Math.max(secondsLeft, 0) / 60 | 0).padStart(2, '0');
    const s = String(Math.max(secondsLeft, 0) % 60).padStart(2, '0');
    timerText.textContent = `${m}:${s}`;
  }

  function endGame(won) {
    clearInterval(timerId);
    lockBoard = true;
    showScreen(won ? 'win' : 'lose');
  }

  function startGame() {
    matchedCount = 0;
    flippedCards = [];
    lockBoard = false;
    buildBoard();
    showScreen('game');
    startTimer();
  }

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-finish-win').addEventListener('click', () => showScreen('intro'));
  document.getElementById('btn-finish-lose').addEventListener('click', () => showScreen('intro'));
})();
