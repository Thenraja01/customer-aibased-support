export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
export const slideUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
export const slideIn = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
export const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };
export const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };
export const staggerItem = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };
