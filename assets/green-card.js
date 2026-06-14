/* ============================================================
   GREEN CARD PAGE — language toggle + quiz
   ============================================================ */
let lang = "en";

function applyLang() {
  document.querySelectorAll("[data-en]").forEach(el => {
    const key = `data-${lang}`;
    if (el.hasAttribute(key)) el.textContent = el.getAttribute(key);
  });
  renderQuiz(); // re-render quiz in new language
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
   QUIZ DATA
   Grounded in current Rules of Golf and carte verte themes.
   correct = index of right option.
   ============================================================ */
const QUESTIONS = [
  {
    q: {
      en: "How long may you search for your ball before it is officially lost?",
      fr: "Combien de temps pouvez-vous chercher votre balle avant qu'elle soit officiellement perdue ?",
    },
    options: {
      en: ["3 minutes", "5 minutes", "10 minutes", "As long as you like"],
      fr: ["3 minutes", "5 minutes", "10 minutes", "Aussi longtemps que vous voulez"],
    },
    correct: 0,
    explain: {
      en: "Under the current Rules of Golf, the search time is 3 minutes (it used to be 5). After that the ball is lost. But never make other groups wait, even within those 3 minutes.",
      fr: "Selon les Regles de Golf actuelles, le temps de recherche est de 3 minutes (c'etait 5 avant). Apres, la balle est perdue. Mais ne faites jamais attendre les autres groupes, meme pendant ces 3 minutes.",
    },
  },
  {
    q: {
      en: "Another group behind you plays faster and you are holding them up. What should you do?",
      fr: "Un groupe derriere vous joue plus vite et vous le retardez. Que devez-vous faire ?",
    },
    options: {
      en: ["Let them play through", "Speed up but make them wait", "Ignore them, you were there first", "Stop and have a break"],
      fr: ["Les laisser passer", "Accelerer mais les faire attendre", "Les ignorer, vous etiez la avant", "Faire une pause"],
    },
    correct: 0,
    explain: {
      en: "Etiquette and pace of play come first. If a faster group is waiting on you, wave them through. Priority is about flow, not who arrived first.",
      fr: "L'etiquette et le rythme de jeu priment. Si un groupe plus rapide attend, laissez-le passer. La priorite concerne le flux, pas qui est arrive en premier.",
    },
  },
  {
    q: {
      en: "Your ball is out of bounds (past the white stakes). What is the penalty and procedure?",
      fr: "Votre balle est hors-limite (au-dela des piquets blancs). Quelle est la penalite et la procedure ?",
    },
    options: {
      en: ["One penalty stroke, replay from where you last played", "No penalty, drop where it crossed", "Two penalty strokes, drop nearby", "Play it where it lies"],
      fr: ["Un coup de penalite, rejouer d'ou vous avez joue", "Pas de penalite, dropper ou elle est sortie", "Deux coups de penalite, dropper a cote", "La jouer ou elle repose"],
    },
    correct: 0,
    explain: {
      en: "Out of bounds is stroke and distance: one penalty stroke, and you replay from where you hit the previous shot. White stakes mark out of bounds.",
      fr: "Le hors-limite, c'est coup et distance : un coup de penalite, et vous rejouez d'ou vous avez frappe le coup precedent. Les piquets blancs marquent le hors-limite.",
    },
  },
  {
    q: {
      en: "On the putting green, before putting, may you repair a spike mark or pitch mark on your line?",
      fr: "Sur le green, avant de putter, pouvez-vous reparer une marque de crampon ou un pitch sur votre ligne ?",
    },
    options: {
      en: ["Yes, both can be repaired", "No, neither", "Only pitch marks, not spike marks", "Only with the flagstick"],
      fr: ["Oui, les deux peuvent etre reparees", "Non, aucune", "Seulement les pitchs, pas les crampons", "Seulement avec le drapeau"],
    },
    correct: 0,
    explain: {
      en: "Under current rules you may repair almost any damage on the green, including pitch marks and shoe or spike marks, on your line of play. This changed in 2019.",
      fr: "Selon les regles actuelles, vous pouvez reparer presque tout dommage sur le green, y compris pitchs et marques de chaussures, sur votre ligne de jeu. Cela a change en 2019.",
    },
  },
  {
    q: {
      en: "What colour stakes or lines now mark a penalty area (water and other defined zones)?",
      fr: "Quelle couleur de piquets ou de lignes marque desormais une zone a penalite (eau et autres zones definies) ?",
    },
    options: {
      en: ["Yellow or red", "White", "Blue", "Green"],
      fr: ["Jaune ou rouge", "Blanc", "Bleu", "Vert"],
    },
    correct: 0,
    explain: {
      en: "Penalty areas are marked yellow or red. The old term 'water hazard' is now 'penalty area'. Red areas give you an extra lateral relief option compared to yellow.",
      fr: "Les zones a penalite sont marquees en jaune ou rouge. L'ancien terme 'obstacle d'eau' est devenu 'zone a penalite'. Les zones rouges offrent une option de degagement lateral en plus par rapport au jaune.",
    },
  },
  {
    q: {
      en: "Your ball lies in a bunker against a rake. You remove the rake and the ball does not move. What happens?",
      fr: "Votre balle repose dans un bunker contre un rateau. Vous enlevez le rateau et la balle ne bouge pas. Que se passe-t-il ?",
    },
    options: {
      en: ["No penalty, the rake is a movable obstruction", "Two penalty strokes", "One penalty stroke", "You must replay the shot"],
      fr: ["Pas de penalite, le rateau est une obstruction amovible", "Deux coups de penalite", "Un coup de penalite", "Vous devez rejouer le coup"],
    },
    correct: 0,
    explain: {
      en: "A rake is a movable obstruction and may be removed anywhere, including in a bunker. If the ball moves as a result, you simply replace it with no penalty.",
      fr: "Un rateau est une obstruction amovible et peut etre enleve partout, y compris dans un bunker. Si la balle bouge en consequence, vous la replacez simplement sans penalite.",
    },
  },
  {
    q: {
      en: "When is it safe to make your stroke?",
      fr: "Quand pouvez-vous frapper en securite ?",
    },
    options: {
      en: ["Only when no one is within range or ahead of you", "Whenever you feel ready", "After shouting once", "When the group ahead has left the tee"],
      fr: ["Seulement quand personne n'est a portee ou devant vous", "Des que vous etes prete", "Apres avoir crie une fois", "Quand le groupe devant a quitte le depart"],
    },
    correct: 0,
    explain: {
      en: "Safety is the number one rule of the green card. Never play if anyone could be hit. Check that players and staff ahead are well out of range first. If a ball heads toward someone, shout 'Fore'.",
      fr: "La securite est la premiere regle de la carte verte. Ne jamais jouer si quelqu'un peut etre touche. Verifiez que les joueurs et le personnel devant sont bien hors de portee. Si une balle part vers quelqu'un, criez 'Fore'.",
    },
  },
  {
    q: {
      en: "On the green, your ball marker is in another player's line. What can you do?",
      fr: "Sur le green, votre marque est sur la ligne d'un autre joueur. Que pouvez-vous faire ?",
    },
    options: {
      en: ["Move it aside using a clubhead as reference, then move it back before playing", "Leave it, that is their problem", "Pick up your ball entirely", "Putt out of turn immediately"],
      fr: ["La deplacer de cote en se reperant avec une tete de club, puis la remettre avant de jouer", "La laisser, c'est leur probleme", "Ramasser votre balle entierement", "Putter hors de votre tour immediatement"],
    },
    correct: 0,
    explain: {
      en: "Mark your ball, then move the marker one or more putter-head lengths to the side using a fixed point as reference. Remember to move it back to the original spot before you play, or you risk a penalty.",
      fr: "Marquez votre balle, puis deplacez la marque d'une ou plusieurs longueurs de tete de putter sur le cote en utilisant un point fixe comme repere. Pensez a la remettre a sa place d'origine avant de jouer, sinon vous risquez une penalite.",
    },
  },
];

/* ============================================================
   RENDER QUIZ
   ============================================================ */
const quizWrap  = document.getElementById("quizWrap");
const quizScore = document.getElementById("quizScore");
const quizReset = document.getElementById("quizReset");

let answered = new Array(QUESTIONS.length).fill(null);

function renderQuiz() {
  quizWrap.innerHTML = "";

  QUESTIONS.forEach((item, qi) => {
    const card = document.createElement("div");
    card.className = "quiz-card";

    const num = document.createElement("div");
    num.className = "quiz-qnum";
    num.textContent = (lang === "fr" ? "Question " : "Question ") + (qi + 1);
    card.appendChild(num);

    const question = document.createElement("div");
    question.className = "quiz-question";
    question.textContent = item.q[lang];
    card.appendChild(question);

    const opts = document.createElement("div");
    opts.className = "quiz-options";

    item.options[lang].forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt;

      // If already answered, show state
      if (answered[qi] !== null) {
        btn.disabled = true;
        if (oi === item.correct) btn.classList.add("correct");
        else if (oi === answered[qi]) btn.classList.add("wrong");
      }

      btn.addEventListener("click", () => {
        if (answered[qi] !== null) return;
        answered[qi] = oi;
        renderQuiz();
        updateScore();
      });

      opts.appendChild(btn);
    });

    card.appendChild(opts);

    const explain = document.createElement("div");
    explain.className = "quiz-explain";
    explain.textContent = item.explain[lang];
    if (answered[qi] !== null) explain.classList.add("show");
    card.appendChild(explain);

    quizWrap.appendChild(card);
  });
}

function updateScore() {
  const done = answered.filter(a => a !== null).length;
  if (done < QUESTIONS.length) { quizScore.hidden = true; quizReset.hidden = true; return; }

  const correct = answered.reduce((sum, a, i) => sum + (a === QUESTIONS[i].correct ? 1 : 0), 0);
  const msg = lang === "fr"
    ? `Score : ${correct} / ${QUESTIONS.length}`
    : `Score: ${correct} / ${QUESTIONS.length}`;
  quizScore.textContent = msg;
  quizScore.hidden = false;
  quizReset.hidden = false;
}

quizReset.addEventListener("click", () => {
  answered = new Array(QUESTIONS.length).fill(null);
  renderQuiz();
  quizScore.hidden = true;
  quizReset.hidden = true;
  quizWrap.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* Initial render */
renderQuiz();
