import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { POLICIES } from '../data/policies';
import { getPolarizationCostMultiplier } from '../engine/polarization';
import { getCongressCostMultiplier } from '../engine/congress';
import type { ActionChoice, ActionCategory, Policy } from '../types/actions';
import type { BlocId } from '../types/blocs';
import PolicyCard from './PolicyCard';
import PolicyOverviewTable from './PolicyOverviewTable';
import PolicyDetailSheet from './PolicyDetailSheet';
import BlocTargetModal from './BlocTargetModal';

const POLICY_VIEW_KEY = 'miranda-policy-view';
type PolicyViewMode = 'detail' | 'overview';

const CATEGORY_TAB_COLORS: Record<string, string> = {
  economic: 'border-emerald-400 text-emerald-300',
  labor: 'border-sky-400 text-sky-300',
  security: 'border-rose-400 text-rose-300',
  diplomatic: 'border-teal-400 text-teal-300',
  institutional: 'border-amber-400 text-amber-300',
  rhetoric: 'border-orange-400 text-orange-300',
  backroom: 'border-violet-400 text-violet-300',
};

const CATEGORY_ORDER: ActionCategory[] = [
  'economic', 'labor', 'security', 'diplomatic', 'institutional', 'rhetoric', 'backroom',
];

const CATEGORY_LABELS: Record<string, string> = {
  economic: 'Economic',
  labor: 'Labor',
  security: 'Security',
  diplomatic: 'Diplomatic',
  institutional: 'Institutional',
  rhetoric: 'Rhetoric',
  backroom: 'Backroom',
};

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

type CategoryFilter = 'all' | ActionCategory;

export default function PolicyPicker() {
  const resources = useGameStore(s => s.resources);
  const blocs = useGameStore(s => s.blocs);
  const rival = useGameStore(s => s.rival);
  const friendlyMajority = useGameStore(s => s.congress.friendlyMajority);
  const submitActions = useGameStore(s => s.submitActions);
  const unlockedPolicyIds = useGameStore(s => s.unlockedPolicyIds);
  const newlyUnlockedPolicyIds = useGameStore(s => s.newlyUnlockedPolicyIds);
  const { isMobile } = useBreakpoint();

  const [selected, setSelected] = useState<ActionChoice[]>([]);
  const [pendingBlocPolicy, setPendingBlocPolicy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [policyViewMode, setPolicyViewMode] = useState<PolicyViewMode>(() => {
    try {
      return (localStorage.getItem(POLICY_VIEW_KEY) as PolicyViewMode) || 'detail';
    } catch {
      return 'detail';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(POLICY_VIEW_KEY, policyViewMode);
    } catch {
      // ignore
    }
  }, [policyViewMode]);

  // Calculate total committed capital
  const committedCapital = selected.reduce((sum, sel) => {
    const p = POLICIES.find(pp => pp.id === sel.policyId);
    if (!p) return sum;
    return sum + computeEffectiveCost(p, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
  }, 0);

  function getDisabledReason(policy: typeof POLICIES[number]): string | null {
    if (resources.polarization < policy.minPolarization) {
      return `Needs polarization ${policy.minPolarization}+`;
    }
    if (resources.polarization > policy.maxPolarization) {
      return `Max polarization ${policy.maxPolarization}`;
    }
    if (policy.requiresSyndicateLoyalty !== undefined && blocs.syndicate.loyalty < policy.requiresSyndicateLoyalty) {
      return `Needs Underworld loyalty ${policy.requiresSyndicateLoyalty}+`;
    }
    if (policy.requiresMajority && !friendlyMajority) {
      return 'Needs majority';
    }
    const cost = computeEffectiveCost(policy, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
    if (resources.capital - committedCapital < cost) {
      return 'Too expensive';
    }
    return null;
  }

  function isPolicyDisabled(policy: typeof POLICIES[number]): boolean {
    return getDisabledReason(policy) !== null;
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

  // Category counts (only count unlocked policies)
  const categoryCounts: Record<string, { unlocked: number; total: number }> = {};
  for (const cat of CATEGORY_ORDER) {
    const inCat = POLICIES.filter(p => p.category === cat);
    const unlocked = inCat.filter(p => unlockedPolicyIds.includes(p.id));
    categoryCounts[cat] = { unlocked: unlocked.length, total: inCat.length };
  }
  const allUnlocked = POLICIES.filter(p => unlockedPolicyIds.includes(p.id)).length;

  // Filter and sort policies
  const filteredPolicies = activeTab === 'all'
    ? POLICIES
    : POLICIES.filter(p => p.category === activeTab);

  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    const aLocked = !unlockedPolicyIds.includes(a.id);
    const bLocked = !unlockedPolicyIds.includes(b.id);
    if (aLocked !== bLocked) return aLocked ? 1 : -1;

    const aSelected = selected.some(s => s.policyId === a.id);
    const bSelected = selected.some(s => s.policyId === b.id);
    if (aSelected !== bSelected) return aSelected ? -1 : 1;

    // New policies float to top (after selected)
    const aNew = newlyUnlockedPolicyIds.includes(a.id);
    const bNew = newlyUnlockedPolicyIds.includes(b.id);
    if (aNew !== bNew) return aNew ? -1 : 1;

    const aDisabled = isPolicyDisabled(a);
    const bDisabled = isPolicyDisabled(b);
    if (aDisabled !== bDisabled) return aDisabled ? 1 : -1;

    // Group by category in "All" tab
    if (activeTab === 'all') {
      const aCatIdx = CATEGORY_ORDER.indexOf(a.category);
      const bCatIdx = CATEGORY_ORDER.indexOf(b.category);
      if (aCatIdx !== bCatIdx) return aCatIdx - bCatIdx;
    }

    // Within available: sort by cost ascending
    const aCost = computeEffectiveCost(a, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
    const bCost = computeEffectiveCost(b, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority);
    return aCost - bCost;
  });

  // Tab keyboard navigation
  function handleTabKeyDown(e: React.KeyboardEvent, tabs: CategoryFilter[]) {
    const currentIdx = tabs.indexOf(activeTab);
    let nextIdx = -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = tabs.length - 1;
    }

    if (nextIdx >= 0) {
      setActiveTab(tabs[nextIdx]);
      // Focus the new tab button
      const tabList = tabListRef.current;
      if (tabList) {
        const buttons = tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIdx]?.focus();
      }
    }
  }

  const allTabs: CategoryFilter[] = ['all', ...CATEGORY_ORDER];
  const tabPanelId = 'policy-tabpanel';
  const remainingCapital = resources.capital - committedCapital;

  // Selection summary bar (shared between mobile and desktop)
  const selectionSummary = (
    <div className="flex items-center gap-2 flex-wrap">
      {selected.map(sel => {
        const p = POLICIES.find(pp => pp.id === sel.policyId);
        if (!p) return null;
        return (
          <span
            key={sel.policyId}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-900/50 text-cyan-300 text-xs"
          >
            {p.name}
            <button
              onClick={() => setSelected(selected.filter(s => s.policyId !== sel.policyId))}
              className="ml-0.5 text-cyan-400 hover:text-cyan-200 focus:outline-none"
              aria-label={`Remove ${p.name}`}
            >
              &times;
            </button>
          </span>
        );
      })}
      <span className="text-xs text-slate-400 ml-auto">
        {selected.length}/2 selected, {remainingCapital} capital left
      </span>
    </div>
  );

  return (
    <section aria-label="Policy selection">
      <div className="px-4 pt-4 pb-2" data-tutorial="policies">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider font-pixel">
            Choose Actions ({selected.length}/2)
          </h3>
          {!isMobile && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5" role="radiogroup" aria-label="Policy view mode">
              <button
                role="radio"
                aria-checked={policyViewMode === 'overview'}
                onClick={() => setPolicyViewMode('overview')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  policyViewMode === 'overview' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                role="radio"
                aria-checked={policyViewMode === 'detail'}
                onClick={() => setPolicyViewMode('detail')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  policyViewMode === 'detail' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Detail
              </button>
            </div>
          )}
        </div>
        {!isMobile && (
          <p className="text-xs text-slate-500 mb-3">
            Select up to 2 policies, then end your turn. You can also skip by ending with no selections.
          </p>
        )}
      </div>

      {/* Selection summary bar */}
      <div className="px-4 pb-2">
        {selectionSummary}
      </div>

      {/* Category filter tabs */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Policy categories"
        data-tutorial="policy-tabs"
        className={`flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide ${isMobile ? 'tab-fade-edges' : ''}`}
      >
        {allTabs.map((tab) => {
          const isActive = activeTab === tab;
          const colorClass = tab === 'all' ? 'border-cyan-400 text-cyan-300' : (CATEGORY_TAB_COLORS[tab] ?? 'border-slate-400 text-slate-300');
          const count = tab === 'all'
            ? `${allUnlocked}/${POLICIES.length}`
            : `${categoryCounts[tab]?.unlocked ?? 0}/${categoryCounts[tab]?.total ?? 0}`;

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              aria-controls={tabPanelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => handleTabKeyDown(e, allTabs)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-t whitespace-nowrap border-b-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-900
                ${isActive
                  ? `${colorClass} bg-slate-800/80`
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'}
              `}
            >
              {tab === 'all' ? 'All' : CATEGORY_LABELS[tab]}{isMobile ? '' : ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* Policy list */}
      <div
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className={
          !isMobile && policyViewMode === 'overview'
            ? 'px-4 pb-4'
            : isMobile
              ? 'flex flex-col gap-1 px-3 pb-3'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-4'
        }
      >
        {!isMobile && policyViewMode === 'overview' ? (
          <PolicyOverviewTable
            policies={sortedPolicies}
            selected={selected}
            unlockedPolicyIds={unlockedPolicyIds}
            newlyUnlockedPolicyIds={newlyUnlockedPolicyIds}
            isDisabled={isPolicyDisabled}
            getDisabledReason={getDisabledReason}
            getEffectiveCost={(p) => computeEffectiveCost(p, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority)}
            onToggle={handleToggle}
            onDetail={setDetailPolicy}
          />
        ) : (
          sortedPolicies.map(policy => {
            const isLocked = !unlockedPolicyIds.includes(policy.id);
            if (isLocked) {
              return (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  selected={false}
                  disabled={true}
                  effectiveCost={0}
                  onToggle={() => {}}
                  locked={true}
                  lockHint={policy.unlockCondition?.hint}
                  compact={isMobile}
                />
              );
            }
            const isSelected = selected.some(s => s.policyId === policy.id);
            const disabledReason = isSelected ? null : (isPolicyDisabled(policy) ? getDisabledReason(policy) : null);
            const disabled = !isSelected && (disabledReason !== null || selected.length >= 2);
            const effectiveCost = computeEffectiveCost(
              policy, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority
            );
            return (
              <PolicyCard
                key={policy.id}
                policy={policy}
                selected={isSelected}
                disabled={disabled}
                disabledReason={disabledReason}
                effectiveCost={effectiveCost}
                onToggle={() => handleToggle(policy.id)}
                onDetail={isMobile ? () => setDetailPolicy(policy) : undefined}
                isNew={newlyUnlockedPolicyIds.includes(policy.id)}
                compact={isMobile}
              />
            );
          })
        )}
      </div>

      {/* End Turn button */}
      <div className={`px-4 pb-4 ${isMobile ? 'sticky bottom-0 bg-slate-950/95 backdrop-blur-sm pt-2 border-t border-slate-700/30' : ''}`}>
        <button
          onClick={handleEndTurn}
          className="w-full px-4 py-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          End Turn{selected.length > 0 ? ` (${selected.length} action${selected.length > 1 ? 's' : ''})` : ''}
        </button>
      </div>

      {/* Policy detail sheet */}
      {detailPolicy && (() => {
        const isLocked = !unlockedPolicyIds.includes(detailPolicy.id);
        const isSelected = selected.some(s => s.policyId === detailPolicy.id);
        const disabledReason = isSelected ? null : (isPolicyDisabled(detailPolicy) ? getDisabledReason(detailPolicy) : null);
        const isDisabled = !isSelected && (disabledReason !== null || selected.length >= 2);
        const effectiveCost = computeEffectiveCost(
          detailPolicy, resources.polarization, rival.gridlockCountdown, blocs.syndicate.loyalty, friendlyMajority
        );
        return (
          <PolicyDetailSheet
            policy={detailPolicy}
            effectiveCost={effectiveCost}
            selected={isSelected}
            disabled={isDisabled}
            disabledReason={disabledReason}
            locked={isLocked}
            lockHint={detailPolicy.unlockCondition?.hint}
            isNew={newlyUnlockedPolicyIds.includes(detailPolicy.id)}
            onToggle={() => handleToggle(detailPolicy.id)}
            onClose={() => setDetailPolicy(null)}
          />
        );
      })()}

      {pendingBlocPolicy && (() => {
        const p = POLICIES.find(pol => pol.id === pendingBlocPolicy);
        return (
          <BlocTargetModal
            policyName={p?.name ?? ''}
            loyaltyBonus={p?.id === 'informal_channels' ? 10 : 15}
            onSelect={handleBlocSelect}
            onCancel={() => setPendingBlocPolicy(null)}
          />
        );
      })()}
    </section>
  );
}
