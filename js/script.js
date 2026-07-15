// Poster carousel (homepage) — one slide visible at a time, loops both ways
const posterTrack = document.getElementById('poster-track');
if (posterTrack) {
  const slides = Array.from(posterTrack.children);
  const dotsWrap = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let current = 0;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    posterTrack.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === current)));
  }

  goTo(0);

  // Auto-advance every 6 seconds, pausing while the user is interacting with it
  const AUTO_ADVANCE_MS = 3500;
  const carouselHoverZone = document.querySelector('.carousel-viewport');
  const prefersReducedMotionCarousel = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoTimer = null;

  function startAutoAdvance() {
    if (prefersReducedMotionCarousel) return;
    stopAutoAdvance();
    autoTimer = setInterval(() => goTo(current + 1), AUTO_ADVANCE_MS);
  }
  function stopAutoAdvance() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  function restartAutoAdvance() {
    startAutoAdvance();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); restartAutoAdvance(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); restartAutoAdvance(); });
  dots.forEach((dot) => dot.addEventListener('click', restartAutoAdvance));

  if (carouselHoverZone) {
    carouselHoverZone.addEventListener('mouseenter', stopAutoAdvance);
    carouselHoverZone.addEventListener('mouseleave', startAutoAdvance);
    carouselHoverZone.addEventListener('focusin', stopAutoAdvance);
    carouselHoverZone.addEventListener('focusout', startAutoAdvance);
  }

  startAutoAdvance();

  // Basic touch swipe support
  let touchStartX = null;
  posterTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoAdvance();
  }, { passive: true });
  posterTrack.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(delta < 0 ? current + 1 : current - 1);
    }
    touchStartX = null;
    startAutoAdvance();
  });
}

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
const navBackdrop = document.getElementById('nav-backdrop');
const moreToggle = document.getElementById('more-toggle');
const moreMenu = document.getElementById('more-menu');

function closeMoreMenu() {
  if (!moreToggle || !moreMenu) return;
  moreMenu.classList.remove('is-open');
  moreToggle.setAttribute('aria-expanded', 'false');
}

function closeMobileNav() {
  if (!navToggle || !mainNav) return;
  mainNav.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  if (navBackdrop) navBackdrop.classList.remove('is-open');
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    if (navBackdrop) navBackdrop.classList.toggle('is-open', isOpen);
    if (!isOpen) closeMoreMenu();
  });

  // Close the whole mobile panel on any top-level link (About, Line-up, Drumsheds, Rise Up, FAQs...)
  mainNav.querySelectorAll(':scope > ul > li > a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileNav();
      closeMoreMenu();
    });
  });

  // Tapping the dimmed backdrop closes the panel, same as tapping the hamburger again
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMobileNav);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });
}

// "More" dropdown
if (moreToggle && moreMenu) {
  moreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = moreMenu.classList.toggle('is-open');
    moreToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Bug fix: clicking a same-page anchor link (e.g. index.html#gallery while
  // already on index.html) doesn't reload the page, so the menu was never
  // told to close and stayed floating open under the header. Close it
  // explicitly on every click inside the menu, not just on navigation.
  moreMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMoreMenu();
      closeMobileNav();
    });
  });

  document.addEventListener('click', (e) => {
    if (!moreMenu.contains(e.target) && e.target !== moreToggle && !moreToggle.contains(e.target)) {
      closeMoreMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMoreMenu();
  });

  // If the viewport crosses the desktop/mobile breakpoint while the menu is
  // open, its old open state can otherwise get stuck between layouts.
  window.addEventListener('resize', () => {
    closeMoreMenu();
    closeMobileNav();
  });
}

// Countdown timer — City Splash, Monday 31 May 2027, Brockwell Park
const COUNTDOWN_TARGET = new Date('2027-05-31T12:00:00+01:00').getTime();

function updateCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  if (!daysEl) return;

  const diff = COUNTDOWN_TARGET - Date.now();
  if (diff <= 0) {
    [daysEl, hoursEl, minsEl, secsEl].forEach((el) => (el.textContent = '00'));
    return;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minsEl.textContent = pad(mins);
  secsEl.textContent = pad(secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Hero title letter-drip-in + hover wave, and scroll-reveal for sections.
// Skipped entirely for users who've asked for reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const heroTitle = document.querySelector('.hero-title');

  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.setAttribute('aria-label', text);
    heroTitle.textContent = '';

    const letters = [...text].map((ch, i) => {
      const span = document.createElement('span');
      span.className = 'letter drip-in';
      span.style.setProperty('--i', i);
      span.textContent = ch === ' ' ? ' ' : ch;
      span.setAttribute('aria-hidden', 'true');
      heroTitle.appendChild(span);
      return span;
    });

    // Drop the one-off entrance class once it's finished so it doesn't replay.
    letters.forEach((span) => {
      span.addEventListener('animationend', () => span.classList.remove('drip-in'), { once: true });
    });

    // Playful wave ripples through the letters on hover, re-triggerable each time.
    heroTitle.addEventListener('mouseenter', () => {
      letters.forEach((span) => {
        span.classList.remove('waving');
        void span.offsetWidth;
        span.classList.add('waving');
      });
    });
    letters.forEach((span) => {
      span.addEventListener('animationend', (e) => {
        if (e.animationName === 'letterWave') span.classList.remove('waving');
      });
    });
  }

  const revealEls = document.querySelectorAll(
    'section h2, .pillar, .ticket-card, .headliner-card, .sponsor-card, .cohort-card, .product-card'
  );
  if (revealEls.length && 'IntersectionObserver' in window) {
    revealEls.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  }
}

// FAQ accordion
document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
  const panel = trigger.nextElementSibling;
  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.accordion-trigger').forEach((t) => {
      t.setAttribute('aria-expanded', 'false');
      t.nextElementSibling.style.maxHeight = null;
    });

    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

// Newsletter form (demo only — no backend wired up)
const newsletterForm = document.getElementById('newsletter-form');
const newsletterStatus = document.getElementById('newsletter-status');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterStatus.textContent = "Thanks — you're on the list! (demo form, not yet connected)";
    newsletterForm.reset();
  });
}

// Footer year
const footerYear = document.getElementById('footer-year');
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}
