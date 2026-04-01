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
  | "rule-sandbox";

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

export type ActivityConfig =
  | { type: "poll"; poll: PollConfig }
  | { type: "prediction"; prediction: PredictionConfig }
  | { type: "reflection"; reflection: ReflectionConfig }
  | { type: "open-response"; openResponse: OpenResponseConfig }
  | { type: "puzzle"; puzzle: PuzzleConfig }
  | { type: "asymmetric"; asymmetric: AsymmetricConfig };

export interface Activity {
  id: string;
  type: ActivityType;
  config: ActivityConfig;
  phase: Phase;
  label: string;
  timeLimit?: number;
  hints?: string[];
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
  | { type: "setup"; activities: Activity[]; displayMode?: DisplayMode }
  | { type: "advance" }
  | { type: "goto"; activityIndex: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "set-mode"; mode: PacingMode }
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
  | { type: "state-update"; state: RoomState }
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
