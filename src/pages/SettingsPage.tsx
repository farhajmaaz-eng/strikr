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
  WindowFrame,
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
        code="CFG / 05"
        title="Set the room."
        description="Defaults, sound, and voice. Stored on this device and applied to the next session."
      />

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
        <WindowFrame
          title={
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontal className="size-3 text-accent" />
              01 / training defaults
            </span>
          }
          code="CFG-01"
        >
          <div className="space-y-4 p-3.5 sm:p-4">
            <SectionNote>The setup screen and quick start load these values.</SectionNote>
            <div>
              <label className="meta-label mb-1.5 block">Discipline</label>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="meta-label mb-1.5 block">Stance</label>
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
                <label className="meta-label mb-1.5 block">Level</label>
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
              <label className="meta-label mb-1.5 block">Default focus</label>
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
              <label className="meta-label mb-1.5 block">Count-in</label>
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
        </WindowFrame>

        <WindowFrame
          title={
            <span className="inline-flex items-center gap-1.5">
              <Volume2 className="size-3 text-accent" />
              02 / sound & voice
            </span>
          }
          code="CFG-02"
        >
          <div className="p-3.5 sm:p-4">
            <SectionNote>Bells and spoken callouts are synthesized on this device.</SectionNote>
            <div className="mt-2 grid sm:grid-cols-2 sm:divide-x sm:divide-line">
              <div className="divide-y divide-line sm:pr-3.5">
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
                <div className="py-3.5">
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
                <div className="py-3.5">
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
              </div>
              <div className="divide-y divide-line border-t border-line sm:border-t-0 sm:pl-3.5">
                <div className="py-3.5">
                  <label className="meta-label mb-1.5 block">Voice</label>
                  <div className="flex flex-col gap-1.5">
                    <select
                      className="field-input"
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
                    <Button variant="secondary" onClick={testVoice} icon={<Mic2 className="size-3.5" />}>
                      Test voice
                    </Button>
                  </div>
                  {voices.length === 0 ? (
                    <p className="mt-2 font-mono text-[9px] leading-relaxed text-mist-dim">
                      No English voices found yet. The browser may load them after the first click.
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                      Callout interval
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-dim">
                      How often a new combination is called during a round.
                    </p>
                  </div>
                  <select
                    className="field-input w-24 shrink-0"
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
                <div className="flex items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                      Test bell
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-dim">Preview the current volume.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={testBell} icon={<Bell className="size-3" />}>
                    Ring
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </WindowFrame>

        <WindowFrame
          title={
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="size-3 text-accent" />
              03 / device
            </span>
          }
          code="CFG-03"
        >
          <div className="p-3.5 sm:p-4">
            <SectionNote>Keep the screen awake and install STRIKR for a full-screen gym feel.</SectionNote>
            <div className="mt-2 divide-y divide-line">
              <Toggle
                label="Keep screen awake"
                description="Uses the Screen Wake Lock API during live rounds where supported."
                checked={settings.wakeLockEnabled}
                onChange={(checked) => updateSettings({ wakeLockEnabled: checked })}
              />
              <div className="py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                      Install app
                    </p>
                    <p className="mt-1 max-w-md text-[10px] leading-relaxed text-mist-dim">
                      {standalone
                        ? 'Running as an installed app.'
                        : installPrompt
                          ? 'Add STRIKR to your home screen for offline training.'
                          : 'Use your browser menu → Add to Home screen. The app shell is cached offline.'}
                    </p>
                  </div>
                  {standalone ? (
                    <span className="border border-success/35 bg-success/10 px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-success">
                      Installed
                    </span>
                  ) : installPrompt ? (
                    <Button size="sm" onClick={install} icon={<Download className="size-3" />}>
                      Install
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                    Offline engine
                  </p>
                  <p className="mt-0.5 text-[10px] text-mist-dim">
                    Curated combinations and the timer ship with the app.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-success/35 bg-success/10 px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-success">
                  <span className="size-1.5 bg-success" /> Ready
                </span>
              </div>
            </div>
          </div>
        </WindowFrame>

        <WindowFrame
          title={
            <span className="inline-flex items-center gap-1.5">
              <Database className="size-3 text-accent" />
              04 / local data
            </span>
          }
          code="CFG-04"
        >
          <div className="p-3.5 sm:p-4">
            <SectionNote>No account. No server history. This device is the source of truth.</SectionNote>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <DataStat value={String(sessions.length)} label="Sessions" />
              <DataStat value={String(customCombinations.length)} label="Custom combos" />
              <DataStat value={String(favorites.length)} label="Favorites" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setClearOpen(true)}
                icon={<Trash2 className="size-3" />}
              >
                Clear training history
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResetOpen(true)}
                icon={<RotateCcw className="size-3" />}
              >
                Reset all settings
              </Button>
            </div>
            <p className="mt-3 font-mono text-[9px] leading-relaxed text-mist-dim">
              Data lives in local storage on this browser. Clearing browser data removes it.
            </p>
          </div>
        </WindowFrame>

        <WindowFrame
          title={
            <span className="inline-flex items-center gap-1.5">
              <Info className="size-3 text-accent" />
              05 / about STRIKR
            </span>
          }
          code="SYS"
          className="lg:col-span-2"
        >
          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <AboutBlock
              title="Training engine"
              copy="Timestamp-based timer, locally synthesized bells, browser speech, and curated combinations. No network needed once the app is loaded."
            />
            <AboutBlock
              title="AI coach"
              copy="Nemotron 3.5 Lightning 30B A3B via Requesty, proxied through a Vercel function. The model and key stay server-side."
            />
            <AboutBlock
              title="Built local-first"
              copy="Settings, custom combinations, favorites, and history stay in this browser. Nothing is uploaded except the AI request you choose to make."
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3.5 py-2.5 font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
            <span>STRIKR v1.0 / local build</span>
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="size-3" /> Made for rounds, not dashboards
            </span>
          </div>
        </WindowFrame>
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

function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-accent bg-ink-soft px-3 py-2 font-mono text-[9px] leading-relaxed tracking-[0.02em] text-mist-dim">
      {children}
    </p>
  );
}

function DataStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-line bg-ink-soft px-2 py-2.5 text-center">
      <p className="font-display text-xl font-semibold leading-none tabular-nums text-paper">{value}</p>
      <p className="mt-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-mist-dim">{label}</p>
    </div>
  );
}

function AboutBlock({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="p-3.5">
      <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-accent">{title}</p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-mist-dim">{copy}</p>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
