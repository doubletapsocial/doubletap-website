// DoubleTap: site interactions

// ---- Mesh background cursor-following glow ----
(function () {
  var root = document.documentElement;
  var lastX = window.innerWidth / 2;
  var lastY = window.innerHeight * 0.4;
  root.style.setProperty('--mx', lastX + 'px');
  root.style.setProperty('--my', lastY + 'px');

  window.addEventListener('mousemove', function (e) {
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (!e.touches || !e.touches.length) return;
    root.style.setProperty('--mx', e.touches[0].clientX + 'px');
    root.style.setProperty('--my', e.touches[0].clientY + 'px');
  }, { passive: true });
})();

// ---- Scroll-spy: highlight nav link for section in view ----
(function () {
  var navLinks = document.querySelectorAll('.nav a:not(.nav__cta)');
  if (!navLinks.length) return;

  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href');
    if (id && id.charAt(0) === '#') {
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    }
  });
  if (!sections.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var match = sections.find(function (s) { return s.section === entry.target; });
      if (!match) return;
      if (entry.isIntersecting) {
        navLinks.forEach(function (l) { l.classList.remove('is-active'); });
        match.link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  sections.forEach(function (s) { io.observe(s.section); });
})();

// ---- Sticky header shadow on scroll ----
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 6);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile nav toggle ----
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;
  toggle.addEventListener('click', function () {
    var open = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ---- Reveal-on-scroll for elements with .reveal ----
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  els.forEach(function (el) { io.observe(el); });
})();

// ---- Service-card mouse spotlight ----
(function () {
  document.querySelectorAll('.service').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * 100;
      var my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', mx + '%');
      card.style.setProperty('--my', my + '%');
    });
  });
})();

// ---- Footer year ----
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();

// ---- Lead capture popup ----
(function () {
  var STORAGE_KEY = 'doubletap-lead-seen';
  var modal = document.getElementById('leadModal');
  var form = document.getElementById('leadForm');
  var note = document.getElementById('leadModalNote');
  if (!modal || !form) return;

  function openModal() {
    if (localStorage.getItem(STORAGE_KEY)) return; // already seen/dismissed/submitted
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal(remember) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    }
  }

  // Show after 8 seconds on page, once per visitor
  var timer = setTimeout(openModal, 8000);

  modal.querySelectorAll('[data-lead-close]').forEach(function (el) {
    el.addEventListener('click', function () { closeModal(true); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(true);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function () {
      form.hidden = true;
      note.hidden = false;
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      setTimeout(function () { closeModal(false); }, 2200);
    }).catch(function () {
      note.textContent = 'Something went wrong. Please try again or email us directly.';
      note.hidden = false;
    });
  });
})();

// ---- Main CTA contact form ----
(function () {
  var form = document.getElementById('mainContactForm');
  var note = document.getElementById('mainContactNote');
  if (!form || !note) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    var originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Sending...';

    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      form.querySelectorAll('label').forEach(function (el) { el.hidden = true; });
      button.hidden = true;
      note.textContent = "Sent, thanks! We'll be in touch within one business day.";
      note.hidden = false;
    }).catch(function () {
      button.disabled = false;
      button.innerHTML = originalText;
      note.textContent = 'Something went wrong. Please try again or email us directly.';
      note.hidden = false;
    });
  });
})();