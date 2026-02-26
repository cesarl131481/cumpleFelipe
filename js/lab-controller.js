const LabController = (() => {

  let _state = 'BOOTING';
  let _currentDino = null;
  let _currentMarker = 0;

  const ui = {
    welcome:      document.getElementById('welcome-screen'),
    startBtn:     document.getElementById('start-button'),
    scanning:     document.getElementById('screen-scanning'),
    detected:     document.getElementById('screen-detected'),
    cloning:      document.getElementById('screen-cloning'),
    statusDot:    document.getElementById('status-dot'),
    statusText:   document.getElementById('status-text'),
    footerMarker: document.getElementById('footer-marker'),
    footerTime:   document.getElementById('footer-time'),
    btnClone:     document.getElementById('btn-clone'),
    dnaLabel:     document.getElementById('dna-label'),
    dnaLabelConfirm: document.getElementById('dna-label-confirm'),
    infoOverlay:  document.getElementById('dino-info-overlay'),
    jpLogo:       document.getElementById('jp-logo'),
    dnaSegs:      [1,2,3,4,5].map(i => document.getElementById('seg-'+i)),
    // Contraseña
    passwordPanel:  document.getElementById('password-panel'),
    detectionMsg:   document.getElementById('detection-message'),
    errorMsg:       document.getElementById('error-message'),
    errorCountdown: document.getElementById('error-countdown'),
    pwdSlots:       Array.from(document.querySelectorAll('.pwd-slot')),
    btnDna:         Array.from(document.querySelectorAll('.btn-dna')),
    btnClearPwd:    document.getElementById('btn-clear-pwd'),
  };

  const DNA_SEQUENCES = {
    0: ['A','T','G','C','X'],
    1: ['C','G','T','A','X'],
    2: ['G','A','C','T','X'],
    3: ['T','C','A','G','X'],
    4: ['T','A','C','G','X'],
    5: ['C','T','G','A','X'],
  };

  // — Lógica de contraseña — (scope del módulo, visible para todos)
  let _pwdInput = [];
  let _pwdLocked = false;

  function _initPassword() {
    _pwdInput = [];
    _pwdLocked = false;
    ui.pwdSlots.forEach(s => { s.textContent = ''; s.className = 'pwd-slot'; });
    ui.btnDna.forEach(b => b.disabled = false);
    ui.passwordPanel.classList.remove('hidden');
    ui.detectionMsg.classList.add('hidden');
    ui.btnClone.classList.add('hidden');
    ui.errorMsg.classList.add('hidden');
  }

  function _onDnaBtn(base) {
    if (_pwdLocked || _pwdInput.length >= 4) return;
    _pwdInput.push(base);
    const slot = ui.pwdSlots[_pwdInput.length - 1];
    slot.textContent = base;
    slot.classList.add('filled');
    if (_pwdInput.length === 4) _checkPassword();
  }

  function _checkPassword() {
    _pwdLocked = true;
    ui.btnDna.forEach(b => b.disabled = true);
    const expected = DNA_SEQUENCES[_currentMarker].slice(0, 4);
    const correct = _pwdInput.join('') === expected.join('');

    if (correct) {
      // ✅ Correcta — mostrar panel de éxito
      ui.passwordPanel.classList.add('hidden');
      ui.dnaLabelConfirm.textContent = _currentDino.cloning.dnaCombination;
      ui.detectionMsg.classList.remove('hidden');
      ui.btnClone.classList.remove('hidden');
    } else {
      // ❌ Incorrecta — slots rojos + countdown
      ui.pwdSlots.forEach(s => s.classList.add('error'));
      ui.passwordPanel.classList.add('hidden');
      ui.errorMsg.classList.remove('hidden');
      let t = 3;
      ui.errorCountdown.textContent = t;
      const interval = setInterval(() => {
        t--;
        ui.errorCountdown.textContent = t;
        if (t <= 0) {
          clearInterval(interval);
          ui.errorMsg.classList.add('hidden');
          _initPassword();
        }
      }, 1000);
    }
  }

  async function init() {
    _startClock();
    await DinoDatabase.init();

    ui.startBtn.addEventListener('click', () => {
      ui.welcome.style.display = 'none';
      _setState('WAITING', 'Esperando marcador...');
      _showScreen('scanning');
      MarkerDetector.init();
    });

    ui.btnDna.forEach(btn => {
      btn.addEventListener('click', () => _onDnaBtn(btn.dataset.base));
    });

    ui.btnClearPwd.addEventListener('click', () => {
      if (_pwdLocked) return;
      _pwdInput = [];
      ui.pwdSlots.forEach(s => { s.textContent = ''; s.className = 'pwd-slot'; });
    });

    ui.btnClone.addEventListener('click', () => {
      if (!_currentDino) return;
      _setState('CLONING', 'Clonando...');
      _showScreen('cloning');
      DinoLoader.start(_currentDino);
    });
  }

  function _setState(state, text) {
    _state = state;
    ui.statusText.textContent = text;
    const dots = { WAITING:'waiting', DETECTED:'detected', CLONING:'cloning', ACTIVE:'active' };
    ui.statusDot.className = 'status-dot ' + (dots[state] || '');
  }

  function _showScreen(name) {
    ['scanning','detected','cloning'].forEach(key => {
      ui[key].classList.toggle('active', key === name);
    });
  }

  // Dinos que ya fueron clonados antes (caché)
  const _cloned = {};

  function onMarkerFound(markerIndex) {
    if (_state === 'CLONING') return;
    const dino = DinoDatabase.getByMarker(markerIndex);
    if (!dino) return;
    _currentDino = dino;
    _currentMarker = markerIndex;
    ui.footerMarker.textContent = 'MARCADOR: ' + markerIndex;

    // Si ya fue clonado antes — muestra directo sin barra
    if (_cloned[dino.id]) {
      _setState('ACTIVE', dino.overlay.name);
      _showScreen(null);
      FxOverlay.show(dino.overlay);
      FxClouds.play(dino.fx, markerIndex);
      ui.jpLogo.classList.add('hidden-fade');
      return;
    }

    const seq = DNA_SEQUENCES[markerIndex] || ['A','T','G','C','X'];
    ui.dnaSegs.forEach((seg, i) => seg.setAttribute('data-base', seq[i]));

    ui.dnaLabel.textContent = dino.cloning.dnaCombination;
    _setState('DETECTED', 'Verificando acceso...');
    _showScreen('detected');
    _initPassword();
  }

  function onMarkerLost() {
    if (_state === 'CLONING') return;
    _currentDino = null;
    ui.infoOverlay.classList.add('hidden');
    ui.jpLogo.classList.remove('hidden-fade');
    _setState('WAITING', 'Esperando marcador...');
    _showScreen('scanning');
  }

  function onLoadComplete() {
    _cloned[_currentDino.id] = true;
    _setState('ACTIVE', _currentDino.overlay.name);
    _showScreen(null);
    FxOverlay.show(_currentDino.overlay);
    FxClouds.play(_currentDino.fx, _currentMarker);
    ui.jpLogo.classList.add('hidden-fade');
  }

  function _startClock() {
    setInterval(() => {
      const n = new Date();
      ui.footerTime.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()]
        .map(v => String(v).padStart(2,'0')).join(':');
    }, 1000);
  }

  return { init, onMarkerFound, onMarkerLost, onLoadComplete };

})();

document.addEventListener('DOMContentLoaded', () => LabController.init());