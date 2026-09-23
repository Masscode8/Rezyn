/* ===========================================================================
   REZYN — Réservation d'atelier

   Le site est statique : rien n'est enregistré côté serveur. Ce module compose
   une DEMANDE de réservation (format, date, créneau, participants) que
   l'atelier confirme ensuite. Aucune disponibilité n'est affichée comme
   certaine — les créneaux proposés viennent du calendrier récurrent ci-dessous.

   ┌──────────────────────────────────────────────────────────────────────┐
   │  TOUT SE RÈGLE ICI : formats, tarifs, jours d'ouverture et horaires. │
   └──────────────────────────────────────────────────────────────────────┘
   =========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-booking]');
  if (!root) return;

  /* ------------------------------------------------------------- Les formats */
  var FORMATS = {
    initiation: {
      label: 'Initiation',
      duree: '2 heures',
      prix: 75,           // € par personne
      minPers: 1,
      maxPers: 8
    },
    signature: {
      label: 'Atelier Signature',
      duree: '3 h 30',
      prix: 140,
      minPers: 1,
      maxPers: 6
    },
    grandePiece: {
      label: 'Grande pièce',
      duree: 'Deux séances de 3 h',
      prix: 290,
      minPers: 1,
      maxPers: 4
    },
    privatisation: {
      label: 'Privatisation',
      duree: 'Une demi-journée',
      prix: null,         // sur devis : pas de total affiché
      minPers: 6,
      maxPers: 14
    }
  };

  /* ------------------------------------------- Le calendrier récurrent de l'atelier
     Clé = jour de la semaine (0 = dimanche … 6 = samedi), valeur = horaires. */
  var CALENDRIER = {
    3: ['18 h 30'],              // mercredi, en soirée
    5: ['14 h 00'],              // vendredi
    6: ['10 h 00', '14 h 30']    // samedi
  };

  var SEMAINES_AFFICHEES = 5;    // nombre de semaines proposées
  var DELAI_MINIMUM = 3;         // jours francs avant la première date proposée

  /* ------------------------------------------------------------------ Éléments */
  var els = {
    dates: root.querySelector('[data-dates]'),
    resumeFormat: root.querySelector('[data-resume="format"]'),
    resumeDuree: root.querySelector('[data-resume="duree"]'),
    resumeDate: root.querySelector('[data-resume="date"]'),
    resumePers: root.querySelector('[data-resume="participants"]'),
    resumeTotal: root.querySelector('[data-resume="total"]'),
    resumeNote: root.querySelector('[data-resume="note"]'),
    compteur: root.querySelector('[data-counter]'),
    moins: root.querySelector('[data-counter-minus]'),
    plus: root.querySelector('[data-counter-plus]'),
    recap: root.querySelector('[data-booking-recap]'),
    alerte: root.querySelector('[data-booking-alert]')
  };

  var euros = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  });

  var dateLongue = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  var etat = {
    format: 'initiation',
    dateISO: null,
    dateTexte: null,
    creneau: null,
    participants: 1
  };

  /* --------------------------------------------------- Génération des créneaux */
  function prochainesDates() {
    var out = [];
    var jour = new Date();
    jour.setHours(0, 0, 0, 0);
    jour.setDate(jour.getDate() + DELAI_MINIMUM);

    var fin = new Date(jour);
    fin.setDate(fin.getDate() + SEMAINES_AFFICHEES * 7);

    while (jour <= fin) {
      var horaires = CALENDRIER[jour.getDay()];
      if (horaires && horaires.length) {
        out.push({
          iso: jour.getFullYear() + '-' +
               String(jour.getMonth() + 1).padStart(2, '0') + '-' +
               String(jour.getDate()).padStart(2, '0'),
          texte: dateLongue.format(jour),
          horaires: horaires.slice()
        });
      }
      jour.setDate(jour.getDate() + 1);
    }
    return out;
  }

  function construireDates() {
    var dates = prochainesDates();

    if (!dates.length) {
      els.dates.innerHTML = '<p class="field__hint">Aucun créneau ouvert pour le moment. ' +
        'Écrivez-nous et nous vous proposerons une date.</p>';
      return;
    }

    els.dates.innerHTML = dates.map(function (d) {
      var boutons = d.horaires.map(function (h) {
        return '<button class="slot" type="button" aria-pressed="false" ' +
               'data-slot data-date="' + d.iso + '" data-texte="' + d.texte + '" ' +
               'data-heure="' + h + '">' + h + '</button>';
      }).join('');

      return '<div class="dateline">' +
               '<span class="dateline__day">' + d.texte + '</span>' +
               '<span class="dateline__slots">' + boutons + '</span>' +
             '</div>';
    }).join('');

    els.dates.querySelectorAll('[data-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        els.dates.querySelectorAll('[data-slot]').forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        etat.dateISO = btn.getAttribute('data-date');
        etat.dateTexte = btn.getAttribute('data-texte');
        etat.creneau = btn.getAttribute('data-heure');
        if (els.alerte) els.alerte.classList.remove('is-visible');
        rendre();
      });
    });
  }

  /* --------------------------------------------------------------- Participants */
  function bornerParticipants() {
    var f = FORMATS[etat.format];
    etat.participants = Math.min(f.maxPers, Math.max(f.minPers, etat.participants));
    if (els.moins) els.moins.disabled = etat.participants <= f.minPers;
    if (els.plus) els.plus.disabled = etat.participants >= f.maxPers;
  }

  /* ------------------------------------------------------------------- Affichage */
  function rendre() {
    var f = FORMATS[etat.format];
    bornerParticipants();

    els.resumeFormat.textContent = f.label;
    els.resumeDuree.textContent = f.duree;
    els.resumeDate.textContent = etat.dateTexte
      ? etat.dateTexte + ' · ' + etat.creneau
      : 'À choisir';
    els.resumePers.textContent = etat.participants +
      (etat.participants > 1 ? ' participants' : ' participant');
    if (els.compteur) els.compteur.textContent = etat.participants;

    if (f.prix === null) {
      els.resumeTotal.textContent = 'Sur devis';
      els.resumeNote.textContent = 'Les privatisations sont chiffrées au cas par cas, ' +
        'selon le lieu et le nombre de participants.';
    } else {
      els.resumeTotal.textContent = euros.format(f.prix * etat.participants);
      els.resumeNote.textContent = euros.format(f.prix) + ' par personne, matière, ' +
        'outillage et finition compris. Vous repartez avec votre pièce.';
    }

    // Le récapitulatif part avec la demande
    if (els.recap) {
      els.recap.value =
        'Demande de réservation\n' +
        '— Atelier : ' + f.label + ' (' + f.duree + ')\n' +
        '— Créneau souhaité : ' + (etat.dateTexte ? etat.dateTexte + ' à ' + etat.creneau : 'non précisé') + '\n' +
        '— Participants : ' + etat.participants + '\n' +
        '— Montant indicatif : ' + (f.prix === null ? 'sur devis' : euros.format(f.prix * etat.participants));
    }
  }

  /* -------------------------------------------------------------------- Écoutes */
  root.querySelectorAll('input[name="format"]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      etat.format = FORMATS[input.value] ? input.value : 'initiation';
      rendre();
    });
  });

  if (els.moins) {
    els.moins.addEventListener('click', function () {
      etat.participants -= 1;
      rendre();
    });
  }

  if (els.plus) {
    els.plus.addEventListener('click', function () {
      etat.participants += 1;
      rendre();
    });
  }

  /* Le créneau n'est pas un champ de formulaire : on le contrôle à la main
     avant de laisser partir la demande. */
  var form = root.querySelector('[data-form]');

  /* form.reset() vide aussi le récapitulatif caché : on le reconstruit
     aussitôt, pour qu'une seconde demande parte complète. */
  if (form) {
    form.addEventListener('reset', function () {
      setTimeout(rendre, 0);
    });
  }

  if (form && els.alerte) {
    form.addEventListener('submit', function (e) {
      if (etat.dateISO) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      els.alerte.classList.add('is-visible');
      els.alerte.setAttribute('tabindex', '-1');
      els.alerte.focus();
    }, true);
  }

  /* ---------------------------------------------------------------------- Boot */
  var coche = root.querySelector('input[name="format"]:checked');
  if (coche && FORMATS[coche.value]) etat.format = coche.value;
  etat.participants = FORMATS[etat.format].minPers;

  construireDates();
  rendre();
})();
