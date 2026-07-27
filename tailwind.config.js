/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ─────────────────────────────────────────────
      // 🎨 BRAND COLOR SYSTEM — edit these to retheme
      // ─────────────────────────────────────────────
      colors: {
        // Primary brand color (currently orange)
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
        },
        // Neutral/surface colors
        surface: {
          DEFAULT: 'var(--color-surface)',      // page bg
          alt:     'var(--color-surface-alt)',  // cards, inputs
          raised:  'var(--color-surface-raised)', // hover states
        },
        // Text colors
        ink: {
          DEFAULT: 'var(--color-ink)',          // headings
          mid:     'var(--color-ink-mid)',      // body
          muted:   'var(--color-ink-muted)',    // labels, meta
          faint:   'var(--color-ink-faint)',    // placeholders
        },
        // Border
        line: {
          DEFAULT: 'var(--color-line)',
          dark:    'var(--color-line-dark)',
        },
        // Status
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 12px rgba(0,0,0,0.07)',
        hover: '0 8px 32px rgba(0,0,0,0.12)',
        nav:   '0 1px 0 var(--color-line)',
      },
    },
  },
  plugins: [],
}
