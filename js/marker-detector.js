/*
  marker-detector.js
  Escucha eventos de MindAR sobre los anchors declarados en el HTML
  y notifica al LabController.
*/

const MarkerDetector = (() => {

  function init() {
    const total = _getMarkerCount();

    for (let i = 0; i < total; i++) {
      const anchor = document.getElementById(`anchor-${i}`);
      if (!anchor) continue;

      anchor.addEventListener('targetFound', () => {
        LabController.onMarkerFound(i);
      });

      anchor.addEventListener('targetLost', () => {
        LabController.onMarkerLost(i);
      });
    }
  }

  function getModelContainer(markerIndex) {
    return document.getElementById(`model-${markerIndex}`);
  }

  function setModelVisible(markerIndex, visible) {
    const model = document.getElementById(`model-${markerIndex}`);
    if (model) model.setAttribute('visible', visible);
  }

  function _getMarkerCount() {
    let i = 0;
    while (DinoDatabase.getByMarker(i) !== null) i++;
    return i;
  }

  return { init, getModelContainer, setModelVisible };

})();
