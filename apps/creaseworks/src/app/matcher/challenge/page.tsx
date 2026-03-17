/**
 * /matcher/challenge → redirects to /matcher?mode=challenge
 *
 * All find modes now live on the single /matcher page for instant
 * client-side switching. This redirect preserves old bookmarks.
 */

import { redirect } from "next/navigation";

export default function ChallengePage() {
  redirect("/matcher?mode=challenge");
}
