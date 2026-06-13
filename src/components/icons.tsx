// Small inline SVG icons (no external dependency). Each inherits `currentColor`
// and sizes to 1em so they align with surrounding text.

type IconProps = { size?: number | string };

/**
 * Project mark: a classic soccer ball. Mirrors `public/favicon.svg` so the
 * favicon and the in-app brand stay visually identical. Uses its own viewBox
 * and explicit colors (it is a logo, not a stroke-only line icon).
 */
export function IconBall({ size = '1em' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="icon-ball-clip">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#ffffff" />
      <g clipPath="url(#icon-ball-clip)" fill="#111827">
        <polygon points="32,23 40.56,29.22 37.29,39.28 26.71,39.28 23.44,29.22" />
        <polygon points="32,9.5 24.87,4.32 27.59,-4.07 36.41,-4.07 39.13,4.32" />
        <polygon points="53.4,25.05 56.12,16.66 64.94,16.66 67.66,25.05 60.53,30.23" />
        <polygon points="45.22,50.2 54.04,50.2 56.76,58.59 49.63,63.77 42.5,58.59" />
        <polygon points="18.78,50.2 21.5,58.59 14.37,63.77 7.24,58.59 9.96,50.2" />
        <polygon points="10.6,25.05 3.47,30.23 -3.66,25.05 -0.94,16.66 7.88,16.66" />
      </g>
      <g
        clipPath="url(#icon-ball-clip)"
        fill="none"
        stroke="#111827"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 23 L32 2" />
        <path d="M40.56 29.22 L60.53 22.73" />
        <path d="M37.29 39.28 L49.63 56.27" />
        <path d="M26.71 39.28 L14.37 56.27" />
        <path d="M23.44 29.22 L3.47 22.73" />
      </g>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#111827" strokeWidth={2.4} />
    </svg>
  );
}

function svgProps(size: number | string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
}

export function IconUser({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export function IconUsers({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 21v-1a5.5 5.5 0 0 1 5.5-5.5h2A5.5 5.5 0 0 1 15.5 20v1" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M18 14.2A5.5 5.5 0 0 1 21.5 19v2" />
    </svg>
  );
}

export function IconTrash({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function IconPlus({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconSync({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-8-5" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 8 5" />
      <path d="M21 3v5h-5" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function IconChevron({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconInfo({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function IconExternalLink({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M14 5h5v5" />
      <path d="M19 5l-8 8" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function IconEye({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconClose({ size = '1em' }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
