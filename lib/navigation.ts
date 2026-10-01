import { BrainCircuit, Flame, Globe2, LayoutDashboard, ListOrdered, MapPinned, Star, TrendingUp, UserRound, Layers3, UsersRound, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/top10", label: "Top 10", icon: ListOrdered },
  { href: "/foreign-flow", label: "Foreign Flow", shortLabel: "Flow", icon: TrendingUp },
  { href: "/hot", label: "Hot", icon: Flame },
  { href: "/market", label: "Market", icon: Globe2 },
  { href: "/sector", label: "Sector", icon: Layers3 },
  { href: "/konglo", label: "Konglo", icon: UsersRound },
  { href: "/lokasi-bisnis", label: "Lokasi Bisnis", shortLabel: "Lokasi", icon: MapPinned },
  { href: "/ai-analyst", label: "AI Analyst", shortLabel: "AI", icon: BrainCircuit },
  { href: "/account", label: "Profile", icon: UserRound },
];
