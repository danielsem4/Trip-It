import { Home, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  titleKey: string
  url: string
  icon: LucideIcon
}

// Add new features here; Settings stays last.
export const navItems: NavItem[] = [
  { titleKey: 'nav.home', url: '/home', icon: Home },
  { titleKey: 'nav.settings', url: '/settings', icon: Settings },
]
