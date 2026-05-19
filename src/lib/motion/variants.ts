import { cozyEase, durations } from "./eases";

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.standard, ease: cozyEase },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.standard, ease: cozyEase },
  },
};

export const scaleTap = {
  tap: { scale: 0.97, opacity: 0.9 },
};

export const slideDown = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.narrative, ease: cozyEase },
  },
  exit: { opacity: 0, y: -12, transition: { duration: durations.micro } },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};
