import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

type SettingsPageProps = {
  searchParams?: Promise<{
    info?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = await searchParams;
  const infoMessage = resolvedSearchParams?.info ?? null;

  return (
    <SettingsClient
      initialEmail={user.email ?? null}
      infoMessage={infoMessage}
    />
  );
}
