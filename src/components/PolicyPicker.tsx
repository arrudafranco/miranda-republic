import { useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { POLICIES } from '../data/policies';
import { getPolarizationCostMultiplier } from '../engine/polarization';
import { getCongressCostMultiplier } from '../engine/congress';
import type { ActionChoice } from '../types/actions';
import type { BlocId } from '../types/blocs';
import PolicyCard from './PolicyCard';
import BlocTargetModal from './BlocTargetModal';

function computeEffectiveCost(
  policy: typeof POLICIES[number],
  polarization: number,
  gridlockCountdown: number,
  syndicateLoyalty: number,
  friendlyMajority: boolean
): number {
  const costMultiplier = getPolarizationCostMultiplier(polarization, policy.centrist);
  const gridlockMultiplier = gridlockCountdown > 0 ? 1.2 : 1.0;
  const syndicateDiscount =
    policy.category === 'backroom' && syndicateLoyalty > 60 ? 0.7 : 1.0;
  const congressMultiplier = getCongressCostMultiplier(friendlyMajority, policy.category);
  return Math.round(policy.capitalCost * costMultiplier * gridlockMultiplier * syndicateDiscount * congressMultiplier);
}

export default function PolicyPicker() {
  const resources = useGameStore(s => s.resources);
  const blocs = useGameStore(s => s.blocs);
  const rival = useGameStore(s => s.rival);
  const friendlyMajority = useGameStore(s => s.congress.friendlyMajority);
  const submitActions = useGameStore(s => s.submitActions);

  const [selected, setSelected] = useState<ActionChoice[]>([]);
  const [pendingBlocPolicy, setPendingBlocPolicy] = useState<string | null>(null);

  // Calculate total committed capital
  const committedCapital = selected.reduce((sum, sel) => {
    const p = POLICIES.find(pp => pp.id === sel.policyId);
    if (!p) return sum;
    return sum + computeEffectiveCost(p, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
  }, 0);

  function isPolicyDisabled(policy: typeof POLICIES[number]): boolean {
    // Polarization range check
    if (resources.polarization < policy.minPolarization || resources.polarization > policy.maxPolarization) return true;
    // Syndicate loyalty requirement
    if (policy.requiresSyndicateLoyalty !== undefined && blocs.syndicate.loyalty < policy.requiresSyndicateLoyalty) return true;
    // Congressional majority requirement
    if (policy.requiresMajority && !friendlyMajority) return true;
    // Capital check (remaining after committed)
    const cost = computeEffectiveCost(policy, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
    if (resources.capital - committedCapital < cost) return true;
    return false;
  }

  function handleToggle(policyId: string) {
    const existing = selected.find(s => s.policyId === policyId);
    if (existing) {
      setSelected(selected.filter(s => s.policyId !== policyId));
      return;
    }
    if (selected.length >= 2) return;

    const policy = POLICIES.find(p => p.id === policyId);
    if (!policy) return;

    if (policy.targetBloc) {
      setPendingBlocPolicy(policyId);
    } else {
      setSelected([...selected, { policyId }]);
    }
  }

  function handleBlocSelect(blocId: BlocId) {
    if (!pendingBlocPolicy) return;
    setSelected([...selected, { policyId: pendingBlocPolicy, targetBlocId: blocId }]);
    setPendingBlocPolicy(null);
  }

  function handleEndTurn() {
    submitActions(selected);
    setSelected([]);
  }

  return (
    <section aria-label="Policy selection">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1 font-pixel">
          Choose Actions ({selected.length}/2)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Select up to 2 policies, then end your turn. You can also skip by ending with no selections.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-4">
        {POLICIES.map(policy => {
          const isSelected = selected.some(s => s.policyId === policy.id);
          const disabled = !isSelected && (isPolicyDisabled(policy) || selected.length >= 2);
          const effectiveCost = computeEffectiveCost(
            policy, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority
          );
          return (
            <PolicyCard
              key={policy.id}
              policy={policy}
              selected={isSelected}
              disabled={disabled}
              needsMajority={!!(policy.requiresMajority && !friendlyMajority)}
              effectiveCost={effectiveCost}
              onToggle={() => handleToggle(policy.id)}
            />
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleEndTurn}
          className="w-full px-4 py-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          End Turn{selected.length > 0 ? ` (${selected.length} action${selected.length > 1 ? 's' : ''})` : ''}
        </button>
      </div>

      {pendingBlocPolicy && (
        <BlocTargetModal
          onSelect={handleBlocSelect}
          onCancel={() => setPendingBlocPolicy(null)}
        />
      )}
    </section>
  );
}
