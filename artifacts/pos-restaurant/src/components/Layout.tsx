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
  { href: "/", icon: Store, label: "ขายหน้าร้าน" },
  { href: "/orders", icon: ClipboardList, label: "คิดเงิน" },
  { href: "/menu", icon: UtensilsCrossed, label: "จัดการเมนู" },
  { href: "/settings", icon: Settings, label: "ตั้งค่าร้าน" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
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
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("size-5 shrink-0", isActive && "fill-primary-foreground/20")} />
                  <span className="hidden lg:block text-sm">{item.label}</span>
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

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden min-w-0">
        {children}
      </main>

      {/* Mobile Bottom Tab */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex items-stretch z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center py-2 px-1 h-full cursor-pointer">
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}>
                  <item.icon className={cn("size-5", isActive && "fill-primary/20")} />
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5 transition-colors leading-tight text-center",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
        {/* Kitchen shortcut on mobile */}
        <a
          href="/kitchen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-orange-600"
        >
          <div className="p-1.5 rounded-xl bg-orange-50">
            <ChefHat className="size-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-tight">ครัว</span>
        </a>
      </nav>
    </div>
  );
}
