/* Shared behaviour: mobile menu, footer year. */
(function () {
  'use strict';

  var button = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');

  if (button && menu) {
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        button.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && button.getAttribute('aria-expanded') === 'true') {
        button.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
