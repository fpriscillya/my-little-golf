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
  portrait:  { en: "This looks like a portrait video. Landscape works best so your feet and club stay in frame, but you can continue.", fr: "Cette video semble en mode portrait. Le paysage est preferable pour garder vos pieds et le club dans le cadre, mais vous pouvez continuer." },
  noPerson:  { en: "No clear person detected yet. Check that your whole body, head to feet, stays in the frame.", fr: "Aucune personne clairement detectee. Verifiez que tout votre corps, de la tete aux pieds, reste dans le cadre." },
  multiPerson: { en: "More than one person detected in your video. Press Select player to choose who to analyse.", fr: "Plusieurs personnes detectees dans votre video. Appuyez sur Selectionner la joueuse pour choisir qui analyser." },
  drawBox:   { en: "Draw a box around yourself: press and drag over the player you want to analyse. Draw it generously to allow for movement.", fr: "Dessinez un cadre autour de vous : appuyez et glissez sur la joueuse a analyser. Dessinez-le large pour laisser de la place au mouvement." },
  boxSet:    { en: "Player selected. Now play or step through to analyse. Draw again to change.", fr: "Joueuse selectionnee. Lancez ou avancez pour analyser. Redessinez pour changer." },
  needBox:   { en: "Draw a box around yourself first, on the video above.", fr: "Dessinez d'abord un cadre autour de vous, sur la video ci-dessus." },
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
    numPoses: 3,
    // Higher thresholds make the model more reluctant to report a pose,
    // which rejects most non-human objects (e.g. a golf bag).
    minPoseDetectionConfidence: 0.7,
    minPosePresenceConfidence: 0.7,
    minTrackingConfidence: 0.7,
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

// Player selection box, normalised coords {x, y, w, h} (0-1). Null until drawn.
let playerBox = null;
let boxDrawing = false;
let boxStart = null;
let selectMode = false; // true only while the user is choosing a player
let multiPersonChecked = false; // whether we have already checked for multiple people

/* Pick the pose whose hip midpoint falls inside the player box.
   If no box yet, or none match, returns null. */
function poseInBox(landmarksArray) {
  if (!playerBox || !landmarksArray?.length) return null;
  for (const pose of landmarksArray) {
    const hipX = ((pose[23]?.x ?? 0) + (pose[24]?.x ?? 0)) / 2;
    const hipY = ((pose[23]?.y ?? 0) + (pose[24]?.y ?? 0)) / 2;
    if (
      hipX >= playerBox.x && hipX <= playerBox.x + playerBox.w &&
      hipY >= playerBox.y && hipY <= playerBox.y + playerBox.h
    ) {
      return pose;
    }
  }
  return null;
}

function resetAnalysis() {
  frameStore = [];
  phases = {};
  playerBox = null;
  boxDrawing = false;
  boxStart = null;
  selectMode = false;
  multiPersonChecked = false;
  canvas.classList.remove("selecting");
  const clr = document.getElementById("clearBoxBtn");
  if (clr) clr.hidden = true;
  phaseMarkers.innerHTML = "";
  metricsGrid.innerHTML = "";
  coachingWrap.hidden = true;
  phaseBadge.textContent = "";
  phaseBadge.classList.remove("visible");
}

function storeFrame(pose, time) {
  if (!pose) return;
  // Require core body joints (shoulders + hips) to be visible enough.
  // This filters out frames where the model fit a skeleton onto an object.
  const coreVis = [11, 12, 23, 24]
    .map(i => pose[i]?.visibility ?? 0)
    .reduce((a, b) => a + b, 0) / 4;
  if (coreVis < 0.6) return; // not a confident human pose, skip
  frameStore.push({ time, lm: pose });
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
   RULE-BASED COACHING ENGINE
   No API key, no server. Works on GitHub Pages. Open source.
   ============================================================ */

const COACHING = {

  /* ---- TEMPO ---- */
  tempo: {
    good: {
      en: "Your rhythm is already in a good place. Your backswing gives the club time to load before the downswing fires.",
      fr: "Votre rythme est deja bien etabli. Votre backswing laisse le temps au club de se charger avant que la descente parte.",
    },
    warn: {
      en: "Your tempo is close but the downswing is a touch quick. You have the right instinct, just give the backswing one extra beat.",
      fr: "Votre tempo est proche mais la descente est un peu rapide. Vous avez le bon instinct, donnez juste un temps de plus au backswing.",
    },
    bad: {
      en: "Your downswing is rushing ahead of the backswing. This is the most common beginner pattern and it costs distance and direction.",
      fr: "Votre descente part avant que le backswing soit fini. C'est le schema le plus courant chez les debutantes et il fait perdre en distance et en direction.",
    },
    drill: {
      en: "Tempo drill: without a club, cross your arms over your chest and count out loud, 'one, two, three' on the backswing, then 'one' on the downswing. Repeat ten times until the rhythm feels natural, then pick up the club and keep that same count.",
      fr: "Exercice de tempo : sans club, croisez les bras sur la poitrine et comptez a voix haute 'un, deux, trois' sur le backswing, puis 'un' sur la descente. Repetez dix fois jusqu'a ce que le rythme soit naturel, puis reprenez le club en gardant ce meme compte.",
    },
  },

  /* ---- SPINE / POSTURE ---- */
  spine: {
    good: {
      en: "Your posture stays solid from address to impact. That consistency is what lets everything else work.",
      fr: "Votre posture reste solide de l'adresse a l'impact. Cette regularite est ce qui permet a tout le reste de fonctionner.",
    },
    warn: {
      en: "There is a slight rise in your upper body through the shot. Most of the time you hold it well, but impact is where it slips.",
      fr: "Il y a une legere montee du haut du corps pendant le coup. La plupart du temps vous la tenez bien, mais c'est a l'impact que ca glisse.",
    },
    bad: {
      en: "Your upper body rises noticeably between address and impact. This is called early extension and it is the main reason shots feel inconsistent.",
      fr: "Votre haut du corps monte sensiblement entre l'adresse et l'impact. C'est ce qu'on appelle l'extension precoce et c'est la principale raison pour laquelle les coups semblent irreguliers.",
    },
    drill: {
      en: "Posture drill: take your address position facing a wall, close enough that your backside just touches it. Make slow practice swings keeping your backside on the wall throughout. If it lifts off, you are rising. Do this fifteen times before every session.",
      fr: "Exercice de posture : prenez votre position d'adresse face a un mur, assez pres pour que vos fesses le touchent a peine. Faites des swings lents en gardant les fesses contre le mur du debut a la fin. Si elles s'en ecartent, vous montez. Faites cela quinze fois avant chaque seance.",
    },
  },

  /* ---- HEAD STABILITY ---- */
  head: {
    good: {
      en: "Your head stays calm through the swing. That steady centre is what lets the club find the ball consistently.",
      fr: "Votre tete reste calme pendant le swing. Ce centre stable est ce qui permet au club de trouver la balle regulierement.",
    },
    warn: {
      en: "Your head moves a little through the swing. A small amount is normal but keeping it quieter will sharpen your contact.",
      fr: "Votre tete bouge un peu pendant le swing. Une petite quantite est normale mais la garder plus calme ameliorera la qualite de votre contact.",
    },
    bad: {
      en: "Your head is moving quite a bit from address to impact. When the head sways, the whole swing has to compensate at the last moment to find the ball.",
      fr: "Votre tete bouge beaucoup de l'adresse a l'impact. Quand la tete se balance, tout le swing doit compenser au dernier moment pour trouver la balle.",
    },
    drill: {
      en: "Head drill: ask a friend to hold a finger lightly on top of your cap at address. Make practice swings trying not to push the finger up or sideways. No friend available: stand next to a wall so your hair just grazes it, and swing without letting your head press into the wall. Ten swings.",
      fr: "Exercice de tete : demandez a une amie de poser un doigt legèrement sur votre casquette a l'adresse. Faites des swings en essayant de ne pas pousser le doigt vers le haut ou sur le cote. Pas d'amie disponible : tenez-vous pres d'un mur pour que vos cheveux l'effleurent, et swinguez sans laisser votre tete appuyer contre le mur. Dix swings.",
    },
  },

  /* ---- SHOULDER TURN ---- */
  shoulder: {
    good: {
      en: "Your shoulder turn at the top is full and committed. That coil is where your distance comes from.",
      fr: "Votre rotation des epaules au sommet est complete et engagee. C'est cet armement qui est la source de votre distance.",
    },
    warn: {
      en: "Your shoulder turn is moderate. You are rotating but there is more available, and more turn means more power without swinging harder.",
      fr: "Votre rotation des epaules est moderee. Vous tournez mais il y a plus a chercher, et plus de rotation signifie plus de puissance sans swinguer plus fort.",
    },
    bad: {
      en: "Your shoulders are not turning very far back. The swing is mostly arms and hands right now, which is why it can feel like a lot of effort for not much result.",
      fr: "Vos epaules ne tournent pas très loin en arriere. Le swing est surtout bras et mains pour l'instant, ce qui explique que ca peut sembler beaucoup d'effort pour peu de resultat.",
    },
    drill: {
      en: "Turn drill: hold a club across your shoulders behind your neck with both hands. From your address posture, rotate until the right end of the club points at the ball. Hold for two seconds. That is how far your shoulders should go. Repeat twenty times daily.",
      fr: "Exercice de rotation : tenez un club sur vos epaules derriere la nuque avec les deux mains. A partir de votre posture d'adresse, tournez jusqu'a ce que l'extremite droite du club pointe vers la balle. Tenez deux secondes. C'est la distance que vos epaules devraient parcourir. Repetez vingt fois par jour.",
    },
  },

  /* ---- WEIGHT SHIFT ---- */
  weight: {
    good: {
      en: "Your weight moves into the shot well. That transfer is what separates a push from a real strike.",
      fr: "Votre poids se transfere bien dans le coup. Ce transfert est ce qui distingue une poussee d'un vrai impact.",
    },
    warn: {
      en: "There is some weight shift but it is not quite completing into your front side through impact.",
      fr: "Il y a un debut de transfert de poids mais il ne se complete pas tout a fait vers le cote avant a l'impact.",
    },
    bad: {
      en: "Your weight is staying too static through the swing. Without that shift forward, you end up hitting at the ball rather than through it.",
      fr: "Votre poids reste trop statique pendant le swing. Sans ce deplacement vers l'avant, vous finissez par frapper sur la balle plutot qu'a travers elle.",
    },
    drill: {
      en: "Weight shift drill: stand with a ball or rolled towel under your back heel at address. Make practice swings. The pressure of the ball under your heel will remind you to shift forward. Your back heel should naturally rise as you swing through. Ten swings.",
      fr: "Exercice de transfert : placez une balle ou une serviette roulee sous votre talon arriere a l'adresse. Faites des swings. La pression de la balle sous votre talon vous rappellera de vous deplacer vers l'avant. Votre talon arriere devrait naturellement se lever en swinguant. Dix swings.",
    },
  },

  /* ---- HIP SHOULDER SEPARATION ---- */
  separation: {
    good: {
      en: "The gap between your hips and shoulders at the top is there. That coil stores the energy that drives the ball.",
      fr: "L'ecart entre vos hanches et vos epaules au sommet est present. Cet armement stocke l'energie qui propulse la balle.",
    },
    warn: {
      en: "Your hips and shoulders are turning together a little. More separation between them at the top means more stored energy on the way down.",
      fr: "Vos hanches et vos epaules tournent un peu ensemble. Plus de separation entre elles au sommet signifie plus d'energie stockee dans la descente.",
    },
    bad: {
      en: "Your hips and shoulders are turning as one unit. When they move together there is no coil, and power comes from coil, not from swinging harder.",
      fr: "Vos hanches et vos epaules tournent comme une seule unite. Quand elles bougent ensemble il n'y a pas d'armement, et la puissance vient de l'armement, pas de swinguer plus fort.",
    },
    drill: {
      en: "Separation drill: cross your arms over your chest. From address, try to turn your shoulders as far as possible while resisting with your hips, keeping them as quiet as you can. You will feel a stretch across your lower back. That is the coil. Hold three seconds, release. Repeat fifteen times.",
      fr: "Exercice de separation : croisez les bras sur la poitrine. A partir de l'adresse, essayez de tourner vos epaules le plus loin possible en resisant avec vos hanches, en les gardant aussi immobiles que possible. Vous sentirez un etirement dans le bas du dos. C'est l'armement. Tenez trois secondes, relâchez. Repetez quinze fois.",
    },
  },

  /* ---- FOLLOW THROUGH ---- */
  followThrough: {
    good: {
      en: "Your finish is full and committed. You are swinging through the ball, not at it.",
      fr: "Votre finish est complet et engage. Vous swinguez a travers la balle, pas sur la balle.",
    },
    warn: {
      en: "Your finish is partial. The swing is decelerating a little before it completes, which costs you both distance and direction.",
      fr: "Votre finish est partiel. Le swing decelere un peu avant de se completer, ce qui vous coute en distance et en direction.",
    },
    bad: {
      en: "Your swing is stopping around impact. This usually means you are focused on hitting the ball rather than swinging through it. The ball just happens to be in the way of the swing.",
      fr: "Votre swing s'arrete autour de l'impact. Cela signifie generalement que vous vous concentrez sur le fait de frapper la balle plutot que de swinguer a travers elle. La balle se trouve juste sur le chemin du swing.",
    },
    drill: {
      en: "Finish drill: make practice swings with the sole goal of holding a full balanced finish for three seconds, weight on your front foot, belt buckle facing the target, back heel up. Do not worry about anything else. Ten swings, all held at the finish.",
      fr: "Exercice de finish : faites des swings avec pour seul objectif de tenir un finish complet et equilibre pendant trois secondes, poids sur le pied avant, boucle de ceinture face a la cible, talon arriere leve. Ne vous preoccupez de rien d'autre. Dix swings, tous tenus au finish.",
    },
  },

  /* ---- ENCOURAGEMENT tied to best metric ---- */
  encouragement: {
    tempo_good: {
      en: "Your rhythm is genuinely one of the hardest things to teach and you already have it. Build everything else on that foundation.",
      fr: "Votre rythme est vraiment l'une des choses les plus difficiles a enseigner et vous l'avez deja. Construisez tout le reste sur cette base.",
    },
    spine_good: {
      en: "Maintaining your posture through the shot is something many golfers struggle with for years. You are already doing it.",
      fr: "Maintenir votre posture pendant le coup est quelque chose avec lequel beaucoup de golfeuses luttent pendant des annees. Vous le faites deja.",
    },
    head_good: {
      en: "A steady head through the swing is a quiet superpower. It means your contact will stay consistent even as other things improve.",
      fr: "Une tete stable pendant le swing est un super-pouvoir discret. Cela signifie que votre contact restera regulier meme quand d'autres elements s'ameliorent.",
    },
    shoulder_good: {
      en: "That shoulder turn is a real asset. Most beginners shorten the backswing out of instinct and lose all the power. You are not doing that.",
      fr: "Cette rotation des epaules est un vrai atout. La plupart des debutantes raccourcissent le backswing par instinct et perdent toute la puissance. Vous, non.",
    },
    weight_good: {
      en: "Transferring your weight through the shot is something that takes many beginners months to feel. You are already moving in the right direction.",
      fr: "Transferer son poids a travers le coup est quelque chose qui prend des mois a beaucoup de debutantes. Vous vous deplacez deja dans la bonne direction.",
    },
    finish_good: {
      en: "That full finish tells me you are committing to the swing, not just poking at the ball. That trust is everything in golf.",
      fr: "Ce finish complet me dit que vous vous engagez dans le swing, que vous ne vous contentez pas de piquer la balle. Cette confiance est tout en golf.",
    },
    default: {
      en: "Every swing gives you more data than the last one. Keep filming, keep comparing, and the improvements will compound.",
      fr: "Chaque swing vous donne plus de donnees que le precedent. Continuez a filmer, a comparer, et les progres s'accumuleront.",
    },
  },
};

/* Pick the weakest metric to give one priority drill */
function weakestMetric(m) {
  const scores = [
    { key: "tempo",     score: m.tempo ?? 99,           bad: v => v < 1.8  },
    { key: "spine",     score: m.spineLoss ?? 0,         bad: v => v > 3.5  },
    { key: "head",      score: m.headMove ?? 0,          bad: v => v > 8    },
    { key: "shoulder",  score: m.shoulderTurn ?? 99,     bad: v => v < 8    },
    { key: "weight",    score: m.weightShift ?? 99,      bad: v => v < 1.5  },
    { key: "separation",score: m.hipShoulderSep ?? 99,   bad: v => v < 18   },
    { key: "followThrough", score: m.followThrough ?? 99, bad: v => v < 35  },
  ];
  // Return first one that is in "bad" range, otherwise first in "warn" range.
  const bad = scores.find(s => s.bad(s.score));
  if (bad) return bad.key;
  const warns = {
    tempo:        m.tempo != null && m.tempo < 2.5,
    spine:        m.spineLoss > 1.5,
    head:         m.headMove != null && m.headMove > 4,
    shoulder:     m.shoulderTurn < 18,
    weight:       m.weightShift < 4,
    separation:   m.hipShoulderSep < 30,
    followThrough:m.followThrough < 55,
  };
  return Object.keys(warns).find(k => warns[k]) ?? "tempo";
}

/* Pick the strongest metric for the encouragement line */
function bestMetric(m) {
  if (m.tempo != null && m.tempo >= 2.5)         return "tempo_good";
  if (m.spineLoss < 1.5)                          return "spine_good";
  if (m.headMove != null && m.headMove < 4)       return "head_good";
  if (m.shoulderTurn > 18)                        return "shoulder_good";
  if (m.weightShift > 4)                          return "weight_good";
  if (m.followThrough > 55)                       return "finish_good";
  return "default";
}

/* Classify a metric into good / warn / bad */
function classify(key, m) {
  const v = {
    tempo:        m.tempo,
    spine:        m.spineLoss,
    head:         m.headMove,
    shoulder:     m.shoulderTurn,
    weight:       m.weightShift,
    separation:   m.hipShoulderSep,
    followThrough:m.followThrough,
  }[key];
  const good = {
    tempo:        v => v >= 2.5,
    spine:        v => v < 1.5,
    head:         v => v < 4,
    shoulder:     v => v > 18,
    weight:       v => v > 4,
    separation:   v => v > 30,
    followThrough:v => v > 55,
  }[key];
  const bad = {
    tempo:        v => v < 1.8,
    spine:        v => v > 3.5,
    head:         v => v > 8,
    shoulder:     v => v < 8,
    weight:       v => v < 1.5,
    separation:   v => v < 18,
    followThrough:v => v < 35,
  }[key];
  if (v == null) return "warn";
  if (good(v)) return "good";
  if (bad(v))  return "bad";
  return "warn";
}

function generateCoaching(m) {
  const L = lang;
  const worst = weakestMetric(m);
  const best  = bestMetric(m);

  const tempoClass = classify("tempo", m);
  const spineClass = classify("spine", m);
  const headClass  = classify("head",  m);
  const shoulderClass  = classify("shoulder",    m);
  const weightClass    = classify("weight",      m);
  const followClass    = classify("followThrough", m);

  const section1Label = L === "fr" ? "Position et tempo" : "Setup and tempo";
  const section2Label = L === "fr" ? "Rotation et puissance" : "Turn and power";
  const section3Label = L === "fr" ? "A travers la balle" : "Through the ball";

  const s1 = [
    COACHING.tempo[tempoClass][L],
    COACHING.spine[spineClass][L],
    ...(m.headMove != null ? [COACHING.head[headClass][L]] : []),
  ].join(" ");

  const s2 = [
    COACHING.shoulder[shoulderClass][L],
    COACHING.weight[weightClass][L],
  ].join(" ");

  const s3 = [
    COACHING.followThrough[followClass][L],
    COACHING[worst]?.drill?.[L] ?? COACHING.tempo.drill[L],
    COACHING.encouragement[best][L],
  ].join(" ");

  return `<strong>${section1Label}</strong>${s1}\n\n<strong>${section2Label}</strong>${s2}\n\n<strong>${section3Label}</strong>${s3}`;
}

function fetchCoaching(m) {
  coachingWrap.hidden = false;
  coachingBody.innerHTML = generateCoaching(m);
}

/* ============================================================
   ANALYSE BUTTON
   ============================================================ */
analyseBtn.addEventListener("click", async () => {
  analyseBtn.disabled = true;
  setStatus(tx("analysing"));

  // If almost no confident human frames were captured, it was likely
  // an object (e.g. a golf bag) or the body was out of frame.
  if (frameStore.length < 10) {
    setStatus(tx("noPerson"));
    analyseBtn.disabled = false;
    return;
  }

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
    fetchCoaching(m);
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

  // Portrait nudge. The player box is optional, mentioned gently.
  if (video.videoHeight > video.videoWidth) {
    setStatus(tx("portrait") + " " + tx("loaded"));
  } else {
    setStatus(tx("loaded"));
  }
  detectCurrentFrame();
});

/* ============================================================
   PLAYER BOX DRAWING (mouse + touch)
   ============================================================ */
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) / rect.width,
    y: (src.clientY - rect.top) / rect.height,
  };
}

function startBox(e) {
  if (!selectMode) return; // only draw when in select mode
  e.preventDefault();
  boxDrawing = true;
  boxStart = canvasPoint(e);
  playerBox = null;
}

function moveBox(e) {
  if (!boxDrawing) return;
  e.preventDefault();
  const p = canvasPoint(e);
  playerBox = {
    x: Math.min(boxStart.x, p.x),
    y: Math.min(boxStart.y, p.y),
    w: Math.abs(p.x - boxStart.x),
    h: Math.abs(p.y - boxStart.y),
  };
  detectCurrentFrame();
}

function endBox(e) {
  if (!boxDrawing) return;
  e.preventDefault();
  boxDrawing = false;
  // Ignore tiny accidental boxes.
  if (!playerBox || playerBox.w < 0.05 || playerBox.h < 0.05) {
    playerBox = null;
    setStatus(tx("drawBox"));
    return;
  }
  selectMode = false;
  canvas.classList.remove("selecting");
  if (clearBoxBtn) clearBoxBtn.hidden = false;
  setStatus(tx("boxSet"));
  detectCurrentFrame();
}

canvas.addEventListener("mousedown", startBox);
canvas.addEventListener("mousemove", moveBox);
canvas.addEventListener("mouseup",   endBox);
canvas.addEventListener("touchstart", startBox, { passive: false });
canvas.addEventListener("touchmove",  moveBox,  { passive: false });
canvas.addEventListener("touchend",   endBox,   { passive: false });

// Select player / clear buttons
const selectPlayerBtn = document.getElementById("selectPlayerBtn");
const clearBoxBtn     = document.getElementById("clearBoxBtn");

if (selectPlayerBtn) {
  selectPlayerBtn.addEventListener("click", () => {
    video.pause();
    playBtn.textContent = tx("play");
    selectMode = true;
    canvas.classList.add("selecting");
    setStatus(tx("drawBox"));
  });
}

if (clearBoxBtn) {
  clearBoxBtn.addEventListener("click", () => {
    playerBox = null;
    selectMode = false;
    canvas.classList.remove("selecting");
    clearBoxBtn.hidden = true;
    setStatus(tx("loaded"));
    detectCurrentFrame();
  });
}

/* ============================================================
   DETECTION + DRAWING
   ============================================================ */
function detectCurrentFrame() {
  if (!poseLandmarker || video.readyState < 2) return;
  const result = poseLandmarker.detectForVideo(video, performance.now());

  // One-time check: if multiple people detected, nudge the user to select.
  if (!multiPersonChecked && result.landmarks?.length > 1 && !playerBox) {
    multiPersonChecked = true;
    setStatus(tx("multiPerson"));
  } else if (!multiPersonChecked && result.landmarks?.length <= 1) {
    multiPersonChecked = true; // single person, no nudge needed
  }

  // Choose the pose inside the player box. Before a box is drawn,
  // fall back to the first detected pose so the preview still shows.
  const chosen = playerBox
    ? poseInBox(result.landmarks)
    : (result.landmarks?.[0] ?? null);

  drawFrame(result, chosen);
  updateQuality(chosen);
  updatePhaseLabel();
  if (chosen) storeFrame(chosen, video.currentTime);
}

function drawFrame(result, chosen) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the player box if one exists.
  if (playerBox) {
    ctx.strokeStyle = "#E4704B";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(
      playerBox.x * canvas.width,
      playerBox.y * canvas.height,
      playerBox.w * canvas.width,
      playerBox.h * canvas.height
    );
    ctx.setLineDash([]);
  }

  // Dim the non-selected people lightly so the chosen one stands out.
  if (result.landmarks?.length) {
    result.landmarks.forEach(lm => {
      if (lm === chosen) return;
      drawingUtils.drawLandmarks(lm, { radius: 2, color: "rgba(180,181,109,0.35)" });
    });
  }

  // Draw the chosen player's skeleton in full colour.
  if (chosen) {
    drawingUtils.drawConnectors(chosen, PoseLandmarker.POSE_CONNECTIONS, {
      color: "#DEE2B0", lineWidth: 2.5,
    });
    drawingUtils.drawLandmarks(chosen, { radius: 4, color: "#8DB2A2" });
    [15, 16].forEach(i => {
      const p = chosen[i];
      if (!p) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#E4704B";
      ctx.fill();
    });
  }
}

function updateQuality(chosen) {
  jointReadout.innerHTML = "";
  if (!chosen) { setDot("#ccc", "--"); return; }
  let minCritical = 1;

  KEY_JOINTS.forEach(j => {
    const v = chosen[j.idx]?.visibility ?? 0;
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
