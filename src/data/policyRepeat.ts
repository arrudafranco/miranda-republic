/**
 * How often each policy can be enacted.
 *
 *   'once'   Founding acts, laws and institutions. Enacted one time per game.
 *   number   Programs, campaigns and deals. That many turns must pass before it can be enacted again.
 *   absent   Emergency levers, favours and cheap talk. Available whenever you can afford them.
 *
 * Kept apart from the policy definitions so the whole pacing picture can be read and tuned in one place.
 */
export type PolicyRepeatRule = 'once' | number;

export const POLICY_REPEAT_RULES: Record<string, PolicyRepeatRule> = {
  // === Once per game: laws, institutions, founding acts ===
  constitutional_amendment: 'once',
  constitutional_convention: 'once',
  electoral_reform: 'once',
  sovereign_wealth_fund: 'once',
  sovereign_investment_fund: 'once',
  trade_independence: 'once',
  universal_basic_income: 'once',
  paramilitary_disbandment: 'once',
  right_to_strike: 'once',
  platform_worker_rights: 'once',
  gig_worker_protections: 'once',
  anti_money_laundering: 'once',
  surveillance_network: 'once',
  whistleblower_hotline: 'once',

  // === Cooldowns: programs, campaigns, deals ===
  international_summit: 12,
  amnesty_program: 8,
  gentlemens_accord: 8,
  sovereignty_trade_package: 6,
  green_industrial_policy: 6,
  national_unity_festival: 6,
  tourism_initiative: 6,
  trade_liberalization: 6,
  minimum_wage_hike: 6,
  apprenticeship_program: 6,
  palace_coup_insurance: 6,
  shadow_cabinet: 6,
  border_militarization: 6,
  embassy_expansion: 6,
  colossus_trade_deal: 6,
  operation_clean_sweep: 4,
  black_market_crackdown: 4,
  microfinance_program: 4,
  historical_revisionism: 4,
  judicial_appointment: 4,
  central_bank_autonomy: 4,
  monetary_sovereignty_decree: 4,
  pulpit_and_plaza: 4,
  public_reconciliation_forum: 3,
  state_media_blitz: 3,
  interest_rate_override: 3,
  price_controls_decree: 3,
  stimulus_package: 3,
  bread_first: 3,

  // === No entry (any time): austerity_budget, emergency_austerity, backroom_deal,
  // informal_channels, offshore_accounts, blackmail_dossier, scapegoat_campaign,
  // counter_propaganda_bureau, populist_pivot, community_policing, foreign_aid_package ===
};
