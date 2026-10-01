import { Flame, Globe2, LayoutDashboard, ListOrdered, MapPinned, Star, TrendingUp, UserRound, Layers3, UsersRound, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/watchlist", label: "Pantauan", icon: Star },
  { href: "/top10", label: "10 Teratas", icon: ListOrdered },
  { href: "/foreign-flow", label: "Arus Asing", icon: TrendingUp },
  { href: "/hot", label: "Aktif", icon: Flame },
  { href: "/market", label: "Pasar", icon: Globe2 },
  { href: "/sector", label: "Sektor", icon: Layers3 },
  { href: "/konglo", label: "Konglo", icon: UsersRound },
  { href: "/lokasi-bisnis", label: "Lokasi Bisnis", shortLabel: "Lokasi", icon: MapPinned },
  { href: "/account", label: "Akun", icon: UserRound },
];
