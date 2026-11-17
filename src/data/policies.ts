import type { Policy } from '../types/actions';
import type { GameState } from '../types/game';

export const POLICIES: Policy[] = [
  {
    id: 'austerity_budget',
    name: 'Austerity Budget',
    tooltip: 'Cut spending. "Fiscal responsibility" means the poor pay for the rich\'s mistakes.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 0,
    centrist: true,
    effects: {
      blocs: {
        finance:    { loyalty: +15, power: +5 },
        industry:   { loyalty: -5 },
        labor:      { loyalty: -20 },
        artists:    { loyalty: -10 },
        academy:    { loyalty: -10 },
        mainStreet: { loyalty: +5 },
      },
      resources: {
        capital: +30,
        mobilization: -10,
        polarization: +5,
        colossusAlignment: +5,
        narrative: -5,
      },
      laborCohesion: -5,
    },
  },
  {
    id: 'platform_worker_rights',
    name: 'Platform Worker Rights Act',
    tooltip: 'Give platform workers rights they didn\'t ask for. Whether they thank you depends on whether they trust you.',
    category: 'labor',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 10,
    centrist: false,
    effects: {
      blocs: {
        labor:      { loyalty: +20 },
        tech:       { loyalty: -25, power: -5 },
        mainStreet: { loyalty: -5 },
        finance:    { loyalty: -10 },
        artists:    { loyalty: +5 },
      },
      resources: {
        polarization: +5,
        narrative: +3,
      },
      laborCohesion: +5,
    },
    conditionalEffects: (state: GameState) => {
      const unionLoyalty = state.blocs.labor.loyalty;
      const narrative = state.resources.narrative;
      if (unionLoyalty > 60 && narrative > 50) {
        return { laborCohesion: +8 };
      } else if ((unionLoyalty >= 40 && unionLoyalty <= 60) || (narrative >= 30 && narrative <= 50)) {
        return { laborCohesion: +3 };
      } else if (unionLoyalty < 40 || narrative < 30) {
        return {
          laborCohesion: -3,
          blocs: { mainStreet: { loyalty: -5 } },
        };
      }
      return {};
    },
  },
  {
    id: 'backroom_deal',
    name: 'Backroom Appropriations',
    tooltip: 'Grease the wheels. Everyone knows. Nobody says anything. Until someone does.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 20,
    centrist: false,
    targetBloc: true,
    effects: {
      blocs: {},
      resources: { legitimacy: -5 },
      discovery: {
        chance: 0.3,
        delay: 3,
        effects: {
          blocs: { court: { loyalty: -10 }, media: { loyalty: -15 } },
          resources: { narrative: -8 },
          rivalPower: +5,
        },
      },
    },
  },
  {
    id: 'informal_channels',
    name: 'Informal Channels',
    tooltip: 'The Underworld knows people who know people. You don\'t need to know the details.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 15,
    centrist: false,
    requiresSyndicateLoyalty: 40,
    targetBloc: true,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'syndicate', loyaltyMin: 40, hint: 'The Underworld opens its catalog... eventually. Needs Underworld loyalty 40+.' },
    effects: {
      blocs: {},
      resources: { dread: +3 },
      discovery: {
        chance: 0.2,
        delay: 4,
        effects: {
          blocs: { court: { loyalty: -15 }, media: { loyalty: -20 } },
          resources: { legitimacy: -10, narrative: -12 },
          rivalPower: +8,
        },
      },
    },
  },
  {
    id: 'sovereignty_trade_package',
    name: 'Sovereignty Trade Package',
    tooltip: 'Buy local. Costs more. The Colossus sends a politely threatening letter.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 20,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 4, hint: 'Your trade ministry needs time to draft alternatives. Available from Turn 4.' },
    effects: {
      blocs: {
        industry:   { loyalty: +15 },
        labor:      { loyalty: +10 },
        finance:    { loyalty: -20 },
        tech:       { loyalty: -10 },
      },
      resources: {
        colossusAlignment: -15,
        narrative: +3,
      },
      laborCohesion: +3,
      delayed: {
        turns: 6,
        perTurn: { capital: +5 },
      },
    },
  },
  {
    id: 'green_industrial_policy',
    name: 'Green Industrial Policy',
    tooltip: 'Save the planet AND create jobs. The catch: it costs money and the Landowners hate you.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 75,
    capitalCost: 35,
    centrist: false,
    unlockCondition: { type: 'turn', turn: 4, hint: 'The environmental lobby is still organizing. Available from Turn 4.' },
    effects: {
      blocs: {
        industry:   { loyalty: +10 },
        labor:      { loyalty: +15 },
        academy:    { loyalty: +20 },
        artists:    { loyalty: +10 },
        agri:       { loyalty: -15 },
        finance:    { loyalty: -10 },
        mainStreet: { loyalty: -5 },
      },
      resources: {
        mobilization: +10,
        polarization: +3,
        colossusAlignment: -5,
        narrative: +5,
      },
      laborCohesion: +5,
    },
  },
  {
    id: 'scapegoat_campaign',
    name: 'The Blame Game',
    tooltip: 'Point fingers. It works. For now.',
    category: 'rhetoric',
    minPolarization: 40,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'turn', turn: 6, hint: 'Your propaganda team is still getting organized. Available from Turn 6.' },
    effects: {
      blocs: {
        mainStreet: { loyalty: +10 },
        clergy:     { loyalty: +5 },
        artists:    { loyalty: -15 },
        academy:    { loyalty: -10 },
      },
      resources: {
        polarization: +8,
        mobilization: +5,
        narrative: -3,
      },
      laborCohesion: -8,
      rivalPower: -3,
    },
  },
  {
    id: 'operation_clean_sweep',
    name: 'Operation Clean Sweep',
    tooltip: 'Crack down on the Underworld. The Enforcers get overtime. The Underworld gets creative.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 25,
    centrist: true,
    effects: {
      blocs: {
        enforcers:  { loyalty: +15, power: +5 },
        syndicate:  { loyalty: -25, power: -10 },
        mainStreet: { loyalty: +10 },
        court:      { loyalty: +5 },
        labor:      { loyalty: +5 },
      },
      resources: {
        dread: +10,
        legitimacy: +5,
        narrative: +3,
      },
    },
  },
  {
    id: 'anti_money_laundering',
    name: 'Anti-Money Laundering Act',
    tooltip: 'Regulate dirty money. The Banks and the Underworld agree on exactly one thing: they hate this.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 15,
    centrist: true,
    effects: {
      blocs: {
        finance:    { loyalty: -15 },
        syndicate:  { loyalty: -15 },
        court:      { loyalty: +10 },
        academy:    { loyalty: +5 },
      },
      resources: {
        legitimacy: +5,
        narrative: +3,
        colossusAlignment: +3,
      },
    },
  },

  // === PHASE 6: RIVAL-COUNTERING POLICIES ===
  {
    id: 'public_reconciliation_forum',
    name: 'Public Reconciliation Forum',
    tooltip: 'Invite your enemies to talk it out on national TV. Nothing defuses rage like a three-hour panel discussion.',
    category: 'rhetoric',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 2,
    centrist: true,
    effects: {
      blocs: {
        media:    { loyalty: +5 },
        artists:  { loyalty: +3 },
        clergy:   { loyalty: +3 },
      },
      resources: {
        polarization: -5,
        narrative: +3,
      },
      rivalPower: -2,
    },
  },
  {
    id: 'price_controls_decree',
    name: 'Price Controls Decree',
    tooltip: 'Cap prices by fiat. The economists will hate it, the people will love it... briefly.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 3,
    centrist: false,
    effects: {
      blocs: {
        finance:    { loyalty: -3 },
        mainStreet: { loyalty: +5 },
        labor:      { loyalty: +5 },
      },
      resources: {
        inflation: -4,
      },
    },
  },
  {
    id: 'community_policing',
    name: 'Community Policing Initiative',
    tooltip: 'Replace riot gear with neighborhood barbecues. Surprisingly effective.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 2,
    centrist: true,
    effects: {
      blocs: {
        enforcers:  { loyalty: +3 },
        mainStreet: { loyalty: +5 },
        labor:      { loyalty: +3 },
      },
      resources: {
        dread: -3,
      },
      rivalPower: -2,
    },
  },
  {
    id: 'counter_propaganda_bureau',
    name: 'Counter-Propaganda Bureau',
    tooltip: 'Fight fire with fire. Fight lies with... creative truth.',
    category: 'rhetoric',
    minPolarization: 10,
    maxPolarization: 100,
    capitalCost: 3,
    centrist: false,
    effects: {
      blocs: {
        media:    { loyalty: +5 },
        academy:  { loyalty: -5 },
      },
      resources: {
        polarization: +3,
        narrative: +5,
      },
      rivalPower: -4,
    },
  },
  {
    id: 'stimulus_package',
    name: 'Stimulus Package',
    tooltip: 'Print money to solve the money problem. Bold.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 4,
    centrist: true,
    effects: {
      blocs: {
        finance:    { loyalty: -2 },
        mainStreet: { loyalty: +5 },
        labor:      { loyalty: +5 },
        industry:   { loyalty: +3 },
      },
      resources: {
        inflation: -3,
        legitimacy: +3,
      },
    },
  },
  {
    id: 'national_unity_festival',
    name: 'National Unity Festival',
    tooltip: 'Nothing unites a nation like mandatory fun.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 2,
    centrist: true,
    effects: {
      blocs: {
        artists:    { loyalty: +3 },
        mainStreet: { loyalty: +3 },
        clergy:     { loyalty: +3 },
      },
      resources: {
        polarization: -4,
        narrative: +2,
      },
      rivalPower: -1,
    },
  },

  // === PHASE 6: ECONOMIC POLICIES ===
  {
    id: 'sovereign_wealth_fund',
    name: 'Sovereign Wealth Fund',
    tooltip: 'Put money aside for a rainy day. In Miranda, every day is a rainy day.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 60,
    capitalCost: 40,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 12, hint: 'Long-term planning requires political stability. Available from Turn 12.' },
    effects: {
      blocs: {
        finance:  { loyalty: +10 },
        academy:  { loyalty: +5 },
        labor:    { loyalty: -5 },
      },
      resources: {
        legitimacy: +3,
        colossusAlignment: +5,
      },
      delayed: {
        turns: 8,
        perTurn: { capital: +8 },
      },
    },
  },
  {
    id: 'black_market_crackdown',
    name: 'Black Market Crackdown',
    tooltip: 'Shut down the shadow economy. Everyone involved suddenly discovers legitimate business interests.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 15,
    centrist: true,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'military', loyaltyMin: 50, hint: 'The generals offer to "assist" with the shadow economy. Needs Military loyalty 50+.', or: { type: 'resource', resource: 'dread', resourceMin: 40, hint: '' } },
    effects: {
      blocs: {
        syndicate:  { loyalty: -15, power: -5 },
        enforcers:  { loyalty: +5 },
        finance:    { loyalty: +5 },
        mainStreet: { loyalty: +3 },
      },
      resources: {
        inflation: -2,
        dread: +3,
      },
    },
  },
  {
    id: 'tourism_initiative',
    name: 'Tourism Initiative',
    tooltip: '"Visit Miranda. Experience the charm. Ignore the protests." The brochures practically write themselves.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 20,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 8, hint: 'The tourism board is still getting organized. Available from Turn 8.' },
    effects: {
      blocs: {
        artists:    { loyalty: +5 },
        mainStreet: { loyalty: +5 },
        agri:       { loyalty: +3 },
      },
      resources: {
        narrative: +3,
      },
      delayed: {
        turns: 6,
        perTurn: { capital: +5 },
      },
    },
  },
  {
    id: 'trade_liberalization',
    name: 'Trade Liberalization',
    tooltip: 'Open the borders to goods. The Colossus sends a fruit basket. Local industry sends a lawyer.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 10,
    centrist: true,
    effects: {
      blocs: {
        finance:  { loyalty: +10 },
        tech:     { loyalty: +5 },
        industry: { loyalty: -10 },
        labor:    { loyalty: -5 },
      },
      resources: {
        inflation: -2,
        colossusAlignment: +10,
      },
    },
  },
  {
    id: 'emergency_austerity',
    name: 'Emergency Austerity',
    tooltip: 'When the treasury is empty, cut everything. "We all must sacrifice" (some more than others).',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 0,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 6, hint: 'Desperate times call for desperate cuts. Not yet desperate enough.' },
    effects: {
      blocs: {
        finance:    { loyalty: +10 },
        labor:      { loyalty: -15 },
        artists:    { loyalty: -10 },
        academy:    { loyalty: -5 },
        mainStreet: { loyalty: -5 },
      },
      resources: {
        capital: +25,
        mobilization: -5,
        narrative: -5,
      },
      rivalPower: +2,
    },
  },
  {
    id: 'microfinance_program',
    name: 'Microfinance Program',
    tooltip: 'Small loans for small businesses. Big impact... eventually. If the paperwork cooperates.',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 15,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 12, hint: 'The banking infrastructure for microloans is still being built. Available from Turn 12.' },
    effects: {
      blocs: {
        mainStreet: { loyalty: +10 },
        labor:      { loyalty: +5 },
        finance:    { loyalty: -3 },
      },
      resources: {
        legitimacy: +2,
      },
      delayed: {
        turns: 4,
        perTurn: { capital: +3 },
        cohesionEffect: +1,
      },
    },
  },

  // === PHASE 6: LABOR POLICIES ===
  {
    id: 'minimum_wage_hike',
    name: 'Minimum Wage Hike',
    tooltip: 'Raise the floor. The ceiling stays where it is, but at least people can see it now.',
    category: 'labor',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 10,
    centrist: false,
    effects: {
      blocs: {
        labor:      { loyalty: +15 },
        mainStreet: { loyalty: +5 },
        industry:   { loyalty: -10 },
        finance:    { loyalty: -5 },
      },
      resources: {
        inflation: +1,
        narrative: +3,
      },
      laborCohesion: +5,
    },
  },
  {
    id: 'gig_worker_protections',
    name: 'Gig Worker Protections',
    tooltip: 'Classify gig workers as actual workers. Big Tech discovers a sudden passion for "flexibility."',
    category: 'labor',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 8,
    centrist: false,
    unlockCondition: { type: 'turn', turn: 4, hint: 'The gig economy hearings haven\'t started yet. Available from Turn 4.' },
    effects: {
      blocs: {
        labor:  { loyalty: +10 },
        tech:   { loyalty: -15 },
        academy: { loyalty: +5 },
      },
      resources: {
        narrative: +2,
        polarization: +3,
      },
      laborCohesion: +3,
    },
  },
  {
    id: 'apprenticeship_program',
    name: 'Apprenticeship Program',
    tooltip: 'Train the next generation. In Miranda, "next generation" means anyone who survives this one.',
    category: 'labor',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 12,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 8, hint: 'The training facilities aren\'t ready yet. Available from Turn 8.' },
    effects: {
      blocs: {
        labor:    { loyalty: +5 },
        industry: { loyalty: +10 },
        academy:  { loyalty: +5 },
      },
      resources: {
        legitimacy: +2,
      },
      laborCohesion: +3,
      delayed: {
        turns: 6,
        perTurn: {},
        cohesionEffect: +2,
      },
    },
  },
  {
    id: 'right_to_strike',
    name: 'Right to Strike Guarantee',
    tooltip: 'Enshrine the right to strike. The Unions celebrate. Industry starts pricing in "disruption costs."',
    category: 'labor',
    minPolarization: 10,
    maxPolarization: 90,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'labor', loyaltyMin: 55, hint: 'The Unions believe you\'ll protect them. Needs Union loyalty 55+.' },
    effects: {
      blocs: {
        labor:    { loyalty: +15 },
        industry: { loyalty: -10 },
        finance:  { loyalty: -5 },
      },
      resources: {
        mobilization: +5,
        polarization: +5,
      },
      laborCohesion: +8,
    },
  },

  // === PHASE 6: BACKROOM POLICIES ===
  {
    id: 'blackmail_dossier',
    name: 'Blackmail Dossier',
    tooltip: 'Everyone has secrets. You just happen to have a filing cabinet.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 10,
    centrist: false,
    targetBloc: true,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'syndicate', loyaltyMin: 45, hint: 'The Underworld has files. They\'re willing to share... once they trust you. Needs Underworld loyalty 45+.' },
    effects: {
      blocs: {},
      resources: {
        dread: +5,
        legitimacy: -3,
      },
      discovery: {
        chance: 0.35,
        delay: 2,
        effects: {
          blocs: { court: { loyalty: -15 }, media: { loyalty: -20 } },
          resources: { legitimacy: -15, narrative: -10 },
          rivalPower: +8,
        },
      },
    },
  },
  {
    id: 'offshore_accounts',
    name: 'Offshore Accounts',
    tooltip: 'Move funds to safety. Your safety, not the republic\'s.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    effects: {
      blocs: {
        finance:   { loyalty: +5 },
        syndicate: { loyalty: +5 },
      },
      resources: {
        capital: +30,
        legitimacy: -5,
      },
      discovery: {
        chance: 0.25,
        delay: 4,
        effects: {
          blocs: { court: { loyalty: -20 }, media: { loyalty: -15 } },
          resources: { legitimacy: -20, narrative: -15 },
          rivalPower: +10,
        },
      },
    },
  },
  {
    id: 'palace_coup_insurance',
    name: 'Palace Coup Insurance',
    tooltip: 'Pay the Generals to stay in their barracks. It\'s cheaper than a civil war.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 25,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'syndicate', loyaltyMin: 30, hint: 'The Underworld opens its catalog. Needs Underworld loyalty 30+.' },
    effects: {
      blocs: {
        military:  { loyalty: +15 },
        enforcers: { loyalty: +5 },
      },
      resources: {
        dread: +3,
        legitimacy: -3,
      },
      discovery: {
        chance: 0.2,
        delay: 3,
        effects: {
          blocs: { court: { loyalty: -10 }, academy: { loyalty: -10 } },
          resources: { legitimacy: -10, narrative: -8 },
          rivalPower: +6,
        },
      },
    },
  },
  {
    id: 'shadow_cabinet',
    name: 'Shadow Cabinet',
    tooltip: 'A parallel government nobody elected. Very efficient. Very illegal.',
    category: 'backroom',
    minPolarization: 0,
    maxPolarization: 100,
    capitalCost: 15,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'syndicate', loyaltyMin: 30, hint: 'The Underworld opens its catalog. Needs Underworld loyalty 30+.' },
    effects: {
      blocs: {
        syndicate: { loyalty: +10 },
      },
      resources: {
        mobilization: +5,
        dread: +5,
        legitimacy: -5,
      },
      discovery: {
        chance: 0.3,
        delay: 3,
        effects: {
          blocs: { court: { loyalty: -20 }, media: { loyalty: -15 }, academy: { loyalty: -10 } },
          resources: { legitimacy: -20, narrative: -15 },
          rivalPower: +12,
        },
      },
    },
  },

  // === PHASE 6: RHETORIC POLICIES ===
  {
    id: 'state_media_blitz',
    name: 'State Media Blitz',
    tooltip: 'Flood the airwaves with your message. Subtlety is for countries that can afford it.',
    category: 'rhetoric',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 10,
    centrist: false,
    unlockCondition: { type: 'resource', resource: 'polarization', resourceMin: 40, hint: 'The political climate is heated enough for bold messaging. Needs polarization 40+.' },
    effects: {
      blocs: {
        media:   { loyalty: +10 },
        academy: { loyalty: -5 },
        artists: { loyalty: -3 },
      },
      resources: {
        narrative: +8,
        polarization: +3,
      },
    },
  },
  {
    id: 'whistleblower_hotline',
    name: 'Whistleblower Hotline',
    tooltip: 'Let people report corruption. You just have to hope they don\'t report yours.',
    category: 'rhetoric',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 5,
    centrist: true,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'media', loyaltyMin: 45, hint: 'The Heralds propose a joint anti-corruption initiative. Needs Heralds loyalty 45+.' },
    effects: {
      blocs: {
        court:     { loyalty: +5 },
        academy:   { loyalty: +5 },
        syndicate: { loyalty: -10 },
      },
      resources: {
        legitimacy: +5,
        narrative: +3,
      },
    },
  },
  {
    id: 'historical_revisionism',
    name: 'Historical Revisionism',
    tooltip: 'Rewrite the textbooks. The past is whatever you say it was. The Scholars disagree, but who reads footnotes?',
    category: 'rhetoric',
    minPolarization: 20,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'turn', turn: 6, hint: 'The textbook committee needs time to convene. Available from Turn 6.' },
    effects: {
      blocs: {
        academy:    { loyalty: -15 },
        clergy:     { loyalty: +5 },
        mainStreet: { loyalty: +5 },
      },
      resources: {
        narrative: +5,
        polarization: +5,
        legitimacy: -3,
      },
    },
  },
  {
    id: 'populist_pivot',
    name: 'Populist Pivot',
    tooltip: '"I hear the people." The people aren\'t sure you do, but they appreciate the performance.',
    category: 'rhetoric',
    minPolarization: 20,
    maxPolarization: 100,
    capitalCost: 3,
    centrist: false,
    effects: {
      blocs: {
        mainStreet: { loyalty: +10 },
        labor:      { loyalty: +5 },
        finance:    { loyalty: -10 },
        academy:    { loyalty: -5 },
      },
      resources: {
        mobilization: +5,
        narrative: +3,
        polarization: +3,
      },
      rivalPower: -2,
    },
  },

  // === PHASE 6: SECURITY POLICIES ===
  {
    id: 'border_militarization',
    name: 'Border Militarization',
    tooltip: 'Troops on the border. Nobody\'s getting in. Nobody\'s getting out. Tourism was overrated anyway.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 20,
    centrist: false,
    unlockCondition: { type: 'turn', turn: 8, hint: 'The military needs time to prepare border deployments. Available from Turn 8.' },
    effects: {
      blocs: {
        military:   { loyalty: +10, power: +5 },
        enforcers:  { loyalty: +5 },
        mainStreet: { loyalty: +5 },
        artists:    { loyalty: -10 },
        academy:    { loyalty: -5 },
      },
      resources: {
        dread: +5,
        colossusAlignment: -5,
        polarization: +3,
      },
    },
  },
  {
    id: 'surveillance_network',
    name: 'Surveillance Network',
    tooltip: 'Cameras everywhere. Privacy is a luxury Miranda can no longer afford.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 90,
    capitalCost: 25,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'enforcers', loyaltyMin: 45, hint: 'The Enforcers propose an "infrastructure upgrade." Needs Enforcers loyalty 45+.' },
    effects: {
      blocs: {
        enforcers: { loyalty: +10 },
        tech:      { loyalty: +5 },
        artists:   { loyalty: -10 },
        academy:   { loyalty: -10 },
        media:     { loyalty: -5 },
      },
      resources: {
        dread: +8,
        narrative: -3,
      },
      rivalPower: -3,
    },
  },
  {
    id: 'amnesty_program',
    name: 'Amnesty Program',
    tooltip: 'Forgive past crimes. The guilty breathe easy. The righteous seethe quietly.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 5,
    centrist: true,
    unlockCondition: { type: 'resource', resource: 'narrative', resourceMin: 50, hint: 'Your narrative position is strong enough to take risks. Needs narrative 50+.' },
    effects: {
      blocs: {
        syndicate:  { loyalty: +10 },
        court:      { loyalty: -10 },
        enforcers:  { loyalty: -5 },
        clergy:     { loyalty: +5 },
      },
      resources: {
        polarization: -3,
        dread: -5,
        legitimacy: -3,
      },
    },
  },
  {
    id: 'paramilitary_disbandment',
    name: 'Paramilitary Disbandment',
    tooltip: 'Send the militias home. Some of them will actually go.',
    category: 'security',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 10,
    centrist: true,
    unlockCondition: { type: 'resource', resource: 'narrative', resourceMin: 50, hint: 'Your narrative position is strong enough to take risks. Needs narrative 50+.' },
    effects: {
      blocs: {
        military:  { loyalty: -5 },
        enforcers: { loyalty: -5 },
        court:     { loyalty: +10 },
        academy:   { loyalty: +5 },
      },
      resources: {
        dread: -8,
        legitimacy: +5,
        polarization: -3,
      },
      rivalPower: -2,
    },
  },

  // === PHASE 6: DIPLOMATIC POLICIES ===
  {
    id: 'foreign_aid_package',
    name: 'Foreign Aid Package',
    tooltip: 'Accept help from abroad. The conditions are manageable. The optics are debatable.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 0,
    centrist: true,
    effects: {
      blocs: {
        finance: { loyalty: +5 },
        labor:   { loyalty: -3 },
      },
      resources: {
        capital: +35,
        colossusAlignment: +8,
        legitimacy: -2,
      },
    },
  },
  {
    id: 'embassy_expansion',
    name: 'Embassy Expansion',
    tooltip: 'Open new embassies. Staff them with the ambitious and the expendable.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 15,
    centrist: true,
    effects: {
      blocs: {
        academy: { loyalty: +5 },
        court:   { loyalty: +3 },
      },
      resources: {
        colossusAlignment: +5,
        narrative: +2,
        legitimacy: +2,
      },
    },
  },
  {
    id: 'colossus_trade_deal',
    name: 'Colossus Trade Deal',
    tooltip: 'Sign on the dotted line. The Colossus gets market access. You get... a pen.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 5,
    centrist: true,
    unlockCondition: { type: 'turn', turn: 12, hint: 'The Colossus ambassador is still drafting terms. Available from Turn 12.' },
    effects: {
      blocs: {
        finance:  { loyalty: +10 },
        industry: { loyalty: -10 },
        labor:    { loyalty: -5 },
        tech:     { loyalty: +5 },
      },
      resources: {
        colossusAlignment: +12,
        inflation: -2,
      },
      delayed: {
        turns: 6,
        perTurn: { capital: +6 },
      },
    },
  },

  // === PHASE 6: INSTITUTIONAL POLICIES ===
  {
    id: 'constitutional_amendment',
    name: 'Constitutional Amendment',
    tooltip: 'Change the rules. The old rules were written by people who couldn\'t imagine you.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 60,
    capitalCost: 20,
    centrist: true,
    requiresMajority: true,
    unlockCondition: { type: 'turn', turn: 8, hint: 'Your legal team is still drafting the amendment. Available from Turn 8.' },
    effects: {
      blocs: {
        court:   { loyalty: +10 },
        academy: { loyalty: +10 },
        clergy:  { loyalty: -5 },
      },
      resources: {
        legitimacy: +8,
        narrative: +3,
        polarization: +3,
      },
    },
  },
  {
    id: 'electoral_reform',
    name: 'Electoral Reform',
    tooltip: 'Make elections fairer. Whoever "fairer" benefits will be very pleased.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 15,
    centrist: true,
    requiresMajority: true,
    unlockCondition: { type: 'turn', turn: 8, hint: 'The electoral commission is still reviewing proposals. Available from Turn 8.' },
    effects: {
      blocs: {
        court:      { loyalty: +5 },
        academy:    { loyalty: +5 },
        mainStreet: { loyalty: +5 },
      },
      resources: {
        legitimacy: +5,
        polarization: -3,
      },
      rivalPower: -2,
    },
  },
  {
    id: 'judicial_appointment',
    name: 'Judicial Appointment',
    tooltip: 'Put your people on the bench. Justice is blind, but it recognizes favors.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 10,
    centrist: false,
    effects: {
      blocs: {
        court:   { loyalty: +15 },
        academy: { loyalty: -5 },
        media:   { loyalty: -5 },
      },
      resources: {
        legitimacy: +3,
        narrative: -2,
        polarization: +3,
      },
    },
  },

  // === CENTRAL BANK INDEPENDENCE POLICIES ===
  {
    id: 'central_bank_autonomy',
    name: 'Central Bank Autonomy Act',
    tooltip: 'Give the central bank more independence. The Banks love it. Everyone else wonders who elected the bankers.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 10,
    centrist: true,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'finance', loyaltyMin: 55, hint: 'The Banks trust you enough to discuss independence. Needs Banks loyalty 55+.' },
    effects: {
      blocs: {
        finance: { loyalty: +10 },
        labor:   { loyalty: -5 },
        artists: { loyalty: -5 },
      },
      resources: {
        legitimacy: +3,
      },
      centralBankIndependence: +15,
    },
  },
  {
    id: 'monetary_sovereignty_decree',
    name: 'Monetary Sovereignty Decree',
    tooltip: 'Take back control of monetary policy. The Banks are furious. The Factories are cautiously optimistic.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 15,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'finance', loyaltyMax: 35, hint: 'The Banks abandoned you. Time to take the wheel. Needs Banks loyalty below 35.' },
    effects: {
      blocs: {
        finance:  { loyalty: -15 },
        industry: { loyalty: +5 },
        labor:    { loyalty: +10 },
      },
      resources: {
        narrative: +3,
      },
      centralBankIndependence: -20,
    },
  },
  {
    id: 'interest_rate_override',
    name: 'Interest Rate Override',
    tooltip: 'Override the central bank\'s rate decision. Inflation drops. Institutional credibility drops faster.',
    category: 'economic',
    minPolarization: 20,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'finance', loyaltyMax: 35, hint: 'The Banks abandoned you. Time to take the wheel. Needs Banks loyalty below 35.' },
    effects: {
      blocs: {
        finance:    { loyalty: -10 },
        mainStreet: { loyalty: +5 },
      },
      resources: {
        inflation: -3,
      },
      centralBankIndependence: -10,
    },
  },

  // === MILESTONE-EXCLUSIVE POLICIES ===
  {
    id: 'international_summit',
    name: 'International Summit',
    tooltip: 'Host a summit of world leaders in Miranda. The prestige alone is worth the catering bill.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 80,
    centrist: true,
    unlockCondition: { type: 'milestone', milestoneId: 'miranda_model', hint: 'Achieve "The Miranda Model" milestone to unlock this policy.' },
    effects: {
      blocs: {
        academy: { loyalty: +5 },
        media:   { loyalty: +5 },
      },
      resources: {
        legitimacy: +15,
        narrative: +10,
      },
      rivalPower: -5,
    },
  },
  {
    id: 'universal_basic_income',
    name: 'Universal Basic Income',
    tooltip: 'Give everyone money. Economists argue about it. Citizens spend it.',
    category: 'social',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 60,
    centrist: false,
    unlockCondition: { type: 'milestone', milestoneId: 'full_employment', hint: 'Achieve "Full Employment" milestone to unlock this policy.' },
    effects: {
      blocs: {
        labor:      { loyalty: +10 },
        mainStreet: { loyalty: +10 },
        finance:    { loyalty: -10 },
      },
      resources: {
        mobilization: +15,
        inflation: +3,
      },
      delayed: {
        turns: 4,
        perTurn: { mobilization: +2 },
      },
    },
  },
  {
    id: 'sovereign_investment_fund',
    name: 'Sovereign Investment Fund',
    tooltip: 'Invest nationally. Returns guaranteed (by optimism and creative accounting).',
    category: 'economic',
    minPolarization: 0,
    maxPolarization: 70,
    capitalCost: 100,
    centrist: true,
    unlockCondition: { type: 'milestone', milestoneId: 'economic_tiger', hint: 'Achieve "Economic Tiger" milestone to unlock this policy.' },
    effects: {
      blocs: {
        finance: { loyalty: +10 },
      },
      resources: {},
      delayed: {
        turns: 6,
        perTurn: { capital: +8 },
        blocEffects: { finance: { loyalty: +1 } },
      },
    },
  },
  {
    id: 'constitutional_convention',
    name: 'Constitutional Convention',
    tooltip: 'Rewrite the rules. All of them. With witnesses.',
    category: 'institutional',
    minPolarization: 0,
    maxPolarization: 60,
    capitalCost: 120,
    centrist: true,
    requiresMajority: true,
    unlockCondition: { type: 'milestone', milestoneId: 'united_front', hint: 'Achieve "United Front" milestone to unlock this policy.' },
    effects: {
      blocs: {
        court:   { loyalty: +10 },
        academy: { loyalty: +10 },
      },
      resources: {
        legitimacy: +20,
        narrative: +10,
        polarization: -10,
      },
    },
  },
  {
    id: 'trade_independence',
    name: 'Trade Independence',
    tooltip: 'Diversify trade away from the Colossus. It takes time, but the returns are sovereignty.',
    category: 'diplomatic',
    minPolarization: 0,
    maxPolarization: 80,
    capitalCost: 70,
    centrist: true,
    unlockCondition: { type: 'milestone', milestoneId: 'colossus_whisperer', hint: 'Achieve "Colossus Whisperer" milestone to unlock this policy.' },
    effects: {
      blocs: {
        industry: { loyalty: +5 },
        labor:    { loyalty: +5 },
      },
      resources: {
        colossusAlignment: -15,
      },
      delayed: {
        turns: 8,
        perTurn: { capital: +3 },
      },
    },
  },
  // === v1.1: TEMPORARY DEPOLARIZATION (each one buys calm at a price) ===
  {
    id: 'gentlemens_accord',
    name: 'The Gentlemen\'s Accord',
    tooltip: 'A private dinner with the Banks and the Landowners. They call off the op-eds. You call off the reforms. The calm lasts until someone finds the menu.',
    category: 'backroom',
    minPolarization: 30,
    maxPolarization: 100,
    capitalCost: 45,
    centrist: false,
    unlockCondition: { type: 'resource', resource: 'polarization', resourceMin: 40, hint: 'When the country is divided enough, the powerful start offering truces. Needs polarization 40+.' },
    effects: {
      blocs: {
        finance:  { loyalty: +10 },
        agri:     { loyalty: +8 },
        industry: { loyalty: +5 },
        labor:    { loyalty: -8 },
        academy:  { loyalty: -4 },
      },
      resources: {
        polarization: -8,
        narrative: -6,
        legitimacy: -3,
      },
      // The truce frays. Most of the calm comes back as resentment.
      delayed: {
        turns: 6,
        perTurn: { polarization: +1 },
      },
      discovery: {
        chance: 0.3,
        delay: 3,
        effects: {
          blocs: { media: { loyalty: -10 }, labor: { loyalty: -5 } },
          resources: { polarization: +10, legitimacy: -6 },
          rivalPower: +5,
        },
      },
    },
  },
  {
    id: 'pulpit_and_plaza',
    name: 'Pulpit and Plaza',
    tooltip: 'Stand beside the bishops and talk about shared values. The pews approve. Some of your oldest allies watch from the plaza and say nothing, loudly.',
    category: 'rhetoric',
    minPolarization: 20,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'bloc_loyalty', blocId: 'clergy', loyaltyMin: 45, hint: 'The Clergy must be willing to share a stage with you. Needs Clergy loyalty 45+.' },
    effects: {
      blocs: {
        clergy:     { loyalty: +10 },
        mainStreet: { loyalty: +4 },
        artists:    { loyalty: -6 },
        academy:    { loyalty: -5 },
      },
      resources: {
        polarization: -5,
        narrative: -4,
        mobilization: -3,
      },
      delayed: {
        turns: 3,
        perTurn: { polarization: +1 },
      },
    },
  },
  {
    id: 'bread_first',
    name: 'Bread First',
    tooltip: 'Talk about prices, wages and buses. Nothing else, for a while. It works when the bread is actually cheaper. It also tells some loyal friends to wait their turn.',
    category: 'rhetoric',
    minPolarization: 20,
    maxPolarization: 100,
    capitalCost: 5,
    centrist: false,
    unlockCondition: { type: 'resource', resource: 'polarization', resourceMin: 35, hint: 'Once the shouting gets loud enough, changing the subject becomes a strategy. Needs polarization 35+.' },
    effects: {
      blocs: {
        mainStreet: { loyalty: +5 },
        labor:      { loyalty: +3 },
        artists:    { loyalty: -5 },
        academy:    { loyalty: -4 },
      },
      resources: {
        polarization: -2,
        narrative: -3,
        mobilization: -3,
      },
    },
    // The message only lands if daily life backs it up.
    conditionalEffects: (state) => {
      if (state.resources.inflation < 10) {
        return { resources: { polarization: -3 } };
      }
      if (state.resources.inflation >= 15) {
        return { resources: { polarization: +2, legitimacy: -2 } };
      }
      return {};
    },
  },
];
