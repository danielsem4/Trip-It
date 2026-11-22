import { Home, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  // One of the two: a `common` translation key, or literal user-entered text.
  titleKey?: string
  title?: string
  url: string
  icon: LucideIcon
  // Active only on an exact match (for a parent url such as a trip's overview).
  end?: boolean
}

export interface NavGroup {
  // Literal user-entered text shown above the group (e.g. the trip title).
  heading?: string
  items: NavItem[]
}

export const homeItem: NavItem = { titleKey: 'nav.home', url: '/home', icon: Home }
export const settingsItem: NavItem = { titleKey: 'nav.settings', url: '/settings', icon: Settings }

// Add new features here; Settings stays last.
export const navItems: NavItem[] = [homeItem, settingsItem]
