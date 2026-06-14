/* ============================================================
   GREEN CARD PAGE: language toggle + quiz
   My Little Golf: femmypriscillya.com
   MIT Licence
   ============================================================ */
let lang = "en";

function applyLang() {
  document.querySelectorAll("[data-en]").forEach(el => {
    const key = `data-${lang}`;
    if (el.hasAttribute(key)) el.textContent = el.getAttribute(key);
  });
  renderQuiz();
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
   QUIZ DATA: 30 questions
   Based on current Rules of Golf (2019 revision) and
   Pass Carte Verte / FFGolf requirements.
   correct = index of the right answer (0-based).
   20 questions are drawn randomly each session.
   ============================================================ */
const ALL_QUESTIONS = [

  /* 1 */
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
      en: "Under the current Rules of Golf the search time is 3 minutes. It used to be 5 before 2019. After 3 minutes the ball is lost. Never make other groups wait even within those 3 minutes.",
      fr: "Selon les Regles de Golf actuelles le temps de recherche est de 3 minutes. C'etait 5 avant 2019. Apres 3 minutes la balle est perdue. Ne faites jamais attendre les autres groupes meme pendant ces 3 minutes.",
    },
  },

  /* 2 */
  {
    q: {
      en: "A faster group is waiting behind you. What does etiquette require?",
      fr: "Un groupe plus rapide attend derriere vous. Que demande l'etiquette ?",
    },
    options: {
      en: ["Let them play through", "Speed up and make them wait", "Ignore them, you were there first", "Stop and rest to let them pass"],
      fr: ["Les laisser passer", "Accelerer et les faire attendre", "Les ignorer, vous etiez la avant", "Faire une pause pour les laisser passer"],
    },
    correct: 0,
    explain: {
      en: "Pace of play comes first. If a faster group is waiting, wave them through without delay. Priority is about flow on the course, not who arrived first.",
      fr: "Le rythme de jeu prime. Si un groupe plus rapide attend, laissez-le passer sans attendre. La priorite concerne le flux sur le parcours, pas qui est arrive en premier.",
    },
  },

  /* 3 */
  {
    q: {
      en: "Your ball is out of bounds past the white stakes. What is the correct procedure?",
      fr: "Votre balle est hors-limite au-dela des piquets blancs. Quelle est la procedure correcte ?",
    },
    options: {
      en: ["1 penalty stroke, replay from the previous spot", "No penalty, drop near where it crossed", "2 penalty strokes, drop nearby", "Play it where it lies"],
      fr: ["1 coup de penalite, rejouer depuis l'endroit precedent", "Pas de penalite, dropper pres de la sortie", "2 coups de penalite, dropper a cote", "La jouer ou elle repose"],
    },
    correct: 0,
    explain: {
      en: "Out of bounds means stroke and distance: 1 penalty stroke and you replay from where the previous shot was played. White stakes always mark out of bounds.",
      fr: "Le hors-limite c'est coup et distance : 1 coup de penalite et vous rejouez depuis l'endroit ou le coup precedent a ete joue. Les piquets blancs marquent toujours le hors-limite.",
    },
  },

  /* 4 */
  {
    q: {
      en: "On the putting green, can you repair a spike mark on your line of putt?",
      fr: "Sur le green, pouvez-vous reparer une marque de crampon sur votre ligne de putt ?",
    },
    options: {
      en: ["Yes, all damage on the green may be repaired", "No, only pitch marks", "Only with the flagstick", "Only if your opponent agrees"],
      fr: ["Oui, tout dommage sur le green peut etre repare", "Non, seulement les pitchs", "Seulement avec le drapeau", "Seulement si l'adversaire est d'accord"],
    },
    correct: 0,
    explain: {
      en: "Since 2019 you may repair virtually any damage on the green including spike marks, pitch marks and old hole plugs. This changed from the previous rules.",
      fr: "Depuis 2019 vous pouvez reparer pratiquement tout dommage sur le green, y compris les marques de crampons, les pitchs et les anciens bouchons de trou. C'etait different avant.",
    },
  },

  /* 5 */
  {
    q: {
      en: "What colour stakes or lines mark a penalty area, formerly called a water hazard?",
      fr: "Quelle couleur de piquets ou de lignes marque une zone a penalite, anciennement obstacle d'eau ?",
    },
    options: {
      en: ["Yellow or red", "White", "Blue", "Green"],
      fr: ["Jaune ou rouge", "Blanc", "Bleu", "Vert"],
    },
    correct: 0,
    explain: {
      en: "Penalty areas are marked yellow or red. The term water hazard was replaced by penalty area in 2019. Red areas give you an extra lateral relief option compared to yellow.",
      fr: "Les zones a penalite sont marquees en jaune ou rouge. Le terme obstacle d'eau a ete remplace par zone a penalite en 2019. Les zones rouges offrent une option de degagement lateral supplementaire par rapport au jaune.",
    },
  },

  /* 6 */
  {
    q: {
      en: "Your ball rests in a bunker against a rake. You remove the rake and the ball does not move. What happens?",
      fr: "Votre balle repose dans un bunker contre un rateau. Vous enlevez le rateau et la balle ne bouge pas. Que se passe-t-il ?",
    },
    options: {
      en: ["No penalty, a rake is a movable obstruction", "2 penalty strokes", "1 penalty stroke", "You must replay the shot"],
      fr: ["Pas de penalite, un rateau est une obstruction amovible", "2 coups de penalite", "1 coup de penalite", "Vous devez rejouer le coup"],
    },
    correct: 0,
    explain: {
      en: "A rake is a movable obstruction and may be removed anywhere on the course including in a bunker. If the ball moves as a result you simply replace it with no penalty.",
      fr: "Un rateau est une obstruction amovible et peut etre enleve partout sur le parcours, y compris dans un bunker. Si la balle bouge en consequence vous la replacez simplement sans penalite.",
    },
  },

  /* 7 */
  {
    q: {
      en: "When is it safe to play your shot?",
      fr: "Quand est-il sur de jouer votre coup ?",
    },
    options: {
      en: ["Only when no one is within range or in your target area", "Whenever you feel ready", "After shouting Fore once", "When the group ahead leaves the tee box"],
      fr: ["Seulement quand personne n'est a portee ou dans votre zone cible", "Des que vous etes prete", "Apres avoir crie Fore une fois", "Quand le groupe devant quitte le depart"],
    },
    correct: 0,
    explain: {
      en: "Safety is the first rule of golf on a course. Never play if anyone could be hit. Check that all players and staff ahead are well out of range. If your ball heads toward someone shout Fore immediately.",
      fr: "La securite est la premiere regle du golf sur un parcours. Ne jouez jamais si quelqu'un peut etre touche. Verifiez que tous les joueurs et le personnel devant sont bien hors de portee. Si votre balle part vers quelqu'un criez Fore immediatement.",
    },
  },

  /* 8 */
  {
    q: {
      en: "On the green, your ball marker is on another player's line. What should you do?",
      fr: "Sur le green, votre marque est sur la ligne d'un autre joueur. Que devez-vous faire ?",
    },
    options: {
      en: ["Move it sideways by one putter head length, then move it back before playing", "Leave it, that is their problem", "Pick up your ball entirely and wait", "Putt immediately out of turn"],
      fr: ["La deplacer de cote d'une longueur de tete de putter, puis la remettre avant de jouer", "La laisser, c'est leur probleme", "Ramasser votre balle et attendre", "Putter hors de votre tour immediatement"],
    },
    correct: 0,
    explain: {
      en: "You move the marker one or more putter head lengths sideways using a fixed point as your reference. Crucially you must move it back to the original spot before you play or you risk a penalty.",
      fr: "Vous deplacez la marque d'une ou plusieurs longueurs de tete de putter sur le cote en utilisant un point fixe comme repere. Il est crucial de la remettre a sa place d'origine avant de jouer sinon vous risquez une penalite.",
    },
  },

  /* 9 */
  {
    q: {
      en: "You declare your ball unplayable in a bunker. Which option costs 2 penalty strokes instead of 1?",
      fr: "Vous declarez votre balle injouable dans un bunker. Quelle option coute 2 coups de penalite plutot que 1 ?",
    },
    options: {
      en: ["Dropping outside the bunker on the line to the hole", "Dropping within the bunker two club lengths from the original spot", "Going back to where you last played", "Dropping behind the bunker on the line to the hole"],
      fr: ["Dropper hors du bunker sur la ligne vers le trou", "Dropper dans le bunker a deux longueurs de club de l'endroit d'origine", "Retourner la ou vous avez joue precedemment", "Dropper derriere le bunker sur la ligne vers le trou"],
    },
    correct: 0,
    explain: {
      en: "Dropping outside the bunker on the back line to the hole costs 2 penalty strokes. The 1-stroke options are: replay from the previous spot, or drop within the bunker two club lengths from the original spot.",
      fr: "Dropper hors du bunker sur la ligne vers le trou coute 2 coups de penalite. Les options a 1 coup sont : rejouer depuis l'endroit precedent, ou dropper dans le bunker a deux longueurs de club de l'endroit d'origine.",
    },
  },

  /* 10 */
  {
    q: {
      en: "What is the expected time to play 9 holes in a friendly 3-player round?",
      fr: "Quel est le temps normal pour jouer 9 trous dans une partie amicale a 3 joueuses ?",
    },
    options: {
      en: ["Between 2h00 and 2h15", "Between 2h45 and 3h00", "Between 3h00 and 3h30", "As long as it takes"],
      fr: ["Entre 2h00 et 2h15", "Entre 2h45 et 3h00", "Entre 3h00 et 3h30", "Le temps qu'il faut"],
    },
    correct: 0,
    explain: {
      en: "A 3-player friendly round of 9 holes should take between 2h00 and 2h15. Knowing the expected pace helps you judge whether you are keeping up with the course.",
      fr: "Une partie amicale a 3 joueuses sur 9 trous devrait prendre entre 2h00 et 2h15. Connaitre le rythme attendu vous aide a evaluer si vous suivez le rythme du parcours.",
    },
  },

  /* 11 */
  {
    q: {
      en: "Your ball is on the green. Before putting you find mud on it. Can you clean it?",
      fr: "Votre balle est sur le green. Avant de putter vous trouvez de la boue dessus. Pouvez-vous la nettoyer ?",
    },
    options: {
      en: ["Yes, you may always clean your ball when lifted on the green", "No, never on the green", "Only if your marker agrees", "Only with a club, not your hands"],
      fr: ["Oui, vous pouvez toujours nettoyer votre balle quand elle est relevee sur le green", "Non, jamais sur le green", "Seulement si votre marqueur est d'accord", "Seulement avec un club, pas avec les mains"],
    },
    correct: 0,
    explain: {
      en: "Whenever you mark and lift your ball on the putting green you are entitled to clean it. Mark it first, then clean it, then replace it on the exact spot.",
      fr: "Chaque fois que vous marquez et relevez votre balle sur le green vous avez le droit de la nettoyer. Marquez-la d'abord, nettoyez-la, puis replacez-la exactement au meme endroit.",
    },
  },

  /* 12 */
  {
    q: {
      en: "After playing from a bunker, what must you do before leaving?",
      fr: "Apres avoir joue depuis un bunker, que devez-vous faire avant de partir ?",
    },
    options: {
      en: ["Rake the bunker to smooth all footprints and marks", "Leave it, the greenkeeper will rake it", "Only rake your own footprints", "Rake only if others are watching"],
      fr: ["Ratisser le bunker pour effacer toutes les empreintes et marques", "Laisser, le greenkeper le fera", "Ratisser seulement vos propres empreintes", "Ratisser seulement si d'autres regardent"],
    },
    correct: 0,
    explain: {
      en: "Raking the bunker after use is a fundamental etiquette requirement. Smooth all marks including footprints, the entry point and the area around where the ball lay.",
      fr: "Ratisser le bunker apres utilisation est une exigence fondamentale de l'etiquette. Lissez toutes les marques y compris les empreintes, le point d'entree et la zone autour de l'endroit ou reposait la balle.",
    },
  },

  /* 13 */
  {
    q: {
      en: "Your shot hits another player's bag left on the fairway. What happens?",
      fr: "Votre coup touche le sac d'un autre joueur laisse sur le fairway. Que se passe-t-il ?",
    },
    options: {
      en: ["Play it as it lies, no penalty to anyone", "1 penalty stroke, replay the shot", "2 penalty strokes, play it as it lies", "The other player is penalised"],
      fr: ["Jouez-la ou elle repose, pas de penalite pour personne", "1 coup de penalite, rejouez le coup", "2 coups de penalite, jouez-la ou elle repose", "L'autre joueuse est penalisee"],
    },
    correct: 0,
    explain: {
      en: "A golf bag is an outside influence. When your ball hits equipment left on the course by another player you play the ball as it lies with no penalty.",
      fr: "Un sac de golf est une influence exterieure. Quand votre balle touche un equipement laisse sur le parcours par un autre joueur vous jouez la balle ou elle repose sans penalite.",
    },
  },

  /* 14 */
  {
    q: {
      en: "What does playing a provisional ball mean?",
      fr: "Que signifie jouer une balle provisoire ?",
    },
    options: {
      en: ["Playing a second ball in case the first is lost or out of bounds, to save time", "Playing a practice shot before your real shot", "Replacing a broken ball mid-hole", "Taking a drop when your ball is unplayable"],
      fr: ["Jouer une deuxieme balle au cas ou la premiere serait perdue ou hors-limite, pour gagner du temps", "Jouer un coup d'entrainement avant votre vrai coup", "Remplacer une balle cassee en cours de trou", "Dropper quand votre balle est injouable"],
    },
    correct: 0,
    explain: {
      en: "A provisional ball saves time when your ball might be lost or out of bounds. You must announce it clearly before playing. If the original is found in bounds the provisional is abandoned.",
      fr: "Une balle provisoire fait gagner du temps quand votre balle pourrait etre perdue ou hors-limite. Vous devez l'annoncer clairement avant de la jouer. Si la balle d'origine est retrouvee en jeu la provisoire est abandonnee.",
    },
  },

  /* 15 */
  {
    q: {
      en: "You putt from the green and the ball hits the unattended flagstick in the hole. What is the ruling?",
      fr: "Vous puttez depuis le green et la balle touche le drapeau laisse dans le trou. Quelle est la regle ?",
    },
    options: {
      en: ["No penalty, play the ball as it lies", "2 penalty strokes", "1 penalty stroke, replay the putt", "The hole result is cancelled"],
      fr: ["Pas de penalite, jouez la balle ou elle repose", "2 coups de penalite", "1 coup de penalite, rejouez le putt", "Le resultat du trou est annule"],
    },
    correct: 0,
    explain: {
      en: "Since 2019 there is no penalty if your ball hits the flagstick when putting from the green. You may leave the flagstick in and play the ball as it lies wherever it ends up.",
      fr: "Depuis 2019 il n'y a pas de penalite si votre balle touche le drapeau en puttant depuis le green. Vous pouvez laisser le drapeau en place et jouer la balle ou elle finit.",
    },
  },

  /* 16 */
  {
    q: {
      en: "Which of these is NOT out of bounds?",
      fr: "Lequel de ces elements n'est PAS hors-limite ?",
    },
    options: {
      en: ["A penalty area marked with red stakes", "Beyond white stakes on the boundary", "A road defined as out of bounds by local rules", "Beyond a white line on the edge of the course"],
      fr: ["Une zone a penalite marquee de piquets rouges", "Au-dela des piquets blancs en limite", "Une route definie comme hors-limite par les regles locales", "Au-dela d'une ligne blanche en bordure du parcours"],
    },
    correct: 0,
    explain: {
      en: "A red-staked penalty area is part of the course. Your ball is in a penalty area, not out of bounds, and you have relief options. Out of bounds is always marked with white stakes or lines.",
      fr: "Une zone a penalite avec des piquets rouges fait partie du parcours. Votre balle est dans une zone a penalite, pas hors-limite, et vous avez des options de degagement. Le hors-limite est toujours marque par des piquets ou des lignes blancs.",
    },
  },

  /* 17 */
  {
    q: {
      en: "In stroke play, who is responsible for checking the score on your scorecard?",
      fr: "En stroke play, qui est responsable de verifier le score sur votre carte de score ?",
    },
    options: {
      en: ["Both the player and the marker must verify and sign it", "Only the marker", "Only the player", "The committee alone"],
      fr: ["Le joueur et le marqueur doivent tous les deux verifier et signer", "Seulement le marqueur", "Seulement le joueur", "Le comite seul"],
    },
    correct: 0,
    explain: {
      en: "In stroke play the marker records the score and signs the card, and the player must verify each hole score and also sign the card. Returning a wrong score leads to disqualification.",
      fr: "En stroke play le marqueur enregistre le score et signe la carte, et le joueur doit verifier le score de chaque trou et signer aussi. Rendre une carte avec un mauvais score entraine la disqualification.",
    },
  },

  /* 18 */
  {
    q: {
      en: "Your ball moves accidentally while you address it on the fairway. What happens?",
      fr: "Votre balle bouge accidentellement pendant que vous l'adressez sur le fairway. Que se passe-t-il ?",
    },
    options: {
      en: ["Replace it on its original spot, no penalty", "Play it from where it moved, no penalty", "1 penalty stroke, replace it", "1 penalty stroke, play from where it moved"],
      fr: ["Replacez-la a son endroit d'origine, pas de penalite", "Jouez-la depuis l'endroit ou elle a bouge, pas de penalite", "1 coup de penalite, replacez-la", "1 coup de penalite, jouez depuis l'endroit ou elle a bouge"],
    },
    correct: 0,
    explain: {
      en: "Under current rules if your ball moves accidentally during address you replace it on its original spot with no penalty. Before 2019 there was a 1-stroke penalty.",
      fr: "Selon les regles actuelles si votre balle bouge accidentellement pendant l'adresse vous la replacez a son endroit d'origine sans penalite. Avant 2019 il y avait 1 coup de penalite.",
    },
  },

  /* 19 */
  {
    q: {
      en: "Is an FFGolf licence required to sit the Pass Carte Verte exam?",
      fr: "Une licence FFGolf est-elle obligatoire pour passer l'examen du Pass Carte Verte ?",
    },
    options: {
      en: ["Yes, the current-year licence is mandatory", "No, the licence is optional", "Yes, but only for players over 18", "No, you can get the licence afterwards"],
      fr: ["Oui, la licence de l'annee en cours est obligatoire", "Non, la licence est optionnelle", "Oui, mais seulement pour les joueuses de plus de 18 ans", "Non, vous pouvez obtenir la licence apres"],
    },
    correct: 0,
    explain: {
      en: "The current-year FFGolf licence is mandatory to sit the Pass Carte Verte exam. Without it the instructor cannot validate your pass. You subscribe via a club or directly online.",
      fr: "La licence FFGolf de l'annee en cours est obligatoire pour passer l'examen du Pass Carte Verte. Sans elle l'enseignant ne peut pas valider votre pass. Vous vous inscrivez via un club ou directement en ligne.",
    },
  },

  /* 20 */
  {
    q: {
      en: "On the green, whose ball is furthest from the hole plays first. True or false?",
      fr: "Sur le green, la balle la plus eloignee du trou joue en premier. Vrai ou faux ?",
    },
    options: {
      en: ["True in competition, but ready golf is encouraged in casual play", "False, the player with the best score on the last hole plays first", "True always with no exceptions", "False, the first to reach the green plays first"],
      fr: ["Vrai en competition, mais le ready golf est encourage en jeu informel", "Faux, la joueuse avec le meilleur score sur le dernier trou joue en premier", "Vrai toujours sans exception", "Faux, la premiere arrivee sur le green joue en premier"],
    },
    correct: 0,
    explain: {
      en: "The ball furthest from the hole plays first in competition. In casual play ready golf is encouraged to maintain pace. Always follow the formal order in competitions.",
      fr: "La balle la plus eloignee du trou joue en premier en competition. En jeu informel le ready golf est encourage pour maintenir le rythme. Respectez toujours l'ordre formel en competition.",
    },
  },

  /* 21 */
  {
    q: {
      en: "How long is the Pass Carte Verte valid once you obtain it?",
      fr: "Combien de temps le Pass Carte Verte est-il valable une fois obtenu ?",
    },
    options: {
      en: ["For life", "One year, like the FFGolf licence", "Five years", "Until your handicap changes"],
      fr: ["A vie", "Un an, comme la licence FFGolf", "Cinq ans", "Jusqu'a ce que votre handicap change"],
    },
    correct: 0,
    explain: {
      en: "The Pass Carte Verte is valid for life. Unlike your FFGolf licence which you renew each year, you never need to retake the pass once you have it.",
      fr: "Le Pass Carte Verte est valable a vie. Contrairement a votre licence FFGolf que vous renouvelez chaque annee, vous n'avez jamais besoin de repasser le pass une fois que vous l'avez.",
    },
  },

  /* 22 */
  {
    q: {
      en: "Your ball lies in casual water on the fairway. What are your options?",
      fr: "Votre balle repose dans de l'eau temporaire sur le fairway. Quelles sont vos options ?",
    },
    options: {
      en: ["Free relief, drop within one club length of the nearest point of complete relief", "1 penalty stroke, drop anywhere", "Play it as it lies or take 2 penalty strokes", "No relief available on the fairway"],
      fr: ["Degagement gratuit, dropper dans une longueur de club du point de degagement complet le plus proche", "1 coup de penalite, dropper n'importe ou", "La jouer ou elle repose ou prendre 2 coups de penalite", "Pas de degagement disponible sur le fairway"],
    },
    correct: 0,
    explain: {
      en: "Casual water, now called temporary water, is an abnormal course condition. You get free relief. Find the nearest point of complete relief from the water and drop within one club length of it, no closer to the hole.",
      fr: "L'eau temporaire, anciennement eau de pluie, est une condition anormale du parcours. Vous obtenez un degagement gratuit. Trouvez le point de degagement complet le plus proche de l'eau et droppez dans une longueur de club, sans vous rapprocher du trou.",
    },
  },

  /* 23 */
  {
    q: {
      en: "What must you do if you think the ball you found might not be yours?",
      fr: "Que devez-vous faire si vous pensez que la balle trouvee n'est peut-etre pas la votre ?",
    },
    options: {
      en: ["Announce your intent to identify it, lift and check, then replace it", "Play it as your own, guessing is fine", "Leave it and declare your ball lost", "Ask a nearby player to confirm"],
      fr: ["Annoncer votre intention de l'identifier, la relever et verifier, puis la replacer", "La jouer comme si c'etait la votre, l'approximation est acceptable", "La laisser et declarer votre balle perdue", "Demander a un joueur proche de confirmer"],
    },
    correct: 0,
    explain: {
      en: "You must announce your intent to identify the ball to your fellow competitor or opponent, then lift it to check the markings. You must then replace it on the exact spot. Playing a wrong ball in stroke play costs 2 penalty strokes.",
      fr: "Vous devez annoncer votre intention d'identifier la balle a votre concurrent ou adversaire, puis la relever pour verifier les marquages. Vous devez ensuite la replacer exactement au meme endroit. Jouer une mauvaise balle en stroke play coute 2 coups de penalite.",
    },
  },

  /* 24 */
  {
    q: {
      en: "After holing out on a green, what should you do before leaving?",
      fr: "Apres avoir retire la balle du trou sur un green, que devez-vous faire avant de partir ?",
    },
    options: {
      en: ["Repair any pitch marks you made or find on the green", "Leave immediately to keep pace", "Replace the flagstick and leave", "Mark the scorecard on the green"],
      fr: ["Reparer les pitchs que vous avez faits ou trouvez sur le green", "Partir immediatement pour maintenir le rythme", "Remettre le drapeau et partir", "Remplir la carte de score sur le green"],
    },
    correct: 0,
    explain: {
      en: "Repairing pitch marks is essential etiquette. Repair your own and any others you find. However move away from the green before filling in your scorecard to avoid delaying the group behind.",
      fr: "Reparer les pitchs est une etiquette essentielle. Reparez les votres et ceux que vous trouvez. Cependant eloignez-vous du green avant de remplir votre carte de score pour ne pas retarder le groupe derriere.",
    },
  },

  /* 25 */
  {
    q: {
      en: "In stroke play, you play your ball from the wrong place. What is the penalty?",
      fr: "En stroke play, vous jouez votre balle depuis le mauvais endroit. Quelle est la penalite ?",
    },
    options: {
      en: ["2 penalty strokes and you must correct the error before teeing off on the next hole", "1 penalty stroke, no correction needed", "Disqualification immediately", "No penalty if the mistake was accidental"],
      fr: ["2 coups de penalite et vous devez corriger l'erreur avant de partir au depart suivant", "1 coup de penalite, pas de correction necessaire", "Disqualification immediate", "Pas de penalite si l'erreur etait accidentelle"],
    },
    correct: 0,
    explain: {
      en: "Playing from the wrong place in stroke play is a 2-stroke penalty. If the breach is serious you must correct it before completing the hole, otherwise you may be disqualified.",
      fr: "Jouer depuis le mauvais endroit en stroke play entraine 2 coups de penalite. Si l'infraction est serieuse vous devez la corriger avant de terminer le trou, sinon vous risquez la disqualification.",
    },
  },

  /* 26 */
  {
    q: {
      en: "You are standing near your ball and accidentally kick it. What is the ruling?",
      fr: "Vous etes pres de votre balle et vous la bottez accidentellement. Quelle est la regle ?",
    },
    options: {
      en: ["Replace it on its original spot, no penalty", "Play it from where it ended up, no penalty", "1 penalty stroke, replace it", "1 penalty stroke, play it from where it ended up"],
      fr: ["Replacez-la a son endroit d'origine, pas de penalite", "Jouez-la depuis l'endroit ou elle a fini, pas de penalite", "1 coup de penalite, replacez-la", "1 coup de penalite, jouez-la depuis l'endroit ou elle a fini"],
    },
    correct: 0,
    explain: {
      en: "If a player accidentally moves their ball anywhere on the course except on the green there is no penalty and the ball must be replaced. This changed from the old rules which imposed a 1-stroke penalty.",
      fr: "Si un joueur deplace accidentellement sa balle n'importe ou sur le parcours sauf sur le green il n'y a pas de penalite et la balle doit etre replacee. C'etait different avec les anciennes regles qui imposaient 1 coup de penalite.",
    },
  },

  /* 27 */
  {
    q: {
      en: "Your tee shot goes into a red penalty area. Which option is NOT available?",
      fr: "Votre coup de depart va dans une zone a penalite rouge. Quelle option n'est PAS disponible ?",
    },
    options: {
      en: ["Drop anywhere on the course for 1 penalty stroke", "Play from where you last played for 1 penalty stroke", "Drop behind the penalty area on a back line for 1 penalty stroke", "Drop within two club lengths of where it crossed the edge for 1 penalty stroke"],
      fr: ["Dropper n'importe ou sur le parcours pour 1 coup de penalite", "Jouer depuis l'endroit ou vous avez joue pour 1 coup de penalite", "Dropper derriere la zone sur une ligne pour 1 coup de penalite", "Dropper dans deux longueurs de club de l'endroit ou elle a franchi le bord pour 1 coup de penalite"],
    },
    correct: 0,
    explain: {
      en: "You cannot simply drop anywhere on the course. Relief from a red penalty area costs 1 stroke and allows three specific options: replay from previous spot, drop on a back line, or lateral drop within two club lengths of the crossing point.",
      fr: "Vous ne pouvez pas simplement dropper n'importe ou sur le parcours. Le degagement d'une zone a penalite rouge coute 1 coup et offre trois options specifiques : rejouer depuis l'endroit precedent, dropper sur une ligne arriere, ou degagement lateral dans deux longueurs de club du point de franchissement.",
    },
  },

  /* 28 */
  {
    q: {
      en: "What is the correct way to take a drop under the new rules since 2019?",
      fr: "Quelle est la facon correcte de dropper selon les nouvelles regles depuis 2019 ?",
    },
    options: {
      en: ["From knee height, letting the ball fall straight down", "From shoulder height, as in the old rules", "From any height as long as the ball lands in the relief area", "By placing the ball on the ground by hand"],
      fr: ["A hauteur de genou, en laissant tomber la balle verticalement", "A hauteur d'epaule, comme dans les anciennes regles", "A n'importe quelle hauteur du moment que la balle atterrit dans la zone", "En posant la balle sur le sol a la main"],
    },
    correct: 0,
    explain: {
      en: "Since 2019 the drop must be made from knee height, not shoulder height as before. The ball must be dropped straight down and must land and come to rest in the correct relief area.",
      fr: "Depuis 2019 le drop doit etre fait a hauteur de genou, pas a hauteur d'epaule comme avant. La balle doit etre lachee verticalement et doit atterrir et s'immobiliser dans la zone de degagement correcte.",
    },
  },

  /* 29 */
  {
    q: {
      en: "What does the Pass Carte Verte primarily certify?",
      fr: "Que certifie principalement le Pass Carte Verte ?",
    },
    options: {
      en: ["That you can play safely at a reasonable pace respecting the rules and etiquette", "That you have reached a specific handicap level", "That you can hit the ball a minimum distance", "That you have completed at least 10 rounds"],
      fr: ["Que vous pouvez jouer en securite a un rythme correct en respectant les regles et l'etiquette", "Que vous avez atteint un niveau de handicap specifique", "Que vous pouvez frapper la balle a une distance minimale", "Que vous avez complete au moins 10 parties"],
    },
    correct: 0,
    explain: {
      en: "The Pass Carte Verte is not a performance test. It certifies that you know the essential rules, respect etiquette and can play an 18-hole course safely without disturbing other players or holding up play.",
      fr: "Le Pass Carte Verte n'est pas un test de performance. Il certifie que vous connaissez les regles essentielles, respectez l'etiquette et pouvez jouer un parcours 18 trous en securite sans deranger les autres joueurs ni ralentir le jeu.",
    },
  },

  /* 30 */
  {
    q: {
      en: "You play a wrong ball in stroke play. What is the penalty?",
      fr: "Vous jouez une mauvaise balle en stroke play. Quelle est la penalite ?",
    },
    options: {
      en: ["2 penalty strokes, then you must find and play your original ball", "1 penalty stroke, continue with the wrong ball", "No penalty if it was a mistake", "Disqualification immediately"],
      fr: ["2 coups de penalite, puis vous devez retrouver et jouer votre balle d'origine", "1 coup de penalite, continuez avec la mauvaise balle", "Pas de penalite si c'etait une erreur", "Disqualification immediate"],
    },
    correct: 0,
    explain: {
      en: "Playing a wrong ball in stroke play costs 2 penalty strokes. You must then find and play your original ball. Strokes made with the wrong ball do not count. If you complete the hole without correcting the error you are disqualified.",
      fr: "Jouer une mauvaise balle en stroke play coute 2 coups de penalite. Vous devez ensuite retrouver et jouer votre balle d'origine. Les coups joues avec la mauvaise balle ne comptent pas. Si vous terminez le trou sans corriger l'erreur vous etes disqualifie.",
    },
  },

]; // end ALL_QUESTIONS

const QUESTIONS_PER_SESSION = 20;

/* ============================================================
   SHUFFLE utility: Fisher-Yates
   ============================================================ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions() {
  return shuffle(ALL_QUESTIONS).slice(0, QUESTIONS_PER_SESSION);
}

/* ============================================================
   QUIZ STATE
   ============================================================ */
let activeQuestions = pickQuestions();
let answered = new Array(activeQuestions.length).fill(null);

/* ============================================================
   RENDER QUIZ
   ============================================================ */
const quizWrap  = document.getElementById("quizWrap");
const quizScore = document.getElementById("quizScore");
const quizReset = document.getElementById("quizReset");

function renderQuiz() {
  quizWrap.innerHTML = "";

  activeQuestions.forEach((item, qi) => {
    const card = document.createElement("div");
    card.className = "quiz-card";

    const num = document.createElement("div");
    num.className = "quiz-qnum";
    num.textContent = "Question " + (qi + 1) + " / " + activeQuestions.length;
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
  if (done < activeQuestions.length) {
    quizScore.hidden = true;
    quizReset.hidden = true;
    return;
  }

  const correct = answered.reduce(
    (sum, a, i) => sum + (a === activeQuestions[i].correct ? 1 : 0), 0
  );
  const total = activeQuestions.length;
  const pct   = Math.round((correct / total) * 100);

  quizScore.textContent = lang === "fr"
    ? `Score : ${correct} / ${total} (${pct}%)`
    : `Score: ${correct} / ${total} (${pct}%)`;

  quizScore.hidden = false;
  quizReset.hidden = false;
  quizReset.textContent = lang === "fr" ? "Nouveau tirage" : "New random draw";
}

quizReset.addEventListener("click", () => {
  activeQuestions = pickQuestions();
  answered = new Array(activeQuestions.length).fill(null);
  renderQuiz();
  quizScore.hidden = true;
  quizReset.hidden = true;
  quizWrap.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* Initial render */
renderQuiz();
