import type { Config } from 'tailwindcss'

/**
 * Tailwind "Zero-Bloat" config untuk layar E-Ink.
 * - Menonaktifkan utilitas yang memicu ghosting/boros baterai di e-ink
 *   (box-shadow, gradient, transition halus, animasi, blur, ring).
 * - Palet terbatas pada kontras tinggi: Warm Paper + Pure Grayscale.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Hanya palet ramah E-Ink — mencegah warna aksen menyilaukan.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      // Mode Warm Paper (Light hangat / Sepia-White)
      paper: {
        DEFAULT: '#F8F6F0',
        soft: '#EFEBE1',
        line: '#D9D2C4',
      },
      // Pure Grayscale High-Contrast
      ink: {
        DEFAULT: '#000000',
        soft: '#1A1A1A',
        muted: '#4D4D4D',
        faint: '#808080',
      },
      white: '#FFFFFF',
      black: '#000000',
      gray: {
        100: '#F2F2F2',
        200: '#D9D9D9',
        400: '#A6A6A6',
        600: '#666666',
        800: '#262626',
      },
    },
    // Tipografi sesuai brief: UI sans-serif tajam, konten serif ramah mata, Arab Naskh.
    fontFamily: {
      // UI & reader sama-sama Literata serif (nuansa eReader/buku, kohesif dengan EPUB).
      ui: ['Literata', 'Charis SIL', 'Georgia', 'serif'],
      reader: ['Literata', 'Bookerly', 'Charis SIL', 'Georgia', 'serif'],
      arabic: ['"LPMQ Isep Misbah"', '"KFGQPC Uthmanic Hafs"', '"Amiri Quran"', '"Scheherazade New"', 'serif'],
    },
    fontSize: {
      // Strict Typography Hierarchy (brief)
      body: ['14px', { lineHeight: '1.6' }],
      'body-lg': ['16px', { lineHeight: '1.6' }],
      button: ['16px', { lineHeight: '1.2', fontWeight: '600' }],
      subtitle: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
      title: ['24px', { lineHeight: '1.3', fontWeight: '700' }],
      // Konten Arab butuh line-height longgar agar harakat tidak bertumpuk
      arabic: ['22px', { lineHeight: '2.0' }],
    },
    extend: {
      borderWidth: {
        // Border tegas 2px untuk tombol E-Ink
        eink: '2px',
      },
      minHeight: {
        tap: '48px', // Generous Tap Target minimum
        'tap-lg': '56px',
      },
    },
  },
  corePlugins: {
    // Zero-Bloat: matikan efek yang memberatkan rendering e-ink & memicu ghosting.
    boxShadow: false,
    boxShadowColor: false,
    gradientColorStops: false,
    backgroundImage: false,
    transitionProperty: false,
    transitionDelay: false,
    transitionDuration: false,
    transitionTimingFunction: false,
    animation: false,
    blur: false,
    backdropBlur: false,
    ringWidth: false,
    ringColor: false,
    ringOffsetWidth: false,
  },
  plugins: [],
} satisfies Config
