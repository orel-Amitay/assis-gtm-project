import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Zap, GitBranch, BookOpen, Languages, Settings } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { t } from '../data/translations'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  { to: '/leads',     icon: Users,           labelKey: 'nav_leads'     },
  { to: '/workflow',  icon: Zap,             labelKey: 'nav_workflow'  },
  { to: '/pipeline',  icon: GitBranch,       labelKey: 'nav_pipeline'  },
  { to: '/playbooks', icon: BookOpen,        labelKey: 'nav_playbooks' },
  { to: '/settings',  icon: Settings,        labelKey: 'nav_settings'  },
]

export default function Sidebar() {
  const { lang, toggle, isHe } = useLang()

  return (
    <aside className="fixed top-0 start-0 h-screen w-56 bg-slate-900 flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
            A
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-none">Assis</div>
            <div className="text-slate-400 text-[10px] mt-0.5">US GTM Machine</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={16} />
            {t(labelKey, lang)}
          </NavLink>
        ))}
      </nav>

      {/* Language toggle + bottom */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-3">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium text-slate-300"
        >
          <Languages size={15} className="text-slate-400 shrink-0" />
          <span>{isHe ? 'Switch to English' : 'עברית'}</span>
        </button>
        <div className="px-2">
          <div className="text-slate-500 text-[11px]">V1 · Home Vertical</div>
          <div className="text-slate-400 text-xs mt-0.5 font-medium">90-day sprint</div>
        </div>
      </div>
    </aside>
  )
}
