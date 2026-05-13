// icons.jsx — small stroke icons (1.5px stroke, currentColor)
// Avoids leaning on icon libraries; keeps a consistent visual language.

const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Pulse: (p) => (
    <Icon {...p}>
      <path d="M3 12h4l2 -6 4 12 2 -6h6" />
    </Icon>
  ),
  Search: (p) => (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20 -3.5 -3.5" />
    </Icon>
  ),
  Portfolio: (p) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 5v-1h6v1" />
    </Icon>
  ),
  Brief: (p) => (
    <Icon {...p}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1 -1 1H6a1 1 0 0 1 -1 -1V4a1 1 0 0 1 1 -1z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h7" />
      <path d="M9 17h5" />
    </Icon>
  ),
  Insights: (p) => (
    <Icon {...p}>
      <path d="M4 19h16" />
      <path d="M7 15v-4" />
      <path d="M12 15v-7" />
      <path d="M17 15v-9" />
    </Icon>
  ),
  Settings: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1 -2.8 2.8l-.1 -.1a1.7 1.7 0 0 0 -1.8 -.3 1.7 1.7 0 0 0 -1 1.5V21a2 2 0 0 1 -4 0v-.1a1.7 1.7 0 0 0 -1 -1.5 1.7 1.7 0 0 0 -1.8 .3l-.1 .1a2 2 0 0 1 -2.8 -2.8l.1 -.1a1.7 1.7 0 0 0 .3 -1.8 1.7 1.7 0 0 0 -1.5 -1H3a2 2 0 0 1 0 -4h.1a1.7 1.7 0 0 0 1.5 -1 1.7 1.7 0 0 0 -.3 -1.8l-.1 -.1a2 2 0 0 1 2.8 -2.8l.1 .1a1.7 1.7 0 0 0 1.8 .3h0a1.7 1.7 0 0 0 1 -1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8 -.3l.1 -.1a2 2 0 0 1 2.8 2.8l-.1 .1a1.7 1.7 0 0 0 -.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0 -1.5 1z" />
    </Icon>
  ),
  ArrowUp: (p) => (
    <Icon {...p}>
      <path d="M7 14l5 -5 5 5" />
    </Icon>
  ),
  ArrowDown: (p) => (
    <Icon {...p}>
      <path d="M7 10l5 5 5 -5" />
    </Icon>
  ),
  ArrowRight: (p) => (
    <Icon {...p}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6 -6 6" />
    </Icon>
  ),
  ArrowLeft: (p) => (
    <Icon {...p}>
      <path d="M19 12H5" />
      <path d="M11 18l-6 -6 6 -6" />
    </Icon>
  ),
  Minus: (p) => (
    <Icon {...p}>
      <path d="M5 12h14" />
    </Icon>
  ),
  Dot: (p) => (
    <Icon {...p} fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="4" />
    </Icon>
  ),
  Sparkle: (p) => (
    <Icon {...p}>
      <path d="M12 3l1.6 5.4 5.4 1.6 -5.4 1.6 -1.6 5.4 -1.6 -5.4 -5.4 -1.6 5.4 -1.6z" />
      <path d="M19 17l.7 1.7 1.8 .6 -1.8 .6 -.7 1.8 -.7 -1.8 -1.8 -.6 1.8 -.6z" />
    </Icon>
  ),
  Refresh: (p) => (
    <Icon {...p}>
      <path d="M4 12a8 8 0 0 1 14 -5l2 -2" />
      <path d="M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1 -14 5l-2 2" />
      <path d="M4 20v-5h5" />
    </Icon>
  ),
  ThumbsUp: (p) => (
    <Icon {...p}>
      <path d="M7 11v9H4v-9z" />
      <path d="M7 11l3 -7c.7 -1.6 3 -1.2 3 .8V10h5.6a2 2 0 0 1 2 2.4l-1.4 6a2 2 0 0 1 -2 1.6H7" />
    </Icon>
  ),
  ThumbsDown: (p) => (
    <Icon {...p}>
      <path d="M7 13V4H4v9z" />
      <path d="M7 13l3 7c.7 1.6 3 1.2 3 -.8V14h5.6a2 2 0 0 0 2 -2.4l-1.4 -6a2 2 0 0 0 -2 -1.6H7" />
    </Icon>
  ),
  Link: (p) => (
    <Icon {...p}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3 -3a4 4 0 0 0 -5.7 -5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0 -5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1 -1" />
    </Icon>
  ),
  Send: (p) => (
    <Icon {...p}>
      <path d="M22 2 11 13" />
      <path d="M22 2l-7 20 -4 -9 -9 -4z" />
    </Icon>
  ),
  Close: (p) => (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  ),
  Plus: (p) => (
    <Icon {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  More: (p) => (
    <Icon {...p}>
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </Icon>
  ),
  Check: (p) => (
    <Icon {...p}>
      <path d="M5 12l5 5 9 -11" />
    </Icon>
  ),
  Calendar: (p) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </Icon>
  ),
  Bolt: (p) => (
    <Icon {...p} fill="currentColor" stroke="none">
      <path d="M13 2 4 14h7l-1 8 9 -12h-7z" />
    </Icon>
  ),
  Doc: (p) => (
    <Icon {...p}>
      <path d="M14 3H6a1 1 0 0 0 -1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1V8z" />
      <path d="M14 3v5h5" />
    </Icon>
  ),
  Slides: (p) => (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </Icon>
  ),
  Pdf: (p) => (
    <Icon {...p}>
      <path d="M14 3H6a1 1 0 0 0 -1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13v5M9 13h2a1.5 1.5 0 0 1 0 3H9" />
    </Icon>
  ),
  Markdown: (p) => (
    <Icon {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 15v-6l2.5 3 2.5 -3v6" />
      <path d="M16 9v6M16 15l-2 -2M16 15l2 -2" />
    </Icon>
  ),
  Warning: (p) => (
    <Icon {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7 -3L13.7 3.9a2 2 0 0 0 -3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  ),
};

Object.assign(window, { Icons, Icon });
