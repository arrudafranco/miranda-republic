# Miranda Republic

A political simulation game set in a fictional developing nation. Navigate four years as president, balancing competing factions, managing an economy under pressure, and surviving the machinations of your political rival.

**[Play Now](https://arrudafranco.github.io/miranda-republic/)**

![Miranda Republic gameplay screenshot](screenshot.png)

## About

Miranda Republic is a turn-based strategy game where every policy decision ripples through 14 political blocs, from the Banks to the Underworld. Manage your legitimacy, control the national narrative, and keep the Colossus (a powerful foreign superpower) from losing patience. With 46 policies, dynamic events, crisis chains, and 10 possible endings, no two playthroughs are alike.

## Tech Stack

- **Framework:** React 19
- **State Management:** Zustand 5
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Language:** TypeScript
- **Testing:** Custom deterministic test harness with seedable PRNG (308 tests, including 1500-seed fuzz across 3 difficulty levels)

## Local Development

```bash
git clone https://github.com/arrudafranco/miranda-republic.git
cd miranda-republic
npm install
npm run dev
```

The game runs at `http://localhost:5173/miranda-republic/` by default.

## Documentation

For a complete reference of all game mechanics, policies, events, crisis chains, endings, and design rationale, see **[GAME_MECHANICS.md](GAME_MECHANICS.md)**.

## Project Structure

```
src/
  components/   # React UI components
  data/         # Policy definitions, bloc data, events
  engine/       # Game logic (rival AI, economy, congress, narrative)
  hooks/        # Custom React hooks
  types/        # TypeScript type definitions
  utils/        # Seedable RNG, helpers
  test/         # Deterministic test harness
```

## How This Was Built

Miranda Republic was built collaboratively with [Claude Code](https://claude.ai/code) (Anthropic's AI coding tool). Here's what each side contributed:

**My role (Gustavo):** Game concept and setting, mechanical design (bloc interactions, rival system, crisis chains, difficulty tuning), UX decisions, balance priorities, and iterative review of every feature before it shipped. I directed the architecture through detailed implementation plans and caught issues Claude missed (accessibility gaps, nested tooltip bugs, writing style violations).

**Claude's role:** Implementation of the engine modules, React components, test harness, and build tooling. Claude translated design specs into working TypeScript, wrote the seedable PRNG testing infrastructure, and handled the mechanical details of state management, save migration, and CSS.

### Technical Details

- **Game engine architecture.** Pure-function engine with eleven modules (rival AI, congressional math, narrative phase, crisis chains, etc.) composing without side effects.
- **Deterministic testing with seedable PRNG.** All randomness routes through a seedable Mulberry32 PRNG. The test harness runs 1,500 fuzz simulations (500 seeds x 3 difficulties) asserting invariants across ~72,000 game ticks, with any failure producing a deterministic repro.
- **Complex system balancing.** 14 interacting blocs with sensitivity matrices, ripple effects, polarization feedback loops, and a multi-phase turn structure. Difficulty tiers tuned via parameterized configs, validated by automated balance assertions.
- **Accessibility.** ARIA roles and labels, semantic HTML, keyboard navigation with focus traps in modals, `prefers-reduced-motion` support, and high-contrast color choices.
- **Save/load with forward migration.** LocalStorage persistence with migration logic for schema evolution, ensuring older saves load cleanly as new mechanics are added.

## Credits

Created by Gustavo Arruda Franco, with Claude Code (Anthropic).
