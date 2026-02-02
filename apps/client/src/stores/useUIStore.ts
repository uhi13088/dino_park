import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 모달 타입
export type ModalType =
  | 'dinosaur_detail'
  | 'building_detail'
  | 'shop'
  | 'inventory'
  | 'settings'
  | 'offline_revenue'
  | 'level_up'
  | 'hatching'
  | 'exploration_complete'
  | 'confirm'
  | null;

// 토스트 타입
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// 사이드 패널 타입
export type SidePanelType = 'dinosaur_list' | 'building_list' | 'great_figure_list' | null;

interface UIState {
  // 모달
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // 토스트
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // 사이드 패널
  sidePanel: SidePanelType;
  openSidePanel: (type: SidePanelType) => void;
  closeSidePanel: () => void;

  // 로딩 오버레이
  isGlobalLoading: boolean;
  loadingMessage: string | null;
  showLoading: (message?: string) => void;
  hideLoading: () => void;

  // 튜토리얼 하이라이트
  tutorialHighlight: string | null;
  setTutorialHighlight: (elementId: string | null) => void;

  // 바텀 시트
  bottomSheetContent: React.ReactNode | null;
  bottomSheetOpen: boolean;
  openBottomSheet: (content: React.ReactNode) => void;
  closeBottomSheet: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // 모달 상태
      activeModal: null,
      modalData: null,
      openModal: (type, data) =>
        set({
          activeModal: type,
          modalData: data ?? null,
        }),
      closeModal: () =>
        set({
          activeModal: null,
          modalData: null,
        }),

      // 토스트 상태
      toasts: [],
      showToast: (toast) => {
        const id = `toast-${++toastId}`;
        const newToast = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // 자동 제거
        const duration = toast.duration ?? 3000;
        if (duration > 0) {
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, duration);
        }
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // 사이드 패널 상태
      sidePanel: null,
      openSidePanel: (type) => set({ sidePanel: type }),
      closeSidePanel: () => set({ sidePanel: null }),

      // 로딩 상태
      isGlobalLoading: false,
      loadingMessage: null,
      showLoading: (message) =>
        set({
          isGlobalLoading: true,
          loadingMessage: message ?? null,
        }),
      hideLoading: () =>
        set({
          isGlobalLoading: false,
          loadingMessage: null,
        }),

      // 튜토리얼 하이라이트
      tutorialHighlight: null,
      setTutorialHighlight: (elementId) =>
        set({ tutorialHighlight: elementId }),

      // 바텀 시트
      bottomSheetContent: null,
      bottomSheetOpen: false,
      openBottomSheet: (content) =>
        set({
          bottomSheetContent: content,
          bottomSheetOpen: true,
        }),
      closeBottomSheet: () =>
        set({
          bottomSheetOpen: false,
          // content는 애니메이션 후 정리
        }),
    }),
    { name: 'UIStore' }
  )
);
