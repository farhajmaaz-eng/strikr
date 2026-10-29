import { useMemo, useState } from 'react';
import { Filter, Layers3, Plus, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import type { Combination, Discipline, Focus, SkillLevel } from '../../shared/types';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  FOCUSES,
  FOCUS_LABELS,
  LEVELS,
} from '../../shared/types';
import { renderCombinationSteps } from '../../shared/combinations';
import { CURATED_COMBINATIONS } from '../../shared/combinations';
import { useData } from '../lib/data-context';
import { useSettings } from '../lib/settings-context';
import { useToast } from '../components/Toast';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Segmented,
} from '../components/ui';
import { ComboCard } from '../components/ComboCard';
import { ComboEditor } from '../components/ComboEditor';
import { cn } from '../lib/cn';

type SourceFilter = 'all' | 'favorites' | 'custom' | 'ai';
type LevelFilter = 'all' | SkillLevel;

export function CombosPage() {
  const { customCombinations, favorites, toggleFavorite, addCombinations, updateCombination, deleteCombination } =
    useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [discipline, setDiscipline] = useState<Discipline>(settings.defaultDiscipline);
  const [level, setLevel] = useState<LevelFilter>('all');
  const [focus, setFocus] = useState<'all' | Focus>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Combination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Combination | null>(null);

  const allCombinations = useMemo(
    () => [...CURATED_COMBINATIONS, ...customCombinations],
    [customCombinations],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const favoriteSet = new Set(favorites);
    const result = allCombinations.filter((combination) => {
      if (combination.discipline !== discipline) return false;
      if (level !== 'all' && combination.level !== level) return false;
      if (focus !== 'all' && combination.focus !== focus) return false;
      if (source === 'favorites' && !favoriteSet.has(combination.id)) return false;
      if (source === 'custom' && combination.source === 'curated') return false;
      if (source === 'ai' && combination.source !== 'ai') return false;
      if (query) {
        const text = [
          combination.name,
          renderCombinationSteps(combination.steps, settings.defaultStance),
          combination.focus,
          combination.level,
        ]
          .join(' ')
          .toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      const aFav = favoriteSet.has(a.id) ? 1 : 0;
      const bFav = favoriteSet.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a.name.localeCompare(b.name);
    });
  }, [allCombinations, discipline, favorites, focus, level, search, settings.defaultStance, source]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const saveCombination = (combination: Combination) => {
    const isExisting = customCombinations.some((item) => item.id === combination.id);
    if (isExisting) {
      updateCombination(combination);
      toast('Combination updated.', 'success');
    } else {
      addCombinations([combination]);
      toast('Combination added to your library.', 'success');
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCombination(deleteTarget.id);
    setDeleteTarget(null);
    toast('Combination deleted.', 'info');
  };

  const activeFilters = (level !== 'all' ? 1 : 0) + (focus !== 'all' ? 1 : 0) + (source !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const clearFilters = () => {
    setLevel('all');
    setFocus('all');
    setSource('all');
    setSearch('');
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Combination library"
        title="The arsenal."
        description="Curated flows and your own sequences. Filter by discipline, sharpen a favorite, or build something new."
        actions={
          <Button onClick={openNew} icon={<Plus className="size-4" />} size="sm">
            New combo
          </Button>
        }
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md flex-1">
            <Segmented
              options={DISCIPLINES.map((item) => ({
                value: item,
                label: DISCIPLINE_LABELS[item],
              }))}
              value={discipline}
              onChange={setDiscipline}
              compact
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
              {filtered.length} shown
            </span>
            <span className="text-mist-dim/40">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
              <Star className="size-3 text-accent" /> {favorites.length} favorites
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist-dim" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search combinations or techniques"
              className="field-input pl-10"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-mist-dim hover:text-paper"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Filter by level"
              className="field-input w-auto min-w-[8.5rem] pr-8"
              value={level}
              onChange={(event) => setLevel(event.target.value as LevelFilter)}
            >
              <option value="all">All levels</option>
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by focus"
              className="field-input w-auto min-w-[8.5rem] pr-8"
              value={focus}
              onChange={(event) => setFocus(event.target.value as 'all' | Focus)}
            >
              <option value="all">All focuses</option>
              {FOCUSES.filter((item) => item !== 'clinch' || discipline === 'muay-thai').map((item) => (
                <option key={item} value={item}>
                  {FOCUS_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { value: 'all', label: 'Everything' },
              { value: 'favorites', label: 'Favorites' },
              { value: 'custom', label: 'My library' },
              { value: 'ai', label: 'AI generated' },
            ] as { value: SourceFilter; label: string }[]
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSource(item.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors',
                source === item.value
                  ? 'border-accent/35 bg-accent/10 text-accent-bright'
                  : 'border-line bg-transparent text-mist-dim hover:border-line-bright hover:text-mist',
              )}
            >
              {item.label}
            </button>
          ))}
          {activeFilters > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-mist-dim hover:text-paper"
            >
              <X className="size-3" /> Clear filters ({activeFilters})
            </button>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-mist-dim/60">
              <SlidersHorizontal className="size-3" /> Duplicate sequences are blocked
            </span>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((combination) => (
            <ComboCard
              key={combination.id}
              combination={combination}
              stance={settings.defaultStance}
              favorite={favorites.includes(combination.id)}
              onToggleFavorite={() => toggleFavorite(combination.id)}
              onEdit={
                combination.source !== 'curated'
                  ? () => {
                      setEditing(combination);
                      setEditorOpen(true);
                    }
                  : undefined
              }
              onDelete={
                combination.source !== 'curated' ? () => setDeleteTarget(combination) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Layers3 className="size-5" />}
          title="No combinations here"
          description="Loosen the filters, or build a fresh sequence for this discipline and level."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {activeFilters > 0 ? (
                <Button variant="secondary" size="sm" onClick={clearFilters} icon={<Filter className="size-3.5" />}>
                  Clear filters
                </Button>
              ) : null}
              <Button size="sm" onClick={openNew} icon={<Plus className="size-3.5" />}>
                Build a combination
              </Button>
            </div>
          }
        />
      )}

      {editorOpen ? (
        <ComboEditor
          key={editing?.id ?? 'new-combination'}
          open
          initial={editing}
          defaultDiscipline={discipline}
          defaultLevel={level === 'all' ? settings.defaultLevel : level}
          stance={settings.defaultStance}
          existing={allCombinations}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={saveCombination}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete combination?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed from your local library.`
            : 'This combination will be removed.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
