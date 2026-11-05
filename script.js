// Content and all download/legal links work without JavaScript.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 768px)');
let observer;

function updateReveals() {
  observer?.disconnect();
  const items = document.querySelectorAll('.reveal');
  items.forEach(item => item.classList.remove('is-waiting'));
  if (motion.matches || !desktop.matches || !('IntersectionObserver' in window)) return;

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-waiting');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px 60px 0px', threshold: 0.05 });

  for (const item of items) {
    if (item.getBoundingClientRect().top < window.innerHeight) continue;
    item.classList.add('is-waiting');
    observer.observe(item);
  }
}

updateReveals();
motion.addEventListener('change', updateReveals);
desktop.addEventListener('change', updateReveals);

// One phone, three real product screens. Browsing the preview never moves or
// pins the page; steps, arrows and swipe all select the same active screen.
function setupTripPreview() {
  const section = document.querySelector('.setup');
  if (!section) return;
  const screen = section.querySelector('.setup-screen');
  const track = section.querySelector('.setup-track');
  const slides = [...section.querySelectorAll('.setup-slide')];
  const steps = [...section.querySelectorAll('.trip-steps > li')];
  const buttons = steps.map(step => step.querySelector('.trip-step-button'));
  const count = section.querySelector('.setup-count');
  const previous = section.querySelector('.preview-arrow--previous');
  const nextButton = section.querySelector('.preview-arrow--next');
  const status = section.querySelector('.setup-status');
  let active = -1;
  let gesture;

  function select(index, announce = false) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (active === next) return;
    active = next;
    track.style.setProperty('--setup-index', active);
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== active));
      slide.inert = i !== active;
      steps[i].classList.toggle('is-active', i === active);
      buttons[i].setAttribute('aria-pressed', String(i === active));
    });
    count.textContent = `0${active + 1} / 03`;
    previous.disabled = active === 0;
    nextButton.disabled = active === slides.length - 1;
    if (announce) status.textContent = slides[active].getAttribute('aria-label');
  }

  buttons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => select(index, true));
  });
  previous.addEventListener('click', () => select(active - 1, true));
  nextButton.addEventListener('click', () => select(active + 1, true));
  section.addEventListener('keydown', event => {
    const stepButton = event.target.closest('.trip-step-button');
    if (event.target !== screen && !stepButton && !event.target.closest('.preview-arrow')) return;
    const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: slides.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
    if (stepButton) buttons[active].focus({ preventScroll: true });
  });
  screen.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
    screen.setPointerCapture(event.pointerId);
  });
  screen.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) select(active + (dx < 0 ? 1 : -1), true);
  });
  screen.addEventListener('pointercancel', () => { gesture = null; });
  screen.addEventListener('lostpointercapture', () => { gesture = null; });

  section.classList.add('is-interactive');
  screen.tabIndex = 0;
  screen.setAttribute('aria-describedby', 'trip-preview-help');
  select(0);
}

setupTripPreview();

// Native details stay usable without JavaScript. Enhance just the height change.
for (const details of document.querySelectorAll('.faq-item')) {
  const summary = details.querySelector('summary');
  let animation;
  let expanded = details.open;
  summary.addEventListener('click', event => {
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    animation?.cancel();
    expanded = !expanded;
    if (motion.matches || !details.animate) {
      details.open = expanded;
      return;
    }
    details.open = true;
    const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
    animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
      duration: 280,
      easing: 'cubic-bezier(.2,.6,.3,1)'
    });
    animation.onfinish = () => {
      details.open = expanded;
      animation = null;
    };
  });
}
