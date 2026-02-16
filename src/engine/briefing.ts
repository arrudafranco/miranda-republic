import type { GameState, BriefingItem } from '../types/game';
import type { BlocId } from '../types/blocs';
import { BLOC_DEFINITIONS } from '../data/blocs';
import { randomChoice } from '../utils/helpers';

const BLOC_DISPLAY: Partial<Record<BlocId, string>> = {
  finance: 'Miranda National Bank',
  labor: 'The dockworkers\' union',
  syndicate: 'The Underworld',
  military: 'The generals',
  enforcers: 'The Enforcers',
  court: 'The Court',
  media: 'The Heralds',
  academy: 'The Scholars',
  artists: 'The Artists\' quarter',
  clergy: 'The Clergy',
  mainStreet: 'Main Street',
  tech: 'The tech sector',
  industry: 'The factory owners',
  agri: 'The Landowners',
};

// ── Text pools (module-level constants for testability) ────────────────

const RIVAL_CROSS_30 = [
  'Whispers in the congressional cafeteria. The Rival\'s name comes up more often than yours.',
  'A junior aide mentioned the Rival in a briefing. Nobody corrected the favorable comparison.',
  'The Rival\'s office requested a larger budget allocation. The request was taken seriously.',
];

const RIVAL_CROSS_50 = [
  'The Rival\'s caucus blocked three bills this week. Main Street shopkeepers have started using the word "gridlock" as a verb.',
  'Your chief of staff found a copy of the Rival\'s policy platform on your agriculture minister\'s desk.',
  'The Rival gave a speech about "the next chapter." The audience understood what chapter was ending.',
  'Opposition flags appeared on balconies across three districts overnight. Nobody took them down.',
];

const RIVAL_CROSS_75 = [
  'The Rival held a rally in Constitution Square. The crowd was larger than yours. The police estimate was "concerning."',
  'International journalists are requesting interviews with the Rival before requesting yours.',
  'Your secretary of state was asked at a dinner party whether the Rival would be "easier to work with."',
  'The Rival\'s morning press briefing now gets more coverage than your official statements.',
];

const RIVAL_CROSS_85 = [
  'Foreign ambassadors have begun scheduling courtesy calls with the opposition. Just in case.',
  'The Rival\'s transition team is already staffed. They\'re not hiding it anymore.',
  'Your driver asked if you\'d heard the Rival\'s latest speech. He sounded impressed.',
];

const CRISIS_STAGE_0 = [
  'Reports of unusual activity across the capital. Your aide recommends keeping the schedule clear.',
  'A classified memo landed on your desk this morning. The subject line was one word long.',
  'Your intelligence chief requested an unscheduled meeting. Brought two folders instead of one.',
  'The phones in the crisis room have been ringing since dawn. Nobody is giving details yet.',
];

const CRISIS_STAGE_1 = [
  'The situation is developing. Your ministers are choosing their words more carefully.',
  'A second briefing was requested before noon. The first one wasn\'t reassuring enough.',
  'The press corps smells blood. Three unscheduled questions at the morning briefing.',
];

const CRISIS_STAGE_2_PLUS = [
  'The crisis deepens. Official statements are starting to contradict each other.',
  'Your chief of staff cancelled all afternoon appointments. "Something came up" was the explanation.',
  'The crisis response team has been in session for eighteen consecutive hours.',
  'Foreign news agencies picked up the story. The framing is not favorable.',
];

const DISCOVERY_TEXTS = [
  'An old backroom deal surfaced in the Heralds. The Court is not amused. Your aide suggests a vacation.',
  'A filing clerk found documents that should have stayed buried. The Heralds have copies.',
  'Your predecessor\'s former aide gave an interview. Some of the anecdotes sounded familiar.',
  'An investigative reporter connected dots that were supposed to stay unconnected.',
];

const INFLATION_CROSS_10 = [
  'The price of bread doubled. A bakery in the old quarter hung a sign: "We accept tears."',
  'Street vendors recalculated their prices twice before lunch. The chalk on their boards is wearing thin.',
  'The Finance Minister\'s breakfast order now costs what his lunch did last month.',
];

const INFLATION_CROSS_18 = [
  'The currency exchange kiosks have stopped updating their boards. "What\'s the point," the attendant said.',
  'A wheelbarrow of pesos was photographed outside the central bank. The photographer won an award.',
  'The national mint announced overtime shifts. The irony was lost on no one.',
];

const NARRATIVE_BELOW_30 = [
  'The morning newspapers ran identical front pages. None of them were yours.',
  'Your press secretary\'s briefing was attended by three reporters. One was asleep.',
  'State television aired a documentary about the presidency. It was not the version you approved.',
];

const NARRATIVE_ABOVE_60 = [
  'The schoolchildren wrote essays about the Republic. Most of them were favorable. All of them mentioned you.',
  'A folk song about your administration is climbing the charts. The lyrics are mostly accurate.',
  'Your biography appeared on the university\'s recommended reading list. The professor meant it as a compliment.',
];

const MOBILIZATION_BELOW_20 = [
  'The rally planned for Sunday was cancelled. "Low expected turnout," the organizers said. They didn\'t look surprised.',
  'Your campaign volunteers are updating their resumes. Quietly.',
  'The party headquarters ordered fewer chairs for the next event. Nobody questioned the number.',
];

const POLARIZATION_ABOVE_60 = [
  'Two cafes on the same street hung opposing banners. Their owners stopped speaking last month.',
  'A family dinner in the government district ended in a shouting match. The neighbors called police.',
  'The university debating society split into two permanent factions. They no longer share a common room.',
];

const DREAD_ABOVE_40 = [
  'The night patrols doubled. Citizens learned to walk faster and look straight ahead.',
  'A comedian made a joke about the government. The audience laughed nervously, then checked the exits.',
  'Someone spray-painted "watching" on the wall of the Interior Ministry. It was cleaned within the hour.',
];

const LEGITIMACY_BELOW_30 = [
  'A shopkeeper asked your motorcade to use a different street. "Bad for business," she said.',
  'The national day celebration was sparsely attended. The weather was fine.',
  'Your official portrait in the post office lobby was moved to a less prominent wall.',
];

const CAPITAL_BELOW_20 = [
  'The budget office sent a memo titled "Prioritization Under Constraint." It was two pages of apologies.',
  'Your chief of staff started meetings by asking what things cost. He never used to do that.',
];

const POLICY_UNLOCK_TEXTS = [
  'A man in an expensive suit arrived at the palace. He left a card. New options are available.',
  'Your policy advisors stayed late. In the morning, they had new proposals.',
  'A sealed folder appeared on your desk overnight. Inside, new possibilities.',
];

const COLOSSUS_PATIENCE_LOW = [
  'The Colossus ambassador\'s smile is getting thinner. Her entourage is getting larger.',
  'Your trade attaché returned from the Colossus embassy looking pale. "We should talk," she said.',
  'The Colossus trade delegation cancelled lunch. They rescheduled for a conference room. With lawyers.',
];

// Bloc low loyalty texts (< 25)
const BLOC_LOW_LOYALTY: Record<string, string[]> = {
  finance: [
    'Miranda National Bank moved its reserves to a Colossus subsidiary. Their press release thanked you for "the learning experience."',
    'The Banks stopped answering calls from the Treasury. Their automated reply mentions "restructuring priorities."',
  ],
  labor: [
    'The dockworkers\' choir cancelled their national theater performance. "We have nothing to sing about," the conductor said.',
    'Work slowdowns at the port. Nothing official. Just everything taking twice as long.',
  ],
  syndicate: [
    'The Underworld sent back your last message unopened. The courier looked sympathetic.',
    'Black market exchange rates diverged sharply from official ones. Someone is making a statement.',
  ],
  military: [
    'The generals\' weekly briefing was unusually short. They left without saluting.',
    'A military band played a funeral march outside the defense ministry. "Practice," they claimed.',
  ],
  enforcers: [
    'The Enforcers filed a collective request for "operational independence." The wording was careful.',
    'Response times in the government district increased by forty minutes. No explanation was offered.',
  ],
  court: [
    'The judges started citing precedents from before the Republic. A quiet form of protest.',
    'Three cases against the government were expedited. The rulings were unfavorable.',
  ],
  media: [
    'The Heralds ran a blank front page. "We thought it was more honest," the editor explained.',
    'State television aired dead air for thirty seconds during a government segment. "Technical issues."',
  ],
  academy: [
    'The Scholars published an open letter. Twelve hundred signatures. The tone was clinical.',
    'University enrollment in political science dropped. Students are choosing "more stable" fields.',
  ],
  artists: [
    'The Artists\' quarter went dark for a night. "A performance piece about governance," the program said.',
    'The national gallery rotated its exhibits. The new theme is "Decline."',
  ],
  clergy: [
    'The Clergy\'s morning prayers now include a passage about "leaders who have lost their way."',
    'Church attendance is up. The sermons are about patience and endurance.',
  ],
  mainStreet: [
    'Main Street shops closed early on a Tuesday. "No point staying open," the grocer said.',
    'A "going out of business" sign appeared on the oldest shop in the government district.',
  ],
  tech: [
    'The tech sector\'s startup incubator relocated to a neighboring country. The farewell party was well-attended.',
    'Miranda\'s best programmers are updating their profiles on international job boards.',
  ],
  industry: [
    'The factory owners\' association skipped the annual presidential luncheon. "Scheduling conflict."',
    'Two factories reduced shifts to three days a week. The owners cited "uncertain conditions."',
  ],
  agri: [
    'The Landowners diverted grain shipments to private storage. "Market conditions," they said.',
    'Agricultural exports bypassed the capital entirely. The customs office wasn\'t informed.',
  ],
};

// Bloc high loyalty texts (>= 70)
const BLOC_HIGH_LOYALTY: Record<string, string[]> = {
  finance: [
    'The Banks sent a crystal decanter to the palace. The card read: "To continued cooperation."',
    'Miranda National Bank offered favorable terms on government bonds. The interest rate was symbolic.',
  ],
  labor: [
    'The dockworkers\' choir performed at the national theater. Standing ovation. The factory owners left at intermission.',
    'Union representatives volunteered for your next campaign event. They brought signs they made themselves.',
  ],
  syndicate: [
    'A man in an expensive suit arrived at the palace. He left a card and a bottle of wine from a vineyard that doesn\'t exist on any map.',
    'Your security detail reported that certain neighborhoods have become "unusually safe." No explanation needed.',
  ],
  military: [
    'The generals invited you to observe field exercises. They named the maneuver after your birthday.',
    'Military bands played your favorite song at the changing of the guard. You never told them what it was.',
  ],
  enforcers: [
    'The Enforcers presented you with an honorary badge. The ceremony was small but sincere.',
    'Crime statistics in the government district dropped to historic lows. The Enforcers credit your policies.',
  ],
  court: [
    'The judges sent a rare formal commendation to the palace. The language was unusually warm for legal professionals.',
    'Three favorable rulings came down this week. The legal analysis cited "alignment with constitutional intent."',
  ],
  media: [
    'The Heralds ran a feature series on your economic vision. It was almost entirely accurate.',
    'State television\'s evening news opened with a profile of your infrastructure projects. The tone was admiring.',
  ],
  academy: [
    'The Scholars dedicated their annual symposium to "The Miranda Model." You were the keynote.',
    'University students formed a policy study group based on your platform. They meet Tuesdays.',
  ],
  artists: [
    'The Artists\' quarter unveiled a mural on the harbor wall. It depicts the Republic in flattering light.',
    'A playwright premiered a new work about political courage. The protagonist was recognizable.',
  ],
  clergy: [
    'The Clergy offered a special blessing for the Republic\'s leadership. The congregation applauded.',
    'Church bells rang on a weekday afternoon. The occasion was gratitude.',
  ],
  mainStreet: [
    'Main Street shopkeepers hung bunting in government colors. A small business owner said, "Things are looking up."',
    'The local market renamed its best bread "The Republic Loaf." It sells out by noon.',
  ],
  tech: [
    'Miranda\'s tech sector announced a "patriotic incubator" for civic technology. Funding came from private donors.',
    'A tech startup named their product after the Republic. The reviews were favorable.',
  ],
  industry: [
    'The factory owners increased shifts and hired two hundred workers. "Confidence in the administration," the press release said.',
    'Industrial output hit a five-year high. The factory owners sent champagne.',
  ],
  agri: [
    'The Landowners pledged a surplus harvest to the national food reserve. The gesture was public and generous.',
    'Agricultural exports are up. The Landowners credit "stable governance" in their quarterly report.',
  ],
};

// ── Color vignettes (30 atmospheric texts) ──────────────────────────

const COLOR_VIGNETTES = [
  // Palace life
  'Your chief of staff forgot his lunch again. The cafeteria sent up a sandwich with a note that read, "On the house, sir."',
  'The palace gardener is arguing with the groundskeeper about the hedges. The dispute has lasted three administrations.',
  'Someone left a resignation letter on the wrong desk. It was addressed to the previous president.',
  'The elevator in the east wing made a sound it has never made before. The maintenance request was filed in triplicate.',
  'Your secretary organized the presidential pen collection by color. You didn\'t know you had a presidential pen collection.',

  // City atmosphere
  'Morning traffic near the harbor. A street musician plays the national anthem on an accordion. Badly, but with feeling.',
  'University students debating in the plaza. The argument is about economic theory. The pigeons are unimpressed.',
  'A cat has taken up residence in the Finance Ministry lobby. It has been there longer than the current minister.',
  'The harbor bells rang at noon. A fisherman checked his watch, shrugged, and went back to his nets.',
  'Someone planted flowers in the median strip of Constitution Avenue. They bloom in the colors of the flag.',

  // Government bureaucracy
  'A filing clerk discovered a form from 1987 that was never processed. The department it was addressed to no longer exists.',
  'The cafeteria changed its menu and three departments filed formal complaints. One requested a parliamentary inquiry.',
  'An elevator in the Interior Ministry has been broken since the previous administration. It has become a landmark.',
  'The official government calendar still lists a holiday that was abolished twelve years ago. Nobody corrects it.',
  'A stack of unread reports reached a height where it became a structural concern. Facilities sent a memo.',

  // Miranda street life
  'A bakery near the old quarter sells coffee and opinions. Both are strong. Both are cheap.',
  'Fishermen at the docks argued about the morning\'s catch. The disagreement escalated to hand gestures, then resolved over beer.',
  'Children playing football in a government parking lot. The security guard watches from the booth, keeping score.',
  'The woman who sells mangoes on the corner of Fifth and Harbor has been there since before the Republic. She remembers all the presidents. She prefers the mangoes.',
  'A stray dog sleeps in the doorway of the congressional annex. It has been there so long it has a name.',

  // Seasonal / weather
  'The rainy season turned the capital\'s side streets into rivers. A taxi driver navigated by memory and prayer.',
  'Heat shimmer over the rooftops made the presidential palace look like it was floating. A tourist took a photo.',
  'The jacaranda trees are blooming purple in the government district. Petals collect in the gutters like confetti.',
  'A thunderstorm knocked out power to three ministries. The Finance Ministry, prepared for everything, had candles.',
  'The dry season dust settled on every surface in the palace. The cleaning staff gave up on the chandeliers.',

  // Dark whimsy
  'A pigeon nesting in the congressional gallery was ejected by security. It returned through a different entrance.',
  'The presidential phone rang at 3 AM. Wrong number. The caller wanted a pizza place that closed in 2019.',
  'A portrait of a former president was found facing the wall in a storage closet. Nobody will admit to turning it.',
  'The palace clock is four minutes fast. It has been four minutes fast for twenty years. Correcting it is considered bad luck.',
  'A memo circulated asking all staff to stop feeding the palace cat. The cat does not appear to be losing weight.',
];

/**
 * Generate narrative briefing items based on what happened this turn.
 * Compares current state to previousResources to detect notable changes.
 * Returns at most 3 items, prioritized by dramatic impact.
 */
export function generateBriefingItems(state: GameState): BriefingItem[] {
  const prev = state.previousResources;
  if (!prev) return [];

  const candidates: (BriefingItem & { priority: number })[] = [];

  // 1. Rival action is always included if present (highest priority)
  if (state.rival.lastAction) {
    candidates.push({
      type: 'rival',
      text: state.rival.lastAction,
      priority: 100,
    });
  }

  // 2. Crisis events fired this turn
  if (state.activeCrises.length > 0) {
    const crisis = state.activeCrises[0];
    const stage = crisis.stageIndex;
    if (stage === 0) {
      candidates.push({
        type: 'crisis',
        text: randomChoice(CRISIS_STAGE_0),
        priority: 95,
      });
    } else if (stage === 1) {
      candidates.push({
        type: 'crisis',
        text: randomChoice(CRISIS_STAGE_1),
        priority: 95,
      });
    } else if (stage >= 2) {
      candidates.push({
        type: 'crisis',
        text: randomChoice(CRISIS_STAGE_2_PLUS),
        priority: 95,
      });
    }
  }

  // 3. Discovery fired (check if legitimacy dropped significantly)
  const legitDrop = prev.legitimacy - state.resources.legitimacy;
  if (legitDrop >= 15) {
    candidates.push({
      type: 'discovery',
      text: randomChoice(DISCOVERY_TEXTS),
      priority: 90,
    });
  }

  // 4. Rival threshold crossings
  const res = state.resources;

  // Rival crossed 30
  if (state.rival.power >= 30 && (state.rival.power - (state.rival.powerDelta ?? 0)) < 30) {
    candidates.push({
      type: 'rival',
      text: randomChoice(RIVAL_CROSS_30),
      priority: 82,
    });
  }

  // Rival crossed 50
  if (state.rival.power >= 50 && (state.rival.power - (state.rival.powerDelta ?? 0)) < 50) {
    candidates.push({
      type: 'rival',
      text: randomChoice(RIVAL_CROSS_50),
      priority: 85,
    });
  }

  // Rival crossed 75
  if (state.rival.power >= 75 && (state.rival.power - (state.rival.powerDelta ?? 0)) < 75) {
    candidates.push({
      type: 'rival',
      text: randomChoice(RIVAL_CROSS_75),
      priority: 88,
    });
  }

  // Rival crossed 85
  if (state.rival.power >= 85 && (state.rival.power - (state.rival.powerDelta ?? 0)) < 85) {
    candidates.push({
      type: 'rival',
      text: randomChoice(RIVAL_CROSS_85),
      priority: 90,
    });
  }

  // 5. Resource threshold crossings

  // Inflation crossed 10
  if (res.inflation >= 10 && prev.inflation < 10) {
    candidates.push({
      type: 'resource',
      text: randomChoice(INFLATION_CROSS_10),
      priority: 80,
    });
  }

  // Inflation crossed 18
  if (res.inflation >= 18 && prev.inflation < 18) {
    candidates.push({
      type: 'resource',
      text: randomChoice(INFLATION_CROSS_18),
      priority: 82,
    });
  }

  // Narrative dropped below 30
  if (res.narrative < 30 && prev.narrative >= 30) {
    candidates.push({
      type: 'resource',
      text: randomChoice(NARRATIVE_BELOW_30),
      priority: 78,
    });
  }

  // Narrative rose above 60
  if (res.narrative >= 60 && prev.narrative < 60) {
    candidates.push({
      type: 'resource',
      text: randomChoice(NARRATIVE_ABOVE_60),
      priority: 70,
    });
  }

  // Mobilization dropped below 20
  if (res.mobilization < 20 && prev.mobilization >= 20) {
    candidates.push({
      type: 'resource',
      text: randomChoice(MOBILIZATION_BELOW_20),
      priority: 75,
    });
  }

  // Polarization crossed 60
  if (res.polarization >= 60 && prev.polarization < 60) {
    candidates.push({
      type: 'resource',
      text: randomChoice(POLARIZATION_ABOVE_60),
      priority: 72,
    });
  }

  // Dread crossed 40
  if (res.dread >= 40 && prev.dread < 40) {
    candidates.push({
      type: 'resource',
      text: randomChoice(DREAD_ABOVE_40),
      priority: 74,
    });
  }

  // Legitimacy below 30
  if (res.legitimacy < 30 && prev.legitimacy >= 30) {
    candidates.push({
      type: 'resource',
      text: randomChoice(LEGITIMACY_BELOW_30),
      priority: 76,
    });
  }

  // Capital below 20
  if (res.capital < 20 && prev.capital >= 20) {
    candidates.push({
      type: 'resource',
      text: randomChoice(CAPITAL_BELOW_20),
      priority: 68,
    });
  }

  // 6. Bloc loyalty shifts
  for (const blocId of Object.keys(state.blocs) as BlocId[]) {
    const bloc = state.blocs[blocId];

    // Crossed below 25
    if (bloc.loyalty < 25 && bloc.loyalty > 15) {
      const pool = BLOC_LOW_LOYALTY[blocId];
      if (pool && pool.length > 0) {
        candidates.push({
          type: 'bloc_shift',
          text: randomChoice(pool),
          priority: 65,
        });
      }
    }

    // Crossed above 70
    if (bloc.loyalty >= 70 && bloc.loyalty <= 75) {
      const pool = BLOC_HIGH_LOYALTY[blocId];
      if (pool && pool.length > 0) {
        candidates.push({
          type: 'bloc_shift',
          text: randomChoice(pool),
          priority: 60,
        });
      }
    }
  }

  // 7. Policy unlocks
  if (state.newlyUnlockedPolicyIds.length > 0) {
    candidates.push({
      type: 'unlock',
      text: randomChoice(POLICY_UNLOCK_TEXTS),
      priority: 50,
    });
  }

  // 8. Colossus patience dropping
  if (state.colossus.patience < 30) {
    candidates.push({
      type: 'resource',
      text: randomChoice(COLOSSUS_PATIENCE_LOW),
      priority: 55,
    });
  }

  // 9. Color vignettes for quiet turns
  if (candidates.length < 2) {
    candidates.push({
      type: 'color',
      text: randomChoice(COLOR_VIGNETTES),
      priority: 35,
    });
  }

  // Sort by priority (highest first) and take top 3
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 3).map(({ priority, ...item }) => item);
}
