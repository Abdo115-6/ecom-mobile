// Props for any motion.* element that should fade and slide in once scrolled into view
// (visitors with "reduce motion" enabled get no movement, see MotionConfig in App.tsx)
export const revealOnScroll = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px -60px 0px' },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
};
