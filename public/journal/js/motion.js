/* One-shot entrances: content remains visible if JavaScript is unavailable. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate || !('IntersectionObserver' in window)) return;

  const active = new Set();
  const seen = new WeakSet();
  const reveal = (element, delay = 0) => {
    if (seen.has(element)) return;
    seen.add(element);
    if (preference.matches) return;
    const animation = element.animate([
      { opacity: 0, translate: '0 20px' },
      { opacity: 1, translate: '0 0' },
    ], {
      duration: 640,
      delay,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards',
    });
    active.add(animation);
    const release = () => active.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  };

  // Stagger the opening composition.
  document.querySelectorAll('.hero__text > *, .note-head > *, .error-page > *')
    .forEach((element, index) => reveal(element, Math.min(index * 65, 260)));
  document.querySelectorAll('.hero__art, .note-hero')
    .forEach(element => reveal(element, 140));

  const observer = new IntersectionObserver(entries => {
    let index = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(entry.target, Math.min(index++ * 60, 180));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  // Reveal each article block once. Animate card contents separately so filters
  // can reorder their parent cards without competing for the same transform.
  document.querySelectorAll('#article > *, .filters, .note__media, .note__body, .related__title, .related__row, .site-foot')
    .forEach(element => observer.observe(element));

  // Keyboard focus should never wait for an entrance animation.
  document.addEventListener('focusin', event => {
    active.forEach(animation => {
      if (animation.effect?.target?.contains(event.target)) animation.finish();
    });
  });
  preference.addEventListener('change', () => {
    if (preference.matches) active.forEach(animation => animation.finish());
  });
})();
