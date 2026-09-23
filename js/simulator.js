/* ===========================================================================
   REZYN — Simulateur d'estimation
   Calcul transparent : chaque ligne du devis est affichée et justifiée.
   =========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-simulator]');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var SYSTEMS = {
    signature: { label: 'Époxy Signature', rate: 120 },
    metal: { label: 'Métal Liquide', rate: 180 },
    prisme: { label: 'Prisme Premium', rate: 220 }
  };

  var PREPARATIONS = {
    none: { label: 'Support déjà prêt', rate: 0 },
    light: { label: 'Ponçage léger', rate: 15 },
    full: { label: 'Grenaillage complet', rate: 30 },
    heavy: { label: 'Reprise de dalle', rate: 50 }
  };

  var FINISHES = {
    standard: { label: 'Vernis standard', rate: 0 },
    grip: { label: 'Antidérapant R10', rate: 20 },
    mirror: { label: 'Brillance miroir', rate: 35 },
    depth: { label: 'Effet 3D métallisé', rate: 45 }
  };

  var DELAYS = {
    planned: { label: 'Planning standard', factor: 0 },
    express: { label: 'Intervention express', factor: 0.12 }
  };

  var MOBILISATION = 390;   // étude, protections, matériel, mise en œuvre
  var MIN_SURFACE = 10;

  var els = {
    surface: root.querySelector('[data-input="surface"]'),
    surfaceOut: root.querySelector('[data-output="surface"]'),
    total: root.querySelector('[data-output="total"]'),
    range: root.querySelector('[data-output="range"]'),
    lines: root.querySelector('[data-output="lines"]'),
    perM2: root.querySelector('[data-output="perm2"]'),
    duration: root.querySelector('[data-output="duration"]')
  };

  // Les boutons de transfert peuvent vivre hors du simulateur (CTA de bas de page)
  var sendButtons = document.querySelectorAll('[data-quote-send]');

  var euros = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  });

  var lastTotal = 0;

  function checked(name, table, fallback) {
    var node = root.querySelector('input[name="' + name + '"]:checked');
    var key = node ? node.value : fallback;
    return table[key] ? key : fallback;
  }

  /** Remise de volume : le coût au m² baisse quand le chantier s'allonge. */
  function volumeDiscount(surface) {
    if (surface >= 250) return 0.1;
    if (surface >= 100) return 0.05;
    return 0;
  }

  function workdays(surface) {
    // 1 jour de préparation + ~45 m² posés par jour + 2 jours de durcissement
    return Math.max(3, Math.ceil(surface / 45) + 3);
  }

  function animateTotal(to) {
    if (reduceMotion.matches) {
      els.total.textContent = euros.format(to);
      lastTotal = to;
      return;
    }

    var from = lastTotal;
    var start = performance.now();
    var duration = 420;

    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      els.total.textContent = euros.format(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
      else lastTotal = to;
    }
    requestAnimationFrame(frame);

    // Filet de sécurité : si rAF est gelé (onglet en arrière-plan, économie
    // d'énergie), le montant exact doit tout de même s'afficher.
    setTimeout(function () {
      if (lastTotal !== to) {
        els.total.textContent = euros.format(to);
        lastTotal = to;
      }
    }, duration + 160);
  }

  function row(label, value, muted) {
    return '<div class="estimate__line"><dt>' + label + '</dt><dd' +
      (muted ? ' style="color:var(--color-accent)"' : '') + '>' + value + '</dd></div>';
  }

  function compute() {
    var surface = Math.max(MIN_SURFACE, Number(els.surface.value) || MIN_SURFACE);

    var system = SYSTEMS[checked('system', SYSTEMS, 'metal')];
    var prep = PREPARATIONS[checked('prep', PREPARATIONS, 'light')];
    var finish = FINISHES[checked('finish', FINISHES, 'standard')];
    var delay = DELAYS[checked('delay', DELAYS, 'planned')];

    var resin = system.rate * surface;
    var preparation = prep.rate * surface;
    var finishing = finish.rate * surface;

    var subtotal = resin + preparation + finishing + MOBILISATION;
    var discountRate = volumeDiscount(surface);
    var discount = Math.round(subtotal * discountRate);
    var rush = Math.round((subtotal - discount) * delay.factor);
    var total = Math.round(subtotal - discount + rush);

    /* ---------------------------------------------------------- Affichage */
    els.surfaceOut.textContent = surface + ' m²';
    els.surface.style.setProperty(
      '--fill',
      ((surface - MIN_SURFACE) / (Number(els.surface.max) - MIN_SURFACE)) * 100 + '%'
    );

    var html = '';
    html += row(system.label + ' · ' + surface + ' m²', euros.format(resin));
    if (preparation > 0) html += row(prep.label, euros.format(preparation));
    if (finishing > 0) html += row(finish.label, euros.format(finishing));
    html += row('Étude, protections, mise en œuvre', euros.format(MOBILISATION));
    if (discount > 0) html += row('Remise volume · −' + Math.round(discountRate * 100) + ' %', '−' + euros.format(discount), true);
    if (rush > 0) html += row(delay.label + ' · +12 %', euros.format(rush));

    els.lines.innerHTML = html;
    animateTotal(total);

    els.perM2.textContent = euros.format(Math.round(total / surface)) + ' / m²';
    els.range.textContent = 'Fourchette indicative ' + euros.format(Math.round(total * 0.92)) +
      ' – ' + euros.format(Math.round(total * 1.08)) + ' TTC';
    els.duration.textContent = workdays(surface) + ' jours';

    return {
      surface: surface,
      system: system.label,
      prep: prep.label,
      finish: finish.label,
      delay: delay.label,
      total: total
    };
  }

  /* --------------------------------------------------- Transfert vers contact */
  function handoff(state) {
    var summary =
      'Estimation Rezyn\n' +
      '— Système : ' + state.system + '\n' +
      '— Surface : ' + state.surface + ' m²\n' +
      '— Préparation : ' + state.prep + '\n' +
      '— Finition : ' + state.finish + '\n' +
      '— Délai : ' + state.delay + '\n' +
      '— Estimation : ' + euros.format(state.total) + ' TTC\n\n' +
      'Précisions sur le projet : ';

    try {
      sessionStorage.setItem('rezyn-estimate', summary);
    } catch (e) {
      /* Stockage refusé : le formulaire restera simplement vide. */
    }
  }

  root.addEventListener('input', function () { compute(); });
  root.addEventListener('change', function () { compute(); });

  Array.prototype.forEach.call(sendButtons, function (btn) {
    btn.addEventListener('click', function () {
      handoff(compute());
    });
  });

  compute();
})();

/* --------------------------------------------- Pré-remplissage côté contact */
(function () {
  'use strict';

  var field = document.querySelector('[data-estimate-target]');
  if (!field) return;

  var stored = null;
  try { stored = sessionStorage.getItem('rezyn-estimate'); } catch (e) { return; }

  if (stored && !field.value) {
    field.value = stored;
    var note = document.querySelector('[data-estimate-note]');
    if (note) note.hidden = false;
  }
})();
