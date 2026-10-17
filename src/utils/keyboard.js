/**
 * Global keyboard shortcuts for the simulator chrome:
 *   "/" focuses operation search, Ctrl+K opens the command palette,
 *   Alt+A authorisation queue, Alt+I inquiry, Escape closes overlays.
 * Returns an unbind function.
 */
export function bindGlobalShortcuts(handlers) {
  function onKeydown(event) {
    const target = event.target;
    const typing = target instanceof HTMLElement
      && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (event.key === '/' && !typing && handlers.onSearchFocus) {
      event.preventDefault();
      handlers.onSearchFocus();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && handlers.onPalette) {
      event.preventDefault();
      handlers.onPalette();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'a' && handlers.onAuthorisationQueue) {
      event.preventDefault();
      handlers.onAuthorisationQueue();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'i' && handlers.onInquiry) {
      event.preventDefault();
      handlers.onInquiry();
      return;
    }
    if (event.key === 'Escape' && handlers.onEscape) {
      handlers.onEscape();
    }
  }

  window.addEventListener('keydown', onKeydown);
  return () => window.removeEventListener('keydown', onKeydown);
}
