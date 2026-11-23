/* Commission enquiry: validate the site facts, then draft the mail. */
(function () {
  'use strict';

  var form = document.getElementById('enquiry');
  if (!form) return;

  var success = document.getElementById('success');
  var draftText = document.getElementById('draft-text');
  var mailLink = document.getElementById('mail-link');
  var recipient = 'studio@prismaticmirror.nl';

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please give a name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please add an email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That address looks incomplete.';
    },
    where: function (v) { return v.trim().length >= 3 ? '' : 'Which site and town?'; },
    room: function (v) { return v.trim().length >= 20 ? '' : 'A sentence about the room is enough to start.'; }
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

    var subject = 'Commission enquiry — ' + value('kind') + ' — ' + value('where');
    var body = [
      'Name: ' + value('name'),
      'Email: ' + value('email'),
      'Commission: ' + value('kind'),
      'Site: ' + value('where'),
      'Opening date: ' + (value('when') || 'not given'),
      'Lighting: ' + (value('light') || 'not given'),
      '',
      'The space:',
      value('room')
    ].join('\n');

    var href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    mailLink.setAttribute('href', href);
    draftText.textContent = 'To: ' + recipient + '\nSubject: ' + subject + '\n\n' + body;
    document.getElementById('success-copy').textContent = 'Thank you, ' + value('name').split(' ')[0] + '. The draft is below. We will come back on the fold count the space can carry before we discuss a fee.';
    success.hidden = false;
    success.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();
