/**
 * creaseworks mini — static data snapshot.
 *
 * GENERATED from materials_cache + playdates_cache on 2026-06-11 — the mini
 * canary carries no database credential, so the picker, matcher, and
 * read-aloud instructions all run on this committed snapshot.
 * Regenerate with the script in the slice-4 / design-round commits.
 */

export interface MiniMaterial {
  id: string;
  title: string;
  emoji: string | null;
  icon: string | null;
  formPrimary: string | null;
  /**
   * When true, the look-page tiles show the literal material icon
   * (icons/materials/<icon>.png) instead of the resolved character — for
   * materials where the cast mapping reads as confusing (e.g. a shoebox).
   */
  preferIcon?: boolean;
  /**
   * Promoted open-ended materials (B5): a bespoke-icon URL (served by the
   * eval worker) instead of the bundled icons/materials/<icon>.png, plus the
   * family/class code that discovered it (recognition — surfaced in the
   * grown-up corner, not the kid grid).
   */
  iconUrl?: string;
  discoveredBy?: string;
}

export const MINI_MATERIALS: MiniMaterial[] = [
  { id: "6626ee5c-2940-4456-bfa9-f9c40292d9ce", title: "letter tiles", emoji: "🔤", icon: "blocks", formPrimary: "discrete small parts" },
  { id: "901cf679-6f54-4d69-9270-27e649d655b0", title: "aluminum foil", emoji: "✨", icon: "aluminum-foil", formPrimary: "sheet goods / surfaces", preferIcon: true },
  { id: "286b196d-47af-418a-b38e-8e5c98161964", title: "big paper", emoji: "📄", icon: null, formPrimary: "sheet goods / surfaces" },
  { id: "32d7affb-0bf2-498f-8c50-fe18c014462b", title: "binder clips", emoji: "📎", icon: "binder-clips", formPrimary: "discrete small parts" },
  { id: "0ee41324-7185-4acd-a19f-178fbc1a3643", title: "bottle caps", emoji: "⭕", icon: "bottle-cap", formPrimary: "discrete small parts" },
  { id: "fd14731e-7e63-4bf2-bb77-1c2e1985a8bf", title: "buttons", emoji: "🔘", icon: "buttons", formPrimary: "discrete small parts" },
  { id: "2af60a51-70ed-4df5-86fc-7a31bb0d38b0", title: "cardboard tubes", emoji: "🌀", icon: "cardboard-tube", formPrimary: "volumes / substrates", preferIcon: true },
  { id: "55f0bf70-da2e-4824-8972-082ddac74453", title: "cardstock", emoji: "📋", icon: null, formPrimary: "sheet goods / surfaces" },
  { id: "48edb12c-b71a-44a4-9d7f-2ad198c92072", title: "cloth scraps", emoji: "🧵", icon: null, formPrimary: "sheet goods / surfaces" },
  { id: "213e9e42-5c3d-4518-a4d0-4bd7e8f4ae88", title: "clothespins", emoji: "🪹", icon: "clothespins", formPrimary: "discrete small parts" },
  { id: "8e118c15-fefa-4dc6-9be9-73d8a7430c5e", title: "colored pencils", emoji: "🖍️", icon: "crayons", formPrimary: "mark-making media" },
  { id: "7cae5ffa-1fd5-4ef1-9ac3-3018caf03e68", title: "craft paper", emoji: "🟧", icon: null, formPrimary: "sheet goods / surfaces" },
  { id: "72881eae-4246-4c77-8a01-001c77a764ae", title: "cotton balls", emoji: "☁️", icon: "cotton-balls", formPrimary: "discrete small parts" },
  { id: "1efd83e1-c3f4-4d5b-b8a8-89ebd6885e62", title: "dice", emoji: "🎲", icon: null, formPrimary: "discrete small parts" },
  { id: "f274b4b1-9833-4ee5-8813-9b8470b75eb4", title: "egg cartons", emoji: "🥚", icon: "egg-cartons", formPrimary: "containers / vessels" },
  { id: "4dfbdb56-3a7b-43a4-a62d-fea6eff12f4d", title: "felt sheets", emoji: "🧶", icon: "felt", formPrimary: "sheet goods / surfaces", preferIcon: true },
  { id: "7ec3988e-7ea8-4dc7-a169-efbde23ab193", title: "googly eyes", emoji: "👀", icon: "googly-eyes", formPrimary: "discrete small parts" },
  { id: "10fb1bed-2028-41d0-af48-2d6297b6ccf0", title: "muffin tin", emoji: "🍱", icon: "muffin-tin", formPrimary: "containers / vessels" },
  { id: "dcb1ada7-d02d-4f8d-b8b3-07520cda0cc8", title: "old gadgets", emoji: null, icon: null, formPrimary: "found objects / evocative artifacts" },
  { id: "2216d5dc-3fba-4e9f-b42f-2a3171c78997", title: "paper cups", emoji: "🥤", icon: "paper-cups", formPrimary: "containers / vessels", preferIcon: true },
  { id: "7498e5a3-6df0-4b4e-b30f-425c10b5683f", title: "paper plates", emoji: "🍽️", icon: "paper-plates", formPrimary: "sheet goods / surfaces", preferIcon: true },
  { id: "f53b82a2-274a-443d-8c7d-83e0593c7a43", title: "plastic beads", emoji: "🔮", icon: "beads", formPrimary: "discrete small parts" },
  { id: "2205f322-dbda-47ef-8a5e-ea461e409a7d", title: "plastic bottles", emoji: "🍶", icon: "plastic-bottle", formPrimary: "containers / vessels" },
  { id: "a59aab52-b94f-4c4f-b247-c5a0e250809b", title: "playing cards", emoji: "🃏", icon: "playing-cards", formPrimary: "discrete small parts" },
  { id: "4e661049-a4ef-420e-9c2e-b4ed8c78efa4", title: "popsicle sticks", emoji: "🍦", icon: "popsicle-sticks", formPrimary: "discrete small parts" },
  { id: "31d462e2-160e-4f19-9b81-49fa43c956cb", title: "ribbon", emoji: "🎀", icon: null, formPrimary: "linear / filament" },
  { id: "10733729-9e9a-4581-90b8-dba499749b3c", title: "rubber bands", emoji: "➰", icon: "rubber-bands", formPrimary: "linear / filament", preferIcon: true },
  { id: "54430205-7db7-4f89-9784-dc2a8db82685", title: "shoebox", emoji: "📦", icon: "shoebox", formPrimary: "containers / vessels", preferIcon: true },
  { id: "ddb69f2a-6171-44f9-874c-9f2291d57934", title: "stickers", emoji: "⭐", icon: "stickers", formPrimary: "discrete small parts" },
  { id: "0cec69db-efb1-4ace-a82b-cea4aaeac234", title: "string / yarn", emoji: "🧶", icon: null, formPrimary: "linear / filament" },
  { id: "42618139-245d-43d3-84f6-0b47ffe977a0", title: "tape", emoji: "🩹", icon: "tape-roll", formPrimary: "joining / fastening" },
  { id: "8162b467-9b2d-4ad3-b4fa-5760b6b4466e", title: "toy parts", emoji: "🧩", icon: "blocks", formPrimary: "found objects / evocative artifacts" },
  { id: "1fe78962-fb1b-49ae-88b0-b0573e3ef85f", title: "washable markers", emoji: "🖍️", icon: "crayons", formPrimary: "mark-making media" },
  { id: "9fc3cdad-5220-4a5d-b255-1942c6110ae3", title: "washi tape", emoji: "🎏", icon: "washi-tape", formPrimary: "joining / fastening" },
  { id: "5b07a6bb-e1ce-4cec-be4b-94ef5affff55", title: "white sock", emoji: "🧦", icon: "socks", formPrimary: "wearables / embodied props" },
  { id: "f7cefdb2-373a-400e-9412-ca1e02c3e9d5", title: "wine corks", emoji: "🍾", icon: "wine-corks", formPrimary: "discrete small parts" },
];

/** Read-aloud phase content per pilot activity (kid-toned, from notion). */
export interface MiniActivityContent {
  find: string | null;
  fold: string | null;
  unfold: string | null;
  findAgainPrompt: string | null;
}

export const MINI_ACTIVITY_CONTENT: Record<string, MiniActivityContent> = {
  "mend-a-stuffed-friend": {
    find: "find a stuffed animal or fabric toy that needs some love — maybe it has a torn seam, a missing eye, stuffing coming out, or it's just looking a little sad and flat. if nothing's broken, you can practice on an old sock or a scrap of fabric. gather your repair kit: needle and thread (with grown-up help!), fabric scraps, buttons, stuffing material (cotton balls, old fabric scraps, or even clean plastic bags work), scissors.",
    fold: "with a grown-up helping you with the needle, start your repair. if there's a rip, pinch the edges together and sew small stitches to close it up — it doesn't have to be perfect! in fact, the stitches can be part of the character. use colorful thread so the repair shows like a cool scar. if your friend needs new stuffing, gently push filling in through the opening before sewing it shut. missing an eye? sew on a button — maybe a DIFFERENT one that gives your friend a whole new personality!",
    unfold: "look at your mended friend. it looks different now — but different isn't worse, it's just... more interesting! every repair tells a story. in Japan there's an art called kintsugi where people fix broken pottery with gold — the cracks become the most beautiful part. your stitches are like that. here's the bigger idea: when something breaks, your first thought doesn't have to be \"throw it away.\" it can be \"how do I fix this?\" that's a superpower.",
    findAgainPrompt: "learn to sew a button onto a shirt (your own clothes need repairs too!). or try mending something that ISN'T fabric — can you tape a broken book? glue a cracked cup (not for drinking, just for holding pencils)? the mending mindset works on everything.",
  },
  "character-from-a-crease": {
    find: "take a piece of paper — any size, any color. fold it. not a specific origami fold, just... fold it however you want. fold it again. and maybe once more. now open it up and really LOOK at all the creases and lines. squint your eyes. turn the paper around. do you see a face hiding in the folds? a body? wings? a hat? the creases are like a secret map of a character waiting to be found.",
    fold: "once you see something — even just a tiny hint of a shape — grab a marker and start drawing on top of the creases. turn fold-lines into arms, legs, eyes, tails. add details: is your character happy? scared? sleepy? what are they wearing? give them a name. now refold the paper — does your character hide when it's folded? can you make a fold that shows just their face peeking out?",
    unfold: "you just did something amazing: you found a character that didn't exist until you LOOKED for it. that's what artists do — they find shapes in things and bring them to life. try it again with a different fold. try crumpling the paper instead of folding it — do crumple-lines make different characters than fold-lines? what about tearing the paper? every kind of mark tells a different story.",
    findAgainPrompt: "try finding characters in other things: cracks in the sidewalk, patterns in wood grain, shapes in clouds. bring a marker outside and draw faces on leaves! or fold fabric instead of paper — do cloth folds make different characters?",
  },
  "design-a-rule-not-an-object": {
    find: "gather a handful of small things — blocks, buttons, toys, whatever — and put them on a table or flat surface. also grab something to write with and write on (paper and marker, or a sticky note).",
    fold: "here's your challenge: DON'T build anything! instead, write ONE rule that changes how people can play with the things on the table. examples: \"you can only move things by blowing on them.\" or \"everything must be touching at least one other thing.\" or \"you have to close your eyes before you pick something up.\" write your rule down, then TRY playing with it! see what happens.",
    unfold: "did your rule make things easier or harder? more fun or more frustrating? show your rule to someone else and let THEM try. where did the rule work perfectly? where did it break or get confusing? the amazing thing about rules is: you didn't change the objects at all, but the rule made them feel like COMPLETELY different materials! game designers do this all the time — the rules ARE the game.",
    findAgainPrompt: "rewrite your rule to make it SIMPLER — can someone start playing in less than 30 seconds? the best rules are easy to learn but hard to master.",
  },
  "function-swap-same-form": {
    find: "grab a pile of small things that all look kind of the same — a bunch of buttons, a stack of coins, some LEGO bricks, a handful of pebbles, some bottle caps. you want about 10-15 pieces that are all similar. spread them out in front of you.",
    fold: "you're going to play three rounds with the SAME pieces, but each round has a different mission. round 1: make your pieces TELL A STORY — arrange them into a picture or a scene. round 2: scramble them up, then ORGANIZE them — sort them into groups by size, color, or some rule you invent. round 3: scramble again, then make them EXPLAIN something — like how to get from the kitchen to your bedroom, or what you ate today.",
    unfold: "you used the exact same pieces all three times, but they DID three completely different things! which round was easiest? which was hardest? did you have to invent new rules for each round? the secret is: ANY material can do almost anything — it depends on the RULES you give it, not what the material actually is.",
    findAgainPrompt: "play one more round but with a new challenge: this time you can't touch the pieces with your hands! use a spoon, chopsticks, or blow on them to move them. how does THAT change what you can make?",
  },
  "take-apart-archaeology": {
    find: "find something broken or old that nobody needs anymore — a dead remote control, a broken clock, an old keyboard, a busted toy, a used-up flashlight. ask a grown-up: \"can I take this apart?\" once you get the okay, gather your tools: a screwdriver (the little kind), pliers if you have them, and a tray or plate to put the pieces on. safety first: no batteries in your mouth, and grown-ups should handle anything sharp!",
    fold: "start unscrewing and opening things up. go slowly — you're like an archaeologist digging up a buried city! lay each piece out on your tray as you remove it. what do you see inside? wires? gears? a tiny motor? a circuit board with paths like a little road map? try to figure out what each part DOES. the spring makes something bounce. the switch opens and closes a path for electricity. the gear turns another gear.",
    unfold: "now you have a tray full of parts from inside a machine. here's the big question: can you figure out how they all worked TOGETHER? try drawing a map of how the pieces connect. and here's a wild challenge: can you use any of these parts to build something NEW? a gear becomes a wheel for a tiny car. a spring becomes a launcher. the circuit board becomes a piece of robot art. taking things apart isn't breaking them — it's learning their secrets.",
    findAgainPrompt: "take apart TWO different things and compare their insides. do they share any of the same parts? can you combine parts from different objects into one new invention? or try drawing what you THINK is inside something before you open it, then compare your guess to reality!",
  },
};
