// Clean line-icon set (no emoji). 1.6 stroke, currentColor.

function Svg({ children, size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p) => (
  <Svg {...p}><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5h5v5" /></Svg>
);
export const IconBuilding = (p) => (
  <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /><path d="M10 21v-3h4v3" /></Svg>
);
export const IconLand = (p) => (
  <Svg {...p}><path d="M3 20h18" /><path d="m4 20 4-10 4 6 3-4 5 8" /><circle cx="8" cy="6" r="1.6" /></Svg>
);
export const IconStore = (p) => (
  <Svg {...p}><path d="M4 9h16l-1-4H5L4 9Z" /><path d="M5 9v11h14V9" /><path d="M9 20v-5h6v5" /></Svg>
);
export const IconBed = (p) => (
  <Svg {...p}><path d="M3 8v11M3 13h18v6M21 19v-5a3 3 0 0 0-3-3H8v3" /><path d="M6 11V9a1 1 0 0 1 1-1" /></Svg>
);
export const IconBath = (p) => (
  <Svg {...p}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" /><path d="M6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2" /><path d="M7 19l-1 2M18 19l1 2" /></Svg>
);
export const IconCar = (p) => (
  <Svg {...p}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" /><path d="M4 13h16v4H4z" /><circle cx="7.5" cy="17.5" r="1.3" /><circle cx="16.5" cy="17.5" r="1.3" /></Svg>
);
export const IconRuler = (p) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="10" rx="1.5" /><path d="M7 7v3M11 7v4M15 7v3M19 7v4" /></Svg>
);
export const IconArea = (p) => (
  <Svg {...p}><path d="M4 4v16h16" /><path d="M4 14 14 4M9 20l11-11" /></Svg>
);
export const IconDoc = (p) => (
  <Svg {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 16h5" /></Svg>
);
export const IconPin = (p) => (
  <Svg {...p}><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Svg>
);
export const IconPhone = (p) => (
  <Svg {...p}><path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 5 6a2 2 0 0 1 0-2Z" /></Svg>
);
export const IconChat = (p) => (
  <Svg {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" /><path d="M9 11h.01M12 11h.01M15 11h.01" /></Svg>
);
export const IconArrow = (p) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const IconStar = (p) => (
  <Svg {...p}><path d="m12 4 2.3 4.7 5.2.8-3.7 3.6.9 5.1L12 16l-4.6 2.4.9-5.1-3.7-3.6 5.2-.8L12 4Z" /></Svg>
);
export const IconCheck = (p) => (
  <Svg {...p}><path d="m5 12 4.5 4.5L19 7" /></Svg>
);
export const IconMenu = (p) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
);
export const IconClose = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const IconCalc = (p) => (
  <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8" /><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></Svg>
);
export const IconShield = (p) => (
  <Svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const IconSparkLess = (p) => (
  <Svg {...p}><path d="M12 4v16M4 12h16" /></Svg>
);

export const IconGrid = (p) => (
  <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Svg>
);
export const IconList = (p) => (
  <Svg {...p}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></Svg>
);
export const IconPlus = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconMega = (p) => (
  <Svg {...p}><path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" /><path d="M17 9a4 4 0 0 1 0 6" /></Svg>
);
export const IconInbox = (p) => (
  <Svg {...p}><path d="M4 13l2.5-7h11L20 13" /><path d="M4 13v5h16v-5h-5a3 3 0 0 1-6 0H4Z" /></Svg>
);
export const IconArticle = (p) => (
  <Svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12H3M6 8l-3 4 3 4" /></Svg>
);
export const IconWand = (p) => (
  <Svg {...p}><path d="M15 4V2M15 10V8M11 6H9M21 6h-2" /><path d="M18 9 6 21l-3-3L15 6Z" /></Svg>
);
export const IconSlide = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" /></Svg>
);
export const IconExternal = (p) => (
  <Svg {...p}><path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></Svg>
);
export const IconUsers = (p) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.6a4.5 4.5 0 0 1 5 4.4" /></Svg>
);
export const IconCode = (p) => (
  <Svg {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /><path d="m13 5-2 14" /></Svg>
);
export const IconBolt = (p) => (
  <Svg {...p}><path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" /></Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>
);

export const TYPE_ICON_COMPONENTS = {
  home: IconHome,
  building: IconBuilding,
  land: IconLand,
  store: IconStore,
};
