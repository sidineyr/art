/* Indicative public page loads. No Auth, form data, or hash-route counting. */
(() => {
  'use strict';
  const badge = document.querySelector('#site-access-counter');
  const status = document.querySelector('#site-access-status');
  if (!badge || badge.dataset.requested) return;
  if (location.hostname !== 'sidineyr.github.io' || !(location.pathname === '/art' || location.pathname.startsWith('/art/'))) return;
  badge.dataset.requested = 'true';
  badge.onload = () => { badge.hidden = false; status.textContent = 'Acessos desde 07/11/2026 · contagem indicativa, sem cadastro.'; };
  badge.onerror = () => { badge.hidden = true; status.textContent = 'Contador temporariamente indisponível.'; };
  // One image request per document. In-page navigation never requests another hit.
  badge.src = badge.dataset.src;
})();
