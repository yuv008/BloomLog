export const colors = {
  cream: "#FBF7F0",
  sage: "#A8B89A",
  blush: "#E8C5C0",
  beige: "#E8DCC8",
  lavenderGray: "#B8B2C0",
  ink: "#3A3530",
  whisper: "#8A847C",
  night: "#1F1B24",
  moonlight: "#E8E2D5",
  duskSage: "#6E7E6A",
  duskBlush: "#B89186",
} as const;

export const radii = {
  sm: "12px",
  md: "20px",
  lg: "28px",
  pill: "999px",
} as const;

export const shadows = {
  soft: "0 8px 32px rgba(58, 53, 48, 0.06)",
  glass: "0 4px 24px rgba(58, 53, 48, 0.04), inset 0 1px 0 rgba(255,255,255,0.4)",
} as const;

export const motion = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  micro: 0.18,
  standard: 0.4,
  narrative: 0.7,
  spring: { stiffness: 120, damping: 14 },
} as const;

export const typography = {
  display: "var(--font-fraunces)",
  body: "var(--font-inter)",
} as const;
