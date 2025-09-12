// @ts-check

// @ts-ignore
window.measureToolInjected = true;

const zIndex = 999999;

let isMeasuring = false;
/**
 * @type {HTMLDivElement | null}
 */
let overlay = null;
/**
 * @type {CanvasRenderingContext2D | null}
 */
let ctx = null;
/**
 * @type {{ start: { x: number; y: number; }; end: { x: number; y: number; }; length: number; midX: number; midY: number; }[]}
 */
let measures = [];
/**
 * @type {{ x: number; y: number; } | null}
 */
let startPoint = null;
/**
 * @type {HTMLDivElement | null}
 */
let panel = null;
/**
 * @type {HTMLInputElement | null}
 */
let scaleInput = null;

/**
 * @type {([string, (e: any) => void, HTMLElement | Window])[]}
 */
let listeners = []; // per rimuoverli facilmente

/**
 * @type {number}
 */
let scale = 1;




function createOverlay() {
  scale = 1;

  overlay = document.createElement("div");
  overlay.id = "measure-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.zIndex = zIndex.toString();
  overlay.style.cursor = "crosshair";
  overlay.style.background = "transparent";

  // qui aggiungiamo un canvas dentro al div
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none"; // il canvas non blocca, ma il div sì

  panel = document.createElement("div");
  panel.id = "measure-panel";
  panel.style.zIndex = (zIndex + 1).toString();

  scaleInput = document.createElement("input");
  scaleInput.type = "number";
  scaleInput.value = scale.toString();
  scaleInput.addEventListener("change", handleScaleChange);

  overlay.appendChild(canvas);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  ctx = canvas.getContext("2d");

  // intercetta i click sul div, così la pagina sotto non li riceve
  overlay.addEventListener("click", handleClick);
  overlay.addEventListener("mousemove", handleMouseMove);
  panel.addEventListener("click", handlePanelClick);

  window.addEventListener("resize", resizeOverlay);

  // salviamo listener per rimuoverli poi
  listeners.push(["click", handleClick, overlay]);
  listeners.push(["mousemove", handleMouseMove, overlay]);
  listeners.push(["click", handlePanelClick, panel]);
  listeners.push(["resize", resizeOverlay, window]);
  listeners.push(["change", handleScaleChange, scaleInput]);
}

function resizeOverlay() {
  if (!overlay) return;
  const canvas = overlay.querySelector("canvas");
  if (!canvas) throw new Error("Canvas not found in overlay");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawMeasures();
}


/**
 * @param {{ x: number; y: number; }} a
 * @param {{ x: number; y: number; }} b
 */
function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

function drawMeasures() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";

  measures.forEach((m, i) => {
    if (!ctx) throw new Error("ctx is null");
    ctx.beginPath();
    ctx.moveTo(m.start.x, m.start.y);
    ctx.lineTo(m.end.x, m.end.y);
    ctx.stroke();

    const text = `${m.length}px`;
    ctx.fillRect(m.midX - 15, m.midY - 10, 40, 15);
    ctx.fillStyle = "white";
    ctx.fillText(text, m.midX - 10, m.midY);
    ctx.fillStyle = "black";
  });
}

/**
 * @param {MouseEvent} e
 */
function handleMouseMove(e) {
  if (!isMeasuring || !startPoint) return;

  if (!ctx) throw new Error("ctx is null");


  drawMeasures();

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(e.clientX, e.clientY);
  ctx.stroke();

  const len = distance(startPoint, { x: e.clientX, y: e.clientY });
  const midX = (startPoint.x + e.clientX) / 2;
  const midY = (startPoint.y + e.clientY) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(midX - 20, midY - 10, 50, 15);
  ctx.fillStyle = "white";
  ctx.fillText(`${len}px`, midX - 10, midY);
}

/**
 * @param {MouseEvent} e
 */
function handleClick(e) {
  e.preventDefault(); // blocca l’interazione con la pagina

  if (!panel) throw new Error("panel is null");

  if (!startPoint) {
    startPoint = { x: e.clientX, y: e.clientY };
  } else {
    const endPoint = { x: e.clientX, y: e.clientY };
    const len = distance(startPoint, endPoint);

    measures.push({
      start: startPoint,
      end: endPoint,
      length: len,
      midX: (startPoint.x + endPoint.x) / 2,
      midY: (startPoint.y + endPoint.y) / 2
    });

    updatePanel();

    startPoint = null;
    drawMeasures();
  }
}

/**
 * @param {MouseEvent} e
 */
function handlePanelClick(e) {
  e.stopPropagation(); // non far propagare il click al div overlay
}

/**
 * @param {Event} e
 */
function handleScaleChange(e) {
  if (!scaleInput) return;
  scale = parseFloat(scaleInput.value);
  updatePanel();
}

function updatePanel() {
  if (!panel) throw new Error("panel is null");


  panel.innerHTML = ""; // pulisci il pannello
  measures.forEach((m, i) => {
    if (!scaleInput) throw new Error("scaleInput is null");
    const text = `#${i + 1} ${m.length}px = ` + (i > 0 ? `${Math.round((m.length / measures[0].length * scale + Number.EPSILON) * 100) / 100}` : "");
    const div = document.createElement("div");
    div.textContent = text;

    if (i === 0) {

      div.appendChild(scaleInput);
    }

    if (!panel) throw new Error("panel is null");
    panel.appendChild(div);
  });
}


// Avvio
function startMeasureMode() {
  if (isMeasuring) return;

  console.log("Modalità misura ATTIVATA");
  isMeasuring = true;
  measures = [];
  startPoint = null;

  createOverlay();
}

// Stop
function stopMeasureMode() {
  if (!isMeasuring) return;
  console.log("Modalità misura DISATTIVATA");

  isMeasuring = false;
  startPoint = null;

  // Rimuovi listener (anche resize)
  listeners.forEach(([event, fn, target]) => {
    (target || document).removeEventListener(event, fn);
  });
  listeners = [];

  // Rimuovi overlay e canvas
  if (overlay) {
    overlay.remove();
    overlay = null;
    ctx = null;
    panel = null;
    scaleInput = null;
  }

  
}

// Ricevi messaggi dal background
// @ts-ignore
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "startMeasure") {
    startMeasureMode();
  } else if (msg.action === "stopMeasure") {
    stopMeasureMode();
  }
});