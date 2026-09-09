(() => {
  const STORAGE_KEY = 'vonder-game-settings';
  const defaults = { memoryEnabled:true, wordSearchEnabled:true, quizEnabled:true, inactivitySeconds:180, memorySeconds:30, memoryPreparationSeconds:5, wordSearchSeconds:60, quizQuestions:3 };
  const page = document.body.dataset.settingsPage || 'home';
  const get = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; } catch (_) { return { ...defaults }; } };
  const save = settings => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return get();
  };
  window.VonderSettings = { get, defaults };
  const introTop = document.querySelector('.intro-top'); if (!introTop) return;
  const trigger = document.createElement('button'); trigger.className = 'mascot-settings-trigger'; trigger.type = 'button'; trigger.setAttribute('aria-label', 'Abrir configurações'); introTop.insertAdjacentElement('afterend', trigger);
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  document.querySelector('.app-frame').appendChild(modal);
  let draft = get();
  const gameCards = [['memoryEnabled', 'Jogo da Memória', 'Encontre todos os pares e vença o tempo.'], ['wordSearchEnabled', 'Caça-Palavras', 'Ache as palavras escondidas na grade.'], ['quizEnabled', 'Quiz VONDER', 'Responda 3 perguntas sobre a marca.']];
  const subtitles = { memory:'Ajustes do Jogo da Memória', wordsearch:'Ajustes do Caça-Palavras', quiz:'Ajustes do Quiz' };
  const range = (key, label, min, max, step, help = '') => `<div class="settings-control"><label>${label}<output class="settings-value" data-output="${key}"></output></label><input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}">${help ? `<p class="settings-help">${help}</p>` : ''}</div>`;
  const inactivity = () => range('inactivitySeconds', 'Tempo de inatividade', 30, 300, 30, 'Sem nenhum toque nesse tempo, o totem exibe o vídeo de atração. Vale para todos os jogos do totem.');
  function render() {
    const body = page === 'home' ? `<p class="settings-subtitle">Selecione os jogos liberados para o público.</p><div class="settings-games">${gameCards.map(([key,title,description]) => `<div class="settings-game"><div class="settings-game-copy"><strong>${title}</strong><small>${description}</small></div><button type="button" class="settings-switch" data-switch="${key}" aria-label="Liberar ${title}"></button></div>`).join('')}</div><div class="settings-divider"></div>${inactivity()}` : `<p class="settings-subtitle">${subtitles[page]}</p>${page === 'memory' ? range('memorySeconds', 'Tempo de jogo', 15, 120, 5) + range('memoryPreparationSeconds', 'Tempo de preparação', 0, 20, 1, 'As cartas ficam viradas para cima nesse tempo, antes do jogo começar.') : ''}${page === 'wordsearch' ? range('wordSearchSeconds', 'Tempo de jogo', 30, 180, 10) : ''}${page === 'quiz' ? range('quizQuestions', 'Número de perguntas', 1, 10, 1) : ''}${inactivity()}`;
    modal.innerHTML = `<div class="settings-dialog" role="dialog" aria-modal="true"><h2 class="settings-title">CONFIGURAÇÕES</h2>${body}<div class="settings-actions"><button class="settings-cancel" type="button">CANCELAR</button><button class="settings-save" type="button">SALVAR</button></div></div>`;
    modal.querySelectorAll('[data-switch]').forEach(button => button.classList.toggle('is-on', draft[button.dataset.switch])); modal.querySelectorAll('[data-setting]').forEach(input => { input.value = draft[input.dataset.setting]; paintRange(input); });
  }
  function format(key, value) { if (key === 'inactivitySeconds') return `${value}s (${value / 60} min)`; if (key === 'quizQuestions') return value; return `${value}s`; }
  function paintRange(input) { const pct = ((input.value - input.min) / (input.max - input.min)) * 100; input.style.setProperty('--slider-progress', `${pct}%`); modal.querySelector(`[data-output="${input.dataset.setting}"]`).textContent = format(input.dataset.setting, input.value); }
  function applyHomeVisibility() {
    const settings = get();
    document.querySelectorAll('.game-card').forEach(card => {
      const enabled = Boolean(settings[card.dataset.game]);
      card.hidden = !enabled;
      card.classList.toggle('is-game-disabled', !enabled);
      card.setAttribute('aria-hidden', String(!enabled));
    });
  }

  function applyConfiguredCopy() {
    const settings = get();
    const memoryRule = document.getElementById('memory-time-rule');
    const wordSearchRule = document.getElementById('word-search-time-rule');
    const quizRule = document.getElementById('quiz-count-rule');
    const homeQuizDescription = document.querySelector('.game-card[data-game="quizEnabled"] .game-desc');
    if (memoryRule) memoryRule.innerHTML = `<span class="rule-icon">⏱️</span> Você terá ${settings.memorySeconds} segundos para encontrar os pares.`;
    if (wordSearchRule) wordSearchRule.innerHTML = `<span class="rule-icon">⏱️</span> Você terá ${settings.wordSearchSeconds} segundos para caçar!`;
    if (quizRule) quizRule.innerHTML = `<span class="rule-icon">❓</span> Responda ${settings.quizQuestions} perguntas sobre ferramentas.`;
    if (homeQuizDescription) homeQuizDescription.textContent = `Responda ${settings.quizQuestions} perguntas sobre a marca.`;
  }
  trigger.addEventListener('click', () => { draft = get(); render(); modal.classList.add('open'); });
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.remove('open');
    const sw = event.target.closest('[data-switch]');
    if (sw) {
      draft[sw.dataset.switch] = !draft[sw.dataset.switch];
      sw.classList.toggle('is-on', draft[sw.dataset.switch]);
    }
    if (event.target.closest('.settings-cancel')) modal.classList.remove('open');
    if (event.target.closest('.settings-save')) {
      save(draft);
      modal.classList.remove('open');
      applyHomeVisibility();
      applyConfiguredCopy();
      window.dispatchEvent(new CustomEvent('vonder-settings-saved', { detail: get() }));
    }
  });
  modal.addEventListener('input', event => {
    if (event.target.matches('[data-setting]')) {
      draft[event.target.dataset.setting] = Number(event.target.value);
      paintRange(event.target);
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.classList.remove('open'); });
  applyHomeVisibility();
  applyConfiguredCopy();
})();
