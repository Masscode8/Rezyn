/* ===========================================================================
   REZYN — Galerie : filtres accessibles + visionneuse
   =========================================================================== */
(function () {
  'use strict';

  var gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  var shots = Array.prototype.slice.call(gallery.querySelectorAll('.piece'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var liveCount = document.querySelector('[data-gallery-count]');
  var visible = shots.slice();

  /* ------------------------------------------------------------------ Filtres */
  function applyFilter(value) {
    visible = [];
    shots.forEach(function (shot) {
      var match = value === 'all' || shot.getAttribute('data-category') === value;
      shot.classList.toggle('is-hidden', !match);
      if (match) visible.push(shot);
    });

    filters.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-filter') === value));
    });

    if (liveCount) {
      liveCount.textContent = visible.length + (visible.length > 1 ? ' pièces' : ' pièce');
    }
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  /* ------------------------------------------------------------- Visionneuse */
  var box = document.querySelector('[data-lightbox]');
  if (!box) return;

  var img = box.querySelector('.lightbox__img');
  var title = box.querySelector('[data-lb-title]');
  var spec = box.querySelector('[data-lb-spec]');
  var counter = box.querySelector('[data-lb-counter]');
  var btnClose = box.querySelector('[data-lb-close]');
  var btnPrev = box.querySelector('[data-lb-prev]');
  var btnNext = box.querySelector('[data-lb-next]');
  var lastFocus = null;
  var index = 0;

  function show(i) {
    if (!visible.length) return;
    index = (i + visible.length) % visible.length;
    var shot = visible[index];
    var source = shot.querySelector('img');

    img.src = source.getAttribute('src');
    img.alt = source.getAttribute('alt');
    title.textContent = shot.getAttribute('data-title') || '';
    spec.textContent = shot.getAttribute('data-spec') || '';
    counter.textContent = (index + 1) + ' / ' + visible.length;
  }

  function open(shot) {
    lastFocus = document.activeElement;
    index = visible.indexOf(shot);
    if (index < 0) index = 0;
    show(index);
    box.classList.add('is-open');
    box.removeAttribute('aria-hidden');
    document.body.classList.add('is-locked');
    btnClose.focus();
  }

  function close() {
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  shots.forEach(function (shot) {
    shot.addEventListener('click', function () { open(shot); });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(index - 1); });
  btnNext.addEventListener('click', function () { show(index + 1); });

  box.addEventListener('click', function (e) {
    if (e.target === box) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { show(index - 1); return; }
    if (e.key === 'ArrowRight') { show(index + 1); return; }

    // Piège de focus : la tabulation reste dans la visionneuse
    if (e.key === 'Tab') {
      var focusables = box.querySelectorAll('button');
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  applyFilter('all');
})();
