import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';
import type {
  Combination,
  Discipline,
  Focus,
  SkillLevel,
  Stance,
  Technique,
} from '../../shared/types';
import {
  CATEGORY_LABELS,
  DISCIPLINES,
  DISCIPLINE_LABELS,
  FOCUSES,
  FOCUS_LABELS,
  LEVELS,
} from '../../shared/types';
import { availableTechniques, renderTechniqueName } from '../../shared/techniques';
import { combinationSignature } from '../../shared/combinations';
import { createId } from '../lib/id';
import { cn } from '../lib/cn';
import { Button, InlineError, Modal, Segmented } from './ui';

const focusOptions = (discipline: Discipline) =>
  FOCUSES.filter((focus) => focus !== 'clinch' || discipline === 'muay-thai');

export function ComboEditor({
  open,
  initial,
  defaultDiscipline = 'boxing',
  defaultLevel = 'beginner',
  stance,
  existing,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Combination | null;
  defaultDiscipline?: Discipline;
  defaultLevel?: SkillLevel;
  stance: Stance;
  existing: Combination[];
  onClose: () => void;
  onSave: (combination: Combination) => void;
}) {
  const [discipline, setDiscipline] = useState<Discipline>(
    initial?.discipline ?? defaultDiscipline,
  );
  const [level, setLevel] = useState<SkillLevel>(initial?.level ?? defaultLevel);
  const [focus, setFocus] = useState<Focus>(initial?.focus ?? 'fundamentals');
  const [name, setName] = useState(initial?.name ?? '');
  const [steps, setSteps] = useState<string[]>(initial?.steps ?? []);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(() => availableTechniques(discipline, level), [discipline, level]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return available;
    return available.filter((technique) =>
      renderTechniqueName(technique, stance).toLowerCase().includes(query),
    );
  }, [available, search, stance]);

  const grouped = useMemo(() => {
    const map = new Map<string, Technique[]>();
    for (const technique of filtered) {
      const list = map.get(technique.category) ?? [];
      list.push(technique);
      map.set(technique.category, list);
    }
    return map;
  }, [filtered]);

  const changeDiscipline = (next: Discipline) => {
    setDiscipline(next);
    const allowed = new Set(availableTechniques(next, level).map((technique) => technique.id));
    setSteps((current) => current.filter((step) => allowed.has(step)));
    if (next !== 'muay-thai' && focus === 'clinch') setFocus('fundamentals');
  };

  const changeLevel = (next: SkillLevel) => {
    setLevel(next);
    const allowed = new Set(availableTechniques(discipline, next).map((technique) => technique.id));
    setSteps((current) => current.filter((step) => allowed.has(step)));
  };

  const addStep = (id: string) => {
    if (steps.length >= 8) return;
    setSteps((current) => [...current, id]);
    setError(null);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const value = next[index];
      const swap = next[target];
      if (!value || !swap) return current;
      next[index] = swap;
      next[target] = value;
      return next;
    });
  };

  const save = () => {
    if (steps.length < 2) {
      setError('Add at least two techniques to build a combination.');
      return;
    }
    const signature = combinationSignature(steps);
    const duplicate = existing.some(
      (combination) =>
        combination.id !== initial?.id && combinationSignature(combination.steps) === signature,
    );
    if (duplicate) {
      setError('That exact sequence already exists. Adjust it to keep the library sharp.');
      return;
    }

    const fallbackName =
      steps
        .slice(0, 2)
        .map((step) => {
          const technique = available.find((item) => item.id === step);
          return technique ? renderTechniqueName(technique, stance) : step;
        })
        .join(' · ') + ' Flow';

    onSave({
      id: initial?.id ?? createId('custom'),
      name: name.trim() || fallbackName,
      steps,
      discipline,
      level,
      focus,
      source: initial?.source ?? 'custom',
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit combination' : 'New combination'}
      description="Build a sequence from the techniques available at this level. Exact duplicates are blocked."
      size="lg"
      footer={
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Button onClick={save} disabled={steps.length < 2}>
            {initial ? 'Save changes' : 'Add to library'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
              Discipline
            </label>
            <Segmented
              options={DISCIPLINES.map((item) => ({ value: item, label: DISCIPLINE_LABELS[item] }))}
              value={discipline}
              onChange={changeDiscipline}
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Level
              </label>
              <select
                className="field-input"
                value={level}
                onChange={(event) => changeLevel(event.target.value as SkillLevel)}
              >
                {LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Focus
              </label>
              <select
                className="field-input"
                value={focus}
                onChange={(event) => setFocus(event.target.value as Focus)}
              >
                {focusOptions(discipline).map((item) => (
                  <option key={item} value={item}>
                    {FOCUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
              Name <span className="normal-case tracking-normal text-mist-dim/60">(optional)</span>
            </label>
            <input
              className="field-input"
              value={name}
              maxLength={70}
              placeholder="e.g. Pressure finish"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Sequence
              </label>
              <span className="text-[10px] text-mist-dim">{steps.length} / 8 moves</span>
            </div>
            {steps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-ink-soft px-4 py-6 text-center text-xs text-mist-dim">
                Pick techniques from the right to build your combination.
              </div>
            ) : (
              <ol className="space-y-2">
                {steps.map((step, index) => {
                  const technique = available.find((item) => item.id === step);
                  return (
                    <li
                      key={`${step}-${index}`}
                      className="flex items-center gap-2 rounded-xl border border-line bg-ink-soft px-2.5 py-2"
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-panel text-[10px] font-bold tabular-nums text-accent">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-paper">
                        {technique ? renderTechniqueName(technique, stance) : step}
                      </span>
                      <button
                        type="button"
                        aria-label="Move up"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="grid size-7 place-items-center rounded-md text-mist-dim hover:bg-panel hover:text-paper disabled:opacity-25"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="grid size-7 place-items-center rounded-md text-mist-dim hover:bg-panel hover:text-paper disabled:opacity-25"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove step"
                        onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
                        className="grid size-7 place-items-center rounded-md text-mist-dim hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {error ? <div className="mt-3"><InlineError>{error}</InlineError></div> : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-dim" />
            <input
              className="field-input pl-9"
              value={search}
              placeholder="Search techniques"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="max-h-[46dvh] space-y-4 overflow-y-auto rounded-2xl border border-line bg-ink-soft p-3 lg:max-h-[52vh]">
            {[...grouped.entries()].map(([category, techniques]) => (
              <div key={category}>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {techniques.map((technique) => (
                    <button
                      key={technique.id}
                      type="button"
                      onClick={() => addStep(technique.id)}
                      disabled={steps.length >= 8}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1 rounded-lg border border-line bg-panel/60 px-2 text-[11px] text-mist transition-colors',
                        'hover:border-accent/40 hover:text-paper disabled:opacity-40',
                      )}
                    >
                      <Plus className="size-3 text-accent" />
                      {renderTechniqueName(technique, stance)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-mist-dim">No techniques match that search.</p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
