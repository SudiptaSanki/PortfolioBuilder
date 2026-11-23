/* Shared behaviour: drawer navigation, footer year. */
(function () {
  'use strict';

  var button = document.querySelector('.drawer-btn');
  var drawer = document.getElementById('drawer');

  if (button && drawer) {
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        button.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 880 && button.getAttribute('aria-expanded') === 'true') {
        button.setAttribute('aria-expanded', 'false');
        drawer.hidden = true;
      }
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
