import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/stores';

/**
 * 전역 로딩 오버레이
 */
export default function LoadingOverlay() {
  const { isGlobalLoading, loadingMessage } = useUIStore();

  return (
    <AnimatePresence>
      {isGlobalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {/* 로딩 스피너 */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-t-primary-500 rounded-full animate-spin" />
          </div>

          {/* 로딩 메시지 */}
          {loadingMessage && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-white font-medium"
            >
              {loadingMessage}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
