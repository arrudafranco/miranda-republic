# Miranda Republic

A political simulation game set in a fictional developing nation. Navigate four years as president, balancing competing factions, managing an economy under pressure, and surviving the machinations of your political rival.

**[Play Now](https://arrudafranco.github.io/fun/)**

![Miranda Republic gameplay screenshot](screenshot.png)

## About

Miranda Republic is a turn-based strategy game where every policy decision ripples through 14 political blocs, from the Banks to the Underworld. Manage your legitimacy, control the national narrative, and keep the Colossus (a powerful foreign superpower) from losing patience. With 46 policies, dynamic events, crisis chains, and 10 possible endings, no two playthroughs are alike.

## Tech Stack

- **Framework:** React 19
- **State Management:** Zustand 5
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Language:** TypeScript
- **Testing:** Custom deterministic test harness with seedable PRNG (297 tests, including 1500-seed fuzz across 3 difficulty levels)

## Local Development

```bash
git clone https://github.com/arrudafranco/fun.git
cd fun
npm install
npm run dev
```

The game runs at `http://localhost:5173` by default.

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

## Technical Highlights

This project demonstrates several software engineering skills beyond the tech stack itself:

- **Game engine architecture.** Pure-function engine with clean separation between simulation logic, state management, and UI. Twelve engine modules (rival AI, congressional math, narrative phase, crisis chains, etc.) compose without side effects.
- **Deterministic testing with seedable PRNG.** All randomness routes through a seedable Mulberry32 PRNG, enabling exact reproducibility. The test harness runs 1,500 fuzz simulations (500 seeds x 3 difficulties) asserting invariants across ~72,000 game ticks, with any failure producing a deterministic repro.
- **Complex system balancing.** 14 interacting blocs with sensitivity matrices, ripple effects, polarization feedback loops, and a multi-phase turn structure. Difficulty tiers are tuned via parameterized configs, validated by automated balance assertions.
- **Accessibility-first UI.** Full ARIA support (roles, labels, live regions), semantic HTML, keyboard navigation with focus traps in modals, skip links, `prefers-reduced-motion` support, and high-contrast color choices.
- **Save/load with forward migration.** LocalStorage persistence with migration logic for schema evolution, ensuring older saves load cleanly as the game adds new mechanics.
- **AI-assisted development.** Built with Claude Code as a force multiplier for architecture, implementation, testing, and review. Effective AI-assisted development, from prompt engineering to iterative code review, is itself a transferable engineering skill.

## Credits

Created by Gustavo Arruda Franco.
