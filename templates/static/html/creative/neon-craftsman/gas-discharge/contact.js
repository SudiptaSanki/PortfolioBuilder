/* Sign enquiry: validate, then draft the mail. */
(function () {
  'use strict';

  var form = document.getElementById('sign');
  if (!form) return;

  var success = document.getElementById('success');
  var draftText = document.getElementById('draft-text');
  var mailLink = document.getElementById('mail-link');
  var recipient = 'signs@gasdischarge.nyc';

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please give a name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please add an email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That address looks incomplete.';
    },
    where: function (v) { return v.trim().length >= 3 ? '' : 'Which address or neighbourhood?'; },
    wall: function (v) { return v.trim().length >= 20 ? '' : 'A sentence about the wall and the sign is enough.'; }
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

    var subject = 'Sign enquiry — ' + value('kind') + ' — ' + value('where');
    var body = [
      'Name: ' + value('name'),
      'Email: ' + value('email'),
      'Work: ' + value('kind'),
      'Address: ' + value('where'),
      'Width available: ' + (value('size') || 'not given'),
      'When needed: ' + (value('when') || 'not given'),
      '',
      'The wall and the sign:',
      value('wall')
    ].join('\n');

    var href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    mailLink.setAttribute('href', href);
    draftText.textContent = 'To: ' + recipient + '\nSubject: ' + subject + '\n\n' + body;
    document.getElementById('success-copy').textContent = 'Thank you, ' + value('name').split(' ')[0] + '. The draft is below. We will reply with a drawing, a transformer size and a date for the site visit.';
    success.hidden = false;
    success.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();
