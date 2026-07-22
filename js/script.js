// Hero background video: don't autoplay for users who've asked for reduced motion
const heroVideo = document.getElementById('hero-video');
if (heroVideo) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
  } else {
    // Some mobile browsers only honour autoplay if muted is also set as a JS
    // property (not just the HTML attribute), and can silently reject the
    // play() promise, which leaves the video paused on its poster frame
    // with a visible native play button. Set muted explicitly and retry.
    heroVideo.muted = true;
    heroVideo.setAttribute('muted', '');
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    heroVideo.addEventListener('loadedmetadata', tryPlay);
    heroVideo.addEventListener('canplay', tryPlay);
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });

    // Only reveal the video (fading it in over the poster photo) once
    // frames are actually rendering, not just once play() resolves,
    // since that can fire even when playback is blocked. Until then the
    // video stays invisible, which hides any native "tap to play" glyph
    // WebKit overlays on it (e.g. iOS Low Power Mode) along with it.
    heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'));
  }
}

// Generic sliding carousel: one slide visible at a time, loops both ways,
// auto-advances, and pauses on hover/focus/touch. Used for the homepage
// poster carousel and the line-up headliner reveal carousel.
function initCarousel({ trackId, dotsId, prevId, nextId, viewportSelector }) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const slides = Array.from(track.children);
  const dotsWrap = document.getElementById(dotsId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
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
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === current)));
  }

  goTo(0);

  // Auto-advance every 3.5 seconds, pausing while the user is interacting with it
  const AUTO_ADVANCE_MS = 3500;
  const carouselHoverZone = document.querySelector(viewportSelector);
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
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoAdvance();
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(delta < 0 ? current + 1 : current - 1);
    }
    touchStartX = null;
    startAutoAdvance();
  });
}

// Poster carousel (homepage)
initCarousel({
  trackId: 'poster-track',
  dotsId: 'carousel-dots',
  prevId: 'carousel-prev',
  nextId: 'carousel-next',
  viewportSelector: '.carousel-viewport',
});

// Headliner reveal carousel (line-up page)
initCarousel({
  trackId: 'headliner-track',
  dotsId: 'headliner-dots',
  prevId: 'headliner-prev',
  nextId: 'headliner-next',
  viewportSelector: '.headliner-viewport',
});

// Press quote carousel (homepage)
initCarousel({
  trackId: 'press-track',
  dotsId: 'press-dots',
  viewportSelector: '.press-carousel-viewport',
});

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
const navBackdrop = document.getElementById('nav-backdrop');
const moreToggle = document.getElementById('more-toggle');
const moreMenu = document.getElementById('more-menu');
const moreBack = document.getElementById('more-back');

function closeMoreMenu() {
  if (!moreToggle || !moreMenu) return;
  moreMenu.classList.remove('is-open');
  moreToggle.setAttribute('aria-expanded', 'false');
  if (mainNav) mainNav.classList.remove('nav-drilldown');
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
    if (mainNav) mainNav.classList.toggle('nav-drilldown', isOpen);
  });

  if (moreBack) {
    moreBack.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMoreMenu();
    });
  }

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

// Countdown timer: City Splash, Monday 31 May 2027, Brockwell Park
const COUNTDOWN_TARGET = new Date('2027-05-31T12:00:00+01:00').getTime();

const prefersReducedMotionCountdown = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Flips a countdown digit like an old departure board when its value
// changes - swaps the text at the midpoint of a quick rotateX animation
// instead of just snapping to the new number.
function flipCountdownDigit(el, newValue) {
  if (el.textContent === newValue) return;
  if (prefersReducedMotionCountdown) {
    el.textContent = newValue;
    return;
  }
  el.classList.add('flip-out');
  setTimeout(() => {
    el.textContent = newValue;
    el.classList.remove('flip-out');
    el.classList.add('flip-in');
    setTimeout(() => el.classList.remove('flip-in'), 200);
  }, 150);
}

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
  const days = pad(Math.floor(diff / 86400000));
  const hours = pad(Math.floor((diff % 86400000) / 3600000));
  const mins = pad(Math.floor((diff % 3600000) / 60000));
  const secs = pad(Math.floor((diff % 60000) / 1000));
  const secsChanged = secsEl.textContent !== secs;

  flipCountdownDigit(daysEl, days);
  flipCountdownDigit(hoursEl, hours);
  flipCountdownDigit(minsEl, mins);
  flipCountdownDigit(secsEl, secs);

  // Extra pulse on the seconds chip specifically, since it's the one
  // visibly "alive" every tick rather than just occasionally.
  if (secsChanged && !prefersReducedMotionCountdown) {
    const secsUnit = secsEl.closest('.countdown-unit');
    if (secsUnit) {
      secsUnit.classList.remove('countdown-pulse');
      void secsUnit.offsetWidth;
      secsUnit.classList.add('countdown-pulse');
    }
  }
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Hero title letter-drip-in + hover wave, and scroll-reveal for sections.
// Skipped entirely for users who've asked for reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && !document.body.classList.contains('no-reveal')) {
  const revealEls = document.querySelectorAll(
    'section h2, .pillar, .ticket-card, .lineup-tile, .sponsor-card, .cohort-card, .product-card'
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

// Gallery lightbox
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
if (galleryItems.length && lightbox) {
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let lightboxIndex = 0;

  function showLightboxImage() {
    const img = galleryItems[lightboxIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }
  function openLightbox(index) {
    lightboxIndex = index;
    showLightboxImage();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  function nextLightboxImage() {
    lightboxIndex = (lightboxIndex + 1) % galleryItems.length;
    showLightboxImage();
  }
  function prevLightboxImage() {
    lightboxIndex = (lightboxIndex - 1 + galleryItems.length) % galleryItems.length;
    showLightboxImage();
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextLightboxImage);
  lightboxPrev.addEventListener('click', prevLightboxImage);

  // Click the dark backdrop (not the image or the arrows/close button) to dismiss
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightboxImage();
    if (e.key === 'ArrowLeft') prevLightboxImage();
  });
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

// Newsletter form (demo only, no backend wired up)
const newsletterForm = document.getElementById('newsletter-form');
const newsletterStatus = document.getElementById('newsletter-status');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterStatus.textContent = "Thanks, you're on the list! (demo form, not yet connected)";
    newsletterForm.reset();
  });
}

// Footer year
const footerYear = document.getElementById('footer-year');
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}
