const paths = {
  spray: '<path d="M6 3h4v7H6z"/><path d="M5 10h6l1.5 11h-9L5 10Z"/><path d="M15 5h5M15 9h4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  pipe: '<path d="M4 8h6v8H4z"/><path d="M10 12h5a3 3 0 0 1 3 3v5"/><path d="M15 20h6"/>',
  hammer: '<path d="m14 3 7 7-3 3-7-7 3-3Z"/><path d="M11 6 3 14v7h7l8-8"/>',
  roller: '<path d="M3 4h13v6H3z"/><path d="M16 7h4v4h-6"/><path d="M12 11v4h-2v7h4v-7h-2"/>',
  van: '<path d="M2 16V7h11l4 4h5v5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  tray: '<path d="M4 10a8 8 0 0 1 16 0"/><path d="M2 10h20"/><path d="M12 10v9"/><path d="M8 21h8"/>',
  book: '<path d="M4 5h7v15H4z"/><path d="M13 5h7v15h-7z"/><path d="M11 5c0-1 .8-2 2-2"/>',
  helmet: '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M2 15h20v3H2z"/><path d="M12 7V4M8.5 8 7 5.5M15.5 8 17 5.5"/>',
};

export function CategoryIcon({ name, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths[name] || paths.helmet }} />
  );
}

export function Check({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5 9 17.5 20 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Verified({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="ID verified">
      <path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V6l-8-3Z" stroke="#12684E" strokeWidth="2" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" stroke="#12684E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 25 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 16V8h11l4 4h5v4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="2.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="17" r="2.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
