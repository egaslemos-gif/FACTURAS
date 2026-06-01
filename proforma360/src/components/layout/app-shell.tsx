import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <div className="md:pl-[var(--spacing-sidebar-width)] flex flex-col min-h-screen transition-all duration-300">
        <TopBar />
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 w-full max-w-[var(--spacing-container-max)] mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
