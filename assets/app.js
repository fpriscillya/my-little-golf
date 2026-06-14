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
    weightShift:{ en: "Weight shift",      fr: "Transfert de poids" },
    headMove:   { en: "Head stability",    fr: "Stabilite de tete" },
    shoulderTurn:{ en: "Shoulder turn",    fr: "Rotation epaules" },
    followThru: { en: "Follow-through",    fr: "Finish" },
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
  const fFinish = frameAt(phases.finish);

  // --- Spine angle loss (shoulder midpoint rise from address to impact) ---
  const sYAddr   = ((fAddr.lm[11]?.y ?? 0)   + (fAddr.lm[12]?.y ?? 0))   / 2;
  const sYImpact = ((fImpact.lm[11]?.y ?? 0) + (fImpact.lm[12]?.y ?? 0)) / 2;
  const spineLoss = (sYAddr - sYImpact) * 100;

  function lineAngle(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
  }

  // --- Hip / shoulder separation at top ---
  const hipAngle = lineAngle(fTop.lm[23]?.x??0, fTop.lm[23]?.y??0, fTop.lm[24]?.x??0, fTop.lm[24]?.y??0);
  const shlAngle = lineAngle(fTop.lm[11]?.x??0, fTop.lm[11]?.y??0, fTop.lm[12]?.x??0, fTop.lm[12]?.y??0);
  const hipShoulderSep = Math.abs(shlAngle - hipAngle);

  // --- NEW: Weight shift (hip midpoint horizontal travel, address to impact) ---
  // Positive = hips moved toward target. Expressed as % of frame width.
  const hipXAddr   = ((fAddr.lm[23]?.x ?? 0)   + (fAddr.lm[24]?.x ?? 0))   / 2;
  const hipXImpact = ((fImpact.lm[23]?.x ?? 0) + (fImpact.lm[24]?.x ?? 0)) / 2;
  const weightShift = Math.abs(hipXImpact - hipXAddr) * 100;

  // --- NEW: Head stability (nose travel from address to impact) ---
  // Lower is better. Good players keep the head fairly still. % of frame.
  const noseAddr   = fAddr.lm[0];
  const noseImpact = fImpact.lm[0];
  const headMove = noseAddr && noseImpact
    ? Math.hypot((noseImpact.x - noseAddr.x), (noseImpact.y - noseAddr.y)) * 100
    : null;

  // --- NEW: Shoulder turn at top (rotation away from address line) ---
  // Compares shoulder line tilt at top vs address. Bigger change = fuller turn.
  const shlAngleAddr = lineAngle(fAddr.lm[11]?.x??0, fAddr.lm[11]?.y??0, fAddr.lm[12]?.x??0, fAddr.lm[12]?.y??0);
  const shoulderTurn = Math.abs(shlAngle - shlAngleAddr);

  // --- NEW: Follow-through extension (wrist height at finish vs top) ---
  // Confirms she swings through rather than quitting at the ball.
  const wristYTop    = Math.min(fTop.lm[15]?.y ?? 1,    fTop.lm[16]?.y ?? 1);
  const wristYFinish = Math.min(fFinish.lm[15]?.y ?? 1, fFinish.lm[16]?.y ?? 1);
  // If wrists return high at finish, follow-through completed.
  const followThrough = (1 - wristYFinish) * 100;

  return {
    tempo, spineLoss, hipShoulderSep,
    weightShift, headMove, shoulderTurn, followThrough,
  };
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

  // --- Weight shift ---
  const wsCls  = m.weightShift > 4 ? "good" : m.weightShift > 1.5 ? "warn" : "bad";
  const wsNote = m.weightShift > 4
    ? { en: "Weight moves into the shot. Athletic.", fr: "Le poids avance dans le coup. Athletique." }
    : m.weightShift > 1.5
    ? { en: "Some transfer. Drive into your lead side.", fr: "Transfert present. Poussez vers le cote avant." }
    : { en: "Little weight shift. Move onto your front foot.", fr: "Peu de transfert. Avancez sur le pied avant." };
  addMetric(tx("metrics.weightShift"), `${m.weightShift.toFixed(1)}%`, wsNote[lang], wsCls);

  // --- Head stability ---
  if (m.headMove !== null) {
    const hmCls  = m.headMove < 4 ? "good" : m.headMove < 8 ? "warn" : "bad";
    const hmNote = m.headMove < 4
      ? { en: "Head stays steady. Great centre.", fr: "Tete stable. Bon centre." }
      : m.headMove < 8
      ? { en: "Slight sway. Keep your head quiet.", fr: "Leger balancement. Gardez la tete calme." }
      : { en: "Head moves a lot. Stay centred over the ball.", fr: "La tete bouge beaucoup. Restez centree sur la balle." };
    addMetric(tx("metrics.headMove"), `${m.headMove.toFixed(1)}%`, hmNote[lang], hmCls);
  }

  // --- Shoulder turn ---
  const stCls  = m.shoulderTurn > 18 ? "good" : m.shoulderTurn > 8 ? "warn" : "bad";
  const stNote = m.shoulderTurn > 18
    ? { en: "Full shoulder turn. Good coil.", fr: "Rotation complete. Bon armement." }
    : m.shoulderTurn > 8
    ? { en: "Moderate turn. Rotate further back.", fr: "Rotation moderee. Tournez plus loin." }
    : { en: "Short turn. Let your shoulders rotate fully.", fr: "Rotation courte. Laissez les epaules tourner." };
  addMetric(tx("metrics.shoulderTurn"), `${m.shoulderTurn.toFixed(0)} deg`, stNote[lang], stCls);

  // --- Follow-through ---
  const ftCls  = m.followThrough > 55 ? "good" : m.followThrough > 35 ? "warn" : "bad";
  const ftNote = m.followThrough > 55
    ? { en: "Full finish. You swing through.", fr: "Finish complet. Vous traversez la balle." }
    : m.followThrough > 35
    ? { en: "Partial finish. Commit through impact.", fr: "Finish partiel. Engagez-vous a travers l'impact." }
    : { en: "Short finish. Do not quit at the ball.", fr: "Finish court. Ne vous arretez pas a la balle." };
  addMetric(tx("metrics.followThru"), `${m.followThrough.toFixed(0)}%`, ftNote[lang], ftCls);
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
  return `Here are the swing metrics for a female beginner golfer, all measured from body tracking on a face-on video. Note: this angle cannot see the clubface or wrist angle, so do not comment on those.

TEMPO
Tempo ratio (backswing : downswing): ${m.tempo?.toFixed(2) ?? "N/A"} : 1
(Tour average for women is around 3:1. Below 2:1 means rushing the downswing.)
Backswing duration: ${p.backswing?.toFixed(2) ?? "N/A"}s. Downswing duration: ${p.downswing?.toFixed(2) ?? "N/A"}s.

POSTURE AND CENTRE
Spine angle loss, address to impact: ${m.spineLoss?.toFixed(1) ?? "N/A"}% (below 1.5% good, above 3.5% is early extension).
Head stability, total head travel address to impact: ${m.headMove?.toFixed(1) ?? "N/A"}% (below 4% steady, above 8% is swaying).

ROTATION AND POWER
Shoulder turn from address to top: ${m.shoulderTurn?.toFixed(0) ?? "N/A"} degrees (above 18 is a full turn).
Hip-shoulder separation at top: ${m.hipShoulderSep?.toFixed(0) ?? "N/A"} degrees (above 30 good coil, below 18 they turn together).
Weight shift toward target, address to impact: ${m.weightShift?.toFixed(1) ?? "N/A"}% (above 4% athletic, below 1.5% too static).

FINISH
Follow-through completion: ${m.followThrough?.toFixed(0) ?? "N/A"}% (above 55% full finish, below 35% means quitting at the ball).

Write a warm, encouraging coaching note of about 6 to 8 sentences, in a friendly tone, as if speaking to a beginner you want to keep motivated. Structure it in three short parts using these exact labels on their own line:

Setup and tempo:
Then one or two sentences on what the tempo, posture and head numbers show.

Turn and power:
Then one or two sentences on the rotation, separation and weight shift numbers.

Through the ball:
Then one sentence on the finish, then name the single most important thing to work on first with one simple concrete drill she can do today, and end with one genuine encouraging line tied to her actual numbers.

Comment only on metrics provided. Do not invent clubface, grip, or ball-flight detail. Do not mention professional players. Do not use em dashes.`;
}

function buildPromptFR(m, p) {
  return `Voici les metriques de swing d'une golfeuse debutante, mesurees a partir du suivi du corps sur une video de face. Note : cet angle ne permet pas de voir la face du club ni l'angle du poignet, donc ne commente pas ces elements.

TEMPO
Ratio de tempo (backswing : descente) : ${m.tempo?.toFixed(2) ?? "N/A"} : 1
(Moyenne du tour feminin environ 3:1. En dessous de 2:1, la descente est precipitee.)
Duree backswing : ${p.backswing?.toFixed(2) ?? "N/A"}s. Duree descente : ${p.downswing?.toFixed(2) ?? "N/A"}s.

POSTURE ET CENTRE
Perte d'angle de colonne, adresse a impact : ${m.spineLoss?.toFixed(1) ?? "N/A"}% (en dessous de 1,5% bien, au-dessus de 3,5% extension precoce).
Stabilite de tete, deplacement total adresse a impact : ${m.headMove?.toFixed(1) ?? "N/A"}% (en dessous de 4% stable, au-dessus de 8% balancement).

ROTATION ET PUISSANCE
Rotation des epaules, adresse au sommet : ${m.shoulderTurn?.toFixed(0) ?? "N/A"} degres (au-dessus de 18 rotation complete).
Separation hanches-epaules au sommet : ${m.hipShoulderSep?.toFixed(0) ?? "N/A"} degres (au-dessus de 30 bon armement, en dessous de 18 elles tournent ensemble).
Transfert de poids vers la cible, adresse a impact : ${m.weightShift?.toFixed(1) ?? "N/A"}% (au-dessus de 4% athletique, en dessous de 1,5% trop statique).

FINISH
Completion du finish : ${m.followThrough?.toFixed(0) ?? "N/A"}% (au-dessus de 55% finish complet, en dessous de 35% elle s'arrete a la balle).

Redige une note de coaching chaleureuse et encourageante d'environ 6 a 8 phrases, sur un ton amical, comme si tu parlais a une debutante que tu veux garder motivee. Structure en trois courtes parties avec ces libelles exacts, chacun sur sa propre ligne :

Position et tempo :
Puis une ou deux phrases sur ce que montrent le tempo, la posture et la tete.

Rotation et puissance :
Puis une ou deux phrases sur la rotation, la separation et le transfert de poids.

A travers la balle :
Puis une phrase sur le finish, puis nomme la chose la plus importante a travailler en premier avec un exercice simple et concret a faire aujourd'hui, et termine par une vraie phrase d'encouragement liee a ses chiffres reels.

Commente uniquement les metriques fournies. N'invente aucun detail de face de club, de prise ou de trajectoire. Ne mentionne pas de joueuses professionnelles. N'utilise pas de tirets cadratins.`;
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
