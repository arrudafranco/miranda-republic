import { useState } from 'react';
import { useGameStore } from './hooks/useGameStore';
import type { Difficulty } from './types/game';
import Dashboard from './components/Dashboard';
import DifficultySelect from './components/DifficultySelect';

export default function App() {
  const initGame = useGameStore(s => s.initGame);
  const turn = useGameStore(s => s.turn);
  const [started, setStarted] = useState(false);

  const handleSelect = (difficulty: Difficulty) => {
    initGame(difficulty);
    setStarted(true);
  };

  if (!started && turn <= 1) {
    return <DifficultySelect onSelect={handleSelect} />;
  }

  return <Dashboard />;
}
