document.documentElement.classList.add('js');

(function(){
  var header = document.querySelector('header');
  var toggle = document.querySelector('.menu-toggle');
  function setToggle(open){
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.innerHTML = open ? '&#10005;' : '&#9776;';
  }
  toggle.addEventListener('click', function(){
    var open = header.classList.toggle('nav-open');
    setToggle(open);
  });
  header.querySelectorAll('.nav-links a').forEach(function(a){
    a.addEventListener('click', function(){
      header.classList.remove('nav-open');
      setToggle(false);
    });
  });
})();

var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Netlify Forms: submit via fetch so the page doesn't reload
function encodeFormData(data){
  return Object.keys(data).map(function(key){
    return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
  }).join('&');
}
document.querySelectorAll('form[data-netlify="true"]').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function(value, key){ data[key] = value; });
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(data)
    }).then(function(){
      form.style.display = 'none';
      var success = form.parentElement.querySelector('.form-success');
      if (success) success.style.display = 'block';
    }).catch(function(){
      form.submit();
    });
  });
});

var supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');
if (!supportsScrollTimeline) {
  var bar = document.querySelector('.scroll-progress');
  window.addEventListener('scroll', function(){
    var h = document.documentElement;
    var pct = h.scrollTop / (h.scrollHeight - h.clientHeight);
    bar.style.transform = 'scaleX(' + pct + ')';
  }, { passive: true });
}

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
} else {
  document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
}

// spine dots fill as each item is reached
if ('IntersectionObserver' in window) {
  var spineIo = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) e.target.classList.add('in');
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.spine-item').forEach(function(el){ spineIo.observe(el); });
}

// count-up (used inside the story sticky panel)
var countedEls = new WeakSet();
function animateCount(el){
  if (countedEls.has(el)) { return; }
  countedEls.add(el);
  var target = parseFloat(el.dataset.count);
  var suffix = el.dataset.suffix || '';
  var isDecimal = el.dataset.count.indexOf('.') > -1;
  if (reduceMotion) {
    el.textContent = (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
    return;
  }
  var start = null, duration = 1200;
  function step(ts){
    if (!start) start = ts;
    var p = Math.min((ts - start) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var val = target * eased;
    el.textContent = (isDecimal ? val.toFixed(1) : Math.floor(val).toLocaleString()) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// scrollytelling: which story-step is centered drives the sticky visual + step emphasis
(function(){
  var steps = document.querySelectorAll('.story-step');
  var layers = document.querySelectorAll('.sv-layer');
  if (!steps.length || !('IntersectionObserver' in window)) return;

  var storyIo = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var key = entry.target.dataset.visual;
      steps.forEach(function(s){ s.classList.toggle('active', s === entry.target); });
      layers.forEach(function(l){ l.classList.toggle('active', l.dataset.visual === key); });
      var activeLayer = document.querySelector('.sv-layer[data-visual="' + key + '"] .sv-num');
      if (activeLayer) animateCount(activeLayer);
    });
  }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });

  steps.forEach(function(s){ storyIo.observe(s); });
})();

// wall: mouse-wheel scrolls the strip horizontally, plus prev/next buttons
(function(){
  var scroller = document.querySelector('.wall-sticky');
  if (!scroller) return;

  scroller.addEventListener('wheel', function(e){
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    var atStart = scroller.scrollLeft <= 0;
    var atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1;
    if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
    scroller.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  function scrollByPage(dir){
    scroller.scrollBy({ left: dir * scroller.clientWidth * 0.8, behavior: 'smooth' });
  }
  var prevBtn = document.querySelector('.wall-prev');
  var nextBtn = document.querySelector('.wall-next');
  if (prevBtn) prevBtn.addEventListener('click', function(){ scrollByPage(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function(){ scrollByPage(1); });
})();
