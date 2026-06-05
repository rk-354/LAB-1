/* ============================================================
   RefineIQ — Icon set (minimal stroke SVGs)
   ============================================================ */
const Icon = ({ d, paths, size = 18, sw = 1.6, fill = "none", style, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={style} {...rest}>
    {paths ? paths : <path d={d} />}
  </svg>
);

const I = {
  chat:   (p) => <Icon {...p} d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />,
  grid:   (p) => <Icon {...p} paths={<g><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></g>} />,
  shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  search: (p) => <Icon {...p} paths={<g><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></g>} />,
  send:   (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />,
  paperclip: (p) => <Icon {...p} d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8" />,
  plus:   (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  user:   (p) => <Icon {...p} paths={<g><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></g>} />,
  users:  (p) => <Icon {...p} paths={<g><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M17.5 14.2A6.5 6.5 0 0 1 21.5 20"/></g>} />,
  doc:    (p) => <Icon {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />,
  folder: (p) => <Icon {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  logs:   (p) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  settings: (p) => <Icon {...p} paths={<g><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></g>} />,
  bell:   (p) => <Icon {...p} d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  chevL:  (p) => <Icon {...p} d="M15 18l-6-6 6-6" />,
  chevR:  (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  chevD:  (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  sparkle:(p) => <Icon {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  spark2: (p) => <Icon {...p} paths={<g><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10z"/><path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z"/></g>} />,
  clock:  (p) => <Icon {...p} paths={<g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>} />,
  trend:  (p) => <Icon {...p} d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5" />,
  mail:   (p) => <Icon {...p} paths={<g><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></g>} />,
  arrowR: (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />,
  copy:   (p) => <Icon {...p} paths={<g><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></g>} />,
  thumbUp:(p) => <Icon {...p} d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM7 11l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" />,
  refresh:(p) => <Icon {...p} d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5" />,
  filter: (p) => <Icon {...p} d="M3 5h18l-7 8v6l-4-2v-4z" />,
  more:   (p) => <Icon {...p} paths={<g><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></g>} />,
  logout: (p) => <Icon {...p} d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />,
  check:  (p) => <Icon {...p} d="M5 13l4 4L19 7" />,
  x:      (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  upload: (p) => <Icon {...p} d="M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />,
  pin:    (p) => <Icon {...p} d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z M12 10h.01" />,
  layers: (p) => <Icon {...p} d="M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5" />,
};

window.I = I;
window.Icon = Icon;
