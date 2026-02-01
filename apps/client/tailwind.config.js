/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 다이노 파크 타이쿤 컬러 팔레트
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // 메인 그린
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        secondary: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107', // 골드
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        accent: {
          500: '#00BCD4', // 다이아몬드
        },
        dino: {
          herbivore: '#4CAF50', // 초식 - 녹색
          carnivore: '#F44336', // 육식 - 빨강
          pterosaur: '#9C27B0', // 익룡 - 보라
          marine: '#2196F3',    // 해양 - 파랑
          hybrid: '#FF9800',    // 하이브리드 - 주황
        },
        rarity: {
          common: '#9E9E9E',
          uncommon: '#4CAF50',
          rare: '#2196F3',
          epic: '#9C27B0',
          legendary: '#FF9800',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [],
};
