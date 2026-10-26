// Small inline icon set (24px grid, stroke icons). Decorative by default.
const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  store: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  retail: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a2.5 2.5 0 005 0 2.5 2.5 0 006 0 2.5 2.5 0 005 0M9 20v-6h6v6",
  rangs: "M4 21V5l8-2v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M3 21h18",
  return: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",
  sold: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01",
  due: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  coin: "M12 3a9 9 0 100 18 9 9 0 000-18zM14.5 9.5C14 8.5 13 8 12 8c-1.4 0-2.5.7-2.5 1.8 0 2.6 5 1.2 5 3.9 0 1.1-1.1 1.8-2.5 1.8-1.1 0-2.1-.5-2.5-1.5M12 6.5V8M12 16v1.5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M6 6l12 12M18 6L6 18",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  upload: "M12 15V3M7 8l5-5 5 5M5 21h14",
  left: "M15 18l-6-6 6-6",
  right: "M9 18l6-6-6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  pin: "M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

export default function Icon({ name, className = "" }) {
  return (
    <svg
      className={`i ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] ?? PATHS.store} />
    </svg>
  );
}
