import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/forest/Button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

async function getSupabaseClient() {
  if (import.meta.env.PROD && import.meta.env.SSR) {
    throw new Error("Supabase client is unavailable during SSR.");
  }
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate({ to: "/" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google 로그인에 실패했습니다.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-bg">
      <header className="h-14 flex items-center px-4">
        <Link
          to="/"
          aria-label="홈으로"
          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-warm-beige"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </header>
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-[400px]">
          <h1 className="font-serif-kr text-3xl text-forest-900">숲 테라피 AI</h1>
          <p className="mt-2 text-sm text-text-secondary">로그인하고 맞춤 치유 코스를 받아보세요</p>

          <div className="mt-6 flex rounded-xl bg-border-subtle p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 h-9 rounded-lg text-sm transition-colors ${
                  mode === m
                    ? "bg-white text-text-primary font-semibold shadow-sm"
                    : "text-text-tertiary"
                }`}
              >
                {m === "signin" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-text-secondary mb-1.5"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-xl bg-white border border-border-default focus:border-forest-500 focus:border-2 focus:outline-none text-base"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-text-secondary mb-1.5"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                className="w-full h-12 px-4 rounded-xl bg-white border border-border-default focus:border-forest-500 focus:border-2 focus:outline-none text-base"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {mode === "signin" ? "로그인" : "회원가입"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex-1 h-px bg-border-default" />
            또는
            <span className="flex-1 h-px bg-border-default" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-white border border-border-default font-medium text-text-primary hover:bg-warm-beige transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.4 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.3 0 10.1-2 13.8-5.3l-6.4-5.4C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.7 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.5 5.8l6.4 5.4C40.7 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
            )}
            Google로 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
