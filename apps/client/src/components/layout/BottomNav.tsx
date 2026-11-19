import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/park', icon: '🦕', label: '파크' },
  { path: '/dinosaur', icon: '📚', label: '도감' },
  { path: '/exploration', icon: '🧭', label: '탐험' },
  { path: '/story', icon: '📖', label: '스토리' },
  { path: '/shop', icon: '🛒', label: '상점' },
];

/**
 * 하단 네비게이션 바
 */
export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="safe-area-bottom relative flex items-center justify-around bg-black/50 px-2 py-2 backdrop-blur-sm">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex min-h-11 min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-1 transition-colors',
              isActive ? 'text-white' : 'text-white/60 hover:text-white/80 active:scale-95',
            )}
          >
            {/* 활성 배경 */}
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="bg-primary-500 absolute inset-0 rounded-xl"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* 아이콘 & 라벨 */}
            <span className="relative z-10 text-2xl" aria-hidden="true">
              {item.icon}
            </span>
            <span className="relative z-10 mt-0.5 text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
