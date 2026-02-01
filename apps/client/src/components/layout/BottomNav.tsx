import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/park', icon: '🏠', label: '파크' },
  { path: '/dinosaur', icon: '🦕', label: '공룡' },
  { path: '/exploration', icon: '🧭', label: '탐험' },
  { path: '/story', icon: '📖', label: '스토리' },
  { path: '/shop', icon: '🛒', label: '상점' },
];

/**
 * 하단 네비게이션 바
 */
export default function BottomNav() {
  return (
    <nav className="flex items-center justify-around bg-black/50 backdrop-blur-sm py-2 px-4 safe-area-bottom">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 rounded-lg transition-all ${
              isActive
                ? 'bg-primary-500 text-white scale-110'
                : 'text-white/70 hover:text-white'
            }`
          }
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
