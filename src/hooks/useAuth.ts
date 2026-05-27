import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

interface UseAuthOptions {
  defer?: boolean;
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function scheduleAuthInit(callback: () => void, defer: boolean): () => void {
  if (!defer || typeof window === "undefined") {
    callback();
    return () => {};
  }

  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.requestIdleCallback === "function") {
    const idleId = idleWindow.requestIdleCallback(callback, { timeout: 1500 });
    return () => idleWindow.cancelIdleCallback?.(idleId);
  }

  const timeoutId = globalThis.setTimeout(callback, 750);
  return () => globalThis.clearTimeout(timeoutId);
}

export function useAuth({ defer = false }: UseAuthOptions = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    const cancelScheduledInit = scheduleAuthInit(() => {
      void (async () => {
        if (import.meta.env.PROD && import.meta.env.SSR) {
          setLoading(false);
          return;
        }
        const { supabase } = await import("@/integrations/supabase/client");
        if (cancelled) return;

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
          setSession(s);
          setUser(s?.user ?? null);
        });
        unsub = () => sub.subscription.unsubscribe();

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })();
    }, defer);

    return () => {
      cancelled = true;
      cancelScheduledInit();
      unsub?.();
    };
  }, [defer]);

  const signOut = async () => {
    if (import.meta.env.PROD && import.meta.env.SSR) return;
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut };
}
