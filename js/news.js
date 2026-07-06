document.addEventListener('DOMContentLoaded', function () {
  var buttons = document.querySelectorAll('[data-filter]');
  var cards = document.querySelectorAll('.newsCard');

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.getAttribute('data-filter');

      buttons.forEach(function (btn) { btn.classList.remove('active'); });
      button.classList.add('active');

      cards.forEach(function (card) {
        var category = card.getAttribute('data-category');
        var show = filter === 'all' || filter === category;
        card.classList.toggle('is-hidden', !show);
      });

      if (typeof gtag === 'function') {
        gtag('event', 'news_filter_click', {
          event_category: 'content',
          event_label: filter
        });
      }
    });
  });

  document.querySelectorAll('.newsCard a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'blog_outbound_click', {
          event_category: 'content',
          event_label: link.querySelector('h2') ? link.querySelector('h2').innerText : '분양정보 블로그'
        });
      }
    });
  });
});
