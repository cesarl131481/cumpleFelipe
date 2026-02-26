/*
  fx-clouds.js
  Nubes que emergen al revelar el dinosaurio.
  Genera textura de nube con Canvas 2D y la aplica
  a planos en la escena A-Frame.
*/

const FxClouds = (() => {

  // Genera una textura de nube usando Canvas 2D
  function _createCloudTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fondo transparente
    ctx.clearRect(0, 0, 256, 128);

    // Dibuja círculos superpuestos para simular nube
    const circles = [
      { x: 128, y: 80, r: 55 },
      { x: 80,  y: 90, r: 40 },
      { x: 176, y: 90, r: 40 },
      { x: 50,  y: 100, r: 28 },
      { x: 206, y: 100, r: 28 },
      { x: 128, y: 55,  r: 35 },
    ];

    circles.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0,   color + 'ff');
      grad.addColorStop(0.5, color + 'cc');
      grad.addColorStop(1,   color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    return canvas.toDataURL();
  }

  const CLOUD_COUNT = 10;

  function play(fx, markerIndex) {
    const color    = fx.cloudColor    || '#ffffff';
    const density  = fx.cloudDensity  || 'media';
    const duration = (fx.revealDuration || 2.0) * 1000;

    const opacityMap = { alta: 1.0, media: 0.92, baja: 0.75 };
    const opacity    = opacityMap[density] || 0.7;

    const anchor = document.getElementById(`anchor-${markerIndex}`) || _getActiveAnchor();
    if (!anchor) return;

    // Genera textura una sola vez por color
    const textureUrl = _createCloudTexture(color);

    const clouds = [];

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = document.createElement('a-image');

      const rx   = (Math.random() - 0.5) * 0.35;
      const ry   = 0.03 + Math.random() * 0.25;
      const rz   = (Math.random() - 0.5) * 0.25;
      const size = 0.35 + Math.random() * 0.35;

      cloud.setAttribute('src',      textureUrl);
      cloud.setAttribute('position', `${rx} ${ry} ${rz}`);
      cloud.setAttribute('rotation', `0 ${Math.random() * 360} 0`);
      cloud.setAttribute('width',    size);
      cloud.setAttribute('height',   size * 0.5);
      cloud.setAttribute('opacity',  opacity);
      cloud.setAttribute('material', 'transparent: true; alphaTest: 0.01; side: double');

      const windX   = (Math.random() - 0.5) * 0.35;
      const windDur = Math.round(duration + Math.random() * 600);

      cloud.setAttribute('animation__move', `
        property: position;
        to: ${rx + windX} ${ry + 0.07} ${rz};
        dur: ${windDur};
        easing: easeOutSine;
        startEvents: startcloud
      `);

      cloud.setAttribute('animation__fade', `
        property: components.material.material.opacity;
        from: ${opacity};
        to: 0;
        dur: ${windDur};
        easing: easeInQuad;
        startEvents: startcloud
      `);

      anchor.appendChild(cloud);
      clouds.push(cloud);
    }

    // Dispara animaciones
    setTimeout(() => clouds.forEach(c => c.emit('startcloud')), 150);

    // Limpia del DOM al terminar
    setTimeout(() => {
      clouds.forEach(c => { if (c.parentNode) c.parentNode.removeChild(c); });
    }, duration + 1500);
  }

  function _getActiveAnchor() {
    for (let i = 0; i < 6; i++) {
      const model = document.getElementById(`model-${i}`);
      if (model) {
        const vis = model.getAttribute('visible');
        if (vis === true || vis === 'true') {
          return document.getElementById(`anchor-${i}`);
        }
      }
    }
    return document.getElementById('anchor-0');
  }

  return { play };

})();