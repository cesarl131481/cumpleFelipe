/*
  fx-overlay.js
  Muestra la tarjeta de información del dinosaurio
  con animación de entrada al completar la clonación.
*/

const FxOverlay = (() => {

  const card    = document.getElementById('dino-info-overlay');
  const elName  = document.getElementById('dino-info-name');
  const elPer   = document.getElementById('dino-info-period');
  const elSize  = document.getElementById('stat-size');
  const elDiet  = document.getElementById('stat-diet');
  const elSpeed = document.getElementById('stat-speed');
  const elQual  = document.getElementById('stat-quality');

  function show(overlay) {
    elName.textContent  = overlay.name;
    elPer.textContent   = overlay.period;
    elSize.textContent  = overlay.size;
    elDiet.textContent  = overlay.diet;
    elSpeed.textContent = overlay.speed;
    elQual.textContent  = overlay.quality;

    card.classList.remove('hidden');
    card.style.animation = 'none';
    // Fuerza reflow para reiniciar animación
    void card.offsetWidth;
    card.style.animation = 'info-card-enter 0.6s ease forwards';
  }

  function hide() {
    card.classList.add('hidden');
  }

  return { show, hide };

})();