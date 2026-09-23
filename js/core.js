/* ===========================================================================
   REZYN — Noyau d'interface
   Navigation, révélations, chiffres, questions, avant/après.
   Chaque module ne s'active que si son markup existe.
   =========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ Navigation */
  function initNav() {
    var nav = document.querySelector('[data-nav]');
    if (!nav) return;

    var toggle = nav.querySelector('[data-nav-toggle]');
    var drawer = document.querySelector('[data-nav-drawer]');

    function onScroll() {
      nav.classList.toggle('is-stuck', window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      drawer.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      // Rideau ouvert : la barre repasse sur fond ivoire
      if (open) nav.classList.add('is-stuck');
      else onScroll();
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1140) setOpen(false);
    });
  }

  /* ------------------------------------------------- Révélation au défilement */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal], [data-veil]');
    if (!items.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var group = entry.target.parentElement;
        var siblings = group ? Array.prototype.filter.call(group.children, function (c) {
          return c.hasAttribute && (c.hasAttribute('data-reveal') || c.hasAttribute('data-veil'));
        }) : [];
        var index = siblings.indexOf(entry.target);

        // Décalage lent, très espacé : la maison ne se presse pas
        entry.target.style.setProperty('--reveal-delay', Math.min(index < 0 ? 0 : index, 5) * 90 + 'ms');
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ Chiffres */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    function format(value, decimals) {
      return value.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduceMotion.matches) {
        el.textContent = format(target, decimals) + suffix;
        return;
      }

      var start = performance.now();
      var duration = 1600;
      var settled = false;

      function frame(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(target * eased, decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else settled = true;
      }
      requestAnimationFrame(frame);

      // Filet de sécurité si rAF est gelé (onglet en arrière-plan)
      setTimeout(function () {
        if (!settled) el.textContent = format(target, decimals) + suffix;
      }, duration + 200);
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------- Questions */
  function initFaq() {
    document.querySelectorAll('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        item.classList.toggle('is-open', !open);
      });
    });
  }

  /* -------------------------------------------------------------- Avant/après */
  function initCompare() {
    document.querySelectorAll('[data-compare]').forEach(function (el) {
      var range = el.querySelector('.compare__range');
      if (!range) return;

      function apply() {
        var v = Number(range.value);
        el.style.setProperty('--split', v + '%');
        el.style.setProperty('--split-inv', (100 - v) + '%');
        range.setAttribute('aria-valuetext', 'Révélation ' + v + ' %');
      }

      range.addEventListener('input', apply);
      apply();
    });
  }

  /* ------------------------------------------------------------ Année courante */
  function initYear() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });
  }

  function boot() {
    initNav();
    initReveal();
    initCounters();
    initFaq();
    initCompare();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
