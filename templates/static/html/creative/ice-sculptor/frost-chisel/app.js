/* Shared behaviour: mobile menu, footer year. */
(function () {
  'use strict';

  var button = document.querySelector('.menu-btn');
  var mobile = document.getElementById('mobile-nav');

  if (button && mobile) {
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      mobile.hidden = open;
    });
    mobile.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        button.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && button.getAttribute('aria-expanded') === 'true') {
        button.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      }
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
