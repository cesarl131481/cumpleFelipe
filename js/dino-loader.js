/*
  dino-loader.js — Carga bajo demanda
  Asigna gltf-model al anchor cuando se detecta el marcador.
  A-Frame maneja la descarga internamente.
  Barra animada 5s corre en paralelo, espera en 99% si no cargó aún.
*/
const DinoLoader = (() => {

  const elBar     = document.getElementById('progress-bar');
  const elPercent = document.getElementById('progress-percent');
  const elMessage = document.getElementById('clone-message');
  const segments  = [1,2,3,4,5].map(i => document.getElementById(`seg-${i}`));

  const MIN_MS  = 5000;
  const STEP_MS = 80;

  const _loaded   = {}; // { markerIndex: true } — ya tiene gltf-model asignado
  const _ready    = {}; // { markerIndex: true } — model-loaded disparado
  const _animated = {}; // { markerIndex: true } — animaciones iniciadas

  function start(dino) {
    _resetUI();
    const idx = _getMarkerIndex(dino.id);
    const model = document.getElementById(`model-${idx}`);
    if (!model) return;

    // Asigna el src si es la primera vez
    if (!_loaded[idx]) {
      _loaded[idx] = true;
      model.setAttribute('gltf-model', dino.model);
      model.addEventListener('model-loaded', () => {
        _ready[idx] = true;
        console.log(`[DinoLoader] model-loaded: ${dino.id}`);
      }, { once: true });
    }

    // Barra en paralelo — espera en 99% hasta que model-loaded
    _runBar(dino, idx, () => {
      _showDino(idx, dino);
      LabController.onLoadComplete();
    });
  }

  function _resetUI() {
    elBar.style.width = '0%';
    elPercent.textContent = '0%';
    segments.forEach(s => s.classList.remove('active'));
  }

  function _runBar(dino, idx, onComplete) {
    const msgs = dino.cloning.progressMessages;
    let msgI = 0, pct = 0, elapsed = 0;
    const inc = 99 / (MIN_MS / STEP_MS);

    elMessage.textContent = msgs[0];
    const msgTimer = setInterval(() => {
      msgI = (msgI + 1) % msgs.length;
      elMessage.textContent = msgs[msgI];
    }, MIN_MS / msgs.length);

    const barTimer = setInterval(() => {
      elapsed += STEP_MS;

      // Avanza hasta 99% durante los 5 segundos
      if (pct < 99) pct = Math.min(pct + inc, 99);
      _updateProgress(pct);

      // Al cumplir 5s: completa solo si el model ya cargó
      if (elapsed >= MIN_MS) {
        if (_ready[idx]) {
          clearInterval(barTimer);
          clearInterval(msgTimer);
          _updateProgress(100);
          setTimeout(onComplete, 300);
        }
        // Si no cargó aún — queda en 99% parpadeando hasta que llegue
      }
    }, STEP_MS);

    // Listener de seguridad: si model-loaded llega después de los 5s
    const checkAfterLoad = () => {
      if (elapsed >= MIN_MS) {
        clearInterval(barTimer);
        clearInterval(msgTimer);
        _updateProgress(100);
        setTimeout(onComplete, 300);
      }
    };

    const model = document.getElementById(`model-${idx}`);
    if (model && !_ready[idx]) {
      model.addEventListener('model-loaded', checkAfterLoad, { once: true });
    }
  }

  function _updateProgress(pct) {
    const p = Math.round(pct);
    elBar.style.width = p + '%';
    elPercent.textContent = p + '%';
    segments.forEach((seg, i) => {
      if (p >= (i + 1) * 20) seg.classList.add('active');
    });
  }

  function _showDino(idx, dino) {
    const model = document.getElementById(`model-${idx}`);
    if (!model) return;
    model.setAttribute('visible', 'true');

    if (!_animated[idx]) {
      _animated[idx] = true;
      let seqIdx = 0;
      const seq = dino.animations.sequence;

      setTimeout(() => {
        model.setAttribute('animation-mixer',
          `clip: ${seq[0]}; loop: once; clampWhenFinished: true`);
        model.addEventListener('animation-finished', () => {
          seqIdx = (seqIdx + 1) % seq.length;
          model.setAttribute('animation-mixer',
            `clip: ${seq[seqIdx]}; loop: once; clampWhenFinished: true`);
        });
      }, 300);
    }
  }

  function _getMarkerIndex(dinoId) {
    for (let i = 0; i < 10; i++) {
      const d = DinoDatabase.getByMarker(i);
      if (d && d.id === dinoId) return i;
    }
    return 0;
  }

  return { start };
})();
