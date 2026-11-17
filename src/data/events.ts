import type { GameEvent } from '../types/events';

export const EVENT_POOL: GameEvent[] = [
  // === RIVAL THRESHOLD EVENTS ===
  {
    id: 'the_rally',
    name: 'The Rally',
    description: 'The Rival held a rally in a shuttered factory. Attendance: 40,000. Average age of the factory\'s last workers: deceased.',
    trigger: { type: 'rival_threshold', powerLevel: 30 },
    oneShot: true,
    choices: [
      {
        id: 'cover_spectacle',
        label: 'Let the Heralds cover it',
        tooltip: 'Ratings gold. The Rival gets airtime, but the Heralds are happy.',
        outcomeText: 'The cameras rolled. The Rival looked good on screen. But so did the democratic process. You hope that matters more.',
        effects: {
          blocs: { media: { loyalty: +5 } },
          resources: { polarization: +3 },
          rivalPower: +0,
        },
      },
      {
        id: 'downplay_rally',
        label: 'Pressure the Heralds to downplay it',
        tooltip: 'Suppress coverage. The Heralds resent it. The Rival grows in the shadows.',
        outcomeText: 'The morning papers were thin. But whispers travel faster than print. The Rival\'s supporters shared the footage anyway.',
        effects: {
          blocs: { media: { loyalty: -5 } },
          rivalPower: +5,
        },
      },
    ],
  },
  {
    id: 'congressional_gridlock',
    name: 'Congressional Gridlock',
    description: 'The Rival\'s caucus is blocking everything. Bills cost more. Main Street is losing patience.',
    trigger: { type: 'rival_threshold', powerLevel: 50 },
    oneShot: true,
    autoEffects: {
      resources: { polarization: +5 },
      blocs: { mainStreet: { loyalty: -5 } },
    },
  },
  {
    id: 'culture_war_offensive',
    name: 'Culture War Offensive',
    description: 'The Rival declared war on a Scholar\'s research. The defense is peer-reviewed. It will convince no one.',
    trigger: { type: 'rival_threshold', powerLevel: 60 },
    oneShot: true,
    autoEffects: {
      blocs: {
        artists: { loyalty: -5 },
        academy: { loyalty: -5 },
      },
      resources: { polarization: +8 },
      laborCohesion: -10,
    },
  },
  {
    id: 'crisis_of_legitimacy',
    name: 'Crisis of Legitimacy',
    description: 'The Rival questions the electoral system. The Colossus sends mixed signals.',
    trigger: { type: 'rival_threshold', powerLevel: 70 },
    oneShot: true,
    condition: (state) => state.blocs.court.loyalty <= 60,
    autoEffects: {
      resources: { legitimacy: -10, polarization: +5 },
    },
  },
  {
    id: 'oligarchs_bet',
    name: 'The Oligarch\'s Bet',
    description: 'Banks and Big Tech are hedging. They haven\'t abandoned you. They\'re just... diversifying.',
    trigger: { type: 'rival_threshold', powerLevel: 85 },
    oneShot: true,
    autoEffects: {
      resources: { capital: -20, polarization: +5 },
      rivalPower: +5,
    },
  },
  {
    id: 'march_on_miranda',
    name: 'March on Miranda',
    description: 'The Rival\'s supporters march on the capital. This is not a drill.',
    trigger: { type: 'rival_threshold', powerLevel: 95 },
    oneShot: true,
    autoEffects: {
      resources: { polarization: +10, narrative: -20, legitimacy: -10 },
    },
  },

  // === RANDOM EVENTS ===
  {
    id: 'currency_crisis',
    name: 'Currency Crisis',
    description: 'Miranda\'s currency dropped 8% overnight. The Banks are "expressing concerns through market mechanisms."',
    trigger: { type: 'random', weight: 3 },
    condition: (state) => state.resources.inflation > 12,
    choices: [
      {
        id: 'raise_rates',
        label: 'Raise interest rates',
        tooltip: 'Stabilize the currency. Growth, jobs, and popularity take a hit.',
        outcomeText: 'The peso stabilized by noon. The unemployment line grew by evening. Your Finance Minister called it "necessary medicine." The patients disagreed.',
        effects: {
          resources: { inflation: -3, capital: -15 },
          blocs: { finance: { loyalty: +10 }, labor: { loyalty: -10 }, industry: { loyalty: -5 } },
        },
      },
      {
        id: 'ride_it_out',
        label: 'Ride it out',
        tooltip: 'Markets correct themselves. Sometimes. Eventually.',
        effects: {
          resources: { inflation: +2 },
          blocs: { finance: { loyalty: -10 } },
          rivalPower: +3,
        },
      },
    ],
  },
  {
    id: 'colossus_trade_offer',
    name: 'The Colossus Extends a Hand',
    description: 'The Colossus ambassador offered a generous development loan. The interest rate is reasonable. The conditions are everything else.',
    trigger: { type: 'random', weight: 3 },
    choices: [
      {
        id: 'accept_loan',
        label: 'Accept the loan',
        tooltip: 'Money now, sovereignty later.',
        outcomeText: 'The check cleared. The ambassador shook your hand for slightly too long. "We are partners now," she said. The word "partners" did a lot of heavy lifting.',
        effects: {
          resources: { capital: +40, colossusAlignment: +10 },
          blocs: { finance: { loyalty: +10 }, industry: { loyalty: -5 }, labor: { loyalty: -5 } },
        },
      },
      {
        id: 'decline_loan',
        label: 'Politely decline',
        tooltip: 'Sovereignty now, money never.',
        outcomeText: 'The ambassador\'s smile froze. "We understand," she said. She did not understand. The treasury remained empty but yours.',
        effects: {
          resources: { colossusAlignment: -5 },
          blocs: { industry: { loyalty: +5 }, labor: { loyalty: +5 } },
        },
      },
    ],
  },
  {
    id: 'syndicate_offer',
    name: 'An Envelope on Your Desk',
    description: 'A man you\'ve never met left an envelope with a man you\'ll never see. Inside: a solution to your congressional math problem.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.syndicate.loyalty >= 30,
    choices: [
      {
        id: 'accept_syndicate_help',
        label: 'Open the envelope',
        tooltip: 'Congressional math solved. Don\'t ask how.',
        effects: {
          resources: { legitimacy: -5, dread: +3 },
          blocs: { syndicate: { loyalty: +10 } },
        },
      },
      {
        id: 'reject_syndicate_help',
        label: 'Return it unopened',
        tooltip: 'Integrity preserved. The math remains unsolved.',
        effects: {
          blocs: { syndicate: { loyalty: -10 }, court: { loyalty: +5 } },
          resources: { legitimacy: +3 },
        },
      },
    ],
  },
  {
    id: 'general_strike_threat',
    name: 'Strike Warning',
    description: 'The Unions called for a general strike. Turnout was... optimistic.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.labor.loyalty < 35,
    autoEffects: {
      resources: { mobilization: -5 },
      blocs: { labor: { loyalty: -5 }, mainStreet: { loyalty: -3 } },
      rivalPower: +2,
    },
  },
  {
    id: 'tech_scandal',
    name: 'Data Breach',
    description: 'Big Tech accidentally leaked the personal data of 12 million Mirandans. Their apology was algorithmic.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'regulate_tech',
        label: 'Push emergency data regulations',
        tooltip: 'Protect citizens. Anger Big Tech.',
        effects: {
          blocs: { tech: { loyalty: -15 }, academy: { loyalty: +5 }, mainStreet: { loyalty: +5 } },
          resources: { narrative: +3, legitimacy: +3 },
        },
      },
      {
        id: 'let_tech_slide',
        label: 'Express concern, do nothing',
        tooltip: 'Big Tech remembers its friends.',
        effects: {
          blocs: { tech: { loyalty: +5 }, academy: { loyalty: -5 } },
          resources: { narrative: -3 },
          rivalPower: +2,
        },
      },
    ],
  },

  {
    id: 'herald_expose',
    name: 'The Exposé',
    description: 'The Heralds published an investigative series on government corruption. It\'s well-sourced, elegantly written, and absolutely devastating.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.media.loyalty > 40,
    choices: [
      {
        id: 'cooperate_press',
        label: 'Cooperate with the investigation',
        tooltip: 'Transparency looks good. The details look less good.',
        effects: {
          blocs: { media: { loyalty: +10 }, syndicate: { loyalty: -5 } },
          resources: { legitimacy: +5, narrative: +3 },
        },
      },
      {
        id: 'discredit_story',
        label: 'Discredit the story',
        tooltip: 'Attack the messenger. It works until it doesn\'t.',
        effects: {
          blocs: { media: { loyalty: -15 } },
          resources: { narrative: -5 },
          rivalPower: +3,
        },
      },
    ],
  },
  {
    id: 'labor_wildcat_strike',
    name: 'Wildcat Strike',
    description: 'Workers at the Miranda Docks walked off the job without union approval. Management is furious. The Unions are... recalculating.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.labor.loyalty > 55,
    choices: [
      {
        id: 'back_strikers',
        label: 'Back the strikers',
        tooltip: 'Solidarity forever. Or at least until the next election.',
        effects: {
          blocs: { labor: { loyalty: +10 }, industry: { loyalty: -10 }, finance: { loyalty: -5 } },
          resources: { mobilization: +5 },
          laborCohesion: +10,
        },
      },
      {
        id: 'enforce_contracts',
        label: 'Enforce existing contracts',
        tooltip: 'The law is the law. The workers are the workers. The docks are closed.',
        effects: {
          blocs: { labor: { loyalty: -10 }, industry: { loyalty: +5 }, finance: { loyalty: +5 } },
          laborCohesion: -5,
        },
      },
    ],
  },
  {
    id: 'tech_automation_wave',
    name: 'The Automation Wave',
    description: 'Big Tech unveiled an AI system that can replace 30% of Miranda\'s clerical workforce. The demo was impressive. The unemployment projections were more so.',
    trigger: { type: 'random', weight: 3 },
    choices: [
      {
        id: 'regulate_automation',
        label: 'Impose an automation tax',
        tooltip: 'Slow the machines. Fund the humans. Annoy the engineers.',
        effects: {
          blocs: { tech: { loyalty: -10 }, labor: { loyalty: +10 }, mainStreet: { loyalty: +5 } },
          resources: { capital: +10 },
        },
      },
      {
        id: 'embrace_automation',
        label: 'Embrace the future',
        tooltip: 'Efficiency gains for everyone. Well, everyone who still has a job.',
        effects: {
          blocs: { tech: { loyalty: +10 }, labor: { loyalty: -10 }, academy: { loyalty: +5 } },
          resources: { inflation: -1 },
          laborCohesion: -5,
        },
      },
    ],
  },
  {
    id: 'rural_drought',
    name: 'The Drought',
    description: 'Three months without rain. The Landowners are losing crops. Main Street is losing patience. The Clergy is gaining attendance.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'emergency_relief',
        label: 'Declare agricultural emergency',
        tooltip: 'Open the treasury. Close the budget gap later.',
        effects: {
          blocs: { agri: { loyalty: +10 }, mainStreet: { loyalty: +5 } },
          resources: { capital: -20, legitimacy: +3 },
        },
      },
      {
        id: 'market_solution',
        label: 'Let the market adjust',
        tooltip: 'Prices will stabilize. Farms might not.',
        effects: {
          blocs: { agri: { loyalty: -10 }, finance: { loyalty: +5 } },
          resources: { inflation: +2 },
          rivalPower: +3,
        },
      },
    ],
  },

  // === RESOURCE THRESHOLD EVENTS ===
  {
    id: 'colossus_military_exercise',
    name: 'Joint Exercises',
    description: 'The Colossus wants to station "advisors" at Miranda\'s largest air base. They brought a 200-page agreement and a smile.',
    trigger: { type: 'resource_threshold', resource: 'colossusAlignment', direction: 'above', threshold: 70 },
    oneShot: true,
    choices: [
      {
        id: 'allow_advisors',
        label: 'Welcome the advisors',
        tooltip: 'Security guaranteed. Sovereignty negotiable.',
        effects: {
          blocs: { military: { loyalty: +10 } },
          resources: { colossusAlignment: +10, dread: +3 },
        },
      },
      {
        id: 'decline_advisors',
        label: 'Politely decline',
        tooltip: 'Miranda\'s bases belong to Miranda. For now.',
        effects: {
          blocs: { military: { loyalty: -5 } },
          resources: { colossusAlignment: -10, legitimacy: +5 },
        },
      },
    ],
  },

  // === LOYALTY THRESHOLD EVENTS ===
  {
    id: 'bank_capital_flight',
    name: 'Capital Flight',
    description: 'Miranda\'s largest bank quietly moved its reserve operations to a Colossus subsidiary. The finance ministry found out from the Herald\'s business section.',
    trigger: { type: 'loyalty_threshold', blocId: 'finance', direction: 'below', threshold: 30 },
    oneShot: false,
    autoEffects: {
      resources: { capital: -15, inflation: +2 },
      blocs: { finance: { power: -5 } },
    },
  },
  {
    id: 'court_constitutional_review',
    name: 'Constitutional Review',
    description: 'The Court announced a review of recent executive orders. The language was measured. The implications were not.',
    trigger: { type: 'loyalty_threshold', blocId: 'court', direction: 'below', threshold: 35 },
    oneShot: false,
    autoEffects: {
      resources: { legitimacy: -5, narrative: -3 },
      rivalPower: +3,
    },
  },


  {
    id: 'military_readiness',
    name: 'Military "Readiness Exercises"',
    description: 'The Generals have scheduled additional "readiness exercises." No one asked what they\'re getting ready for.',
    trigger: { type: 'loyalty_threshold', blocId: 'military', direction: 'below', threshold: 25 },
    oneShot: false,
    autoEffects: {
      resources: { dread: +5, legitimacy: -3 },
    },
  },
  {
    id: 'syndicate_message',
    name: 'A Message',
    description: 'The Underworld hasn\'t said anything. That\'s worse.',
    trigger: { type: 'loyalty_threshold', blocId: 'syndicate', direction: 'below', threshold: 15 },
    oneShot: false,
    autoEffects: {
      resources: { legitimacy: -3, narrative: -5 },
      blocs: { mainStreet: { loyalty: -3 } },
    },
  },
  {
    id: 'clergy_sermon',
    name: 'The Sermon',
    description: 'The Clergy delivered a sermon about moral decay in government. Attendance was up 30%.',
    trigger: { type: 'loyalty_threshold', blocId: 'clergy', direction: 'below', threshold: 30 },
    oneShot: false,
    autoEffects: {
      resources: { narrative: -3 },
      blocs: { mainStreet: { loyalty: -3 } },
      rivalPower: +2,
    },
  },

  // === PHASE 6: SYNDICATE "MESSAGE" EVENTS ===
  {
    id: 'syndicate_protection_racket',
    name: 'The Protection Racket',
    description: 'The Underworld sent representatives to Main Street businesses. They offered "insurance." The premiums are... creative.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.syndicate.loyalty >= 40,
    choices: [
      {
        id: 'ignore_racket',
        label: 'Look the other way',
        tooltip: 'Main Street suffers. The Underworld profits. You maintain plausible deniability.',
        effects: {
          blocs: { syndicate: { loyalty: +5 }, mainStreet: { loyalty: -8 } },
          resources: { dread: +3 },
        },
      },
      {
        id: 'crack_down_racket',
        label: 'Send the Enforcers',
        tooltip: 'Break it up. The Underworld remembers.',
        effects: {
          blocs: { syndicate: { loyalty: -15 }, mainStreet: { loyalty: +5 }, enforcers: { loyalty: +3 } },
          resources: { legitimacy: +3 },
        },
      },
    ],
  },
  {
    id: 'syndicate_smuggling',
    name: 'The Cargo Ship',
    description: 'A ship docked at Port Miranda with cargo that doesn\'t match the manifest. The customs officer is asking for "guidance."',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.syndicate.loyalty >= 30,
    choices: [
      {
        id: 'allow_smuggling',
        label: 'Clear the cargo',
        tooltip: 'Revenue for everyone. Questions for no one.',
        effects: {
          blocs: { syndicate: { loyalty: +10 } },
          resources: { capital: +15, legitimacy: -3, dread: +2 },
        },
      },
      {
        id: 'seize_cargo',
        label: 'Seize the shipment',
        tooltip: 'Law and order. Minus the revenue.',
        effects: {
          blocs: { syndicate: { loyalty: -10 }, court: { loyalty: +5 } },
          resources: { legitimacy: +3 },
        },
      },
    ],
  },
  {
    id: 'syndicate_favor',
    name: 'A Favor Owed',
    description: 'The Underworld\'s representative arrived at your office. Not through the door. "We need a small thing. You owe us a large thing."',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.syndicate.loyalty >= 50,
    choices: [
      {
        id: 'grant_favor',
        label: 'Pay the favor',
        tooltip: 'Debts are debts. Even the kind that aren\'t on paper.',
        effects: {
          blocs: { syndicate: { loyalty: +10 }, court: { loyalty: -5 } },
          resources: { legitimacy: -5, dread: +3 },
        },
      },
      {
        id: 'refuse_favor',
        label: 'Refuse politely',
        tooltip: '"Politely" is doing a lot of work in this sentence.',
        effects: {
          blocs: { syndicate: { loyalty: -15 } },
          resources: { dread: +5 },
        },
      },
    ],
  },
  {
    id: 'syndicate_info_broker',
    name: 'The Informant',
    description: 'An Underworld contact offers intelligence on the Rival\'s campaign funding. The price is a blind eye to certain "imports."',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.syndicate.loyalty >= 35 && state.rival.power > 40,
    choices: [
      {
        id: 'buy_intel',
        label: 'Buy the intelligence',
        tooltip: 'Knowledge is power. Corruption is the cost.',
        effects: {
          blocs: { syndicate: { loyalty: +5 } },
          resources: { legitimacy: -3, dread: +2 },
          rivalPower: -5,
        },
      },
      {
        id: 'decline_intel',
        label: 'Decline the offer',
        tooltip: 'Stay clean. The Rival stays funded.',
        effects: {
          blocs: { syndicate: { loyalty: -5 } },
          resources: { legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'syndicate_election_help',
    name: 'The Ballot Box',
    description: 'The Underworld offers to "ensure favorable outcomes" in a key district. Their track record is excellent. Their methods are not.',
    trigger: { type: 'random', weight: 1 },
    condition: (state) => state.blocs.syndicate.loyalty >= 45,
    choices: [
      {
        id: 'accept_ballot_help',
        label: 'Accept the help',
        tooltip: 'Win the district. Lose the moral high ground.',
        effects: {
          blocs: { syndicate: { loyalty: +10 } },
          resources: { legitimacy: -8, narrative: +3, dread: +3 },
          rivalPower: -3,
        },
      },
      {
        id: 'reject_ballot_help',
        label: 'Reject it absolutely',
        tooltip: 'Democracy isn\'t for sale. At least not at this price.',
        effects: {
          blocs: { syndicate: { loyalty: -10 }, court: { loyalty: +5 } },
          resources: { legitimacy: +5 },
        },
      },
    ],
  },

  // === PHASE 6: CRISIS CHAIN EVENTS ===
  // Banking Crisis chain
  {
    id: 'crisis_bank_run_rumors',
    name: 'Bank Run Rumors',
    description: 'Whispers spread through Miranda\'s financial district. People are lining up at ATMs. The Banks insist everything is fine. The lines are getting longer.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'banking_crisis',
    oneShot: true,
    choices: [
      {
        id: 'guarantee_deposits',
        label: 'Guarantee all deposits',
        tooltip: 'Calm the crowds. Empty the treasury.',
        effects: {
          resources: { capital: -30, legitimacy: +3 },
          blocs: { finance: { loyalty: +10 }, mainStreet: { loyalty: +5 } },
        },
      },
      {
        id: 'let_markets_decide',
        label: 'Let the market correct',
        tooltip: 'Markets correct themselves. Unless they don\'t.',
        effects: {
          resources: { inflation: +2 },
          blocs: { finance: { loyalty: -10 } },
          rivalPower: +3,
        },
      },
    ],
  },
  {
    id: 'crisis_credit_freeze',
    name: 'Credit Freeze',
    description: 'Banks stopped lending. Businesses can\'t make payroll. The economy is holding its breath.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'banking_crisis',
    oneShot: true,
    autoEffects: {
      resources: { capital: -20, inflation: +3 },
      blocs: { finance: { loyalty: -5 }, industry: { loyalty: -5 }, mainStreet: { loyalty: -5 } },
      rivalPower: +3,
    },
  },
  {
    id: 'crisis_bank_resolution',
    name: 'The Banking Resolution',
    description: 'The crisis peaks. Parliament demands action. The Banks demand bailouts. Main Street demands answers.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'banking_crisis',
    oneShot: true,
    choices: [
      {
        id: 'bailout_banks',
        label: 'Bail out the banks',
        tooltip: 'Save the system. Pay the price.',
        outcomeText: 'The banks reopened Monday morning. The treasury was lighter by a generation\'s savings. The Banks sent a thank-you note. Main Street sent something less polite.',
        effects: {
          resources: { capital: -40, legitimacy: -5 },
          blocs: { finance: { loyalty: +15 }, mainStreet: { loyalty: -10 }, labor: { loyalty: -10 } },
        },
      },
      {
        id: 'nationalize_banks',
        label: 'Nationalize failing banks',
        tooltip: 'Take control. The Banks will never forgive you. Everyone else might.',
        outcomeText: 'Government officials arrived at the banks with paperwork and purpose. The tellers looked confused. The executives looked furious. Main Street looked... relieved.',
        effects: {
          blocs: { finance: { loyalty: -20, power: -10 }, labor: { loyalty: +10 }, mainStreet: { loyalty: +5 } },
          resources: { legitimacy: +5, polarization: +5 },
        },
      },
    ],
  },

  // Military Restlessness chain
  {
    id: 'crisis_barracks_rumors',
    name: 'Barracks Rumors',
    description: 'Junior officers are talking. The Generals are listening. Nobody is sharing what they hear.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'military_restlessness',
    oneShot: true,
    choices: [
      {
        id: 'increase_military_pay',
        label: 'Increase military pay',
        tooltip: 'Money solves most problems. At least the ones with uniforms.',
        effects: {
          resources: { capital: -25 },
          blocs: { military: { loyalty: +10 } },
        },
      },
      {
        id: 'reassure_generals',
        label: 'Hold private meetings',
        tooltip: 'Talk to the Generals. Promise things. Mean some of them.',
        effects: {
          blocs: { military: { loyalty: +5 } },
          resources: { dread: +3 },
        },
      },
    ],
  },
  {
    id: 'crisis_officers_ultimatum',
    name: 'The Officers\' Ultimatum',
    description: 'A delegation of colonels requested a "private audience." They arrived in dress uniforms. They brought a list of demands.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'military_restlessness',
    oneShot: true,
    choices: [
      {
        id: 'accept_demands',
        label: 'Accept their demands',
        tooltip: 'Give them what they want. It\'s cheaper than a coup.',
        effects: {
          blocs: { military: { loyalty: +15 } },
          resources: { capital: -30, legitimacy: -5, dread: +5 },
        },
      },
      {
        id: 'call_bluff',
        label: 'Call their bluff',
        tooltip: 'Stare them down. Hope they blink first.',
        effects: {
          blocs: { military: { loyalty: -10 } },
          resources: { legitimacy: +5 },
          rivalPower: +5,
        },
      },
    ],
  },
  {
    id: 'crisis_loyalty_oath',
    name: 'The Loyalty Question',
    description: 'The crisis comes to a head. Will the military stand with the republic... or with whoever offers more?',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'military_restlessness',
    oneShot: true,
    choices: [
      {
        id: 'purge_disloyal',
        label: 'Purge disloyal officers',
        tooltip: 'Remove the threat. Create new enemies.',
        effects: {
          blocs: { military: { loyalty: +10, power: -10 }, enforcers: { loyalty: +5 } },
          resources: { dread: +10, legitimacy: -5 },
        },
      },
      {
        id: 'unity_ceremony',
        label: 'Hold a unity ceremony',
        tooltip: 'Pageantry and patriotism. Sometimes that\'s enough.',
        effects: {
          blocs: { military: { loyalty: +5 } },
          resources: { narrative: +5, legitimacy: +3 },
        },
      },
    ],
  },

  // Labor Uprising chain
  {
    id: 'crisis_rolling_strikes',
    name: 'Rolling Strikes',
    description: 'Dockworkers walked out Monday. Factory workers joined Tuesday. By Wednesday, the entire industrial district was silent.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'labor_uprising',
    oneShot: true,
    choices: [
      {
        id: 'negotiate_strikers',
        label: 'Open negotiations',
        tooltip: 'Talk. Listen. Concede something. It\'s diplomacy with hard hats.',
        effects: {
          blocs: { labor: { loyalty: +10 }, industry: { loyalty: -5 } },
          resources: { capital: -15 },
          laborCohesion: +10,
        },
      },
      {
        id: 'send_enforcers_strike',
        label: 'Send in the Enforcers',
        tooltip: 'Break the strike. Break the workers\' trust while you\'re at it.',
        effects: {
          blocs: { labor: { loyalty: -15 }, enforcers: { loyalty: +5 }, industry: { loyalty: +5 } },
          resources: { dread: +8, mobilization: -10 },
          laborCohesion: -15,
        },
      },
    ],
  },
  {
    id: 'crisis_general_shutdown',
    name: 'The General Shutdown',
    description: 'Miranda ground to a halt. Nothing moves. Nothing sells. Nothing works. The Rival is giving speeches from a flatbed truck.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'labor_uprising',
    oneShot: true,
    choices: [
      {
        id: 'grand_bargain',
        label: 'Propose a grand bargain',
        tooltip: 'Everyone gets something. Nobody gets everything. That\'s how it works.',
        outcomeText: 'Negotiations lasted forty-eight hours. The table was littered with coffee cups and compromises. When it was over, nobody was happy. That meant it worked.',
        effects: {
          blocs: { labor: { loyalty: +10 }, finance: { loyalty: -5 }, industry: { loyalty: -5 } },
          resources: { capital: -25, legitimacy: +5 },
          laborCohesion: +15,
          rivalPower: -3,
        },
      },
      {
        id: 'declare_emergency',
        label: 'Declare a state of emergency',
        tooltip: 'Martial law is just a suggestion... with tanks.',
        effects: {
          blocs: { labor: { loyalty: -20 }, military: { loyalty: +10 }, mainStreet: { loyalty: -10 } },
          resources: { dread: +15, legitimacy: -10 },
          laborCohesion: -20,
          rivalPower: +5,
        },
      },
    ],
  },

  // Media Scandal chain
  {
    id: 'crisis_leak',
    name: 'The Leak',
    description: 'Someone talked. Documents appeared on the Heralds\' front page. The kind with signatures on them.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'media_scandal',
    oneShot: true,
    choices: [
      {
        id: 'deny_leak',
        label: 'Deny everything',
        tooltip: 'Those documents are fabricated. The signatures are coincidental. The truth is whatever you say.',
        effects: {
          blocs: { media: { loyalty: -10 } },
          resources: { narrative: -5 },
          rivalPower: +3,
        },
      },
      {
        id: 'controlled_release',
        label: 'Get ahead of the story',
        tooltip: 'Release your version first. Context is everything.',
        effects: {
          blocs: { media: { loyalty: +5 } },
          resources: { legitimacy: -3, narrative: +3 },
        },
      },
    ],
  },
  {
    id: 'crisis_investigation',
    name: 'The Investigation',
    description: 'The Court opened a formal inquiry. The Heralds are running daily coverage. The Scholars are writing op-eds. This is not going away.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'media_scandal',
    oneShot: true,
    autoEffects: {
      blocs: { court: { loyalty: -5 }, media: { loyalty: -3 } },
      resources: { legitimacy: -5, narrative: -5 },
      rivalPower: +3,
    },
  },
  {
    id: 'crisis_verdict',
    name: 'The Verdict',
    description: 'The investigation concluded. The findings are on every newsstand. Miranda holds its breath.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'media_scandal',
    oneShot: true,
    choices: [
      {
        id: 'accept_findings',
        label: 'Accept the findings',
        tooltip: 'Take responsibility. It hurts now but heals later.',
        outcomeText: 'You stood at the podium and said the words nobody expected. "We were wrong." The silence lasted three seconds. Then something shifted. The Heralds wrote about integrity. The Court nodded.',
        effects: {
          blocs: { court: { loyalty: +10 }, media: { loyalty: +5 } },
          resources: { legitimacy: +5, narrative: +5 },
          rivalPower: -2,
        },
      },
      {
        id: 'dismiss_findings',
        label: 'Dismiss the findings',
        tooltip: '"Politically motivated." Everyone knows. Nobody can prove it.',
        effects: {
          blocs: { court: { loyalty: -10 }, media: { loyalty: -10 } },
          resources: { narrative: -8, polarization: +5 },
          rivalPower: +5,
        },
      },
    ],
  },

  // Colossus Pressure chain
  {
    id: 'crisis_diplomatic_warning',
    name: 'The Diplomatic Warning',
    description: 'The Colossus ambassador requested an "urgent meeting." She arrived with a prepared statement and zero small talk.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'colossus_pressure',
    oneShot: true,
    choices: [
      {
        id: 'comply_warning',
        label: 'Promise compliance',
        tooltip: 'Say what they want to hear. Do what you need to do.',
        effects: {
          resources: { colossusAlignment: +8, legitimacy: -3 },
        },
      },
      {
        id: 'defy_warning',
        label: 'Stand firm',
        tooltip: 'Miranda is sovereign. For now.',
        effects: {
          resources: { colossusAlignment: -5, narrative: +5 },
          blocs: { industry: { loyalty: +5 }, labor: { loyalty: +5 } },
        },
      },
    ],
  },
  {
    id: 'crisis_sanctions',
    name: 'Sanctions',
    description: 'The Colossus imposed targeted sanctions. "Targeted" meaning everything Miranda exports.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'colossus_pressure',
    oneShot: true,
    autoEffects: {
      resources: { capital: -25, inflation: +3, colossusAlignment: -5 },
      blocs: { finance: { loyalty: -5 }, industry: { loyalty: -5 } },
      rivalPower: +3,
    },
  },
  {
    id: 'crisis_colossus_ultimatum',
    name: 'The Colossus Ultimatum',
    description: 'The Colossus delivered an ultimatum. The language was diplomatic. The aircraft carrier off the coast was less so.',
    trigger: { type: 'random', weight: 0 },
    crisisChainId: 'colossus_pressure',
    oneShot: true,
    choices: [
      {
        id: 'capitulate',
        label: 'Accept the terms',
        tooltip: 'Survival first. Dignity later.',
        outcomeText: 'You signed the document at 3 AM. The ambassador was the only one smiling. Your aide said nothing on the drive home. The aircraft carrier turned around by morning.',
        effects: {
          resources: { colossusAlignment: +20, legitimacy: -10, narrative: -10 },
          blocs: { military: { loyalty: -10 } },
          rivalPower: +5,
        },
      },
      {
        id: 'resist_ultimatum',
        label: 'Refuse the ultimatum',
        tooltip: 'Miranda will not kneel. The consequences will be significant.',
        outcomeText: 'Your statement was broadcast at prime time. The words "Miranda will not kneel" trended internationally by midnight. The Generals saluted. The Colossus went quiet. Quiet is not the same as gone.',
        effects: {
          resources: { colossusAlignment: -15, narrative: +10, mobilization: +10 },
          blocs: { military: { loyalty: +10 }, labor: { loyalty: +5 } },
          rivalPower: -3,
        },
      },
    ],
  },

  // === PHASE 6: GENERAL EVENTS ===
  {
    id: 'natural_disaster',
    name: 'The Flood',
    description: 'The Mariposa River broke its banks. Three districts underwater. The Landowners lost crops. Main Street lost storefronts. The Clergy is organizing shelters.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'massive_relief',
        label: 'Launch massive relief effort',
        tooltip: 'Empty the coffers. Fill the sandbags. Show up with cameras.',
        outcomeText: 'Helicopters flew all night. Sandbags by the thousands. Your boots were muddy on the evening news. The Clergy opened every door. Main Street started cleaning before the water receded.',
        effects: {
          resources: { capital: -30, legitimacy: +5, narrative: +5 },
          blocs: { mainStreet: { loyalty: +10 }, agri: { loyalty: +5 }, clergy: { loyalty: +5 } },
        },
      },
      {
        id: 'minimal_response',
        label: 'Issue statements of concern',
        tooltip: 'Thoughts and prayers. The budget stays intact.',
        effects: {
          blocs: { mainStreet: { loyalty: -10 }, agri: { loyalty: -5 } },
          rivalPower: +5,
        },
      },
    ],
  },
  {
    id: 'celebrity_endorsement',
    name: 'The Celebrity',
    description: 'Miranda\'s most famous singer endorsed your government on live TV. Their fan base is enormous. Their political knowledge is not.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'embrace_celebrity',
        label: 'Welcome the endorsement',
        tooltip: 'Star power is power. Use it.',
        effects: {
          blocs: { artists: { loyalty: +5 }, mainStreet: { loyalty: +5 } },
          resources: { narrative: +5 },
        },
      },
      {
        id: 'distance_celebrity',
        label: 'Keep a professional distance',
        tooltip: 'You don\'t need a pop star. You need good policy. (You also need the pop star.)',
        effects: {
          blocs: { academy: { loyalty: +3 } },
          resources: { legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'foreign_dignitary',
    name: 'The State Visit',
    description: 'A foreign head of state is visiting Miranda. The protocol office is panicking. The caterers are panicking harder.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'lavish_reception',
        label: 'Spare no expense',
        tooltip: 'Make Miranda look prosperous. The bill comes later.',
        effects: {
          resources: { capital: -15, colossusAlignment: +5, narrative: +3 },
          blocs: { finance: { loyalty: +3 } },
        },
      },
      {
        id: 'modest_reception',
        label: 'Keep it simple',
        tooltip: 'Diplomacy doesn\'t need gold plates. But it helps.',
        effects: {
          resources: { colossusAlignment: +2, legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'student_protests',
    name: 'Campus Unrest',
    description: 'Students at Miranda National University occupied the administration building. Their demands are idealistic. Their chanting is relentless.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.resources.polarization > 35,
    choices: [
      {
        id: 'meet_students',
        label: 'Meet with student leaders',
        tooltip: 'Listen. Nod. Promise a committee. It usually works.',
        effects: {
          blocs: { academy: { loyalty: +10 }, artists: { loyalty: +5 } },
          resources: { narrative: +3, mobilization: +3 },
        },
      },
      {
        id: 'clear_campus',
        label: 'Clear the building',
        tooltip: 'End the occupation. Start the resentment.',
        effects: {
          blocs: { academy: { loyalty: -10 }, enforcers: { loyalty: +3 } },
          resources: { dread: +3, narrative: -3 },
          rivalPower: +2,
        },
      },
    ],
  },
  {
    id: 'religious_festival',
    name: 'The Festival of Saints',
    description: 'Miranda\'s annual religious festival drew record crowds. The Clergy is energized. The Artists are inspired. The Enforcers are exhausted.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'sponsor_festival',
        label: 'Sponsor the festival',
        tooltip: 'God and government, together at last.',
        effects: {
          blocs: { clergy: { loyalty: +10 }, artists: { loyalty: +3 } },
          resources: { capital: -10, narrative: +3 },
        },
      },
      {
        id: 'observe_festival',
        label: 'Attend but don\'t sponsor',
        tooltip: 'Separation of church and state. The Clergy notices.',
        effects: {
          blocs: { clergy: { loyalty: +3 }, academy: { loyalty: +3 } },
          resources: { legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'tech_startup_boom',
    name: 'The Miranda Valley',
    description: 'A wave of tech startups is setting up in Miranda. Venture capital is flowing in. The old guard is suspicious. The young are coding.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'tech_incentives',
        label: 'Offer tax incentives',
        tooltip: 'Welcome the future. Worry about the tax base later.',
        effects: {
          blocs: { tech: { loyalty: +10 }, finance: { loyalty: +5 }, labor: { loyalty: -5 } },
          resources: { capital: -10, inflation: -1 },
        },
      },
      {
        id: 'regulate_startups',
        label: 'Regulate first',
        tooltip: 'Rules before revenue. The startups might go elsewhere.',
        effects: {
          blocs: { tech: { loyalty: -5 }, labor: { loyalty: +5 }, academy: { loyalty: +3 } },
          resources: { legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'agricultural_blight',
    name: 'The Blight',
    description: 'A fungal blight is destroying Miranda\'s coffee crop. The Landowners want subsidies. The Banks want collateral. The coffee shops want beans.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.agri.loyalty > 20,
    choices: [
      {
        id: 'subsidize_farmers',
        label: 'Emergency farm subsidies',
        tooltip: 'Save the harvest. Drain the treasury.',
        effects: {
          blocs: { agri: { loyalty: +15 }, finance: { loyalty: -5 } },
          resources: { capital: -20, legitimacy: +3 },
        },
      },
      {
        id: 'import_substitute',
        label: 'Import substitute crops',
        tooltip: 'Solve the shortage. Anger the Landowners.',
        effects: {
          blocs: { agri: { loyalty: -10 }, mainStreet: { loyalty: +5 } },
          resources: { colossusAlignment: +3, inflation: -1 },
        },
      },
    ],
  },
  {
    id: 'media_expose_government',
    name: 'The Deep Dive',
    description: 'The Heralds published a 12-part series on government spending. It\'s thorough, fair, and deeply unflattering.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.media.loyalty > 30 && state.blocs.media.loyalty < 70,
    choices: [
      {
        id: 'reform_spending',
        label: 'Announce spending reforms',
        tooltip: 'Address the findings. The Heralds appreciate accountability.',
        effects: {
          blocs: { media: { loyalty: +5 }, academy: { loyalty: +5 } },
          resources: { legitimacy: +5, capital: -10 },
        },
      },
      {
        id: 'attack_credibility',
        label: 'Question the methodology',
        tooltip: 'The best defense is a good nitpick.',
        effects: {
          blocs: { media: { loyalty: -10 } },
          resources: { narrative: -3 },
          rivalPower: +2,
        },
      },
    ],
  },
  {
    id: 'cultural_renaissance',
    name: 'The Miranda Renaissance',
    description: 'Miranda\'s art scene is exploding. New galleries, films, and novels are capturing international attention. The world is watching.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.artists.loyalty > 50,
    autoEffects: {
      blocs: { artists: { loyalty: +5 }, academy: { loyalty: +3 } },
      resources: { narrative: +5, legitimacy: +3 },
    },
  },
  {
    id: 'border_incident',
    name: 'The Border Incident',
    description: 'Shots fired near the northern border. Nobody knows who started it. Everybody has an opinion.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'military_response',
        label: 'Deploy military reinforcements',
        tooltip: 'Show strength. Risk escalation.',
        effects: {
          blocs: { military: { loyalty: +10 } },
          resources: { dread: +5, colossusAlignment: -3, capital: -15 },
        },
      },
      {
        id: 'diplomatic_response',
        label: 'Pursue diplomatic channels',
        tooltip: 'Talk first. Deploy second. Maybe.',
        effects: {
          blocs: { military: { loyalty: -3 }, academy: { loyalty: +3 } },
          resources: { colossusAlignment: +3, legitimacy: +3 },
        },
      },
    ],
  },
  {
    id: 'economic_summit',
    name: 'The Economic Summit',
    description: 'Miranda is hosting a regional economic summit. The world\'s cameras are pointed at you. Try not to trip.',
    trigger: { type: 'random', weight: 2 },
    choices: [
      {
        id: 'ambitious_proposals',
        label: 'Present ambitious reforms',
        tooltip: 'Dream big on the world stage. Deliver... later.',
        effects: {
          resources: { narrative: +5, colossusAlignment: +5, legitimacy: +3 },
          blocs: { finance: { loyalty: +3 }, academy: { loyalty: +3 } },
        },
      },
      {
        id: 'safe_proposals',
        label: 'Play it safe',
        tooltip: 'Nothing controversial. Nothing memorable. Nothing wrong with that.',
        effects: {
          resources: { colossusAlignment: +3, legitimacy: +2 },
        },
      },
    ],
  },
  {
    id: 'labor_day_rally',
    name: 'Labor Day Rally',
    description: 'Thousands marched through Miranda\'s streets for Labor Day. The signs were colorful. The demands were concrete. The traffic was impossible.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.blocs.labor.loyalty > 40,
    choices: [
      {
        id: 'join_march',
        label: 'Join the march',
        tooltip: 'Walk with the workers. Hope nobody checks your shoes.',
        effects: {
          blocs: { labor: { loyalty: +10 }, finance: { loyalty: -5 } },
          resources: { mobilization: +5, narrative: +3 },
          laborCohesion: +5,
        },
      },
      {
        id: 'send_regards',
        label: 'Send a message of support',
        tooltip: 'Support from a safe distance. Very presidential.',
        effects: {
          blocs: { labor: { loyalty: +3 } },
          resources: { narrative: +1 },
        },
      },
    ],
  },
  // === v1.1: EXTERNAL PRICE SHOCKS AND THE BENEFIT CLIFF ===
  {
    id: 'colossus_foreign_war',
    name: 'A War Elsewhere',
    description: 'The Colossus has started a war on the far side of the world. Shipping lanes are closing. Fuel and grain prices are climbing in ports that have never heard of Miranda.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.turn >= 6,
    choices: [
      {
        id: 'back_the_colossus',
        label: 'Stand with the Colossus',
        tooltip: 'Loyalty is noted. So is the fuel bill, and so are the protests.',
        outcomeText: 'Your statement of solidarity ran on the Colossus evening news for eleven seconds. At home, the price of diesel ran for much longer.',
        effects: {
          blocs: { military: { loyalty: +5 }, finance: { loyalty: +3 }, academy: { loyalty: -6 }, artists: { loyalty: -5 } },
          resources: { colossusAlignment: +8, inflation: +3, narrative: -4 },
        },
      },
      {
        id: 'declare_neutrality',
        label: 'Declare neutrality',
        tooltip: 'Stay out of it. The prices will find you anyway.',
        outcomeText: 'Miranda takes no side. The tankers reroute regardless, and the ambassador stops returning calls.',
        effects: {
          blocs: { academy: { loyalty: +4 }, labor: { loyalty: +3 }, finance: { loyalty: -4 } },
          resources: { colossusAlignment: -6, inflation: +2, narrative: +3 },
        },
      },
    ],
  },
  {
    id: 'heat_dome',
    name: 'The Hottest Summer on Record',
    description: 'For the third year running, the hottest summer on record. Crops are withering in the valley, the reservoirs are low, and the price of beans has become a national conversation.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.turn >= 4,
    choices: [
      {
        id: 'release_reserves',
        label: 'Release grain reserves and cap staple prices',
        tooltip: 'Expensive, and the Landowners will hate the cap. Dinner stays affordable.',
        outcomeText: 'Government trucks roll into the markets at dawn. The Landowners send a strongly worded letter. People eat.',
        effects: {
          blocs: { mainStreet: { loyalty: +5 }, labor: { loyalty: +3 }, agri: { loyalty: -6 } },
          resources: { capital: -15, inflation: +1 },
        },
      },
      {
        id: 'wait_for_rain',
        label: 'Wait for the rains',
        tooltip: 'Costs nothing today. The Clergy will lead the prayers.',
        outcomeText: 'The rains come late and thin. By then the price of a basic basket has a nickname, and it is your name.',
        effects: {
          blocs: { mainStreet: { loyalty: -6 }, clergy: { loyalty: +3 } },
          resources: { inflation: +3 },
          rivalPower: +2,
        },
      },
    ],
  },
  {
    id: 'benefit_cliff',
    name: 'The Cut-off Line',
    description: 'A family earning one peso over the limit lost its food assistance this month. Their neighbors, one peso under, kept theirs. Both households are now on the radio, and they are not angry at the same people.',
    trigger: { type: 'random', weight: 2 },
    condition: (state) => state.turn >= 8 && state.resources.polarization >= 30,
    choices: [
      {
        id: 'phase_out_gradually',
        label: 'Replace the cut-off with a gradual phase-out',
        tooltip: 'Costs more. Nobody loses everything over one peso.',
        outcomeText: 'The new rules take four pages to explain and remove the one line everybody hated. The radio moves on to another grievance.',
        effects: {
          blocs: { mainStreet: { loyalty: +6 }, labor: { loyalty: +3 }, finance: { loyalty: -4 } },
          resources: { capital: -15, polarization: -3 },
        },
      },
      {
        id: 'hold_the_line',
        label: 'Hold the line',
        tooltip: 'Rules are rules. The budget stays tidy. The resentment does not.',
        outcomeText: 'The limit stands. So does the fence between the two households, which is new.',
        effects: {
          blocs: { mainStreet: { loyalty: -7 }, finance: { loyalty: +3 } },
          resources: { polarization: +4 },
        },
      },
    ],
  },
];
