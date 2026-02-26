import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middlewareで保護している前提ですが、念のためnull
  const currentEmail = user?.email ?? null;

  return <SettingsClient initialEmail={currentEmail} />;
}
