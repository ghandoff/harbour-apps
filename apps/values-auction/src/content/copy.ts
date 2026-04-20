export const COPY = {
  arrival: {
    heading: 'welcome. you\u2019re about to play for what matters.',
    subheading: 'enter your name to join the session.',
    nameLabel: 'your name',
    joinButton: 'join',
    waitingForFacilitator: 'we\u2019re waiting for the facilitator to start. stretch a little.',
  },
  grouping: {
    heading: 'pick the strategy archetype that feels least like you.',
    options: [
      { key: 'builder', label: 'the builder \u2014 ship, measure, ship again.' },
      { key: 'diplomat', label: 'the diplomat \u2014 align everyone before a single move.' },
      { key: 'rebel', label: 'the rebel \u2014 burn the playbook and see what catches.' },
      { key: 'steward', label: 'the steward \u2014 protect what\u2019s fragile, invest in what lasts.' },
    ],
    confirm: 'team me up',
  },
  scene: {
    ready: 'i\u2019ve read it. ready.',
  },
  strategy: {
    prompt: 'drag each value into a zone. your team must agree before the auction.',
    zones: {
      must: 'must have',
      nice: 'would be nice',
      wont: 'won\u2019t fight for',
    },
    budgetHint: 'set a soft ceiling. the auction will test it.',
    nudge30s: 'agree on your top three.',
    nudge90s: 'one minute to bidding. lock your strategy.',
  },
  auction: {
    live: 'live now.',
    bidCta: 'bid',
    bidPlaced: 'bid in.',
    won: 'locked in.',
    refundNeverHappens: 'no refunds. once spent, gone.',
    restrategise: 'two minutes. regroup. adjust.',
  },
  reflection: {
    prompts: [
      'which values did you secure that you didn\u2019t intend to?',
      'which did you miss?',
      'what did this force you to trade off?',
      'what kind of company have you just become?',
    ],
    purpose: 'in one sentence, what does your company exist to do?',
    placeholder: 'we exist to...',
  },
  regather: {
    cta: 'share your identity card.',
    qr: 'scan to keep playing \u2014 windedvertigo.com/play',
  },
} as const;
