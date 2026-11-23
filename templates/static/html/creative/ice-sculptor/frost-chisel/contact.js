/* Event enquiry: validate the details that decide feasibility, then draft the mail. */
(function () {
  'use strict';

  var form = document.getElementById('event');
  if (!form) return;

  var success = document.getElementById('success');
  var draftText = document.getElementById('draft-text');
  var mailLink = document.getElementById('mail-link');
  var recipient = 'bench@frostchisel.com';

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please give a name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please add an email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That address looks incomplete.';
    },
    date: function (v) { return v.trim().length >= 4 ? '' : 'We need the date to check availability.'; },
    venue: function (v) { return v.trim().length >= 3 ? '' : 'Which venue and town?'; },
    brief: function (v) { return v.trim().length >= 20 ? '' : 'A sentence about the piece is enough.'; }
  };

  function setError(field, message) {
    var wrapper = field.closest('.field');
    var output = document.getElementById(field.id + '-error');
    if (wrapper) wrapper.classList.toggle('is-invalid', Boolean(message));
    if (output) output.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  Object.keys(rules).forEach(function (id) {
    var field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur', function () { setError(field, rules[id](field.value)); });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true' && !rules[id](field.value)) setError(field, '');
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
    if (firstBad) { firstBad.focus(); return; }

    var value = function (id) {
      var node = document.getElementById(id);
      return node ? node.value.trim() : '';
    };

    var subject = 'Ice commission — ' + value('date') + ' — ' + value('venue');
    var body = [
      'Name: ' + value('name'),
      'Email: ' + value('email'),
      'Date: ' + value('date'),
      'Venue: ' + value('venue'),
      'Setting: ' + value('setting'),
      'Room temperature: ' + (value('temp') || 'not given'),
      '',
      'The piece:',
      value('brief')
    ].join('\n');

    var href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    mailLink.setAttribute('href', href);
    draftText.textContent = 'To: ' + recipient + '\nSubject: ' + subject + '\n\n' + body;
    document.getElementById('success-copy').textContent = 'Thank you, ' + value('name').split(' ')[0] + '. We will check the date and come back on the melt window before we talk about design.';
    success.hidden = false;
    success.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();
