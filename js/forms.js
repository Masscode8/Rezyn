/* ===========================================================================
   REZYN — Formulaires
   Validation au blur, erreur sous le champ concerné, résumé focalisable,
   état de chargement puis confirmation.
   Démo front-end : aucun envoi réseau n'est effectué.
   =========================================================================== */
(function () {
  'use strict';

  var forms = document.querySelectorAll('[data-form]');
  if (!forms.length) return;

  var MESSAGES = {
    valueMissing: 'Ce champ est obligatoire.',
    typeMismatch: {
      email: "Saisissez une adresse e-mail valide, par exemple nom@domaine.fr.",
      tel: 'Saisissez un numéro de téléphone valide.'
    },
    tooShort: 'Ce message est trop court : décrivez votre projet en quelques mots.',
    patternMismatch: 'Le format attendu n’est pas respecté.',
    fallback: 'Vérifiez cette information.'
  };

  function messageFor(input) {
    var v = input.validity;
    if (v.valueMissing) return MESSAGES.valueMissing;
    if (v.typeMismatch) return MESSAGES.typeMismatch[input.type] || MESSAGES.fallback;
    if (v.tooShort) return MESSAGES.tooShort;
    if (v.patternMismatch) return MESSAGES.patternMismatch;
    return input.validationMessage || MESSAGES.fallback;
  }

  function setFieldState(input, valid, message) {
    var field = input.closest('.field');
    if (!field) return;

    var error = field.querySelector('.field__error');
    field.classList.toggle('is-invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));

    if (error) {
      error.textContent = valid ? '' : message;
      if (!input.getAttribute('aria-describedby') && error.id) {
        input.setAttribute('aria-describedby', error.id);
      }
    }
  }

  function validate(input) {
    var ok = input.checkValidity();
    setFieldState(input, ok, ok ? '' : messageFor(input));
    return ok;
  }

  forms.forEach(function (form) {
    var inputs = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    var summary = form.querySelector('[data-error-summary]');
    var summaryList = summary ? summary.querySelector('ul') : null;
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit ? submit.textContent : '';

    // Validation au blur uniquement : on n'interrompt jamais la frappe
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value !== '' || input.required) validate(input);
      });

      // Une fois le champ signalé, on le libère dès qu'il redevient valide
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field && field.classList.contains('is-invalid') && input.checkValidity()) {
          setFieldState(input, true, '');
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = inputs.filter(function (input) { return !validate(input); });

      if (invalid.length) {
        if (summary && summaryList) {
          summaryList.innerHTML = invalid.map(function (input) {
            var label = form.querySelector('label[for="' + input.id + '"]');
            var name = label ? label.textContent.replace('*', '').trim() : input.name;
            return '<li><a href="#' + input.id + '">' + name + ' — ' + messageFor(input) + '</a></li>';
          }).join('');

          summary.classList.add('is-visible');
          summary.setAttribute('tabindex', '-1');
          summary.focus();

          summaryList.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function (ev) {
              ev.preventDefault();
              var target = document.querySelector(link.getAttribute('href'));
              if (target) target.focus();
            });
          });
        } else {
          invalid[0].focus();
        }
        return;
      }

      if (summary) summary.classList.remove('is-visible');

      // État de chargement : le bouton est neutralisé pendant l'opération
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Envoi en cours…';
      }

      setTimeout(function () {
        if (submit) {
          submit.disabled = false;
          submit.textContent = submitLabel;
        }

        if (status) {
          status.className = 'form-status form-status--success is-visible';
          status.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-top:2px"><path d="M20 6 9 17l-5-5"/></svg>' +
            '<span><strong>Demande reçue.</strong> ' +
            "L'atelier vous répond sous 24 heures ouvrées, avec une première " +
            'estimation et une date de visite.</span>';
          status.focus();
        }

        form.reset();
        inputs.forEach(function (input) { setFieldState(input, true, ''); });

        // Le simulateur de portée éventuel repart de zéro
        var range = form.querySelector('.range');
        if (range) range.dispatchEvent(new Event('input', { bubbles: true }));
      }, 900);
    });
  });
})();
