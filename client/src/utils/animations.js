import gsap from 'gsap';

/**
 * Utility to check if user has requested reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Animate a numeric DOM element toward a target value
 * Respects tabular alignment and formatting
 */
export const animateCounter = (element, targetValue, duration = 1.0) => {
  if (!element || prefersReducedMotion()) {
    if (element) element.textContent = targetValue;
    return;
  }

  // Extract raw number if string has formatting
  const isPercent = String(targetValue).includes('%');
  const cleanStr = String(targetValue).replace(/[^0-9.-]/g, '');
  const numValue = parseFloat(cleanStr);

  if (isNaN(numValue)) {
    element.textContent = targetValue;
    return;
  }

  const obj = { val: 0 };
  gsap.to(obj, {
    val: numValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const formatted = numValue % 1 === 0
        ? Math.round(obj.val).toLocaleString()
        : obj.val.toFixed(1);
      element.textContent = isPercent ? `${formatted}%` : formatted;
    },
    onComplete: () => {
      element.textContent = targetValue;
    }
  });
};

/**
 * Staggered entrance animation for cards / list items
 */
export const animateStaggerIn = (container, selector = '.animate-item', stagger = 0.08) => {
  if (!container || prefersReducedMotion()) return null;

  const ctx = gsap.context(() => {
    gsap.from(selector, {
      opacity: 0,
      y: 12,
      duration: 0.45,
      stagger,
      ease: 'power2.out',
      clearProps: 'all'
    });
  }, container);

  return ctx;
};
