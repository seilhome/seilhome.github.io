document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.news-modern-card a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        var title = link.querySelector('h2');
        gtag('event', 'blog_outbound_click', {event_category:'content', event_label:title ? title.innerText : '분양정보 블로그'});
      }
    });
  });
});
