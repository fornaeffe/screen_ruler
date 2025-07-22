// @ts-check

const zIndex = 999999;

let isMeasuring = false;
let overlay = null;
let ctx = null;
let measures = [];
let startPoint = null;
let panel = null;

let listeners = []; // per rimuoverli facilmente

function createOverlay() {
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

  overlay.appendChild(canvas);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  ctx = canvas.getContext("2d");

  // intercetta i click sul div, così la pagina sotto non li riceve
  overlay.addEventListener("click", handleClick);
  overlay.addEventListener("mousemove", handleMouseMove);
  panel.addEventListener("click", (e) => e.stopPropagation());

  window.addEventListener("resize", resizeOverlay);

  // salviamo listener per rimuoverli poi
  listeners.push(["click", handleClick, overlay]);
  listeners.push(["mousemove", handleMouseMove, overlay]);
  listeners.push(["click", (e) => e.stopPropagation(), panel]);
  listeners.push(["resize", resizeOverlay, window]);
}

function resizeOverlay() {
  if (!overlay) return;
  const canvas = overlay.querySelector("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawMeasures();
}


function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.sqrt(dx*dx + dy*dy));
}

function drawMeasures() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";

  measures.forEach((m, i) => {
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

function handleMouseMove(e) {
  if (!isMeasuring || !startPoint) return;

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

function handleClick(e) {
  e.preventDefault(); // blocca l’interazione con la pagina

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

    panel.innerHTML = ""; // pulisci il pannello
    measures.forEach((m, i) => {
      const text = `#${i + 1} ${m.length}px` + (i > 0 ? ` = ${
        Math.round((m.length / measures[0].length + Number.EPSILON) * 100) / 100
      } of #1` : "");
      const div = document.createElement("div");
      div.textContent = text;
      panel.appendChild(div);
    });

    startPoint = null;
    drawMeasures();
  }
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

  // Rimuovi overlay e canvas
  if (overlay) {
    overlay.remove();
    overlay = null;
    ctx = null;
    panel = null;
  }

  // Rimuovi listener (anche resize)
  listeners.forEach(([event, fn, target]) => {
    (target || document).removeEventListener(event, fn);
  });
  listeners = [];
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