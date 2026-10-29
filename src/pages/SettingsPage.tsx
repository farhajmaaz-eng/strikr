import { useEffect, useState } from 'react';
import {
  Bell,
  Database,
  Download,
  Info,
  Mic2,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Volume2,
} from 'lucide-react';
import type { Discipline, Focus, SkillLevel, Stance } from '../../shared/types';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  FOCUSES,
  FOCUS_LABELS,
  LEVELS,
  STANCES,
} from '../../shared/types';
import { useData } from '../lib/data-context';
import { useSettings } from '../lib/settings-context';
import { useToast } from '../components/Toast';
import { availableVoices, primeSpeech, speak, subscribeToVoices } from '../lib/speech';
import { bellAudio } from '../lib/audio';
import { formatRoundLength } from '../lib/format';
import {
  Button,
  ConfirmDialog,
  NumberStepper,
  PageHeader,
  RangeInput,
  Segmented,
  Toggle,
} from '../components/ui';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { sessions, customCombinations, favorites, clearHistory } = useData();
  const { toast } = useToast();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => availableVoices());
  const [clearOpen, setClearOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches,
  );

  useEffect(() => {
    const update = () => setVoices(availableVoices());
    update();
    return subscribeToVoices(update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const changeDiscipline = (discipline: Discipline) => {
    updateSettings({
      defaultDiscipline: discipline,
      defaultFocus:
        settings.defaultFocus === 'clinch' && discipline !== 'muay-thai'
          ? 'fundamentals'
          : settings.defaultFocus,
    });
  };

  const testVoice = () => {
    primeSpeech();
    const ok = speak('Jab, cross, lead hook, rear round kick.', {
      rate: settings.speechRate,
      voiceURI: settings.voiceURI,
    });
    if (!ok) toast('Speech synthesis is not available in this browser.', 'error');
  };

  const testBell = () => {
    void bellAudio.unlock();
    bellAudio.playBell(settings.bellVolume, 1);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      toast('STRIKR installed.', 'success');
      setInstallPrompt(null);
    }
  };

  const focusOptions = FOCUSES.filter(
    (focus) => focus !== 'clinch' || settings.defaultDiscipline === 'muay-thai',
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Preferences"
        title="Set the room."
        description="Defaults, sound, and voice. Everything is stored on this device and applied to the next session."
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
          <SectionHead
            icon={<SlidersHorizontal className="size-4" />}
            title="Training defaults"
            description="The setup screen and quick start load these values."
          />
          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Discipline
              </label>
              <Segmented
                options={DISCIPLINES.map((item) => ({
                  value: item,
                  label: DISCIPLINE_LABELS[item],
                }))}
                value={settings.defaultDiscipline}
                onChange={changeDiscipline}
                compact
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Stance
                </label>
                <select
                  className="field-input"
                  value={settings.defaultStance}
                  onChange={(event) =>
                    updateSettings({ defaultStance: event.target.value as Stance })
                  }
                >
                  {STANCES.map((stance) => (
                    <option key={stance} value={stance}>
                      {stance === 'orthodox' ? 'Orthodox' : 'Southpaw'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Level
                </label>
                <select
                  className="field-input"
                  value={settings.defaultLevel}
                  onChange={(event) =>
                    updateSettings({ defaultLevel: event.target.value as SkillLevel })
                  }
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Default focus
              </label>
              <select
                className="field-input"
                value={settings.defaultFocus}
                onChange={(event) =>
                  updateSettings({ defaultFocus: event.target.value as Focus })
                }
              >
                {focusOptions.map((focus) => (
                  <option key={focus} value={focus}>
                    {FOCUS_LABELS[focus]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberStepper
                label="Rounds"
                value={settings.defaultRounds}
                onChange={(value) => updateSettings({ defaultRounds: value })}
                min={1}
                max={20}
              />
              <NumberStepper
                label="Round"
                value={settings.defaultRoundSeconds}
                onChange={(value) => updateSettings({ defaultRoundSeconds: value })}
                min={30}
                max={600}
                step={30}
                format={formatRoundLength}
              />
              <NumberStepper
                label="Rest"
                value={settings.defaultRestSeconds}
                onChange={(value) => updateSettings({ defaultRestSeconds: value })}
                min={0}
                max={180}
                step={15}
                format={formatRoundLength}
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Count-in
              </label>
              <Segmented
                options={[
                  { value: '0', label: 'Off' },
                  { value: '5', label: '5 seconds' },
                  { value: '10', label: '10 seconds' },
                ]}
                value={String(settings.defaultCountInSeconds)}
                onChange={(value) =>
                  updateSettings({ defaultCountInSeconds: Number(value) })
                }
                compact
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
          <SectionHead
            icon={<Volume2 className="size-4" />}
            title="Sound & voice"
            description="Bells and spoken callouts are synthesized on this device."
          />
          <div className="mt-3 divide-y divide-line/70">
            <Toggle
              label="Spoken callouts"
              description="Read each combination aloud during rounds."
              checked={settings.speechEnabled}
              onChange={(checked) => {
                if (!checked) window.speechSynthesis?.cancel();
                else primeSpeech();
                updateSettings({ speechEnabled: checked });
              }}
            />
            <Toggle
              label="Bells & cues"
              description="Round bells, count-in ticks, and completion bells."
              checked={settings.soundEnabled}
              onChange={(checked) => {
                if (checked) void bellAudio.unlock();
                updateSettings({ soundEnabled: checked });
              }}
            />
            <div className="py-4">
              <RangeInput
                label="Speech rate"
                value={settings.speechRate}
                min={0.6}
                max={1.4}
                step={0.05}
                onChange={(value) => updateSettings({ speechRate: value })}
                display={`${settings.speechRate.toFixed(2)}×`}
              />
            </div>
            <div className="py-4">
              <RangeInput
                label="Bell volume"
                value={settings.bellVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => updateSettings({ bellVolume: value })}
                display={`${Math.round(settings.bellVolume * 100)}%`}
              />
            </div>
            <div className="py-4">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Voice
              </label>
              <div className="flex gap-2">
                <select
                  className="field-input flex-1"
                  value={settings.voiceURI ?? ''}
                  onChange={(event) =>
                    updateSettings({ voiceURI: event.target.value || null })
                  }
                >
                  <option value="">System default</option>
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
                <Button variant="secondary" onClick={testVoice} icon={<Mic2 className="size-4" />}>
                  Test
                </Button>
              </div>
              {voices.length === 0 ? (
                <p className="mt-2 text-[10px] text-mist-dim">
                  No English voices found yet. Your browser may load them after the first click.
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-xs font-semibold text-paper">Callout interval</p>
                <p className="mt-0.5 text-[10px] text-mist-dim">
                  How often a new combination is called during a round.
                </p>
              </div>
              <select
                className="field-input w-28"
                value={settings.calloutIntervalSeconds}
                onChange={(event) =>
                  updateSettings({ calloutIntervalSeconds: Number(event.target.value) })
                }
              >
                {[5, 8, 10, 12, 15, 20].map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds}s
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-xs font-semibold text-paper">Test bell</p>
                <p className="mt-0.5 text-[10px] text-mist-dim">Preview the current volume.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={testBell} icon={<Bell className="size-3.5" />}>
                Ring
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
          <SectionHead
            icon={<Smartphone className="size-4" />}
            title="Device"
            description="Keep the screen awake and install STRIKR for a full-screen gym feel."
          />
          <div className="mt-3 divide-y divide-line/70">
            <Toggle
              label="Keep screen awake"
              description="Uses the Screen Wake Lock API during live rounds where supported."
              checked={settings.wakeLockEnabled}
              onChange={(checked) => updateSettings({ wakeLockEnabled: checked })}
            />
            <div className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-paper">Install app</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-mist-dim">
                    {standalone
                      ? 'Running as an installed app.'
                      : installPrompt
                        ? 'Add STRIKR to your home screen for offline training.'
                        : 'Use your browser menu → Add to Home screen. The app shell is cached offline.'}
                  </p>
                </div>
                {standalone ? (
                  <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-success">
                    Installed
                  </span>
                ) : installPrompt ? (
                  <Button size="sm" onClick={install} icon={<Download className="size-3.5" />}>
                    Install
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-xs font-semibold text-paper">Offline engine</p>
                <p className="mt-0.5 text-[10px] text-mist-dim">
                  Curated combinations and the timer ship with the app.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-success">
                <span className="size-1.5 rounded-full bg-success" /> Ready
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
          <SectionHead
            icon={<Database className="size-4" />}
            title="Local data"
            description="No account. No server history. Export is not needed because this device is the source."
          />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <DataStat value={String(sessions.length)} label="Sessions" />
            <DataStat value={String(customCombinations.length)} label="Custom combos" />
            <DataStat value={String(favorites.length)} label="Favorites" />
          </div>
          <div className="mt-4 space-y-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setClearOpen(true)}
              icon={<Trash2 className="size-3.5" />}
            >
              Clear training history
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResetOpen(true)}
              icon={<RotateCcw className="size-3.5" />}
            >
              Reset all settings
            </Button>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-mist-dim">
            Data lives in local storage on this browser. Clearing browser data removes it.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6 lg:col-span-2">
          <SectionHead
            icon={<Info className="size-4" />}
            title="About STRIKR"
            description="A striking studio built for the phone in your hand."
          />
          <div className="mt-4 grid gap-4 text-[11px] leading-relaxed text-mist-dim sm:grid-cols-3">
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-paper">
                Training engine
              </p>
              <p>
                Timestamp-based timer, locally synthesized bells, browser speech, and curated
                combinations. No network needed once the app is loaded.
              </p>
            </div>
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-paper">
                AI coach
              </p>
              <p>
                Nemotron 3.5 Lightning 30B A3B via Requesty, proxied through a Vercel function.
                The model and key stay in server-side environment variables.
              </p>
            </div>
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-paper">
                Built local-first
              </p>
              <p>
                Settings, custom combinations, favorites, and history are stored in your browser.
                Nothing is uploaded except the AI request you choose to make.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4 text-[10px] text-mist-dim">
            <span>STRIKR v1.0</span>
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="size-3" /> Made for rounds, not dashboards
            </span>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearHistory();
          setClearOpen(false);
          toast('Training history cleared.', 'info');
        }}
        title="Clear training history?"
        description="All sessions on this device will be deleted. Settings and custom combinations stay."
        confirmLabel="Clear history"
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetSettings();
          setResetOpen(false);
          toast('Settings reset to defaults.', 'info');
        }}
        title="Reset all settings?"
        description="Training defaults, voice, audio, and callout preferences return to the original values."
        confirmLabel="Reset settings"
      />
    </div>
  );
}

function SectionHead({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-ink-soft text-accent">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.03em] text-paper">
          {title}
        </h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-mist-dim">{description}</p>
      </div>
    </div>
  );
}

function DataStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft px-3 py-3 text-center">
      <p className="font-display text-2xl font-semibold leading-none tabular-nums text-paper">{value}</p>
      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-dim">{label}</p>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
