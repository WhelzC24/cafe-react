import { useDarkMode } from '../../hooks/useDarkMode'

export default function DarkModeToggle() {
  const { dark, toggle } = useDarkMode()

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-14 h-7 rounded-full transition-all duration-500 ${
        dark
          ? 'bg-espresso-700 shadow-[inset_0_0_6px_rgba(147,197,253,0.25)]'
          : 'bg-amber-200 shadow-[inset_0_0_6px_rgba(251,191,36,0.25)]'
      }`}
    >
      {/* Sliding knob */}
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
          dark
            ? 'left-[30px] bg-espresso-800 shadow-[0_0_6px_rgba(147,197,253,0.35)]'
            : 'left-[2px] bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.35)]'
        }`}
      >
        {/* Sun icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute w-3.5 h-3.5 transition-all duration-500 ${
            dark
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100 text-amber-700'
          }`}
        >
          <circle cx="12" cy="12" r="5" />
          <g style={{ animation: dark ? 'none' : 'spin 8s linear infinite', transformOrigin: 'center' }}>
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>

        {/* Moon icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute w-3.5 h-3.5 transition-all duration-500 ${
            dark
              ? 'opacity-100 rotate-0 scale-100 text-blue-200'
              : 'opacity-0 -rotate-90 scale-0 text-blue-200'
          }`}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          {/* Small star */}
          <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" opacity="0.6" />
        </svg>
      </span>

      {/* Decorative dots */}
      <span
        className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none transition-opacity duration-700"
        style={{ opacity: dark ? 0.6 : 0 }}
      >
        <span className="w-1 h-1 rounded-full bg-blue-300" />
        <span className="w-0.5 h-0.5 rounded-full bg-blue-300" />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none transition-opacity duration-700"
        style={{ opacity: dark ? 0 : 0.6 }}
      >
        <span className="w-1 h-1 rounded-full bg-amber-400" />
        <span className="w-0.5 h-0.5 rounded-full bg-amber-400" />
      </span>
    </button>
  )
}
