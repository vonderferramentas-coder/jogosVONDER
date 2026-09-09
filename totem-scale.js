(() => {
  const DESIGN_WIDTH = 430;
  const DESIGN_HEIGHT = 764.44;
  function fitTotem() {
    const frame = document.querySelector('.app-frame');
    if (!frame) return;
    // O totem deve sempre preencher toda a altura. Em telas mais estreitas que
    // 9:16, o excedente lateral é recortado em vez de criar faixas em cima/baixo.
    const scale = window.innerHeight / DESIGN_HEIGHT;
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = 'center center';
  }
  window.addEventListener('resize', fitTotem);
  document.addEventListener('DOMContentLoaded', fitTotem);
})();
