import { createClient } from "@/lib/supabase/server";
import Splash from "./Splash";

export default async function PublicHomePage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const nextPath = session ? "/app" : "/auth/login";

  return <Splash nextPath={nextPath} />;
}
