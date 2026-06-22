import { Link, useLocation } from "wouter";
import {
  Store,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  ChefHat,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",         icon: Store,          label: "ขาย",    fullLabel: "ขายหน้าร้าน" },
  { href: "/orders",   icon: ClipboardList,  label: "คิดเงิน", fullLabel: "คิดเงิน" },
  { href: "/menu",     icon: UtensilsCrossed,label: "เมนู",   fullLabel: "จัดการเมนู" },
  { href: "/settings", icon: Settings,        label: "ตั้งค่า", fullLabel: "ตั้งค่าร้าน" },
];

const pageTitle: Record<string, string> = {
  "/":         "ขายหน้าร้าน",
  "/orders":   "คิดเงิน",
  "/menu":     "จัดการเมนู",
  "/settings": "ตั้งค่าร้าน",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const currentTitle = pageTitle[location] ?? "อร่อยPOS";

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-muted/30">

      {/* ───── Desktop Sidebar ───── */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r bg-card/50 backdrop-blur shrink-0">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shrink-0">
            <Store className="size-6" />
          </div>
          <span className="font-bold text-xl hidden lg:block tracking-tight">อร่อยPOS</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}>
                  <item.icon className={cn("size-5 shrink-0", isActive && "fill-primary-foreground/20")} />
                  <span className="hidden lg:block text-sm">{item.fullLabel}</span>
                </div>
              </Link>
            );
          })}

          <div className="mt-auto pt-2 border-t border-border/50">
            <a
              href="/kitchen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              <ChefHat className="size-5 shrink-0" />
              <span className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
                หน้าห้องครัว
                <ExternalLink className="size-3 opacity-60" />
              </span>
            </a>
          </div>
        </nav>
      </aside>

      {/* ───── Mobile Top Bar ───── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur border-b flex items-center px-4 gap-3 shadow-sm">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shrink-0">
          <Store className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none mb-0.5">อร่อยPOS</p>
          <p className="font-bold text-sm leading-none truncate">{currentTitle}</p>
        </div>
        <a
          href="/kitchen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
        >
          <ChefHat className="size-3.5" />
          ครัว
        </a>
      </header>

      {/* ───── Main Content ───── */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden min-w-0 pt-14 md:pt-0">
        {children}
      </main>

      {/* ───── Mobile Bottom Tab Bar ───── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex items-stretch z-50 shadow-[0_-1px_12px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 h-[84px] cursor-pointer transition-colors active:bg-muted/60",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-2xl transition-colors",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <item.icon className={cn("size-7", isActive && "fill-primary/20")} />
                </div>
                <span className={cn(
                  "text-xs leading-none font-bold",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Kitchen shortcut */}
        <a
          href="/kitchen"
          target="_blank"
          rel="noopener noreferrer"
          style={{ touchAction: "manipulation" }}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 h-[84px] text-orange-500 active:bg-orange-50/60 transition-colors"
        >
          <div className="p-2.5 rounded-2xl bg-orange-50">
            <ChefHat className="size-7" />
          </div>
          <span className="text-xs leading-none font-bold">ครัว</span>
        </a>
      </nav>
    </div>
  );
}
