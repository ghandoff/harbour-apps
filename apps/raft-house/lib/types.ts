// ── core types for raft.house ────────────────────────────────────

/** phases of the threshold crossing arc */
export type Phase =
  | "encounter"
  | "struggle"
  | "threshold"
  | "integration"
  | "application";

/** activity types (wave 1 = poll, prediction, reflection, open-response) */
export type ActivityType =
  | "poll"
  | "prediction"
  | "reflection"
  | "open-response"
  // wave 2
  | "puzzle"
  | "asymmetric"
  // wave 3
  | "canvas"
  | "sorting"
  | "rule-sandbox"
  // wave 4 — promoted from prototypes/card-deal
  | "card-deal"
  // wave 5 — interactive Web Audio sequencer (rhythm.lab threshold)
  | "beat-sequencer";

// ── mechanic metadata ───────────────────────────────────────────

export type InteractionModel =
  | "sandbox"
  | "construction"
  | "reveal"
  | "negotiation"
  | "performance"
  | "investigation"
  | "competition"
  | "framing";

export type SocialStructure =
  | "solo"
  | "cooperative"
  | "asymmetric"
  | "competitive"
  | "anonymous"
  | "audience";

export type Tempo =
  | "contemplative"
  | "paced"
  | "timed"
  | "rapid-fire"
  | "real-time";

export interface MechanicMetadata {
  interactionModel?: InteractionModel;
  socialStructure?: SocialStructure;
  tempo?: Tempo;
}

export const TEMPO_DEFAULT_DURATION_MS: Record<Tempo, number | null> = {
  contemplative: null,
  paced: null,
  timed: 120_000,
  "rapid-fire": 15_000,
  "real-time": null,
};

/** age-level for language adaptation */
export type AgeLevel = "kids" | "highschool" | "professional";

/** participant roles */
export type ParticipantRole = "participant" | "guide" | "observer";

/** display mode */
export type DisplayMode = "shared-screen" | "screenless";

/** session pacing mode */
export type PacingMode = "sync" | "async";

/** room lifecycle */
export type RoomStatus = "lobby" | "active" | "paused" | "completed";

// ── activity configs ─────────────────────────────────────────────

export interface PollOption {
  id: string;
  label: string;
}

export interface PollConfig {
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
}

export interface PredictionConfig {
  question: string;
  type: "number" | "text" | "choice";
  options?: PollOption[];
  answer?: string | number;
  unit?: string;
}

export interface ReflectionConfig {
  prompt: string;
  minLength?: number;
  shareWithGroup?: boolean;
}

export interface OpenResponseConfig {
  prompt: string;
  responseType: "text" | "drawing";
  anonymous?: boolean;
}

export interface PuzzleConfig {
  prompt: string;
  pieces: PuzzlePiece[];
  solution: string[];
  revealOrder?: boolean;
}

export interface PuzzlePiece {
  id: string;
  content: string;
  hint?: string;
}

export interface AsymmetricConfig {
  scenario: string;
  roles: AsymmetricRole[];
  discussionPrompt: string;
  revealPrompt?: string;
}

export interface AsymmetricRole {
  id: string;
  label: string;
  info: string;
  question: string;
}

// wave 3 configs

export interface CanvasConfig {
  prompt: string;
  width: number;
  height: number;
  /** optional axis titles centered along each edge */
  xLabel?: string;
  yLabel?: string;
  /** endpoint labels — render at the four edges of the canvas */
  xLow?: string;
  xHigh?: string;
  yLow?: string;
  yHigh?: string;
  /** optional named zones shown as overlays */
  zones?: CanvasZone[];
  allowNote?: boolean;
  /** when set, pin color is derived from its x/y position on the canvas */
  pinColor?: "hue-mapped";
  /** when true, participants place multiple pins instead of one */
  multiPin?: boolean;
  /** minimum number of pins required when multiPin is true */
  minPins?: number;
  /** categories for pin types — when set, participant picks one before placing each pin */
  pinCategories?: CanvasPinCategory[];
}

export interface CanvasPinCategory {
  id: string;
  label: string;
  color: string;
}

export interface CanvasZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SortingConfig {
  prompt: string;
  cards: SortingCard[];
  categories: SortingCategory[];
  /** correct mapping of cardId → categoryId (for scoring) */
  solution?: Record<string, string>;
}

export interface SortingCard {
  id: string;
  content: string;
  hint?: string;
}

export interface SortingCategory {
  id: string;
  label: string;
  description?: string;
}

export interface RuleSandboxConfig {
  prompt: string;
  parameters: SandboxParameter[];
  /** JS expression evaluated with parameter values as variables, e.g. "price * quantity * (1 - discount)" */
  formula: string;
  outputLabel: string;
  outputUnit?: string;
  /** question participants answer after exploring */
  reflectionPrompt: string;
  /** optional live visualization alongside sliders */
  visualizer?: "color-preview";
}

export interface SandboxParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

// ── card-deal (wave 4) ───────────────────────────────────────────
// Distinct from `puzzle` in that there is NO single correct sequence.
// Card-deal is interpretive: the participant picks N cards from a deck
// and arranges them into THEIR order. The arrangement itself IS the
// response — there's no scoring, only narrative reveal.

export interface CardDealCard {
  id: string;
  content: string;
  hint?: string;
  /** optional grouping tag for visual variety in the deck */
  suit?: string;
}

export interface CardDealConfig {
  prompt: string;
  /** the deck of cards available to draft from */
  cards: CardDealCard[];
  /**
   * How many cards the participant must arrange. Default = all cards in the
   * deck. If `selectCount < cards.length`, the participant picks a subset
   * AND orders them (drafting + arranging). If equal, it's pure ordering.
   */
  selectCount?: number;
  /** label for the arranged sequence (e.g. "your life story", "your stack") */
  sequenceLabel?: string;
  /**
   * Optional written reflection prompt shown alongside the arrangement.
   * Encourages the participant to articulate WHY their order is what it is —
   * which is what distinguishes card-deal from puzzle.
   */
  reflectionPrompt?: string;
}

// ── beat-sequencer (wave 5) ──────────────────────────────────────
// Interactive Web Audio step sequencer — the embodied heart of the
// rhythm.lab threshold experience. Unlike rule-sandbox (sliders → a
// number) this PLAYS sound: the learner toggles cells in a grid and
// hears the pattern loop. A "feel" slider applies swing to off-beats
// so syncopation is felt, not described. Each row is one drum voice.

export type BeatVoice = "kick" | "snare" | "hihat" | "clap";

export interface BeatSequencerRow {
  instrument: BeatVoice;
  /** felt label shown beside the row, e.g. "the pulse", "the surprise" */
  label: string;
}

export interface BeatSequencerPreset {
  id: string;
  /** felt label, e.g. "steady", "alive" — never music theory */
  label: string;
  /** [row][step] booleans; row order matches config.rows */
  grid: boolean[][];
}

export interface BeatSequencerConfig {
  prompt: string;
  rows: BeatSequencerRow[];
  /** number of steps (columns) in the loop — 4, 8, or 16 */
  steps: number;
  /** initial tempo in BPM */
  tempo: number;
  /** [min, max] for the tempo slider; defaults to [60, 160] */
  tempoRange?: [number, number];
  /** one-tap starting patterns the learner can load */
  presets?: BeatSequencerPreset[];
  /** optional swing/syncopation slider; absent = no feel control */
  feel?: { label: string; lowLabel: string; highLabel: string };
  /** explicit bridge to the standalone toy, e.g. "open rhythm.lab →" */
  toyLink?: { label: string; href: string };
  /** if present, a reflection textarea is shown and required to submit;
   *  if absent, a simple "i'm ready" button submits the pattern alone */
  reflectionPrompt?: string;
  /** start the loop automatically on the first user gesture */
  autoplay?: boolean;
}

export type ActivityConfig =
  | { type: "poll"; poll: PollConfig }
  | { type: "prediction"; prediction: PredictionConfig }
  | { type: "reflection"; reflection: ReflectionConfig }
  | { type: "open-response"; openResponse: OpenResponseConfig }
  | { type: "puzzle"; puzzle: PuzzleConfig }
  | { type: "asymmetric"; asymmetric: AsymmetricConfig }
  | { type: "canvas"; canvas: CanvasConfig }
  | { type: "sorting"; sorting: SortingConfig }
  | { type: "rule-sandbox"; ruleSandbox: RuleSandboxConfig }
  | { type: "card-deal"; cardDeal: CardDealConfig }
  | { type: "beat-sequencer"; beatSequencer: BeatSequencerConfig };

export interface Activity {
  id: string;
  type: ActivityType;
  config: ActivityConfig;
  phase: Phase;
  label: string;
  timeLimit?: number;
  hints?: string[];
  mechanic?: MechanicMetadata;
  /** shown to facilitator after results are revealed — guides group discussion */
  discussionPrompt?: string;
}

// ── participant ──────────────────────────────────────────────────

export interface Participant {
  id: string;
  displayName: string;
  role: ParticipantRole;
  connectionStatus: "connected" | "disconnected";
  currentActivityIndex: number;
  responses: Record<string, unknown>;
  lastSeen: number;
}

// ── timer ────────────────────────────────────────────────────────

export interface TimerState {
  type: "countdown" | "stopwatch";
  durationMs: number;
  startedAt: number;
  pausedAt?: number;
}

// ── room state ───────────────────────────────────────────────────

export interface RoomState {
  code: string;
  facilitatorId: string | null;
  mode: PacingMode;
  displayMode: DisplayMode;
  ageLevel: AgeLevel;
  status: RoomStatus;
  activities: Activity[];
  currentActivityIndex: number;
  participants: Record<string, Participant>;
  timer: TimerState | null;
  createdAt: number;
  resultsRevealed: boolean;
}

// ── messages ─────────────────────────────────────────────────────

export type FacilitatorMessage =
  | { type: "setup"; activities: Activity[]; displayMode?: DisplayMode; ageLevel?: AgeLevel }
  | { type: "set-age-level"; ageLevel: AgeLevel }
  | { type: "advance" }
  | { type: "goto"; activityIndex: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "set-mode"; mode: PacingMode }
  | { type: "set-display-mode"; displayMode: DisplayMode }
  | { type: "send-hint"; hint: string; participantId?: string }
  | { type: "lock-responses" }
  | { type: "reveal-results" }
  | { type: "timer-start"; durationMs: number }
  | { type: "timer-pause" }
  | { type: "timer-clear" }
  | { type: "kick"; participantId: string }
  | { type: "end-session" };

export type ParticipantMessage =
  | { type: "submit"; activityId: string; response: unknown }
  | { type: "request-hint" }
  | { type: "navigate"; activityIndex: number };

export type ServerBroadcast =
  | { type: "state-update"; state: RoomState; yourId?: string }
  | { type: "activity-changed"; activityIndex: number; activity: Activity }
  | { type: "timer-sync"; timer: TimerState | null }
  | { type: "results-revealed"; activityId: string; responses: Record<string, unknown> }
  | { type: "hint"; hint: string }
  | { type: "participant-joined"; participant: Participant }
  | { type: "participant-left"; participantId: string }
  | { type: "session-ended" }
  | { type: "look-up"; message: string; durationMs: number };

export type ClientMessage =
  | ({ role: "facilitator" } & FacilitatorMessage)
  | ({ role: "participant"; participantId: string } & ParticipantMessage);
