// Smooth-scroll for the in-page anchor nav (Work / About / Contact / the [NN] mark).
// This is the only JavaScript on the site. Everything else is plain HTML and CSS.
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener('click', function (event) {
    var targetId = link.getAttribute('href').slice(1);
    var target = document.getElementById(targetId);

    // Placeholder links (href="#" with no matching id, e.g. the booking/CV/LinkedIn
    // placeholders) fall through to default behavior instead of jumping to the top.
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
