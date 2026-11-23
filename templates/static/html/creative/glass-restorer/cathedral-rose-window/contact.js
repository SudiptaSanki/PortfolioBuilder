/* Enquiry form: validates in place, then hands the visitor a mail draft.
   Nothing is submitted anywhere; the page produces the message the studio
   would otherwise have to ask for. */
(function () {
  'use strict';

  var form = document.getElementById('enquiry');
  if (!form) return;

  var success = document.getElementById('form-success');
  var draftText = document.getElementById('draft-text');
  var mailLink = document.getElementById('mail-link');
  var recipient = 'studio@cameandcobalt.fr';

  var rules = {
    name: function (value) { return value.trim().length >= 2 ? '' : 'Please give a name we can reply to.'; },
    email: function (value) {
      if (!value.trim()) return 'Please add an email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'That address is missing a domain or a dot.';
    },
    building: function (value) { return value.trim().length >= 3 ? '' : 'Please name the building and the town.'; },
    window: function (value) { return value.trim().length >= 20 ? '' : 'A sentence or two about the window is enough.'; }
  };

  function setError(field, message) {
    var wrapper = field.closest('.field');
    var output = document.getElementById(field.id + '-error');
    if (wrapper) wrapper.classList.toggle('is-invalid', Boolean(message));
    if (output) output.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) field.setAttribute('aria-describedby', field.id + '-error');
    else field.removeAttribute('aria-describedby');
  }

  Object.keys(rules).forEach(function (id) {
    var field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur', function () {
      setError(field, rules[id](field.value));
    });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true' && !rules[id](field.value)) {
        setError(field, '');
      }
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var firstBad = null;

    Object.keys(rules).forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;
      var message = rules[id](field.value);
      setError(field, message);
      if (message && !firstBad) firstBad = field;
    });

    if (firstBad) {
      firstBad.focus();
      return;
    }

    var value = function (id) {
      var node = document.getElementById(id);
      return node ? node.value.trim() : '';
    };

    var subject = 'Survey enquiry — ' + value('building');
    var body = [
      'Name: ' + value('name'),
      'Role or committee: ' + (value('role') || 'not given'),
      'Email: ' + value('email'),
      'Building: ' + value('building'),
      'Request: ' + value('kind'),
      '',
      'The window:',
      value('window'),
      '',
      'Access and timing: ' + (value('access') || 'not given')
    ].join('\n');

    var href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    mailLink.setAttribute('href', href);
    draftText.textContent = 'To: ' + recipient + '\nSubject: ' + subject + '\n\n' + body;

    success.hidden = false;
    document.getElementById('success-copy').textContent = 'Thank you, ' + value('name').split(' ')[0] + '. The draft is below and addressed to the studio. Open it in your mail app, or copy the text and send it yourself.';

    success.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();
