/* Shared behaviour: mobile menu, footer year. */
(function () {
  'use strict';

  var burger = document.querySelector('.burger');
  var mobile = document.getElementById('top-mobile');

  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobile.hidden = open;
    });
    mobile.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && burger.getAttribute('aria-expanded') === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      }
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
