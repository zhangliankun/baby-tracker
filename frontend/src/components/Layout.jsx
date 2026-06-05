import { NavLink } from 'react-router-dom';
import { Clock, BarChart3, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '时间轴', Icon: Clock },
  { path: '/stats', label: '统计分析', Icon: BarChart3 },
  { path: '/profile', label: '我的', Icon: User },
];

export default function Layout({ children }) {
  return (
    <div className="page-container relative">
      {/* 内容区 */}
      <main className="pb-20">
        {children}
      </main>

      {/* 底部 TabBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light z-40">
        <div className="max-w-md mx-auto flex items-center justify-around h-14">
          {tabs.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-1 px-4 min-w-[64px] transition-colors ${
                  isActive ? 'text-brand-primary' : 'text-text-muted'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
