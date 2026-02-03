import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/park', icon: '🦕', label: '파크' },
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
    <nav className="relative flex items-center justify-around bg-black/50 backdrop-blur-sm py-2 px-2 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center py-1 px-4 rounded-xl transition-all',
              isActive
                ? 'text-white'
                : 'text-white/60 hover:text-white/80 active:scale-95'
            )}
          >
            {/* 활성 배경 */}
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 bg-primary-500 rounded-xl"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* 아이콘 & 라벨 */}
            <span className="relative text-2xl z-10">{item.icon}</span>
            <span className="relative text-[10px] mt-0.5 font-medium z-10">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
