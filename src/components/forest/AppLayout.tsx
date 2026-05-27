import * as React from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Home, Leaf, Map, MessageSquare, User, type LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface TabDef {
  to: "/home" | "/map" | "/community" | "/mypage";
  icon: LucideIcon;
  label: string;
}

const TABS: TabDef[] = [
  { to: "/home", icon: Home, label: "홈" },
  { to: "/map", icon: Map, label: "지도" },
  { to: "/community", icon: MessageSquare, label: "대화공간" },
  { to: "/mypage", icon: User, label: "마이" },
];

function Header() {
  const { user } = useAuth({ defer: true });

  return (
    <header
      role="banner"
      className="absolute inset-x-0 top-0 z-20 h-16 border-b border-border-subtle bg-white/95 backdrop-blur-md"
    >
      <div className="flex h-full items-center justify-between px-6">
        <Link to="/home" className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
            <Leaf className="size-4" aria-hidden />
          </span>
          <span className="font-serif-kr text-base text-forest-900">숲 테라피 AI</span>
        </Link>
        <div>
          {user ? (
            <Link
              to="/mypage"
              aria-label="마이페이지"
              className="inline-flex size-9 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-700"
            >
              {(user.email?.[0] ?? "U").toUpperCase()}
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-bold text-forest-700 hover:text-forest-900">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      role="navigation"
      aria-label="주요 메뉴"
      className="absolute inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-white/95 backdrop-blur-xl safe-bottom"
    >
      <ul className="mx-auto flex h-[68px] w-full">
        {TABS.map(({ to, icon: Icon, label }) => {
          const active =
            to === "/home" ? location.pathname === "/home" : location.pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1.5 transition-colors",
                  active ? "text-forest-700" : "text-text-tertiary",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const isLanding = location.pathname === "/";
  const hideChrome = location.pathname.startsWith("/auth");

  const mainRef = React.useRef<HTMLElement>(null);

  if (isLanding) {
    return <div className="min-h-screen w-full bg-black">{children}</div>;
  }

  if (hideChrome) {
    return (
      <main className="min-h-screen bg-neutral-100 flex justify-center lg:py-4">
        <div className="w-full max-w-[480px] min-h-screen lg:min-h-[850px] lg:h-[850px] lg:rounded-[2.5rem] bg-white relative overflow-hidden shadow-2xl flex flex-col transform-gpu">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center lg:py-4">
      <div className="w-full max-w-[480px] min-h-screen lg:min-h-[850px] lg:h-[850px] lg:rounded-[2.5rem] bg-white relative overflow-hidden shadow-2xl flex flex-col transform-gpu">
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Header />
        <main
          id="main-content"
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-warm-bg pb-[68px] pt-16 safe-bottom"
          key={router.state.location.pathname}
        >
          {children}
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}
