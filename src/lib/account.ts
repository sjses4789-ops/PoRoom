"use server";

import { createClient } from "@/lib/supabase/server";
import { err } from "@/lib/errors";
import { performAccountDeletion } from "@/lib/account-core";

export async function deleteAccount(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: await err("loginRequired") };

  const result = await performAccountDeletion(supabase, user.id);
  if ("error" in result) return { error: result.error };

  await supabase.auth.signOut();
  return null;
}
