/* Archive topic filters and pagination, reflected in shareable URLs. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceMQ.matches;
  const pad2 = (n) => String(n).padStart(2, '0');

  const LABELS = Object.fromEntries($$('[data-filter]').map(button => [button.dataset.filter, button.dataset.label]));

  /* notes, read from the markup so the HTML stays the source of truth */
  const grid = $('#notes');
  if (!grid) return;
  const cards = $$('.note', grid);
  const notes = cards.map((el) => {
    const link = $('.note__link', el);
    const cat = el.dataset.category;
    return {
      el, cat,
      title: link.textContent.trim(),
      href: link.getAttribute('href'),
      meta: $('.note__byline', el).textContent.replace(/\s+/g, ' ').trim(),
      minutes: Number(el.dataset.minutes) || 0,
    };
  });

  /* counts: hero chips + filter badges */
  const byCat = notes.reduce((m, n) => ((m[n.cat] = (m[n.cat] || 0) + 1), m), {});
  const setStat = (k, v) => $$(`[data-stat="${k}"]`).forEach((s) => (s.textContent = v));
  setStat('notes', notes.length);
  setStat('minutes', notes.reduce((t, n) => t + n.minutes, 0));
  $$('[data-filter]').forEach((b) => {
    const k = b.dataset.filter;
    $('.seg__n', b).textContent = k === 'all' ? notes.length : byCat[k] || 0;
  });

  /* filters, with a FLIP reflow so you can see where each card went */
  const heading = $('#notes-heading');
  const countEl = $('#notes-count');
  const opts = $$('[data-filter]');
  const seg = $('.seg');
  const pager = $('#pagination');
  const pageSize = Math.max(1, Number(grid.dataset.pageSize) || 4);
  let currentCategory = 'all';
  let currentPage = 1;

  function pageURL(page, category = currentCategory) {
    const url = new URL(location.href);
    category === 'all' ? url.searchParams.delete('topic') : url.searchParams.set('topic', category);
    page === 1 ? url.searchParams.delete('page') : url.searchParams.set('page', String(page));
    return url;
  }

  function pageLink(label, page, className = '') {
    const link = document.createElement('a');
    const url = pageURL(page);
    url.hash = 'notes-heading';
    link.href = url.href;
    link.dataset.page = String(page);
    link.className = className;
    link.textContent = label;
    return link;
  }

  function renderPagination(totalPages, count) {
    pager.hidden = count === 0;
    const numbers = $('#page-numbers');
    numbers.replaceChildren();
    // Match the reference's opening state: 1 2 3 4 … last.
    // Move the four-page window as readers advance through the archive.
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
    const end = Math.min(totalPages, start + 3);
    let previous = 0;
    for (let page = 1; page <= totalPages; page++) {
      if (page !== 1 && page !== totalPages && (page < start || page > end)) continue;
      if (page - previous > 1) {
        const item = document.createElement('li');
        const gap = document.createElement('span');
        gap.className = 'pager__gap';
        gap.setAttribute('aria-hidden', 'true');
        gap.textContent = '…';
        item.append(gap);
        numbers.append(item);
      }
      const item = document.createElement('li');
      const link = pageLink(String(page), page);
      link.setAttribute('aria-label', `Page ${page}`);
      if (page === currentPage) link.setAttribute('aria-current', 'page');
      item.append(link);
      numbers.append(item);
      previous = page;
    }
    $('#page-label').textContent = `Page ${currentPage} of ${totalPages}`;
    for (const [selector, label, page, disabled] of [
      ['#page-newer', 'Newer', currentPage - 1, currentPage === 1],
      ['#page-older', 'Older', currentPage + 1, currentPage === totalPages],
    ]) {
      let control;
      if (disabled) {
        control = document.createElement('span');
        control.className = 'pager__btn is-disabled';
        control.setAttribute('aria-disabled', 'true');
        control.textContent = label;
      } else {
        control = pageLink(label, page, 'pager__btn');
        control.rel = page < currentPage ? 'prev' : 'next';
      }
      control.id = selector.slice(1);
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = selector === '#page-newer' ? '←' : '→';
      if (selector === '#page-newer') control.prepend(arrow, ' ');
      else control.append(' ', arrow);
      $(selector).replaceWith(control);
    }
  }

  function applyFilter(cat, { animate = true, page = 1 } = {}) {
    if (!LABELS[cat]) cat = 'all';
    const first = new Map(cards.map((c) => [c, c.hidden ? null : c.getBoundingClientRect()]));

    const matching = cards.filter(card => cat === 'all' || card.dataset.category === cat);
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    currentCategory = cat;
    currentPage = Math.min(totalPages, Math.max(1, Number.isSafeInteger(page) ? page : 1));
    const pageCards = new Set(matching.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    cards.forEach(card => { card.hidden = !pageCards.has(card); });
    renderPagination(totalPages, matching.length);
    opts.forEach((b) => {
      const on = b.dataset.filter === cat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const visible = cards.filter((c) => !c.hidden);
    const activeOpt = opts.find((b) => b.dataset.filter === cat);
    if (seg.scrollWidth > seg.clientWidth) {
      seg.scrollTo({
        left: activeOpt.offsetLeft - (seg.clientWidth - activeOpt.offsetWidth) / 2,
        behavior: animate && !reduced() ? 'smooth' : 'auto',
      });
    }
    heading.textContent = LABELS[cat];
    countEl.textContent = pad2(matching.length);

    if (!animate || reduced()) return;
    visible.forEach((c) => {
      const a = first.get(c);
      if (!a) {
        c.animate(
          [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1.25)' }
        );
        return;
      }
      const b = c.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      c.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(.3,1.1,.35,1)' }
      );
    });
  }

  opts.forEach((b) =>
    b.addEventListener('click', () => {
      const cat = b.dataset.filter;
      applyFilter(cat);
      try {
        history.pushState(null, '', pageURL(currentPage));
      } catch { /* sandboxed frames can refuse this; the filter still works */ }
    })
  );
  /* scroll hint on the segmented control when it overflows (phones) */
  const edges = () => {
    const max = seg.scrollWidth - seg.clientWidth;
    seg.classList.toggle('more-start', max > 1 && seg.scrollLeft > 1);
    seg.classList.toggle('more-end', max > 1 && seg.scrollLeft < max - 1);
  };
  seg.addEventListener('scroll', edges, { passive: true });
  addEventListener('resize', edges);
  edges();

  function restoreFromURL() {
    const params = new URLSearchParams(location.search);
    applyFilter(params.get('topic') || 'all', { animate: false, page: Number(params.get('page') || 1) });
    try { history.replaceState(null, '', pageURL(currentPage)); } catch { /* Embedded previews. */ }
  }
  pager.addEventListener('click', event => {
    const link = event.target.closest('a[data-page]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    applyFilter(currentCategory, { page: Number(link.dataset.page), animate: false });
    try { history.pushState(null, '', link.href); } catch { /* Embedded previews. */ }
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  });
  addEventListener('popstate', restoreFromURL);
  restoreFromURL();

})();
