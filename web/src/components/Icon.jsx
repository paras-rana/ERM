const ICONS = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="11" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="17" width="7" height="3" rx="1.5" />
    </>
  ),
  register: (
    <>
      <path d="M7 4.5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  detail: (
    <>
      <path d="M12 3 4 7v5c0 5 3.4 7.9 8 9 4.6-1.1 8-4 8-9V7l-8-4Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </>
  ),
  signout: (
    <>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M9 12h9" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  matrix: (
    <>
      <rect x="4" y="4" width="5" height="5" rx="1" />
      <rect x="10" y="4" width="5" height="5" rx="1" />
      <rect x="16" y="4" width="4" height="5" rx="1" />
      <rect x="4" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
      <rect x="16" y="10" width="4" height="5" rx="1" />
      <rect x="4" y="16" width="5" height="4" rx="1" />
      <rect x="10" y="16" width="5" height="4" rx="1" />
      <rect x="16" y="16" width="4" height="4" rx="1" />
    </>
  ),
  category: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    </>
  ),
  department: (
    <>
      <path d="M4 19h16" />
      <path d="M6 19V8l6-3 6 3v11" />
      <path d="M9 11h.01" />
      <path d="M12 11h.01" />
      <path d="M15 11h.01" />
      <path d="M9 14h.01" />
      <path d="M12 14h.01" />
      <path d="M15 14h.01" />
    </>
  ),
  risk: (
    <>
      <path d="M12 3 3 19h18L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  mitigations: (
    <>
      <path d="M7 12h10" />
      <path d="M12 7v10" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  assessment: (
    <>
      <path d="M6 19h12" />
      <path d="M8 16V9" />
      <path d="M12 16V5" />
      <path d="M16 16v-4" />
    </>
  ),
  review: (
    <>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  login: (
    <>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M9 12h9" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="m7 14 5 5 5-5" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m7 10 5-5 5 5" />
    </>
  ),
  minus: (
    <>
      <path d="M6 12h12" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  portfolio: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M9 6V4h6v2" />
      <path d="M4 11h16" />
      <path d="M10 14h4" />
    </>
  ),
};

export default function Icon({ name, className = '', strokeWidth = 1.8 }) {
  const glyph = ICONS[name];
  if (!glyph) return null;

  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
}
