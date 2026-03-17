/**
 * /matcher/hunt → redirects to /matcher?mode=hunt
 *
 * All find modes now live on the single /matcher page for instant
 * client-side switching. This redirect preserves old bookmarks.
 */

import { redirect } from "next/navigation";

export default function HuntPage() {
  redirect("/matcher?mode=hunt");
}
