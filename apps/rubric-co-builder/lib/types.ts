export type RoomState =
  | "lobby"
  | "frame"
  | "propose"
  | "vote"
  | "scale"
  | "calibrate"
  | "ai_ladder"
  | "pledge"
  | "commit";

export type AiUseLevel = 0 | 1 | 2 | 3 | 4;

export type PledgeSlotIndex = 1 | 2 | 3 | 4;

export type CriterionSource = "seed" | "proposed";
export type CriterionStatus = "proposed" | "selected" | "rejected";

export type Room = {
  id: string;
  code: string;
  learning_outcome: string;
  project_description: string;
  state: RoomState;
  step_started_at: string;
  created_at: string;
};

export type Criterion = {
  id: string;
  room_id: string;
  name: string;
  good_description: string | null;
  failure_description: string | null;
  source: CriterionSource;
  required: boolean;
  status: CriterionStatus;
  position: number;
  created_at: string;
};

export type Participant = {
  id: string;
  room_id: string;
  joined_at: string;
};

export type Vote = {
  id: string;
  participant_id: string;
  criterion_id: string;
  created_at: string;
};

export type Scale = {
  id: string;
  criterion_id: string;
  level: 1 | 2 | 3 | 4;
  descriptor: string;
  updated_at: string;
};

export type CalibrationScore = {
  id: string;
  participant_id: string;
  criterion_id: string;
  level: 1 | 2 | 3 | 4;
  created_at: string;
};

export type AiUseVote = {
  id: string;
  participant_id: string;
  room_id: string;
  level: AiUseLevel;
  created_at: string;
};

export type PledgeSlot = {
  id: string;
  room_id: string;
  slot_index: PledgeSlotIndex;
  content: string;
  updated_at: string;
};

export type RoomSnapshot = {
  room: Room;
  criteria: Criterion[];
  participants_count: number;
  votes: Vote[];
  scales: Scale[];
  calibration_scores: CalibrationScore[];
  ai_use_votes: AiUseVote[];
  pledge_slots: PledgeSlot[];
};

export const SEED_CRITERIA: Array<Pick<Criterion, "name" | "good_description">> = [
  {
    name: "clarity",
    good_description: "the reader understands the point without needing to ask.",
  },
  {
    name: "collaboration",
    good_description: "every voice on the team left a fingerprint on the work.",
  },
  {
    name: "evidence",
    good_description: "claims are backed by sources the reader can check.",
  },
  {
    name: "execution",
    good_description: "the thing works, end to end, on the day it is due.",
  },
];

export const SCALE_LEVELS: Array<{ level: 1 | 2 | 3 | 4; label: string }> = [
  { level: 1, label: "novice" },
  { level: 2, label: "emerging" },
  { level: 3, label: "proficient" },
  { level: 4, label: "advanced" },
];

export const DEFAULT_DESCRIPTORS: Record<1 | 2 | 3 | 4, string> = {
  1: "the thing is missing or so thin it doesn't land. a reader couldn't tell what the team meant to do.",
  2: "it's there, but uneven. pieces are strong, pieces are thin, the overall effect wobbles.",
  3: "it does the job. a reader gets it, the team did the work, nothing major is missing.",
  4: "it does the job with craft. clear, tight, evidence-backed. a reader would share it unprompted.",
};

export const AI_USE_LEVELS: Array<{
  level: AiUseLevel;
  name: string;
  helper: string;
}> = [
  {
    level: 0,
    name: "no AI anywhere.",
    helper:
      "nothing in this project touches an AI tool. research, drafting, feedback, polishing — all human.",
  },
  {
    level: 1,
    name: "AI for brainstorming only.",
    helper:
      "we can use AI to explore ideas at the start. every word in the final artefact is ours.",
  },
  {
    level: 2,
    name: "AI for feedback on drafts.",
    helper:
      "we draft, then use AI to test for clarity or gaps. we rewrite based on what we learn. the AI doesn't hold the pen.",
  },
  {
    level: 3,
    name: "AI co-authors our work, disclosed.",
    helper:
      "AI contributes to the drafting itself. we disclose where and how in the artefact.",
  },
  {
    level: 4,
    name: "AI is the subject we're studying.",
    helper:
      "the project is about AI. using AI tools is part of the inquiry. we document what we used and what we found.",
  },
];

export const PLEDGE_SLOTS: Array<{
  index: PledgeSlotIndex;
  label: string;
  placeholder: string;
}> = [
  {
    index: 1,
    label: "we will use AI for:",
    placeholder:
      "e.g., checking our argument for gaps, testing our summary for clarity",
  },
  {
    index: 2,
    label: "we will NOT use AI for:",
    placeholder: "e.g., writing the introduction, generating citations",
  },
  {
    index: 3,
    label: "we will disclose:",
    placeholder:
      "e.g., which tools we used, which sections AI touched, which prompts we used",
  },
  {
    index: 4,
    label: "if we cross our own line, we will:",
    placeholder:
      "e.g., flag it to the facilitator, rewrite the crossed section, note it in our final submission",
  },
];
