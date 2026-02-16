# Miranda Republic -- Game Mechanics Documentation

*Last updated: v1.3 (February 2026)*

This document describes all game mechanics, systems, and design rationale in detail. It is intended as a reference for development, balance tuning, and onboarding.

---

## Table of Contents

1. [Overview](#overview)
2. [Turn Structure](#turn-structure)
3. [Resources](#resources)
4. [Political Blocs](#political-blocs)
5. [Actions and Policies](#actions-and-policies)
6. [The Rival](#the-rival)
7. [The Colossus](#the-colossus)
8. [Congress](#congress)
9. [Narrative System](#narrative-system)
10. [Labor Cohesion](#labor-cohesion)
11. [Central Bank Independence](#central-bank-independence)
12. [Polarization](#polarization)
13. [Interaction Matrix (Ripple Effects)](#interaction-matrix-ripple-effects)
14. [Discovery and Scandal](#discovery-and-scandal)
15. [Events](#events)
16. [Crisis Chains](#crisis-chains)
17. [Win and Loss Conditions](#win-and-loss-conditions)
18. [Difficulty Settings](#difficulty-settings)
19. [Day One Briefing](#day-one-briefing)
20. [Responsive Design](#responsive-design)
21. [Design Rationale](#design-rationale)
22. [Changelog](#changelog)

---

## Overview

Miranda Republic is a turn-based political simulation. The player is president of a fictional developing nation called Miranda and must survive 48 turns (representing a four-year term, one turn per month). The game models tensions between 14 political blocs, a rising political rival, a foreign superpower (the Colossus), and various economic and social pressures.

The core loop each turn: read the news, choose up to two policy actions, then watch the consequences ripple through every faction and resource.

---

## Turn Structure

Each turn proceeds through seven phases in order:

1. **News Phase** -- A news event is selected and presented. Crisis events from the queue take priority. Events may require the player to make a choice, or auto-resolve with preset effects. If no event triggers, a "quiet month" placeholder appears.

2. **Briefing Phase** -- Informational only. No state changes. The player reviews the current situation before acting.

3. **Action Phase** -- The player submits up to two policy actions. Each action is resolved sequentially: requirements are checked, capital costs are deducted (with modifiers), bloc effects are applied with sensitivity scaling, ripple effects propagate, resource deltas apply, and discovery rolls are made for backroom actions.

4. **Reaction Phase** -- Automated systems process in this order:
   - Rival power growth
   - Colossus patience/alignment effects
   - Central Bank independence effects
   - Delayed effects tick down
   - Pending discoveries tick down (scandals may fire)
   - Crisis chains advance or trigger
   - Trade income is added
   - Base capital income is added

5. **Congressional Phase** -- Seat shares are recalculated based on bloc power. Friendly majority status is updated.

6. **Narrative Phase** -- Narrative resource shifts based on cultural bloc loyalties.

7. **End Phase** -- Labor cohesion streak processing, congressional legitimacy bonus/penalty (+1 with friendly majority, -1 without), end-phase loyalty threshold events, legitimacy decay shield (Story mode), and win/loss condition checks. If the game continues, the turn counter advances.

---

## Resources

Eight tracked resources govern the state of Miranda. Each has a defined range.

| Resource | Range | Starting Value | What It Represents |
|---|---|---|---|
| **Legitimacy** | 0-100 | 65 | How valid the population considers your government. Reaching 0 triggers impeachment. |
| **Narrative** | 0-100 | 45 | Control of the public story. Driven by cultural blocs (Media, Artists, Scholars, Clergy). High narrative suppresses rival growth. Low narrative accelerates it. |
| **Capital** | 0-999 | 200 | Political and financial resources available for actions. Replenished by trade income, base income, and certain policies. |
| **Mobilization** | 0-100 | 40 | The energy of your political base. High mobilization suppresses rival growth. Lost through austerity and backlash. |
| **Polarization** | 0-100 | 25 | How divided the country is. Affects policy costs, enables/disables certain actions, fuels rival growth, and can trigger backlash against centrist policies. |
| **Inflation** | 0-30 | 6 | Economic pressure. Above 10, it accelerates rival growth (+2 per 5 points). Above 12, it can trigger the currency crisis event. Above 18, it triggers the banking crisis chain. |
| **Dread** | 0-100 | 15 | Fear of the state. High dread combined with low military loyalty triggers a coup. |
| **Colossus Alignment** | 0-100 | 65 | How aligned Miranda is with the foreign superpower. Affects trade income, Colossus patience, and bloc loyalties. |

### How Resources Are Gained and Lost

- **Capital** comes from: base income per turn (difficulty-dependent: 10/5/3), trade income (based on Colossus trade dependency and alignment), policies that generate capital, and low central bank independence (+3/turn).
- **Legitimacy** changes from: congressional majority status (+1/-1 per turn), central bank independence (high CBI gives +1/turn), policies, events, and discovery scandals. Story mode has a legitimacy decay shield that reduces losses by up to 3 per turn.
- **Narrative** is primarily driven by the narrative phase (cultural bloc loyalties) and modified by policies and events.
- **Mobilization** is gained through labor, green, and mass-appeal policies. Lost through austerity and backlash.

---

## Political Blocs

14 factions compete for influence in Miranda. Each bloc has two core attributes:

- **Loyalty** (0-100): How much the bloc supports the player's government. Blocs with loyalty >= 50 are considered "friendly" for congressional majority calculations.
- **Power** (0-100): The bloc's overall influence in society. Determines congressional seat share.

### Bloc Sensitivities

Each bloc has two sensitivity scores (0-100) that act as multipliers for how strongly they react to different policy types:

- **Material sensitivity**: Multiplier for economic, labor, security, institutional, and diplomatic policies. Formula: `sensitivity / 50` (so 50 = 1.0x, 100 = 2.0x, 25 = 0.5x).
- **Narrative sensitivity**: Multiplier for rhetoric policies. Same formula.
- **Backroom** policies always use a 1.0x multiplier (they bypass sensitivities entirely).

### All 14 Blocs

| Bloc | Player-Facing Name | Start Loyalty | Start Power | Material / Narrative Sensitivity |
|---|---|---|---|---|
| court | The Court | 60 | 70 | 70 / 30 |
| military | The Generals | 50 | 80 | 75 / 40 |
| enforcers | The Enforcers | 45 | 50 | 70 / 55 |
| finance | The Banks | 55 | 85 | 85 / 35 |
| industry | The Factories | 45 | 55 | 80 / 30 |
| tech | Big Tech | 50 | 60 | 65 / 55 |
| agri | The Landowners | 50 | 55 | 75 / 25 |
| mainStreet | Main Street | 50 | 40 | 55 / 65 |
| media | The Heralds | 55 | 65 | 60 / 70 |
| clergy | The Clergy | 45 | 50 | 55 / 65 |
| academy | The Scholars | 50 | 35 | 65 / 50 |
| artists | The Artists | 45 | 30 | 55 / 70 |
| labor | The Unions | 45 | 45 | 70 / 45 |
| syndicate | The Underworld | 35 | 40 | 90 / 10 |

---

## Actions and Policies

The player selects up to two actions per turn from a pool of 46 policies across 8 categories.

### Categories

| Category | Type | Congressional Cost Modifier | Notes |
|---|---|---|---|
| economic | Legislative | Yes (0.85x/1.15x) | Broad economic interventions |
| labor | Legislative | Yes | Worker-focused policies |
| security | Legislative | Yes | Military, police, and order policies |
| institutional | Legislative | Yes | Governance and constitutional changes |
| diplomatic | Legislative | Yes | Foreign relations and Colossus interaction |
| rhetoric | Bypass | No (always 1.0x) | Public messaging and narrative control |
| backroom | Bypass | No (always 1.0x) | Covert deals with discovery risk |
| social | Legislative | Yes | Social programs (currently unused in policy list) |

### Cost Calculation

The actual capital cost of a policy is:

```
totalCost = baseCost * polarizationMod * gridlockMod * syndicateDiscount * congressMod
```

Where:
- **Polarization modifier** (centrist policies): 1.0x if polarization < 30, 1.25x if < 60, 1.5x if < 80, 2.0x if >= 80. Non-centrist policies: 0.75x discount if polarization >= 60, otherwise 1.0x.
- **Gridlock modifier**: 1.2x if the rival's gridlock countdown is active (rival power crossed 50 threshold).
- **Syndicate discount**: 0.7x on backroom actions if Underworld loyalty > 60.
- **Congressional modifier**: 0.85x with friendly majority, 1.15x without (legislative categories only).

### Centrist vs. Non-Centrist

Each policy is tagged as centrist or non-centrist. This distinction affects:
- **Cost scaling with polarization**: Centrist policies get more expensive as polarization rises. Non-centrist policies get a discount at high polarization (>= 60).
- **Backlash risk**: Only centrist policies can trigger backlash at high polarization. At polarization 60-79, there's a 20% chance. At 80+, 40% chance. Backlash costs -5 Narrative and -5 Mobilization.

### Polarization Windows

Every policy has a `minPolarization` and `maxPolarization`. The policy is only available when current polarization falls within this range. This represents how the political climate shapes what's possible.

### Special Requirements

Some policies have additional requirements:
- **requiresSyndicateLoyalty**: Underworld loyalty must be at or above a threshold (e.g., Informal Channels requires 40).
- **requiresMajority**: The player must have a friendly congressional majority (e.g., Constitutional Amendment, Electoral Reform).

### Progressive Unlock System

Not all 46 policies are available from Turn 1. 18 "starting" policies are available immediately. The remaining 28 unlock progressively through turn milestones, bloc loyalty thresholds, and resource conditions. This creates a sense of discovery and forward movement, preventing the player from being overwhelmed by a wall of 46 options on Turn 1.

Each locked policy has an `unlockCondition` with a player-facing `hint` describing (in the game's dark whimsy voice) what must be achieved to unlock it. Locked policies are visible in the UI as dimmed cards with lock icons, showing only their name and hint.

**Unlock condition types:**
- **turn**: Available from a specific turn onward (e.g., Turn 4, Turn 8, Turn 12)
- **bloc_loyalty**: Requires a specific bloc's loyalty above or below a threshold (e.g., Banks >= 55, Underworld >= 30)
- **resource**: Requires a resource at a certain level (e.g., Narrative >= 50, Polarization >= 40, Dread >= 40)
- **OR chains**: Some policies can unlock via multiple paths (e.g., Black Market Crackdown unlocks at Military loyalty >= 50 OR Dread >= 40)

**Starting policies (18):** Austerity Budget, Platform Worker Rights, Backroom Appropriations, Operation Clean Sweep, Anti-Money Laundering Act, Public Reconciliation Forum, Price Controls Decree, Community Policing Initiative, Counter-Propaganda Bureau, Stimulus Package, National Unity Festival, Minimum Wage Hike, Trade Liberalization, Foreign Aid Package, Embassy Expansion, Judicial Appointment, Offshore Accounts, Populist Pivot.

**Turn-based unlocks:**
- Turn 4: Green Industrial Policy, Gig Worker Protections, Sovereignty Trade Package
- Turn 6: Emergency Austerity, The Blame Game, Historical Revisionism
- Turn 8: Tourism Initiative, Border Militarization, Apprenticeship Program, Constitutional Amendment, Electoral Reform
- Turn 12: Sovereign Wealth Fund, Colossus Trade Deal, Microfinance Program

**Relationship-based unlocks:**
- Banks loyalty >= 55: Central Bank Autonomy Act
- Banks loyalty <= 35: Monetary Sovereignty Decree, Interest Rate Override
- Union loyalty >= 55: Right to Strike Guarantee
- Underworld loyalty >= 30: Palace Coup Insurance, Shadow Cabinet
- Underworld loyalty >= 40: Informal Channels
- Underworld loyalty >= 45: Blackmail Dossier
- Enforcers loyalty >= 45: Surveillance Network
- Military loyalty >= 50 OR Dread >= 40: Black Market Crackdown

**Context-based unlocks:**
- Polarization >= 40: State Media Blitz
- Heralds loyalty >= 45: Whistleblower Hotline
- Narrative >= 50: Amnesty Program, Paramilitary Disbandment

Unlock conditions are checked at the end of each turn. Newly unlocked policies receive a pulsing "New!" badge that clears after one turn.

**Design rationale:** The unlock schedule ensures the player has enough starting options to be strategic without being overwhelmed. Turn-based unlocks simulate the growing capacity of government. Relationship-based unlocks reward investment in specific blocs. Some policies that create a resource are deliberately NOT gated on that same resource (e.g., Historical Revisionism creates polarization, so it's gated by turn count rather than polarization level, avoiding circular causality).

### Target Bloc Policies

Backroom policies marked `targetBloc: true` let the player choose which bloc receives a loyalty bonus:
- **Backroom Appropriations**: +15 loyalty to the chosen bloc.
- **Informal Channels**: +10 loyalty to the chosen bloc (requires Underworld loyalty >= 40).
- **Blackmail Dossier**: +15 loyalty to the chosen bloc.

### Complete Policy Reference (All 46 Policies)

#### Economic Policies (11)

**Austerity Budget** (Cost: 0, Centrist, Pol: 0-70)
- Blocs: Banks +15/+5p, Factories -5, Unions -20, Artists -10, Scholars -10, Main Street +5
- Resources: Capital +30, Mobilization -10, Polarization +5, Colossus Alignment +5, Narrative -5
- Labor cohesion: -5

**Green Industrial Policy** (Cost: 35, Non-centrist, Pol: 0-75)
- Blocs: Factories +10, Unions +15, Scholars +20, Artists +10, Landowners -15, Banks -10, Main Street -5
- Resources: Mobilization +10, Polarization +3, Colossus Alignment -5, Narrative +5
- Labor cohesion: +5

**Price Controls Decree** (Cost: 3, Non-centrist, Pol: 0-90)
- Blocs: Banks -3, Main Street +5, Unions +5
- Resources: Inflation -4

**Stimulus Package** (Cost: 4, Centrist, Pol: 0-80)
- Blocs: Banks -2, Main Street +5, Unions +5, Factories +3
- Resources: Inflation -3, Legitimacy +3

**Sovereign Wealth Fund** (Cost: 40, Centrist, Pol: 0-60)
- Blocs: Banks +10, Scholars +5, Unions -5
- Resources: Legitimacy +3, Colossus Alignment +5
- Delayed: +8 capital/turn for 8 turns (64 total return)

**Black Market Crackdown** (Cost: 15, Centrist, Pol: 0-80)
- Blocs: Underworld -15/-5p, Enforcers +5, Banks +5, Main Street +3
- Resources: Inflation -2, Dread +3

**Tourism Initiative** (Cost: 20, Centrist, Pol: 0-70)
- Blocs: Artists +5, Main Street +5, Landowners +3
- Resources: Narrative +3
- Delayed: +5 capital/turn for 6 turns (30 total return)

**Trade Liberalization** (Cost: 10, Centrist, Pol: 0-80)
- Blocs: Banks +10, Big Tech +5, Factories -10, Unions -5
- Resources: Inflation -2, Colossus Alignment +10

**Emergency Austerity** (Cost: 0, Centrist, Pol: 0-90)
- Blocs: Banks +10, Unions -15, Artists -10, Scholars -5, Main Street -5
- Resources: Capital +25, Mobilization -5, Narrative -5
- Rival power: +2

**Microfinance Program** (Cost: 15, Centrist, Pol: 0-70)
- Blocs: Main Street +10, Unions +5, Banks -3
- Resources: Legitimacy +2
- Delayed: +3 capital/turn for 4 turns (12 total return), +1 cohesion/turn during delay

**Interest Rate Override** (Cost: 5, Non-centrist, Pol: 20-100)
- Blocs: Banks -10, Main Street +5
- Resources: Inflation -3
- Central bank independence: -10

#### Labor Policies (5)

**Platform Worker Rights Act** (Cost: 10, Non-centrist, Pol: 0-80)
- Blocs: Unions +20, Big Tech -25/-5p, Main Street -5, Banks -10, Artists +5
- Resources: Polarization +5, Narrative +3
- Labor cohesion: +5
- Conditional effects: If Union loyalty > 60 AND narrative > 50, additional cohesion +8. If Union loyalty 40-60 OR narrative 30-50, additional cohesion +3. If Union loyalty < 40 OR narrative < 30, cohesion -3 and Main Street -5.

**Minimum Wage Hike** (Cost: 10, Non-centrist, Pol: 0-80)
- Blocs: Unions +15, Main Street +5, Factories -10, Banks -5
- Resources: Inflation +1, Narrative +3
- Labor cohesion: +5

**Gig Worker Protections** (Cost: 8, Non-centrist, Pol: 0-80)
- Blocs: Unions +10, Big Tech -15, Scholars +5
- Resources: Narrative +2, Polarization +3
- Labor cohesion: +3

**Apprenticeship Program** (Cost: 12, Centrist, Pol: 0-70)
- Blocs: Unions +5, Factories +10, Scholars +5
- Resources: Legitimacy +2
- Labor cohesion: +3
- Delayed: +2 cohesion/turn for 6 turns (no capital, pure long-term cohesion investment)

**Right to Strike Guarantee** (Cost: 5, Non-centrist, Pol: 10-90)
- Blocs: Unions +15, Factories -10, Banks -5
- Resources: Mobilization +5, Polarization +5
- Labor cohesion: +8

#### Security Policies (6)

**Operation Clean Sweep** (Cost: 25, Centrist, Pol: 0-90)
- Blocs: Enforcers +15/+5p, Underworld -25/-10p, Main Street +10, Court +5, Unions +5
- Resources: Dread +10, Legitimacy +5, Narrative +3

**Community Policing Initiative** (Cost: 2, Centrist, Pol: 0-80)
- Blocs: Enforcers +3, Main Street +5, Unions +3
- Resources: Dread -3
- Rival power: -2

**Border Militarization** (Cost: 20, Non-centrist, Pol: 0-90)
- Blocs: Generals +10/+5p, Enforcers +5, Main Street +5, Artists -10, Scholars -5
- Resources: Dread +5, Colossus Alignment -5, Polarization +3

**Surveillance Network** (Cost: 25, Non-centrist, Pol: 0-90)
- Blocs: Enforcers +10, Big Tech +5, Artists -10, Scholars -10, Heralds -5
- Resources: Dread +8, Narrative -3
- Rival power: -3

**Amnesty Program** (Cost: 5, Centrist, Pol: 0-70)
- Blocs: Underworld +10, Court -10, Enforcers -5, Clergy +5
- Resources: Polarization -3, Dread -5, Legitimacy -3

**Paramilitary Disbandment** (Cost: 10, Centrist, Pol: 0-80)
- Blocs: Generals -5, Enforcers -5, Court +10, Scholars +5
- Resources: Dread -8, Legitimacy +5, Polarization -3
- Rival power: -2

#### Diplomatic Policies (4)

**Sovereignty Trade Package** (Cost: 20, Centrist, Pol: 0-90)
- Blocs: Factories +15, Unions +10, Banks -20, Big Tech -10
- Resources: Colossus Alignment -15, Narrative +3
- Labor cohesion: +3
- Delayed: +5 capital/turn for 6 turns (30 total return)

**Foreign Aid Package** (Cost: 0, Centrist, Pol: 0-80)
- Blocs: Banks +5, Unions -3
- Resources: Capital +35, Colossus Alignment +8, Legitimacy -2

**Embassy Expansion** (Cost: 15, Centrist, Pol: 0-70)
- Blocs: Scholars +5, Court +3
- Resources: Colossus Alignment +5, Narrative +2, Legitimacy +2

**Colossus Trade Deal** (Cost: 5, Centrist, Pol: 0-80)
- Blocs: Banks +10, Factories -10, Unions -5, Big Tech +5
- Resources: Colossus Alignment +12, Inflation -2
- Delayed: +6 capital/turn for 6 turns (36 total return)

#### Institutional Policies (7)

**Anti-Money Laundering Act** (Cost: 15, Centrist, Pol: 0-70)
- Blocs: Banks -15, Underworld -15, Court +10, Scholars +5
- Resources: Legitimacy +5, Narrative +3, Colossus Alignment +3

**National Unity Festival** (Cost: 2, Centrist, Pol: 0-70)
- Blocs: Artists +3, Main Street +3, Clergy +3
- Resources: Polarization -4, Narrative +2
- Rival power: -1

**Constitutional Amendment** (Cost: 20, Centrist, Pol: 0-60, Requires majority)
- Blocs: Court +10, Scholars +10, Clergy -5
- Resources: Legitimacy +8, Narrative +3, Polarization +3

**Electoral Reform** (Cost: 15, Centrist, Pol: 0-70, Requires majority)
- Blocs: Court +5, Scholars +5, Main Street +5
- Resources: Legitimacy +5, Polarization -3
- Rival power: -2

**Judicial Appointment** (Cost: 10, Non-centrist, Pol: 0-80)
- Blocs: Court +15, Scholars -5, Heralds -5
- Resources: Legitimacy +3, Narrative -2, Polarization +3

**Central Bank Autonomy Act** (Cost: 10, Centrist, Pol: 0-70)
- Blocs: Banks +10, Unions -5, Artists -5
- Resources: Legitimacy +3
- Central bank independence: +15

**Monetary Sovereignty Decree** (Cost: 15, Non-centrist, Pol: 0-80)
- Blocs: Banks -15, Factories +5, Unions +10
- Resources: Narrative +3
- Central bank independence: -20

#### Rhetoric Policies (7)

**The Blame Game** (Cost: 5, Non-centrist, Pol: 40-100)
- Blocs: Main Street +10, Clergy +5, Artists -15, Scholars -10
- Resources: Polarization +8, Mobilization +5, Narrative -3
- Labor cohesion: -8
- Rival power: -3
- Unavailable at game start (polarization starts at 25, requires >= 40)

**Public Reconciliation Forum** (Cost: 2, Centrist, Pol: 0-80)
- Blocs: Heralds +5, Artists +3, Clergy +3
- Resources: Polarization -5, Narrative +3
- Rival power: -2

**Counter-Propaganda Bureau** (Cost: 3, Non-centrist, Pol: 10-100)
- Blocs: Heralds +5, Scholars -5
- Resources: Polarization +3, Narrative +5
- Rival power: -4

**State Media Blitz** (Cost: 10, Non-centrist, Pol: 0-90)
- Blocs: Heralds +10, Scholars -5, Artists -3
- Resources: Narrative +8, Polarization +3

**Whistleblower Hotline** (Cost: 5, Centrist, Pol: 0-70)
- Blocs: Court +5, Scholars +5, Underworld -10
- Resources: Legitimacy +5, Narrative +3

**Historical Revisionism** (Cost: 5, Non-centrist, Pol: 20-100)
- Blocs: Scholars -15, Clergy +5, Main Street +5
- Resources: Narrative +5, Polarization +5, Legitimacy -3

**Populist Pivot** (Cost: 3, Non-centrist, Pol: 20-100)
- Blocs: Main Street +10, Unions +5, Banks -10, Scholars -5
- Resources: Mobilization +5, Narrative +3, Polarization +3
- Rival power: -2

#### Backroom Policies (6)

All backroom policies bypass congressional cost modifiers and sensitivity scaling. Discovery chance is halved if Underworld loyalty > 60. Backroom costs are reduced 30% if Underworld loyalty > 60.

**Backroom Appropriations** (Cost: 20, Non-centrist, Pol: 0-100, Target bloc)
- Gives +15 loyalty to chosen bloc
- Resources: Legitimacy -5
- Discovery: 30% chance, 3-turn delay. If exposed: Court -10, Heralds -15, Narrative -8, Rival +5

**Informal Channels** (Cost: 15, Non-centrist, Pol: 0-100, Target bloc, Requires Underworld loyalty >= 40)
- Gives +10 loyalty to chosen bloc
- Resources: Dread +3
- Discovery: 20% chance, 4-turn delay. If exposed: Court -15, Heralds -20, Legitimacy -10, Narrative -12, Rival +8
- Unavailable at game start (Underworld starts at 35 loyalty, requires >= 40)

**Blackmail Dossier** (Cost: 10, Non-centrist, Pol: 0-100, Target bloc)
- Gives +15 loyalty to chosen bloc
- Resources: Dread +5, Legitimacy -3
- Discovery: 35% chance, 2-turn delay. If exposed: Court -15, Heralds -20, Legitimacy -15, Narrative -10, Rival +8

**Offshore Accounts** (Cost: 5, Non-centrist, Pol: 0-100)
- Blocs: Banks +5, Underworld +5
- Resources: Capital +30, Legitimacy -5
- Discovery: 25% chance, 4-turn delay. If exposed: Court -20, Heralds -15, Legitimacy -20, Narrative -15, Rival +10

**Palace Coup Insurance** (Cost: 25, Non-centrist, Pol: 0-100)
- Blocs: Generals +15, Enforcers +5
- Resources: Dread +3, Legitimacy -3
- Discovery: 20% chance, 3-turn delay. If exposed: Court -10, Scholars -10, Legitimacy -10, Narrative -8, Rival +6

**Shadow Cabinet** (Cost: 15, Non-centrist, Pol: 0-100)
- Blocs: Underworld +10
- Resources: Mobilization +5, Dread +5, Legitimacy -5
- Discovery: 30% chance, 3-turn delay. If exposed: Court -20, Heralds -15, Scholars -10, Legitimacy -20, Narrative -15, Rival +12

### Delayed Effects Reference

Policies with delayed effects create per-turn bonuses that tick for a set number of turns after use.

| Policy | Delay Duration | Per-Turn Effect | Total Return | Other |
|---|---|---|---|---|
| Sovereign Wealth Fund | 8 turns | +8 capital | 64 capital | Best long-term ROI |
| Colossus Trade Deal | 6 turns | +6 capital | 36 capital | -- |
| Sovereignty Trade Package | 6 turns | +5 capital | 30 capital | -- |
| Tourism Initiative | 6 turns | +5 capital | 30 capital | -- |
| Microfinance Program | 4 turns | +3 capital | 12 capital | Also +1 cohesion/turn |
| Apprenticeship Program | 6 turns | -- | -- | +2 cohesion/turn only |

---

## The Rival

A procedurally generated political opponent with one of four backgrounds, each with distinct narrative flavor.

### Rival Backgrounds

| Background | Title | Possible Names |
|---|---|---|
| congressional_leader | Congressional Leader | Senator Vidal, Senator Correa, Speaker Moreno |
| regional_governor | Regional Governor | Governor Torres, Governor Almeida, Governor Fuentes |
| retired_general | Retired General | General Cardoso, General Montoya, General Braga |
| media_personality | Media Personality | Ricardo Vox, Diana Cruz, Marco Estrella |

### Rival Power (0-100, starts at 15)

The rival's power grows each turn based on the player's weaknesses. If it reaches 100, the player loses ("Rival Wins" ending).

#### Growth Formula

Base growth: +1 per turn (structural discontent). Then modifiers:

**Accelerators (things that increase rival growth):**
- Polarization above 30: +1 per 5 points over 30
- Inflation above 10: +2 per 5 points over 10
- Legitimacy below 40: +3
- Labor cohesion below 25: +2
- Narrative below 30: +1
- No congressional majority: +1

**Suppressors (things that slow rival growth):**
- Mobilization above 40: -1 per 8 points over 40
- Narrative above 50: -2
- Labor cohesion above 40: -1 per 8 points over 40
- Legitimacy above 70: -2

The total is capped at +8 before the difficulty multiplier is applied (Story: 0.15x, Standard: 1.0x, Crisis: 1.5x).

### Rival Thresholds

At specific power levels, one-shot events trigger and special effects activate:

| Power Level | Effect |
|---|---|
| 30 | **The Rally** event (player chooses how media covers it) |
| 50 | **Congressional Gridlock** event. Gridlock countdown activates (4 turns of +20% cost on all policies) |
| 60 | **Culture War Offensive** event. Culture war countdown activates (4 turns; Clergy and Main Street lose -5 loyalty/turn if their loyalty is below 50) |
| 70 | **Crisis of Legitimacy** event (if Court loyalty <= 60). Legitimacy -10. |
| 85 | **The Oligarch's Bet** event. Capital -20, rival +5. |
| 95 | **March on Miranda** event. Polarization +10, narrative -20, legitimacy -10. |

### Rival Action Text

Each turn, the rival performs a narrative action based on their background, current power tier, and the player's most exploitable weakness. These are flavor text displayed in the turn report.

Power tiers: Low (0-35), Mid (36-65), High (66+).

Weaknesses are identified by severity: low legitimacy, high inflation, no majority, high polarization, or low narrative.

The text pool contains 240 unique lines (60 per background: 15 low, 20 mid, 25 high). Each background has a distinct voice: congressional leaders speak in parliamentary maneuvers, regional governors in populist ground-level campaigns, retired generals in terse military authority, and media personalities in viral engagement metrics. Every background has at least 3 weakness-specific lines per tier covering all five weakness types.

---

## The Colossus

A foreign superpower that exerts economic and political pressure on Miranda.

### Colossus State

| Attribute | Range | Start | Description |
|---|---|---|---|
| Alignment | 0-100 | 65 | Synced with the colossusAlignment resource. How aligned Miranda's policies are with Colossus interests. |
| Patience | 0-100 | 70 | How tolerant the Colossus is. Decays when alignment is low. |
| Trade Dependency | 0-100% | 40 | How much of Miranda's economy depends on Colossus trade. |

### Patience Mechanics

Each turn:
- Alignment < 40: Patience -3
- Alignment 40-54: Patience -1
- Alignment > 70: Patience +1 (slow recovery)

When patience reaches 0: Economic crisis hits every turn (capital -15, inflation +2, Banks loyalty -5).

### Alignment Effects on Blocs

Each turn:
- Alignment > 70: Banks +1 loyalty, Scholars -1 loyalty (dependency resentment)
- Alignment < 30: Factories +1 loyalty (protectionism benefit), Banks -2 loyalty

### Trade Income

```
tradeIncome = round(10 * tradeDependency / 100)
```

If alignment < 30, trade income is halved. At the default 40% trade dependency, this yields 4 capital/turn normally, or 2 capital/turn if alignment drops below 30.

### Colossus Crisis Chain

When patience drops below 20, the Colossus Pressure crisis chain triggers (see Crisis Chains section).

---

## Congress

Congress represents the legislative branch and affects policy costs and legitimacy.

### Seat Shares

Seat shares are proportional to each bloc's power, recalculated every turn. Two special cases:
- **Underworld**: Power is multiplied by 0.3x for seat calculation (they operate outside formal politics).
- **Unions**: Use "effective power" = `basePower * (0.5 + laborCohesion / 200)`. At cohesion 0, they operate at 50% effectiveness. At cohesion 100, they operate at 100%.

### Friendly Majority

Blocs with loyalty >= 50 are "friendly." If friendly blocs hold > 50% of total seat share, the player has a friendly majority.

### Effects of Majority

- **Policy cost modifier**: Legislative policies cost 0.85x with majority, 1.15x without. Rhetoric and backroom policies are unaffected.
- **Legitimacy per turn**: +1 with majority, -1 without.
- **Rival growth**: +1 when there is no majority.
- **Policy access**: Constitutional Amendment and Electoral Reform require majority.

---

## Narrative System

Narrative represents control of the public story. It shifts each turn based on the weighted loyalty of four "cultural" blocs:

| Bloc | Weight |
|---|---|
| The Heralds (media) | 35% |
| The Artists (artists) | 25% |
| The Scholars (academy) | 20% |
| The Clergy (clergy) | 20% |

### Calculation

The weighted average of these four blocs' loyalty is computed. The difference from 50 determines the shift:

- **Weighted loyalty > 50** (cultural blocs support you): Narrative gains slowly. +1 to +3 per turn (= `clamp(round((weightedLoyalty - 50) / 15), 1, 3)`).
- **Weighted loyalty < 40** (cultural blocs oppose you): Narrative falls quickly. -2 to -8 per turn (= `clamp(round((weightedLoyalty - 50) / 5), -8, -2)`).
- **Weighted loyalty 40-50**: No change.

### Why Narrative Matters

- **Rival suppression**: Narrative > 50 gives -2 rival growth. Narrative < 30 gives +1 rival growth.
- **Endings**: Narrative > 60 or 70 is required for the best endings (A New Story, New Compact).
- **Backlash**: Narrative is lost (-5) when centrist backlash triggers at high polarization.

---

## Labor Cohesion

A hidden stat (0-100, starts at 40) representing how organized and effective the labor movement is.

### Streak-Based Changes

- **Union loyalty > 70 for 3+ consecutive turns**: Cohesion +2/turn (sustained trust builds capacity).
- **Polarization > 60 for 4+ consecutive turns**: Cohesion -2/turn (division erodes solidarity).

### Direct Changes

Many policies affect cohesion directly:
- Increases: Platform Worker Rights (+5 to +8 conditional), Green Industrial Policy (+5), labor policies generally (+3 to +8).
- Decreases: Austerity Budget (-5), The Blame Game (-8), Culture War Offensive event (-10).

### Why Labor Cohesion Matters

- **Congressional power**: Union effective power = basePower * (0.5 + cohesion/200). Low cohesion halves union representation.
- **Rival growth**: Cohesion < 25 adds +2 rival growth. Cohesion > 40 subtracts (-1 per 8 points above 40).
- **Endings**: Cohesion >= 80 (combined with rival < 30 and narrative > 70) unlocks the secret "New Compact" ending. Cohesion < 25 leads to the "Manager's Victory" ending.
- **Crisis trigger**: The Labor Uprising crisis chain triggers when union loyalty < 20 AND cohesion > 60 (paradoxically, organized workers who feel betrayed are more dangerous).

---

## Central Bank Independence

A hidden stat (0-100, starts at 60) representing how autonomous the central bank is from political control.

### Per-Turn Effects

| CBI Level | Banks Loyalty | Legitimacy | Inflation | Capital |
|---|---|---|---|---|
| >= 70 (high) | +1/turn | +1/turn | +1 every 2 turns | -- |
| 30-69 (mid) | No effect | No effect | No effect | No effect |
| < 30 (low) | -2/turn | -- | +1/turn | +3/turn |

### Design Trade-off

High CBI provides institutional credibility (legitimacy, Banks support) but limits monetary policy flexibility (mild inflation drift). Low CBI provides extra capital and monetary control but at the cost of Banks loyalty and faster inflation. The mid range is stable but offers no bonuses.

### Policies That Affect CBI

- Central Bank Autonomy Act: +15 CBI
- Monetary Sovereignty Decree: -20 CBI
- Interest Rate Override: -10 CBI

---

## Polarization

Polarization (0-100, starts at 25) represents how ideologically divided the country is. It's one of the most consequential resources.

### Effects on Policy Costs

**Centrist policies** (compromise, moderate reforms):
- Polarization < 30: No modifier (1.0x)
- 30-59: Costs increase 25% (1.25x)
- 60-79: Costs increase 50% (1.5x)
- 80+: Costs double (2.0x)

**Non-centrist policies** (ideological actions):
- Polarization >= 60: Costs decrease 25% (0.75x discount)
- Otherwise: No modifier (1.0x)

### Backlash

Only centrist policies can trigger backlash:
- Polarization 60-79: 20% chance per centrist action
- Polarization 80+: 40% chance per centrist action
- Backlash effect: Narrative -5, Mobilization -5

### Other Effects

- Polarization > 30: +1 rival growth per 5 points above 30
- High polarization streak (> 60 for 4+ turns): Labor cohesion -2/turn
- Polarization > 80 at game end: "Hollow Republic" ending

### Policy Availability Windows

Many policies require polarization to be within a specific range. For example:
- The Blame Game requires polarization >= 40 (unavailable at game start where polarization is 25)
- Constitutional Amendment requires polarization <= 60 (impossible in a deeply divided country)

---

## Interaction Matrix (Ripple Effects)

When a policy directly changes a bloc's loyalty, secondary ripple effects propagate to allied and rival blocs. These represent how factions react to changes in their allies' or opponents' fortunes.

### How Ripples Work

Each bloc has defined alliance/rivalry coefficients with other blocs (range: -1.0 to +1.0). When a primary loyalty change hits a bloc, every allied/rival bloc receives a secondary change at **25% scale**.

Formula: `rippleDelta = round(primaryLoyaltyDelta * coefficient * 0.25)`

Ripples do NOT apply to blocs that already received a direct effect from the same policy (no double-dipping).

### Key Relationships

Strong alliances (positive coefficients):
- Banks <-> Big Tech (0.6)
- Generals <-> Enforcers (0.6)
- Factories <-> Unions (0.5)
- Scholars <-> Artists (0.5)
- Clergy <-> Main Street (0.4)

Strong rivalries (negative coefficients):
- Banks <-> Unions (-0.7)
- Big Tech <-> Unions (-0.6)
- Artists <-> Clergy (-0.6)
- Enforcers <-> Underworld (-0.5)
- Court <-> Underworld (-0.5)

---

## Discovery and Scandal

Backroom policies carry a risk of being exposed. Each has a discovery chance and a delay.

### Mechanics

1. When a backroom policy is used, a random roll is made against the discovery chance.
2. If the roll succeeds, the discovery is queued with a countdown (delay in turns).
3. Each turn, all pending discoveries tick down. When a discovery reaches 0, the scandal fires.
4. Scandal effects typically include: Court and Heralds loyalty drops, legitimacy and narrative losses, and rival power gains.

### Mitigation

- **Underworld loyalty > 60**: Discovery chance is halved (50% reduction). This represents the Underworld's ability to cover tracks.
- High Underworld loyalty also gives a 30% cost discount on backroom policies.

### Connection to Crisis Chains

Having any pending discoveries is one of the trigger conditions for the Media Scandal crisis chain.

---

## Events

Events are narrative moments that introduce external pressures and player choices. There are 53 events in total (6 rival threshold, 1 resource threshold, 5 loyalty threshold, 26 random, and 15 crisis chain stage events).

### Event Types by Trigger

| Trigger Type | How It Works |
|---|---|
| **rival_threshold** | Fires when rival power crosses a specific level (30, 50, 60, 70, 85, 95). Priority over other events. |
| **loyalty_threshold** | Fires when a bloc's loyalty drops below (or rises above) a threshold. Checked during news phase and end phase. |
| **resource_threshold** | Fires when a resource crosses a threshold (e.g., Colossus alignment > 70). |
| **random** | Has a weight value. Probability = weight/20 per turn. Subject to additional conditions. |

### Event Resolution

- Events with **choices**: The player picks one option, each with different effects.
- Events with **autoEffects** only: Resolve automatically with no player input.
- **oneShot** events fire only once per game. Non-oneShot events (like loyalty threshold events) can fire repeatedly.

### Event Priority

When multiple events are eligible in one turn: rival threshold events > loyalty threshold events > random events. Only one event fires per turn (plus any crisis chain events in the queue).

### Rival Threshold Events (6, all one-shot)

**The Rally** (Rival power >= 30) -- Player choice
- "Let the Heralds cover it": Heralds +5, Polarization +3
- "Pressure the Heralds to downplay it": Heralds -5, Rival +5

**Congressional Gridlock** (Rival power >= 50) -- Auto-resolve
- Polarization +5, Main Street -5
- Activates gridlock countdown (4 turns of +20% cost on all policies)

**Culture War Offensive** (Rival power >= 60) -- Auto-resolve
- Artists -5, Scholars -5, Polarization +8, Labor cohesion -10
- Activates culture war countdown (4 turns; Clergy and Main Street lose -5 loyalty/turn if their loyalty < 50)

**Crisis of Legitimacy** (Rival power >= 70, requires Court loyalty <= 60) -- Auto-resolve
- Legitimacy -10, Polarization +5

**The Oligarch's Bet** (Rival power >= 85) -- Auto-resolve
- Capital -20, Polarization +5, Rival +5

**March on Miranda** (Rival power >= 95) -- Auto-resolve
- Polarization +10, Narrative -20, Legitimacy -10

### Resource Threshold Events (1, one-shot)

**Joint Exercises** (Colossus Alignment > 70) -- Player choice
- "Welcome the advisors": Generals +10, Colossus Alignment +10, Dread +3
- "Politely decline": Generals -5, Colossus Alignment -10, Legitimacy +5

### Loyalty Threshold Events (5, repeatable)

**Capital Flight** (Banks loyalty < 30) -- Auto-resolve
- Capital -15, Inflation +2, Banks -5p

**Constitutional Review** (Court loyalty < 35) -- Auto-resolve
- Legitimacy -5, Narrative -3, Rival +3

**Military "Readiness Exercises"** (Generals loyalty < 25) -- Auto-resolve
- Dread +5, Legitimacy -3

**A Message** (Underworld loyalty < 15) -- Auto-resolve
- Legitimacy -3, Narrative -5, Main Street -3

**The Sermon** (Clergy loyalty < 30) -- Auto-resolve
- Narrative -3, Main Street -3, Rival +2

### Random Events (26)

**Currency Crisis** (Weight: 3, Condition: Inflation > 12) -- Player choice
- "Raise interest rates": Inflation -3, Capital -15, Banks +10, Unions -10, Factories -5
- "Ride it out": Inflation +2, Banks -10, Rival +3

**The Colossus Extends a Hand** (Weight: 3) -- Player choice
- "Accept the loan": Capital +40, Colossus Alignment +10, Banks +10, Factories -5, Unions -5
- "Politely decline": Colossus Alignment -5, Factories +5, Unions +5

**An Envelope on Your Desk** (Weight: 2, Condition: Underworld loyalty >= 30) -- Player choice
- "Open the envelope": Legitimacy -5, Dread +3, Underworld +10
- "Return it unopened": Underworld -10, Court +5, Legitimacy +3

**Strike Warning** (Weight: 2, Condition: Union loyalty < 35) -- Auto-resolve
- Mobilization -5, Unions -5, Main Street -3, Rival +2

**Data Breach** (Weight: 2) -- Player choice
- "Push emergency data regulations": Big Tech -15, Scholars +5, Main Street +5, Narrative +3, Legitimacy +3
- "Express concern, do nothing": Big Tech +5, Scholars -5, Narrative -3, Rival +2

**The Exposé** (Weight: 2, Condition: Heralds loyalty > 40) -- Player choice
- "Cooperate with the investigation": Heralds +10, Underworld -5, Legitimacy +5, Narrative +3
- "Discredit the story": Heralds -15, Narrative -5, Rival +3

**Wildcat Strike** (Weight: 2, Condition: Union loyalty > 55) -- Player choice
- "Back the strikers": Unions +10, Factories -10, Banks -5, Mobilization +5, Cohesion +10
- "Enforce existing contracts": Unions -10, Factories +5, Banks +5, Cohesion -5

**The Automation Wave** (Weight: 3) -- Player choice
- "Impose an automation tax": Big Tech -10, Unions +10, Main Street +5, Capital +10
- "Embrace the future": Big Tech +10, Unions -10, Scholars +5, Inflation -1, Cohesion -5

**The Drought** (Weight: 2) -- Player choice
- "Declare agricultural emergency": Landowners +10, Main Street +5, Capital -20, Legitimacy +3
- "Let the market adjust": Landowners -10, Banks +5, Inflation +2, Rival +3

**The Protection Racket** (Weight: 2, Condition: Underworld loyalty >= 40) -- Player choice
- "Look the other way": Underworld +5, Main Street -8, Dread +3
- "Send the Enforcers": Underworld -15, Main Street +5, Enforcers +3, Legitimacy +3

**The Cargo Ship** (Weight: 2, Condition: Underworld loyalty >= 30) -- Player choice
- "Clear the cargo": Underworld +10, Capital +15, Legitimacy -3, Dread +2
- "Seize the shipment": Underworld -10, Court +5, Legitimacy +3

**A Favor Owed** (Weight: 2, Condition: Underworld loyalty >= 50) -- Player choice
- "Pay the favor": Underworld +10, Court -5, Legitimacy -5, Dread +3
- "Refuse politely": Underworld -15, Dread +5

**The Informant** (Weight: 2, Condition: Underworld loyalty >= 35 AND Rival power > 40) -- Player choice
- "Buy the intelligence": Underworld +5, Legitimacy -3, Dread +2, Rival -5
- "Decline the offer": Underworld -5, Legitimacy +2

**The Ballot Box** (Weight: 1, Condition: Underworld loyalty >= 45) -- Player choice
- "Accept the help": Underworld +10, Legitimacy -8, Narrative +3, Dread +3, Rival -3
- "Reject it absolutely": Underworld -10, Court +5, Legitimacy +5

**The Flood** (Weight: 2) -- Player choice
- "Launch massive relief effort": Capital -30, Legitimacy +5, Narrative +5, Main Street +10, Landowners +5, Clergy +5
- "Issue statements of concern": Main Street -10, Landowners -5, Rival +5

**The Celebrity** (Weight: 2) -- Player choice
- "Welcome the endorsement": Artists +5, Main Street +5, Narrative +5
- "Keep a professional distance": Scholars +3, Legitimacy +2

**The State Visit** (Weight: 2) -- Player choice
- "Spare no expense": Capital -15, Colossus Alignment +5, Narrative +3, Banks +3
- "Keep it simple": Colossus Alignment +2, Legitimacy +2

**Campus Unrest** (Weight: 2, Condition: Polarization > 35) -- Player choice
- "Meet with student leaders": Scholars +10, Artists +5, Narrative +3, Mobilization +3
- "Clear the building": Scholars -10, Enforcers +3, Dread +3, Narrative -3, Rival +2

**The Festival of Saints** (Weight: 2) -- Player choice
- "Sponsor the festival": Clergy +10, Artists +3, Capital -10, Narrative +3
- "Attend but don't sponsor": Clergy +3, Scholars +3, Legitimacy +2

**The Miranda Valley** (Weight: 2) -- Player choice
- "Offer tax incentives": Big Tech +10, Banks +5, Unions -5, Capital -10, Inflation -1
- "Regulate first": Big Tech -5, Unions +5, Scholars +3, Legitimacy +2

**The Blight** (Weight: 2, Condition: Landowners loyalty > 20) -- Player choice
- "Emergency farm subsidies": Landowners +15, Banks -5, Capital -20, Legitimacy +3
- "Import substitute crops": Landowners -10, Main Street +5, Colossus Alignment +3, Inflation -1

**The Deep Dive** (Weight: 2, Condition: Heralds loyalty 30-70) -- Player choice
- "Announce spending reforms": Heralds +5, Scholars +5, Legitimacy +5, Capital -10
- "Question the methodology": Heralds -10, Narrative -3, Rival +2

**The Miranda Renaissance** (Weight: 2, Condition: Artists loyalty > 50) -- Auto-resolve
- Artists +5, Scholars +3, Narrative +5, Legitimacy +3

**The Border Incident** (Weight: 2) -- Player choice
- "Deploy military reinforcements": Generals +10, Dread +5, Colossus Alignment -3, Capital -15
- "Pursue diplomatic channels": Generals -3, Scholars +3, Colossus Alignment +3, Legitimacy +3

**The Economic Summit** (Weight: 2) -- Player choice
- "Present ambitious reforms": Narrative +5, Colossus Alignment +5, Legitimacy +3, Banks +3, Scholars +3
- "Play it safe": Colossus Alignment +3, Legitimacy +2

**Labor Day Rally** (Weight: 2, Condition: Union loyalty > 40) -- Player choice
- "Join the march": Unions +10, Banks -5, Mobilization +5, Narrative +3, Cohesion +5
- "Send a message of support": Unions +3, Narrative +1

---

## Crisis Chains

Crisis chains are multi-stage escalating emergencies that unfold over consecutive turns.

### How Chains Work

1. When trigger conditions are met during the Reaction phase, the chain's first stage fires.
2. Each subsequent turn, the next stage fires automatically.
3. Events with player choices are queued and shown in the next turn's News phase.
4. Events without choices auto-resolve immediately.
5. Chains are one-shot... once the first stage fires, the chain won't re-trigger.

### Banking Crisis (3 stages, Trigger: Inflation > 18)

**Stage 1: Bank Run Rumors** -- Player choice
- "Guarantee all deposits": Capital -30, Legitimacy +3, Banks +10, Main Street +5
- "Let the market correct": Inflation +2, Banks -10, Rival +3

**Stage 2: Credit Freeze** -- Auto-resolve
- Capital -20, Inflation +3, Banks -5, Factories -5, Main Street -5, Rival +3

**Stage 3: The Banking Resolution** -- Player choice
- "Bail out the banks": Capital -40, Legitimacy -5, Banks +15, Main Street -10, Unions -10
- "Nationalize failing banks": Banks -20/-10p, Unions +10, Main Street +5, Legitimacy +5, Polarization +5

### Military Restlessness (3 stages, Trigger: Generals loyalty < 25)

**Stage 1: Barracks Rumors** -- Player choice
- "Increase military pay": Capital -25, Generals +10
- "Hold private meetings": Generals +5, Dread +3

**Stage 2: The Officers' Ultimatum** -- Player choice
- "Accept their demands": Generals +15, Capital -30, Legitimacy -5, Dread +5
- "Call their bluff": Generals -10, Legitimacy +5, Rival +5

**Stage 3: The Loyalty Question** -- Player choice
- "Purge disloyal officers": Generals +10/-10p, Enforcers +5, Dread +10, Legitimacy -5
- "Hold a unity ceremony": Generals +5, Narrative +5, Legitimacy +3

### Labor Uprising (2 stages, Trigger: Union loyalty < 20 AND labor cohesion > 60)

**Stage 1: Rolling Strikes** -- Player choice
- "Open negotiations": Unions +10, Factories -5, Capital -15, Cohesion +10
- "Send in the Enforcers": Unions -15, Enforcers +5, Factories +5, Dread +8, Mobilization -10, Cohesion -15

**Stage 2: The General Shutdown** -- Player choice
- "Propose a grand bargain": Unions +10, Banks -5, Factories -5, Capital -25, Legitimacy +5, Cohesion +15, Rival -3
- "Declare a state of emergency": Unions -20, Generals +10, Main Street -10, Dread +15, Legitimacy -10, Cohesion -20, Rival +5

### Media Scandal (3 stages, Trigger: Pending discoveries exist OR Heralds loyalty < 35)

**Stage 1: The Leak** -- Player choice
- "Deny everything": Heralds -10, Narrative -5, Rival +3
- "Get ahead of the story": Heralds +5, Legitimacy -3, Narrative +3

**Stage 2: The Investigation** -- Auto-resolve
- Court -5, Heralds -3, Legitimacy -5, Narrative -5, Rival +3

**Stage 3: The Verdict** -- Player choice
- "Accept the findings": Court +10, Heralds +5, Legitimacy +5, Narrative +5, Rival -2
- "Dismiss the findings": Court -10, Heralds -10, Narrative -8, Polarization +5, Rival +5

### Colossus Pressure (3 stages, Trigger: Colossus patience < 20)

**Stage 1: The Diplomatic Warning** -- Player choice
- "Promise compliance": Colossus Alignment +8, Legitimacy -3
- "Stand firm": Colossus Alignment -5, Narrative +5, Factories +5, Unions +5

**Stage 2: Sanctions** -- Auto-resolve
- Capital -25, Inflation +3, Colossus Alignment -5, Banks -5, Factories -5, Rival +3

**Stage 3: The Colossus Ultimatum** -- Player choice
- "Accept the terms": Colossus Alignment +20, Legitimacy -10, Narrative -10, Generals -10, Rival +5
- "Refuse the ultimatum": Colossus Alignment -15, Narrative +10, Mobilization +10, Generals +10, Unions +5, Rival -3

---

## Win and Loss Conditions

### Immediate Loss Conditions (checked every turn)

| Condition | Ending |
|---|---|
| Legitimacy reaches 0 | **Impeached** -- "The republic remembers who you were." |
| Generals loyalty < 20 AND dread > threshold* | **Coup** -- "The generals moved at dawn." |
| Rival power reaches 100 | **Rival Wins** -- "Democracy works. Sometimes against you." |

*Coup dread threshold varies by difficulty: Story = 85, Standard = 70, Crisis = 60.

### End-of-Term Conditions (turn 48, checked in priority order)

| Priority | Condition | Ending |
|---|---|---|
| 1 | Labor cohesion >= 80, rival < 30, narrative > 70 | **New Compact** (secret best ending) -- "A nation rebuilt from the bottom up." |
| 2 | Rival < 20, narrative > 60 | **A New Story** -- "The story they'll tell is the one you wrote." |
| 3 | Rival < 20, labor cohesion < 25 | **Manager's Victory** -- "The trains run on time. The workers run on fumes." |
| 4 | Underworld loyalty > 80 | **Shadow Republic** -- "The state works. Nobody asks who it works for." |
| 5 | Colossus alignment > 85 | **Protectorate** -- "Miranda is independent. The Colossus just makes the decisions." |
| 6 | Polarization > 80 | **Hollow Republic** -- "The institutions stand. Nobody's inside them." |
| 7 | Legitimacy > 30 | **Republic Endures** (default survival) -- "Not a victory. A continuation." |
| 8 | Otherwise | **Impeached** |

---

## Difficulty Settings

Three difficulty levels affect starting conditions and ongoing mechanics.

| Parameter | Story | Standard | Crisis |
|---|---|---|---|
| Rival growth multiplier | 0.15x | 1.0x | 1.5x |
| Base capital income/turn | 10 | 5 | 3 |
| Starting capital bonus | +80 | 0 | -30 |
| Starting legitimacy bonus | +20 | 0 | -10 |
| Legitimacy decay shield | 3/turn | 0 | 0 |
| Coup dread threshold | 85 | 70 | 60 |

**Story mode** is designed for exploring the narrative with minimal mechanical pressure. The rival barely grows, resources are abundant, and legitimacy is protected.

**Standard mode** is the intended experience with meaningful challenge.

**Crisis mode** is a harder variant where the rival grows 50% faster, resources are scarce, and coups trigger more easily.

---

## Day One Briefing

A narrative modal that bridges the tutorial and the first game event, providing an "Inauguration Day" moment.

### Flow

1. Player selects difficulty, `initGame()` creates state with `showDayOneBriefing: true`
2. Tutorial shows (if first time) at z-50
3. Player dismisses tutorial
4. Day One Briefing appears (z-50, DOM order places it behind tutorial but visible once tutorial is gone)
5. Player clicks "Begin" to dismiss
6. First news event shows

For returning players (tutorial already seen), the briefing shows immediately after difficulty selection. For loaded games, `showDayOneBriefing` migrates to `false` (the inauguration already happened).

### Content

3-4 paragraphs of dark whimsy narrative, varying by difficulty. The player has just arrived at the presidential desk. The chief of staff introduces the political landscape, referencing the rival by name and title (from game state), the fourteen factions, the Colossus, and the 48-month term.

- **Story:** Relaxed tone. The desk is polished, the predecessor left a bottle of wine with an encouraging note. The chief of staff enters with a knock and a smile. The rival is mentioned casually. "You have time."
- **Standard:** Neutral tension. Mahogany desk, pre-signed resignation letter. The chief of staff enters without knocking. The rival is organizing but not yet threatening. Ends with "The phone is ringing."
- **Crisis:** Urgent, hostile tone. Cigarette-burned desk from a predecessor who didn't last four years. Three urgent briefing folders. The chief of staff enters already arguing on the phone. The rival has held two rallies this week. The Colossus ambassador called twice before breakfast. Ends with "Three phones are ringing. Nobody is answering them."

### Design Rationale

The Day One briefing solves the jarring transition from tutorial to first event. Without it, the player finishes learning mechanics and immediately faces "The Drought" with no narrative context. The briefing establishes the presidential setting, introduces the rival as a named character rather than a stat bar, and sets the dark whimsy tone before mechanical decisions begin.

No auto-advance timer. This is a first-impression moment. No Escape key dismiss either. You can't escape inauguration day.

### Accessibility

Dialog role, aria-modal, auto-focus on Begin button.

---

## Responsive Design

The game adapts to three viewport ranges using a `useBreakpoint` hook based on `matchMedia('(min-width: 768px)')`.

### Mobile (<768px)

A bottom tab bar replaces the sidebar, with four tabs:

| Tab | Content |
|-----|---------|
| Blocs | BlocGrid in compact accordion mode with group headers |
| Actions | PolicyPicker in compact list mode with selection summary bar |
| Status | Full-width ResourceSidebar (resources, Central Bank, Colossus, Congress, Rival) + Save controls + Skip turn reports toggle |
| News | NewsLog at full height |

All four tab content areas remain mounted (CSS `hidden`) to preserve state across tab switches. This is critical for PolicyPicker selection persistence.

Key mobile adaptations:
- **Compact header:** "MIRANDA" title, phase badge, turn counter. Save controls and date move to Status tab.
- **Compact BlocCards:** Single row with emoji, name, loyalty value, power value. Tap to expand accordion with full bars and mood text.
- **Compact PolicyCards:** Single row with category color dot, name, cost badge, checkbox. Tap name for PolicyDetailSheet bottom sheet.
- **PolicyDetailSheet:** Bottom sheet overlay (70vh max) showing full policy details with Select/Deselect button.
- **Bottom nav:** Fixed at bottom with inline SVG icons, cyan active indicator bar, pulse ring on Actions tab during action phase.
- **Scrollable modals:** All modal overlays use `overflow-y-auto` so long content (like Crisis difficulty inauguration) is scrollable on small screens.

### Tablet (768-1023px)

Uses the desktop sidebar layout. The sidebar width stays at `w-56` and the content area adapts to the remaining space.

### Desktop (>=1024px)

Full sidebar + main content layout. Bloc cards render in a responsive grid (up to 5 columns at wide viewports) with group section headers (State Power, Capital, Civil Society, Underworld). Cards have subtle hover lift effect (`hover:-translate-y-0.5`).

### Skip Turn Reports

A `skipBriefings` toggle (stored in GameState, persists across saves) allows players to auto-dismiss turn report modals. Default is off (meditative pacing). When enabled, `TurnBriefing` never appears. The auto-advance countdown timer was removed entirely. Turn reports now wait for the player to click "Continue" or press Enter/Space/Escape.

### Touch Support

Tooltips support touch devices via long-press (500ms hold to show, release to dismiss). This is critical because hover tooltips don't exist on touch devices.

### Design Rationale

Bottom tabs (not hamburger menu) because the game has 3-4 distinct content areas that need instant switching, resources are gameplay-critical and shouldn't be hidden, bottom tabs match the thumb zone, and game phases map naturally to tab highlighting.

CSS `hidden` class (not conditional rendering) for tab content because PolicyPicker selection state must persist when switching tabs to check resources or blocs.

`100dvh` instead of `100vh` because mobile Safari's address bar changes viewport height, and `dvh` units account for this.

No new dependencies added. Everything uses Tailwind utilities, CSS transitions, and vanilla React state.

---

## Design Rationale

### Core Design Philosophy

Miranda Republic is a systems-first political simulation. Its genre reference points are grand strategy and management simulation, filtered through satirical political commentary. The aesthetic is "dark whimsy" with an irreverent tone.

Miranda is a "synthetic republic" that mirrors tensions across multiple real-world democracies (Americas, Europe) without being locked to any single country. The game's setting exists in the shadow of an imperial neighbor (the Colossus), creating structural constraints on sovereignty that shape every decision.

The game avoids simple ideological binaries. Instead, it models how material conditions, cultural narratives, institutional inertia, and external pressures interact to produce political outcomes. The player should feel the structural limits of reform, not just pick sides.

### The Rival as Symptom, Not Cause

The rival's rise is designed as a **symptom of systemic failure**. Material conditions (inequality, precarity, institutional decay, imperial dependency) are the underlying engine. The rival channels real grievances through spectacle and scapegoating. This is why rival growth is driven by the player's weaknesses (inflation, low legitimacy, polarization) rather than by the rival's own actions. The player can suppress the rival, but until they address root causes, new grievances will fuel continued opposition.

The rival gains +1 power per turn even with perfect governance. This represents structural political opposition inherent to any democratic system. The player can slow or suppress growth but never eliminate it entirely. Every game has a ticking clock.

### Why Centrist Policies Get More Expensive

As polarization rises, the political center becomes harder to maintain. This models how compromise becomes politically costly in divided societies. The mechanic creates a feedback loop: polarizing actions are cheap and effective in the short term, but they make future compromise harder and more expensive.

At high polarization, centrist policies don't disappear, they become expensive and risky (backlash). But backroom versions of moderate governance remain accessible. This encodes a real dynamic: in highly polarized environments, moderate governance doesn't stop, it just moves underground and becomes corrupt. The player faces a genuine dilemma: pay the enormous political cost of centrist policy in public, or achieve the same outcome through backroom deals and risk scandal.

### Why Backroom Deals Are Risky But Useful

Backroom policies bypass congressional costs and sensitivity scaling, making them the most direct way to shift bloc loyalty. But the discovery mechanic creates delayed accountability. This models the trade-off between expedient governance and institutional integrity.

Corruption in Miranda isn't just a moral failure. It's a structural lubricant that smooths institutional friction. The player should sometimes face situations where a backroom deal is the only practical way to achieve a beneficial outcome. The game doesn't moralize about this choice; it simulates the consequences.

### Why Some Actions Are Locked

- **The Blame Game** (requires polarization >= 40): Scapegoating only works when society is already somewhat divided. In calm times, it would fall flat.
- **Informal Channels** (requires Underworld loyalty >= 40): The Underworld won't cooperate until they trust you. You need to build that relationship through other means first. The Underworld starts at 35 loyalty, just below the threshold, creating an early strategic question.
- **Constitutional Amendment / Electoral Reform** (requires majority): Major institutional changes require legislative support. You can't reform the system without first building a coalition within it.

### Why Narrative Is Slow to Build

The asymmetry (gains of +1 to +3 vs losses of -2 to -8) models how public trust is hard to earn and easy to lose. This makes investing in cultural blocs a long-term strategy rather than a quick fix. A single scandal can undo months of careful narrative work.

### Legitimacy vs. Narrative as Separate Dimensions

These two resources create fundamentally different strategic positions:

- **High Legitimacy + High Narrative**: Rare and powerful. Governing effectively and culturally ascendant.
- **High Legitimacy + Low Narrative**: "The Caretaker." Governing legally but nobody believes in your project. Technocratic inertia.
- **Low Legitimacy + High Narrative**: "The Revolutionary." Everyone loves your vision but institutions are blocking you. One scandal from impeachment.
- **Low Legitimacy + Low Narrative**: Crisis mode. The rival barely needs to campaign.

### Why Labor Cohesion Is Hidden

Labor cohesion operates as a structural variable that the player influences indirectly through policies and events. Making it visible would reduce it to a number to optimize. Keeping it hidden encourages the player to think about the conditions that build or erode worker solidarity rather than targeting a metric. The player sees the Unions' power fluctuate and must learn through play what strengthens or weakens organized labor.

The labor cohesion system models the fragmentation of the contemporary working class through de-industrialization, platform capitalism, and geographic divides. Traditional labor organizing no longer works on its own. Platform worker protections have conditional effects. whether they help or hurt cohesion depends on whether unions have built enough trust and whether the public narrative supports collective frameworks. You can't just legislate solidarity. You have to build the conditions that make it viable.

### Why the Dual Sensitivity System Exists

Rather than a single "media weight" axis, each bloc has separate material and narrative sensitivity scores. This reflects that every faction has both material interests and narrative susceptibility, and these are not inversely related. The Clergy runs schools, charities, and real estate (material) while also being deeply responsive to values rhetoric (narrative). The Enforcers care about budgets (material) but are also heavily swayed by "law and order" framing (narrative). The Underworld, uniquely, is almost purely transactional (material 90, narrative 10).

This means rhetoric alone can't secure a bloc if their material needs are unmet, and policy alone won't move blocs that are also narrative-sensitive. Different factions require different strategic mixes.

### Why the Interaction Matrix Exists

Ripple effects prevent the player from treating blocs as independent dials. Helping one faction affects its allies and rivals, creating realistic second-order consequences. A +20 loyalty boost to Unions doesn't just help the Unions; it sends -3 or -4 to the Banks (via the -0.7 rivalry coefficient at 25% scale).

The matrix encodes natural coalitions (Banks-Tech-Landowners as "global capital," Factories-Unions as "the old industrial compact," Generals-Enforcers-Clergy as "the order coalition," Unions-Artists-Scholars as "the progress coalition") while leaving room for unlikely alliances forced by circumstances. The Heralds and Main Street function as swing blocs, responsive to whoever controls the narrative or addresses their material anxieties. The Underworld is a wildcard with no natural coalition, allying with whoever is useful and non-threatening.

### Why the Underworld Exists

The Underworld represents organized informal power in territories the state has abandoned or never reached. They are not simply antagonists. They fill governance vacuums, providing security, employment, social services, and dispute resolution where formal institutions fail. This is why their ideology is 0 (purely transactional) and their narrative sensitivity is near-zero. They don't care about your speeches. They care about whether you'll leave them alone.

The Underworld creates a unique strategic layer. They are the ultimate backroom ally, able to deliver votes, smooth logistics, and suppress opposition. The cost: legitimacy erosion and the ever-present risk that any exposed connection destroys your narrative.

### Why the Colossus Is a Structural Constraint

The Colossus isn't an optional context. it's the structural framework that makes Miranda's "sovereignty" partially conditional. Trade dependency, debt, alignment pressures, and patience mechanics model how external imperial relationships constrain domestic policy options. The player can pursue independence, but it comes with real economic costs. Alignment with the Colossus brings stability and capital, but at the price of domestic industry, intellectual independence, and sovereignty.

### Why There Are 10 Endings

Multiple endings reward different play styles and prevent a single "correct" strategy:

- **New Compact** (secret best ending) requires investing in labor cohesion, controlling the rival, and maintaining narrative. This demands sustained, coherent policy-making rather than reactive crisis management.
- **A New Story** rewards narrative and rival control without requiring labor cohesion.
- **Manager's Victory** shows the cost of defeating the rival through institutions alone, without building worker solidarity.
- **Shadow Republic**, **Protectorate**, and **Hollow Republic** are "Pyrrhic survival" endings. you survived, but at what cost?
- **Republic Endures** is the default survival. Not a victory, a continuation.
- The three loss conditions (Impeached, Coup, Rival Wins) represent different modes of failure.

The endings collectively pose the question: "What does it mean to govern? And for whom?"

---

## Turn Briefing System

After the player ends their turn and all phases process, a narrative briefing overlay appears (if anything notable happened). The briefing consists of at most 3 short vignettes written in the game's dark whimsy voice, describing what happened as lived detail rather than mechanical summaries.

### Briefing Item Types (by priority)

1. **Rival actions** (priority 100) -- The rival's generated action text, always included if present
2. **Crisis events** (priority 95) -- Active crisis chain developments
3. **Discovery/scandal** (priority 90) -- Triggered when legitimacy drops >= 15 in one turn
4. **Rival threshold crossings** (priority 85-88) -- When rival power crosses 30, 50, 75, or 85
5. **Resource threshold crossings** (priority 70-82) -- Inflation crossing 10 or 18, Narrative dropping below 30 or rising above 60, Mobilization dropping below 20, Polarization crossing 60, Dread crossing 40, Legitimacy dropping below 30, Capital dropping below 20
6. **Bloc loyalty milestones** (priority 60-65) -- All 14 blocs have flavor text for dropping below 25 or rising above 70
7. **Colossus patience** (priority 55) -- Ambassador's patience below 30
8. **Policy unlocks** (priority 50) -- New policies became available
9. **Color vignettes** (priority 35) -- Atmospheric world-building snapshots (see below)

### Color Vignettes

A pool of 30 atmospheric vignettes that fire on quiet turns when fewer than 2 higher-priority items exist. These are pure world-building with no mechanical information. They paint Miranda as a lived-in place through palace life, city atmosphere, government bureaucracy, street life, seasonal weather, and dark whimsy. Examples: a filing clerk discovering a 1987 form, the presidential phone ringing at 3 AM (wrong number), jacaranda trees blooming in the government district.

Color vignettes ensure there is always a visible turn transition, preventing the jarring effect of a quiet turn advancing immediately into the next event.

### Behavior

- Maximum 3 items shown per briefing (highest priority wins)
- If fewer than 2 candidates exist, a color vignette is injected as a minimum transition
- Auto-advances after 8 seconds with visible countdown
- Dismissible via click, Enter, Escape, or Space
- Items compare current state to `previousResources` (stored at start of turn processing)

### Content Scale

All briefing text is stored in module-level arrays with `randomChoice()` selection, ensuring variety across playthroughs. The pool contains ~125 unique vignettes across all categories. Each category has 2-4 variant texts to reduce repetition.

### Tone

The briefing text uses situationist detournement. It employs the language of institutional normalcy to reveal absurdity. The irony speaks for itself. No moralizing. The player draws their own conclusions. Each vignette builds a cumulative portrait of Miranda as a living place.

---

## UI Systems

### Turn Report Visual Design

The turn report modal displays briefing items with visual hierarchy and labeled sections. A cyan gradient accent line runs across the top.

**Rival section** appears at the top with the rival's name and title as a subheading (e.g., "Governor Fuentes, Regional Governor"), followed by their action text in amber italic. This section has a left amber border to distinguish it from other items.

**Other items** are labeled by type with colored left borders:
- `crisis` -> "Crisis Report" (red border)
- `discovery` -> "Intelligence" (purple border)
- `resource` -> "Field Report" (emerald border)
- `bloc_shift` -> "Political Dispatch" (cyan border)
- `unlock` -> "New Capability" (green border)
- `color` -> no label, no border (atmospheric, labels would break the mood)

The header reads "Turn Report, Month {turn}" to anchor the player in the timeline.

### Policy Category Tabs

The 46 policies are organized into 7 categories displayed as a horizontal tab bar above the policy grid. The "All" tab is selected by default. Each tab shows unlocked/total counts (e.g., "Economic (4/11)").

**Categories:** All, Economic (11), Labor (5), Security (6), Diplomatic (4), Institutional (7), Rhetoric (7), Backroom (6).

Within each category, policies are sorted: selected first, then newly unlocked ("New!" badge), then available (by ascending cost), then disabled, then locked.

The tab bar follows the ARIA tablist pattern with arrow key navigation, Home/End keys, and proper focus management.

### Resource Tooltips

Each resource in the sidebar has a context-aware tooltip that explains its current gameplay impact using actual values from the game state. Examples:

- **Inflation (6/30):** "Economic pain (6/30). Above 10, adds +2 rival growth per 5 points. Above 12, currency crisis can trigger."
- **Polarization (25/100):** "Societal division (25/100). Currently no cost penalty. At 30+, centrist policies cost 25% more."
- **Narrative (45/100):** "Control of the public story (45/100). Below 50, your rival grows faster."

Tooltips update dynamically as values change. They teach mechanics through play rather than tutorials.

### Resource Trend Arrows

Small colored arrows next to each resource value show the direction of change from the previous turn. Green arrows indicate beneficial changes, red indicates harmful changes, gray indicates stability. For "negative" resources (polarization, inflation, dread), the color coding is inverted (increases are red). Screen readers announce trend descriptions via sr-only text.

### Desktop View Modes (Overview/Detail Toggles)

Each major desktop panel supports two view modes, toggled via radio buttons with localStorage persistence. Mobile uses its own compact modes and does not show these toggles.

**Bloc Grid:** Overview mode shows a condensed table with emoji + name + color-coded loyalty + muted power per row, grouped by faction (State Power, Capital, Culture, Labor, Underworld). Click any row to expand an inline accordion with full loyalty/power bars and mood text. Detail mode shows the original full bloc cards. Trend arrows (from `prevBlocLoyalty` engine snapshot) show loyalty direction.

**Policy Picker:** Overview mode shows a compact table with category dot + policy name + cost + up to 2 effect tags + checkbox. Click a policy name to open the PolicyDetailSheet for full details. Locked policies show as greyed rows with lock icon and hint. Detail mode shows the original full policy cards.

**Resource Sidebar:** Compact mode replaces progress bars with a number grid (colored dot + abbreviated label + value) and collapses panels (CBI, Colossus, Congress, Rival) to single-line summaries. Click any collapsed panel to expand inline. Detail mode shows the original full sidebar.

**Design rationale:** Playtesting revealed that the mobile-responsive compact modes were often more scannable than desktop's full cards. These toggles bring that information density to desktop while preserving the detailed view for players who prefer it. View preference persists across sessions via localStorage.

### Tutorial Spotlighting

The tutorial overlay (accessible via the "?" button) highlights relevant UI elements using a box-shadow cutout technique. When a step has a spotlight target, a transparent div overlays the target element with `box-shadow: 0 0 0 9999px rgba(0,0,0,0.7)` to dim everything except the target. The tutorial card repositions itself to avoid overlapping (preferring below > right > above > left > centered fallback).

On mobile, the tutorial auto-switches bottom nav tabs to show the relevant section (e.g., switching to the Status tab when explaining resources).

Steps without spotlight targets (Welcome, Backroom Deals, Turn Reports, View Modes) fall back to a centered modal with full dark backdrop.

### Bloc Grouping

Blocs are organized into 5 groups reflecting materialist categories:
- **State Power** (cyan border): Court, Generals, Enforcers
- **Capital** (amber border): Banks, Factories, Big Tech, Landowners, Main Street
- **Culture** (violet border): Heralds, Clergy, Scholars, Artists
- **Labor** (sky border): Unions
- **Underworld** (rose border): The Underworld

Labor is intentionally separate from Culture. Unions operate on fundamentally different incentives (wages, working conditions, collective bargaining power) than cultural institutions (narrative, prestige, public opinion). Grouping them together would obscure meaningful gameplay distinctions.

---

## Changelog

### v1.4 (February 2026)
- Desktop Overview/Detail toggles for Blocs (BlocOverviewTable), Policies (PolicyOverviewTable), and Sidebar (SidebarOverview)
- Tutorial spotlighting with box-shadow cutout technique and auto-positioning card
- Tutorial mobile tab auto-switching for spotlight targets
- New tutorial step explaining view mode toggles
- Bloc grouping reverted: Labor separated from Civil Society into standalone group (distinct economic incentives)
- `prevBlocLoyalty` engine state for bloc trend arrows in overview table
- Skip-briefings toggle moved from sidebar to header toolbar (SaveControls)
- Vitest migration: 85 tests across 4 suites replacing custom console harness
- 3,000-seed fuzz (500 x 3 difficulties x 2 suites) validating engine invariants
- New components: BlocOverviewTable, PolicyOverviewTable, SidebarOverview, TutorialSpotlight
- `data-tutorial` attribute system for spotlight targeting
- Community feedback section added to README

### v1.3 (February 2026)
- Mobile-responsive redesign with bottom tab navigation (Blocs, Actions, Status, News)
- Compact BlocCard accordion mode for mobile with group headers
- Compact PolicyCard list mode for mobile with PolicyDetailSheet bottom sheet
- Fullwidth ResourceSidebar variant for mobile Status tab
- Skip turn reports toggle (persists across saves, default off)
- Turn report auto-advance timer removed (manual "Continue" only)
- "New Game" button now returns to difficulty selection screen
- Difficulty-specific Day One Briefing narratives (Story, Standard, Crisis)
- Scrollable modal overlays for small viewports
- Touch tooltip support via long-press (500ms)
- Accent gradient line on EventModal and BlocTargetModal
- Hover lift effect on desktop BlocCards
- Bloc group headers on desktop BlocGrid
- Selection summary bar on PolicyPicker (both mobile and desktop)
- `useBreakpoint` hook using `matchMedia` for responsive rendering
- New components: MobileLayout, MobileBottomNav, PolicyDetailSheet, SaveControls

### v1.2 (February 2026)
- Day One "Inauguration Day" briefing with narrative introduction and rival name
- Turn report redesign with rival section header, type labels, and colored borders
- Color vignette system (30 atmospheric world-building texts for quiet turns)
- Rival action text expanded from 86 to 240 lines (60 per background, weakness coverage)
- Briefing vignettes expanded from 25 to ~125 unique texts across all categories
- New briefing triggers: rival crossing 30/85, crisis stage 1, legitimacy < 30, capital < 20
- All 14 blocs now have low-loyalty and high-loyalty briefing texts
- Narrative tooltip no longer spoils ending thresholds
- "All" tab in policy picker now groups policies by category within tiers
- 452 tests (up from 409), including content expansion and Day One briefing coverage

### v1.1 (February 2026)
- Policy category tabs with filtering, sorting, and ARIA tablist navigation
- Progressive policy unlock system (18 starting, 28 unlockable via turns, loyalty, and resources)
- Narrative turn briefing system with priority-based vignette selection
- Context-aware resource tooltips with dynamic threshold explanations
- Resource trend arrows showing direction of change per turn
- Enhanced disabled reason display on policy cards (specific requirements shown)
- 409 tests (up from 308), including unlock system and briefing generation coverage

### v1.0 (February 2026)
- Initial documentation of all game mechanics
- Engine through Phase 6 complete (46 policies, 14 blocs, 5 crisis chains, 10 endings)
- Rival personality system with 4 backgrounds and context-aware action text
- Congressional mechanics with seat shares and majority effects
- Central bank independence as a hidden strategic lever
- 53 events documented exhaustively (6 rival threshold, 1 resource threshold, 5 loyalty threshold, 26 random, 15 crisis chain stages)
