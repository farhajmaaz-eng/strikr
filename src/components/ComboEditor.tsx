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
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button onClick={save} disabled={steps.length < 2}>
            {initial ? 'Save changes' : 'Add to library'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div>
            <label className="meta-label mb-1.5 block">Discipline</label>
            <Segmented
              options={DISCIPLINES.map((item) => ({ value: item, label: DISCIPLINE_LABELS[item] }))}
              value={discipline}
              onChange={changeDiscipline}
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="meta-label mb-1.5 block">Level</label>
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
              <label className="meta-label mb-1.5 block">Focus</label>
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
            <label className="meta-label mb-1.5 block">
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
            <div className="mb-1.5 flex items-center justify-between border-b border-line pb-1.5">
              <label className="meta-label">Sequence</label>
              <span className="font-mono text-[9px] tabular-nums text-mist-dim">{steps.length} / 8</span>
            </div>
            {steps.length === 0 ? (
              <div className="border border-dashed border-line bg-ink-soft px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-mist-dim">
                Pick techniques to build the sequence.
              </div>
            ) : (
              <ol className="space-y-1">
                {steps.map((step, index) => {
                  const technique = available.find((item) => item.id === step);
                  return (
                    <li
                      key={`${step}-${index}`}
                      className="flex items-center gap-2 border border-line bg-ink-soft px-2 py-1.5"
                    >
                      <span className="grid size-5 shrink-0 place-items-center border border-line bg-panel font-mono text-[9px] font-bold tabular-nums text-accent">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-paper">
                        {technique ? renderTechniqueName(technique, stance) : step}
                      </span>
                      <button
                        type="button"
                        aria-label="Move up"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="grid size-6 place-items-center text-mist-dim hover:bg-panel hover:text-paper disabled:opacity-25"
                      >
                        <ArrowUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="grid size-6 place-items-center text-mist-dim hover:bg-panel hover:text-paper disabled:opacity-25"
                      >
                        <ArrowDown className="size-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove step"
                        onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
                        className="grid size-6 place-items-center text-mist-dim hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
            {error ? <div className="mt-2"><InlineError>{error}</InlineError></div> : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mist-dim" />
            <input
              className="field-input pl-9"
              value={search}
              placeholder="Search techniques"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="max-h-[46dvh] space-y-4 overflow-y-auto border border-line bg-ink-soft p-2.5 lg:max-h-[52vh]">
            {[...grouped.entries()].map(([category, techniques]) => (
              <div key={category}>
                <p className="mb-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {techniques.map((technique) => (
                    <button
                      key={technique.id}
                      type="button"
                      onClick={() => addStep(technique.id)}
                      disabled={steps.length >= 8}
                      className={cn(
                        'inline-flex min-h-7 items-center gap-1 border border-line bg-panel px-1.5 text-[10px] text-mist transition-colors',
                        'hover:border-accent hover:text-paper disabled:opacity-35',
                      )}
                    >
                      <Plus className="size-2.5 text-accent" />
                      {renderTechniqueName(technique, stance)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <p className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-mist-dim">
                No techniques match that search.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
