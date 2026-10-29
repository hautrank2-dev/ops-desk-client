"use client";

import { Sidebar, SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useSidebar } from './useSidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Fixed sidebar — desktop only */}
        <aside
          className="fixed top-0 left-0 h-screen z-30 hidden md:block"
          style={{ width: sidebarW, transition: "width 200ms cubic-bezier(0.25, 0.1, 0.25, 1)" }}
        >
          <Sidebar collapsed={collapsed} className="h-full" />
        </aside>



        {/* Spacer div that pushes content right on desktop */}
        <SidebarSpacer sidebarW={sidebarW}>
          {/* Fixed header */}
          <header className="sticky top-0 left-0 right-0 z-40 h-[var(--header-height)]">
            <Header sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
          </header>
          <main>
            <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-[1440px] mx-auto space-y-6">
              {children}
            </div>
          </main>
        </SidebarSpacer>
      </div>
    </ProtectedRoute>
  );
}

function SidebarSpacer({ sidebarW, children }: { sidebarW: number; children: React.ReactNode }) {
  return (
    <>
      <style>{`@media (min-width: 768px) { .sidebar-offset { margin-left: ${sidebarW}px; } }`}</style>
      <div className="sidebar-offset" style={{ transition: "margin-left 200ms cubic-bezier(0.25, 0.1, 0.25, 1)" }}>
        {children}
      </div>
    </>
  );
}
