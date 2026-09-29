"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Ticket, Users, Building2,
  Settings, Menu, ChevronLeft, MapPin, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const SIDEBAR_EXPANDED_W = 240;
export const SIDEBAR_COLLAPSED_W = 64;

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
};

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Assets', href: '/assets', icon: Package,
    children: [
      { name: 'Asset List', href: '/assets' },
      { name: 'Asset Items', href: '/assets/asset-item' },
    ],
  },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const navItemBase =
  "flex items-center rounded-lg text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-150 cursor-pointer";
const navItemIdle =
  "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]";
const navItemActive =
  "bg-black/[0.06] text-foreground dark:bg-white/[0.09]";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname() || "";

  const isGroupActive = (item: NavItem) =>
    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <div
      className={cn("flex flex-col border-r border-border bg-sidebar overflow-hidden transition-[width] duration-200 ease-apple", className)}
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 shrink-0", collapsed ? "justify-center px-3" : "gap-2.5 px-5")}>
        <div className="h-8 w-8 rounded-[9px] bg-gradient-to-b from-[#2997ff] to-[#0062d1] flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgb(0_0_0/0.15),inset_0_1px_0_rgb(255_255_255/0.25)]">
          <Layers className="h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="font-semibold text-[15px] tracking-[-0.02em] truncate">OpsDesk</p>
            <p className="text-[11px] text-muted-foreground truncate">Asset & Maintenance</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {!collapsed && (
          <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/70">Workspace</p>
        )}
        {navItems.map((item) => {
          const active = isGroupActive(item);

          if (item.children && !collapsed) {
            return (
              <div key={item.href} className="py-0.5">
                {/* Parent row — not a link, just a label */}
                <div className={cn(
                  "flex items-center gap-2.5 w-full h-9 px-2.5 text-[13.5px] font-medium tracking-[-0.01em]",
                  active ? "text-foreground" : "text-foreground/70"
                )}>
                  <item.icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-primary" : "text-foreground/50")} />
                  <span>{item.name}</span>
                </div>
                {/* Sub-items */}
                <div className="ml-[19px] mt-0.5 space-y-0.5 border-l border-border pl-2.5">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href ||
                      (child.href !== item.href && pathname.startsWith(child.href));
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(navItemBase, "h-8 px-2.5 text-[13px]", childActive ? navItemActive : navItemIdle)}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          // collapsed or no children — single icon link
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                navItemBase,
                "h-9",
                collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
                active ? navItemActive : navItemIdle
              )}
            >
              <item.icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-primary" : "text-foreground/50")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {onToggle && (
        <div className={cn("p-3", collapsed ? "flex justify-center" : "flex justify-end")}>
          <button
            onClick={onToggle}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200 ease-apple", collapsed && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button className="inline-flex cursor-pointer items-center justify-center rounded-full h-9 w-9 -ml-1.5 text-foreground/70 transition-colors hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.08] md:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-60 gap-0">
        <Sidebar className="h-full border-none" />
      </SheetContent>
    </Sheet>
  );
}
