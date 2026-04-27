import {
  LayoutDashboard, CloudLightning, AlertTriangle,
  FileText, Settings, ShieldAlert,
} from 'lucide-react'
import type { NavSection } from '@/types'

interface NavItem {
  id: NavSection
  icon: React.ComponentType<{ size?: number }>
  label: string
  abbr: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview', abbr: 'OVR' },
  { id: 'weather',  icon: CloudLightning,  label: 'Weather',  abbr: 'WX'  },
  { id: 'alerts',   icon: AlertTriangle,   label: 'Alerts',   abbr: 'ALT' },
  { id: 'reports',  icon: FileText,        label: 'Reports',  abbr: 'RPT' },
]

interface Props {
  activeSection: NavSection
  onNavigate: (s: NavSection) => void
}

export function LeftNav({ activeSection, onNavigate }: Props) {
  return (
    <nav className="hidden sm:flex w-16 bg-card border-r border-line flex-col items-center pt-2 pb-3 gap-0.5 shrink-0" aria-label="Dashboard sections">
      {/* Logo anchor */}
      <div className="w-10 h-9 flex items-center justify-center mb-1 border-b border-line w-full">
        <ShieldAlert size={16} className="text-cyan/70" />
      </div>

      {NAV_ITEMS.map(({ id, icon: Icon, label, abbr }) => {
        const isActive = activeSection === id
        return (
          <button
            key={id}
            title={label}
            aria-label={`Show ${label}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(id)}
            className={`w-12 h-11 flex flex-col items-center justify-center gap-0.5 rounded-sm transition-all duration-150 relative group ${
              isActive
                ? 'text-cyan bg-cyan/10 border-l-2 border-cyan shadow-[inset_0_0_12px_rgba(0,200,255,0.08)]'
                : 'text-muted hover:text-secondary hover:bg-elevated border-l-2 border-transparent'
            }`}
          >
            <Icon size={16} />
            <span className="font-mono text-[8px] tracking-wider text-current">{abbr}</span>
            {/* Tooltip */}
            <span className="absolute left-full ml-2 z-50 px-2 py-1 bg-card border border-line text-primary text-xs font-mono rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              {label}
            </span>
          </button>
        )
      })}

      <div className="mt-auto">
        <button
          title="Settings"
          aria-label="Show Settings"
          aria-current={activeSection === 'settings' ? 'page' : undefined}
          onClick={() => onNavigate('settings')}
          className={`w-12 h-11 flex flex-col items-center justify-center gap-0.5 rounded-sm transition-all duration-150 border-l-2 relative group ${
            activeSection === 'settings'
              ? 'text-cyan bg-cyan/10 border-cyan shadow-[inset_0_0_12px_rgba(0,200,255,0.08)]'
              : 'text-muted hover:text-secondary hover:bg-elevated border-transparent'
          }`}
        >
          <Settings size={16} />
          <span className="font-mono text-[8px] tracking-wider text-current">CFG</span>
          <span className="absolute left-full ml-2 z-50 px-2 py-1 bg-card border border-line text-primary text-xs font-mono rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
            Settings
          </span>
        </button>
      </div>
    </nav>
  )
}
