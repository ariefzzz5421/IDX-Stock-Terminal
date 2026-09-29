import { Flame, Globe2, LayoutDashboard, ListOrdered, MapPinned, Star, TrendingUp, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/top10", label: "Top 10", icon: ListOrdered },
  { href: "/foreign-flow", label: "Foreign Flow", shortLabel: "Flow", icon: TrendingUp },
  { href: "/hot", label: "Hot", icon: Flame },
  { href: "/market", label: "Market", icon: Globe2 },
  { href: "/lokasi-bisnis", label: "Lokasi Bisnis", shortLabel: "Lokasi", icon: MapPinned },
  { href: "/account", label: "Account", icon: UserRound },
];
