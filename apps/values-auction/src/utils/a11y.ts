let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;

function ensureRegion(politeness: 'polite' | 'assertive'): HTMLElement {
  const existing = politeness === 'polite' ? politeRegion : assertiveRegion;
  if (existing) return existing;
  const el = document.createElement('div');
  el.setAttribute('aria-live', politeness);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
  document.body.appendChild(el);
  if (politeness === 'polite') politeRegion = el;
  else assertiveRegion = el;
  return el;
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;
  const region = ensureRegion(politeness);
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 40);
}

export function trapFocus(container: HTMLElement): () => void {
  const focusables = container.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  container.addEventListener('keydown', onKey);
  first?.focus();
  return () => container.removeEventListener('keydown', onKey);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
