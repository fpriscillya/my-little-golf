import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

/* ============================================================
   LANGUAGE SYSTEM
   ============================================================ */
let lang = "en";

function t(el) {
  const key = `data-${lang}`;
  if (el.hasAttribute(key)) el.textContent = el.getAttribute(key);
}

function applyLang() {
  document.querySelectorAll("[data-en]").forEach(t);
  document.querySelectorAll("[data-fr]").forEach(t);
  document.querySelectorAll("option[data-en]").forEach(t);
  // Update button labels that JS owns
  playBtn.textContent = video.paused ? tx("play") : tx("pause");
  muteBtn.textContent = video.muted ? tx("muted") : tx("vol");
  stepBack.textContent = tx("back");
  stepFwd.textContent  = tx("fwd");
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applyLang();
  });
});

/* ============================================================
   TRANSLATIONS
   ============================================================ */
const T = {
  loading:   { en: "Loading model...",            fr: "Chargement du modele..." },
  modelReady:{ en: "Model ready. Upload your swing video.", fr: "Modele pret. Uploadez votre video." },
  modelFail: { en: "Model failed to load. Serve this app over https://", fr: "Echec du chargement. Servez l'app via https://" },
  loaded:    { en: "Video loaded. Play or step through to analyse.", fr: "Video chargee. Lancez ou avancez image par image." },
  analysing: { en: "Analysing your swing...",      fr: "Analyse du swing en cours..." },
  noPhases:  { en: "Could not detect swing phases. Try a clearer video or play it through once first.", fr: "Phases non detectees. Essayez une video plus nette ou lisez-la entierement d'abord." },
  play:      { en: "Play",   fr: "Lire" },
  pause:     { en: "Pause",  fr: "Pause" },
  back:      { en: "Back",   fr: "Retour" },
  fwd:       { en: "Fwd",    fr: "Avant" },
  vol:       { en: "Vol",    fr: "Vol" },
  muted:     { en: "Muted",  fr: "Muet" },
  phases: {
    address:       { en: "Address",       fr: "Adresse" },
    backswing:     { en: "Backswing",     fr: "Backswing" },
    top:           { en: "Top",           fr: "Sommet" },
    downswing:     { en: "Downswing",     fr: "Descente" },
    impact:        { en: "Impact",        fr: "Impact" },
    followthrough: { en: "Follow-through",fr: "Finish" },
  },
  metrics: {
    tempo:      { en: "Tempo ratio",       fr: "Ratio de tempo" },
    spineAngle: { en: "Spine angle loss",  fr: "Perte angle colonne" },
    hipSep:     { en: "Hip/shoulder sep.", fr: "Sep. hanches/epaules" },
  },
};

function tx(key) {
  const node = key.split(".").reduce((o, k) => o?.[k], T);
  return node?.[lang] ?? node?.en ?? key;
}

/* ============================================================
   ELEMENTS
   ============================================================ */
const fileFace     = document.getElementById("file-face");
const fileDtl      = document.getElementById("file-dtl");
const modelSelect  = document.getElementById("modelSelect");
const fpsInput     = document.getElementById("fpsInput");
const statusEl     = document.getElementById("status");
const stage        = document.getElementById("stage");
const video        = document.getElementById("video");
const canvas       = document.getElementById("overlay");
const ctx          = canvas.getContext("2d");
const phaseBadge   = document.getElementById("phaseBadge");
const playBtn      = document.getElementById("playBtn");
const stepBack     = document.getElementById("stepBack");
const stepFwd      = document.getElementById("stepFwd");
const speedSelect  = document.getElementById("speedSelect");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const phaseMarkers = document.getElementById("phaseMarkers");
const timeDisplay  = document.getElementById("timeDisplay");
const muteBtn      = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const analyseBtn   = document.getElementById("analyseBtn");
const qualityDot   = document.getElementById("qualityDot");
const qualityText  = document.getElementById("qualityText");
const metricsGrid  = document.getElementById("metricsGrid");
const coachingWrap = document.getElementById("coachingWrap");
const coachingBody = document.getElementById("coachingBody");
const jointReadout = document.getElementById("jointReadout");

const drawingUtils = new DrawingUtils(ctx);

/* ============================================================
   TABS
   ============================================================ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".upload-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.angle}`).classList.add("active");
  });
});

["face", "dtl"].forEach(angle => {
  const zone = document.getElementById(`drop-${angle}`);
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) loadVideo(file);
  });
});

/* ============================================================
   MEDIAPIPE
   ============================================================ */
let poseLandmarker = null;
let lastModel = null;

async function loadModel(which) {
  setStatus(tx("loading"));
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  const paths = {
    lite:  "pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    full:  "pose_landmarker_full/float16/1/pose_landmarker_full.task",
    heavy: "pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  };
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/${paths[which]}`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
  lastModel = which;
  setStatus(tx("modelReady"));
}

async function ensureModel() {
  const which = modelSelect.value;
  if (which !== lastModel || !poseLandmarker) await loadModel(which);
}

modelSelect.addEventListener("change", () => { poseLandmarker = null; lastModel = null; });

/* ============================================================
   KEY JOINTS
   ============================================================ */
const KEY_JOINTS = [
  { name: "L wrist",    idx: 15, critical: true  },
  { name: "R wrist",    idx: 16, critical: true  },
  { name: "L elbow",    idx: 13, critical: false },
  { name: "R elbow",    idx: 14, critical: false },
  { name: "L shoulder", idx: 11, critical: false },
  { name: "R shoulder", idx: 12, critical: false },
  { name: "L hip",      idx: 23, critical: false },
  { name: "R hip",      idx: 24, critical: false },
];

/* ============================================================
   SWING PHASE DETECTION + METRICS
   ============================================================ */
let frameStore = [];
let phases = {};

function resetAnalysis() {
  frameStore = [];
  phases = {};
  phaseMarkers.innerHTML = "";
  metricsGrid.innerHTML = "";
  coachingWrap.hidden = true;
  phaseBadge.textContent = "";
  phaseBadge.classList.remove("visible");
}

function storeFrame(lm, time) {
  if (lm?.length > 0) frameStore.push({ time, lm: lm[0] });
}

function detectPhases() {
  if (frameStore.length < 10) return false;

  const wristY = frameStore.map(f => f.lm[16]?.y ?? 1);
  const n = wristY.length;
  const addressIdx = Math.floor(n * 0.04);

  let topIdx = 0, minY = 99;
  for (let i = addressIdx; i < Math.floor(n * 0.6); i++) {
    if (wristY[i] < minY) { minY = wristY[i]; topIdx = i; }
  }

  let impactIdx = topIdx + 1, maxDrop = 0;
  for (let i = topIdx + 1; i < Math.floor(n * 0.85); i++) {
    const drop = wristY[i] - wristY[i - 1];
    if (drop > maxDrop) { maxDrop = drop; impactIdx = i; }
  }

  const finishIdx = Math.floor(n * 0.92);
  if (impactIdx <= topIdx) return false;

  phases = {
    address: frameStore[addressIdx].time,
    top:     frameStore[topIdx].time,
    impact:  frameStore[impactIdx].time,
    finish:  frameStore[finishIdx].time,
  };
  return true;
}

function calcMetrics() {
  if (!phases.top || !phases.impact || !phases.address) return null;

  const backswing = phases.top    - phases.address;
  const downswing = phases.impact - phases.top;
  const tempo     = downswing > 0 ? backswing / downswing : null;

  function frameAt(time) {
    return frameStore.reduce((best, f) =>
      Math.abs(f.time - time) < Math.abs(best.time - time) ? f : best
    );
  }

  const fAddr   = frameAt(phases.address);
  const fImpact = frameAt(phases.impact);
  const fTop    = frameAt(phases.top);

  const sYAddr   = ((fAddr.lm[11]?.y ?? 0)   + (fAddr.lm[12]?.y ?? 0))   / 2;
  const sYImpact = ((fImpact.lm[11]?.y ?? 0) + (fImpact.lm[12]?.y ?? 0)) / 2;
  const spineLoss = (sYAddr - sYImpact) * 100;

  function lineAngle(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
  }

  const hipAngle = lineAngle(fTop.lm[23]?.x??0, fTop.lm[23]?.y??0, fTop.lm[24]?.x??0, fTop.lm[24]?.y??0);
  const shlAngle = lineAngle(fTop.lm[11]?.x??0, fTop.lm[11]?.y??0, fTop.lm[12]?.x??0, fTop.lm[12]?.y??0);
  const hipShoulderSep = Math.abs(shlAngle - hipAngle);

  return { tempo, spineLoss, hipShoulderSep };
}

/* ============================================================
   METRICS DISPLAY
   ============================================================ */
function renderMetrics(m) {
  metricsGrid.innerHTML = "";

  if (m.tempo !== null) {
    const cls  = m.tempo >= 2.5 ? "good" : m.tempo >= 1.8 ? "warn" : "bad";
    const note = m.tempo >= 2.5
      ? { en: "On tour tempo. Good rhythm.",         fr: "Tempo de tour. Bon rythme." }
      : m.tempo >= 1.8
      ? { en: "Close. Avoid rushing the downswing.", fr: "Proche. Evitez de precipiter la descente." }
      : { en: "Rushing. Slow your backswing.",       fr: "Trop rapide. Ralentissez le backswing." };
    addMetric(tx("metrics.tempo"), `${m.tempo.toFixed(2)} : 1`, note[lang], cls);
  }

  const spineCls  = m.spineLoss < 1.5 ? "good" : m.spineLoss < 3.5 ? "warn" : "bad";
  const spineNote = m.spineLoss < 1.5
    ? { en: "Solid posture maintained.",          fr: "Posture solide maintenue." }
    : m.spineLoss < 3.5
    ? { en: "Slight rise. Watch at impact.",      fr: "Legere montee. Surveillez a l'impact." }
    : { en: "Early extension. Stay in posture.",  fr: "Extension precoce. Restez en posture." };
  addMetric(tx("metrics.spineAngle"), `${m.spineLoss.toFixed(1)}%`, spineNote[lang], spineCls);

  const sepCls  = m.hipShoulderSep > 30 ? "good" : m.hipShoulderSep > 18 ? "warn" : "bad";
  const sepNote = m.hipShoulderSep > 30
    ? { en: "Good X-factor. Power loaded.",                            fr: "Bon X-factor. Puissance chargee." }
    : m.hipShoulderSep > 18
    ? { en: "Moderate separation. Rotate more.",                       fr: "Separation moderee. Tournez davantage." }
    : { en: "Low separation. Hips and shoulders are turning together.", fr: "Faible separation. Hanches et epaules tournent ensemble." };
  addMetric(tx("metrics.hipSep"), `${m.hipShoulderSep.toFixed(0)} deg`, sepNote[lang], sepCls);
}

function addMetric(name, value, note, cls) {
  const card = document.createElement("div");
  card.className = `metric-card ${cls}`;
  card.innerHTML = `
    <div class="metric-name">${name}</div>
    <div class="metric-value">${value}</div>
    <div class="metric-note">${note}</div>
  `;
  metricsGrid.appendChild(card);
}

/* ============================================================
   LLM COACHING
   ============================================================ */
async function fetchCoaching(m, p) {
  const prompt = lang === "fr" ? buildPromptFR(m, p) : buildPromptEN(m, p);
  coachingWrap.hidden = false;
  coachingBody.textContent = "...";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: lang === "fr"
        ? "Tu es un coach de golf specialise dans l'enseignement aux debutantes adultes. Tu donnes des retours clairs, encourageants et actionnables. Tu bases tes conseils uniquement sur les metriques fournies, sans inventer de donnees. Tu reponds toujours en francais."
        : "You are a golf coach specialising in teaching adult female beginners. You give clear, encouraging, and actionable feedback. You base your advice strictly on the provided metrics, never inventing data. You always respond in English.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text ?? "";
  coachingBody.textContent = text;
}

function buildPromptEN(m, p) {
  return `Here are the swing metrics for a female beginner golfer:

Tempo ratio (backswing : downswing): ${m.tempo?.toFixed(2) ?? "N/A"} : 1
(Tour average for women is approximately 3:1. Below 2:1 means rushing the downswing.)

Spine angle loss from address to impact: ${m.spineLoss?.toFixed(1) ?? "N/A"}%
(Below 1.5% is good. Above 3.5% indicates early extension or losing posture.)

Hip-shoulder separation at top of backswing: ${m.hipShoulderSep?.toFixed(0) ?? "N/A"} degrees
(Above 30 degrees is good X-factor and power loading. Below 18 degrees means hips and shoulders are rotating together.)

Phase timings:
Backswing duration: ${p.backswing?.toFixed(2) ?? "N/A"} seconds
Downswing duration: ${p.downswing?.toFixed(2) ?? "N/A"} seconds

Based only on these metrics, write a short coaching note of 4 to 6 sentences. Structure it as follows:
1. One honest observation about what the numbers show.
2. The single most important thing to work on first, with one simple concrete drill she can do today.
3. One encouraging closing sentence that relates to her actual data, not a generic motivational phrase.

Do not mention professional players. Do not invent metrics not listed above. Do not use em dashes.`;
}

function buildPromptFR(m, p) {
  return `Voici les metriques de swing d'une golfeuse debutante :

Ratio de tempo (backswing : descente) : ${m.tempo?.toFixed(2) ?? "N/A"} : 1
(La moyenne sur le tour feminin est d'environ 3:1. En dessous de 2:1, la descente est precipitee.)

Perte d'angle de la colonne vertebrale (adresse a impact) : ${m.spineLoss?.toFixed(1) ?? "N/A"}%
(En dessous de 1,5% c'est bien. Au-dessus de 3,5% indique une extension precoce ou une perte de posture.)

Separation hanches-epaules au sommet du backswing : ${m.hipShoulderSep?.toFixed(0) ?? "N/A"} degres
(Au-dessus de 30 degres c'est un bon X-factor. En dessous de 18 degres, hanches et epaules tournent ensemble.)

Timings des phases :
Duree du backswing : ${p.backswing?.toFixed(2) ?? "N/A"} secondes
Duree de la descente : ${p.downswing?.toFixed(2) ?? "N/A"} secondes

En te basant uniquement sur ces metriques, redige une note de coaching de 4 a 6 phrases. Structure :
1. Une observation honnete sur ce que montrent les chiffres.
2. La chose la plus importante a travailler en premier, avec un exercice simple et concret a faire aujourd'hui.
3. Une phrase de cloture encourageante liee a ses donnees reelles, pas une phrase de motivation generique.

Ne mentionne pas de joueuses professionnelles. N'invente aucune metrique non listee. N'utilise pas de tirets cadratins.`;
}

/* ============================================================
   ANALYSE BUTTON
   ============================================================ */
analyseBtn.addEventListener("click", async () => {
  analyseBtn.disabled = true;
  setStatus(tx("analysing"));

  const detected = detectPhases();
  if (!detected) {
    setStatus(tx("noPhases"));
    analyseBtn.disabled = false;
    return;
  }

  renderPhaseMarkers();
  const m = calcMetrics();
  if (m) {
    renderMetrics(m);
    const p = {
      backswing: phases.top    - phases.address,
      downswing: phases.impact - phases.top,
    };
    await fetchCoaching(m, p);
  }

  setStatus("");
  analyseBtn.disabled = false;
});

/* ============================================================
   PHASE MARKERS
   ============================================================ */
function renderPhaseMarkers() {
  phaseMarkers.innerHTML = "";
  const dur = video.duration || 1;
  ["address", "top", "impact", "finish"].forEach(key => {
    if (!phases[key]) return;
    const pct = (phases[key] / dur) * 100;
    const dot = document.createElement("div");
    dot.className = "phase-marker";
    dot.title = tx(`phases.${key}`);
    dot.style.left = `${pct}%`;
    phaseMarkers.appendChild(dot);
  });
}

function currentPhaseLabel(time) {
  if (!phases.address) return "";
  if (time < phases.address + 0.05) return tx("phases.address");
  if (time < phases.top)            return tx("phases.backswing");
  if (time < phases.top + 0.05)    return tx("phases.top");
  if (time < phases.impact)         return tx("phases.downswing");
  if (time < phases.impact + 0.05) return tx("phases.impact");
  return tx("phases.followthrough");
}

/* ============================================================
   FILE LOADING
   ============================================================ */
[fileFace, fileDtl].forEach(input => {
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) loadVideo(file);
  });
});

async function loadVideo(file) {
  try { await ensureModel(); } catch (e) { setStatus(tx("modelFail")); return; }
  resetAnalysis();
  video.src = URL.createObjectURL(file);
  video.load();
}

video.addEventListener("loadedmetadata", () => {
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  stage.hidden  = false;
  stage.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatus(tx("loaded"));
  detectCurrentFrame();
});

/* ============================================================
   DETECTION + DRAWING
   ============================================================ */
function detectCurrentFrame() {
  if (!poseLandmarker || video.readyState < 2) return;
  const result = poseLandmarker.detectForVideo(video, performance.now());
  drawFrame(result);
  updateQuality(result);
  updatePhaseLabel();
  storeFrame(result.landmarks, video.currentTime);
}

function drawFrame(result) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!result.landmarks?.length) return;
  const lm = result.landmarks[0];

  drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#DEE2B0", lineWidth: 2.5,
  });
  drawingUtils.drawLandmarks(lm, { radius: 4, color: "#8DB2A2" });

  [15, 16].forEach(i => {
    const p = lm[i];
    if (!p) return;
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#E4704B";
    ctx.fill();
  });
}

function updateQuality(result) {
  jointReadout.innerHTML = "";
  if (!result.landmarks?.length) { setDot("#ccc", "--"); return; }
  const lm = result.landmarks[0];
  let minCritical = 1;

  KEY_JOINTS.forEach(j => {
    const v = lm[j.idx]?.visibility ?? 0;
    if (j.critical) minCritical = Math.min(minCritical, v);
    const li = document.createElement("li");
    li.innerHTML = `<span>${j.name}</span><span class="jval" style="color:${colorFor(v)}">${(v*100).toFixed(0)}%</span>`;
    jointReadout.appendChild(li);
  });

  setDot(colorFor(minCritical), `${(minCritical*100).toFixed(0)}%`);
}

function updatePhaseLabel() {
  const label = currentPhaseLabel(video.currentTime);
  if (label) {
    phaseBadge.textContent = label;
    phaseBadge.classList.add("visible");
  } else {
    phaseBadge.classList.remove("visible");
  }
}

function colorFor(v) {
  const s = getComputedStyle(document.documentElement);
  return v >= 0.7 ? s.getPropertyValue("--good").trim()
       : v >= 0.4 ? s.getPropertyValue("--warn").trim()
                  : s.getPropertyValue("--bad").trim();
}

function setDot(color, text) {
  qualityDot.style.background = color;
  qualityText.textContent = text;
}

/* ============================================================
   PLAYBACK LOOP
   ============================================================ */
function loop() {
  if (video.paused || video.ended) { playBtn.textContent = tx("play"); return; }
  detectCurrentFrame();
  updateProgressBar();
  if (video.requestVideoFrameCallback) {
    video.requestVideoFrameCallback(loop);
  } else {
    requestAnimationFrame(loop);
  }
}

playBtn.addEventListener("click", async () => {
  try { await ensureModel(); } catch (e) { setStatus(tx("modelFail")); return; }
  if (video.paused) {
    video.playbackRate = parseFloat(speedSelect.value);
    await video.play();
    playBtn.textContent = tx("pause");
    loop();
  } else {
    video.pause();
    playBtn.textContent = tx("play");
  }
});

video.addEventListener("ended", () => { playBtn.textContent = tx("play"); });
speedSelect.addEventListener("change", () => { video.playbackRate = parseFloat(speedSelect.value); });

/* ============================================================
   FRAME STEPPING
   ============================================================ */
function frameDur() { return 1 / (parseFloat(fpsInput.value) || 30); }

async function step(dir) {
  try { await ensureModel(); } catch (e) { return; }
  video.pause();
  playBtn.textContent = tx("play");
  video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + dir * frameDur()));
}

stepFwd.addEventListener("click",  () => step(1));
stepBack.addEventListener("click", () => step(-1));
video.addEventListener("seeked",   () => { detectCurrentFrame(); updateProgressBar(); });

/* ============================================================
   PROGRESS BAR
   ============================================================ */
function updateProgressBar() {
  const dur = video.duration || 1;
  const pct = (video.currentTime / dur) * 100;
  progressFill.style.width = `${pct}%`;
  timeDisplay.textContent  = `${fmtTime(video.currentTime)} / ${fmtTime(dur)}`;
}

progressWrap.addEventListener("click", e => {
  const rect = progressWrap.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  video.currentTime = pct * (video.duration || 0);
});

function fmtTime(s) {
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

/* ============================================================
   VOLUME
   ============================================================ */
muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  muteBtn.textContent = video.muted ? tx("muted") : tx("vol");
});

volumeSlider.addEventListener("input", () => {
  video.volume = parseFloat(volumeSlider.value);
  video.muted  = video.volume === 0;
  muteBtn.textContent = video.muted ? tx("muted") : tx("vol");
});

/* ============================================================
   UTILS
   ============================================================ */
function setStatus(msg) { statusEl.textContent = msg; }

// Initial lang pass
applyLang();
