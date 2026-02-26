/*
  dino-database.js
  Carga el índice de dinosaurios y cada JSON individual.
  Expone dos funciones al resto de scripts:
    - DinoDatabase.init()          → carga dinosaurs.json
    - DinoDatabase.getByMarker(i)  → devuelve los datos del dino por índice de marcador
*/

const DinoDatabase = (() => {

  // Aquí se guardan todos los datos cargados: { markerIndex: {...dinoData} }
  const _data = {};

  // Carga el índice general y luego cada JSON individual
  async function init() {
    const index = await _fetchJSON('data/dinosaurs.json');

    // Carga todos los JSON en paralelo (más rápido)
    await Promise.all(
      index.markers.map(async (entry) => {
        const dinoData = await _fetchJSON(entry.dataFile);
        _data[entry.markerIndex] = dinoData;
      })
    );

    console.log('[DinoDatabase] Cargados:', Object.keys(_data).length, 'dinosaurios');
  }

  // Devuelve los datos del dino según el índice del marcador detectado
  function getByMarker(markerIndex) {
    return _data[markerIndex] || null;
  }

  // Función interna: hace fetch y parsea JSON
  async function _fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar: ${url}`);
    return res.json();
  }

  return { init, getByMarker };

})();
