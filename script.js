const DEFAULT_SLIDES = Array.from({ length: 45 }, (_, i) => {
  const numbers = [1,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,37,38,42,43,44,45,51,52,54,55,56,59];
  return {
    id: null,
    position: i,
    image_url: `assets/slides/${numbers[i]}.jpg`,
    title: 'Protecting people. Securing operations.',
    description: 'Dependable, client-focused security solutions across demanding operating environments.'
  };
});

const DEFAULT_NEWS = [
  {
    id: null,
    published_date: '2026-07-01',
    title: 'Expanding renewable-energy security capability',
    summary: 'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.',
    body: 'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.',
    image_url: 'assets/slides/1.jpg'
  },
  {
    id: null,
    published_date: '2026-06-15',
    title: 'Local employment and skills development',
    summary: 'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.',
    body: 'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.',
    image_url: 'assets/slides/12.jpg'
  },
  {
    id: null,
    published_date: '2026-05-20',
    title: 'Fleet and operational readiness',
    summary: 'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.',
    body: 'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.',
    image_url: 'assets/slides/25.jpg'
  }
];

const DEFAULT_SETTINGS = { quoteEmail: 'info@sinegugusecurity.co.za' };
const db = window.sineguguSupabase;
let slides = DEFAULT_SLIDES.slice();
let news = DEFAULT_NEWS.slice();
let settings = { ...DEFAULT_SETTINGS };
let active = 0;
let timer;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function newsDateValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(`${value}T00:00:00`);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function loadRemoteContent() {
  if (!db) return;
  try {
    const [slideResult, newsResult, settingsResult] = await Promise.all([
      db.from('website_slides')
        .select('id,position,title,description,image_url,is_published')
        .eq('is_published', true)
        .order('position', { ascending: true }),
      db.from('website_news')
        .select('id,published_date,title,summary,body,image_url,is_published')
        .eq('is_published', true)
        .order('published_date', { ascending: false })
        .order('created_at', { ascending: false }),
      db.from('website_settings').select('key,value')
    ]);

    if (slideResult.error) throw slideResult.error;
    if (newsResult.error) throw newsResult.error;
    if (settingsResult.error) throw settingsResult.error;

    if (slideResult.data?.length) slides = slideResult.data;
    if (newsResult.data?.length) news = newsResult.data;

    const quoteSetting = settingsResult.data?.find(item => item.key === 'quote_email');
    if (typeof quoteSetting?.value === 'string' && quoteSetting.value) {
      settings.quoteEmail = quoteSetting.value;
    }
  } catch (error) {
    console.warn('Using built-in website content because Supabase could not be loaded.', error);
  }
}

const slideshow = document.getElementById('heroSlideshow');
const dots = document.getElementById('slideDots');

function renderSlides() {
  if (!slideshow || !dots) return;
  slideshow.innerHTML = '';
  dots.innerHTML = '';
  active = 0;

  slides.forEach((slide, index) => {
    const element = document.createElement('div');
    element.className = `slide${index === 0 ? ' active' : ''}`;
    const image = document.createElement('img');
    image.src = slide.image_url || 'assets/hero.png';
    image.alt = `Sinegugu Security slide ${index + 1}`;
    image.loading = index < 2 ? 'eager' : 'lazy';
    element.appendChild(image);
    slideshow.appendChild(element);

    const dot = document.createElement('button');
    dot.className = index === 0 ? 'active' : '';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index, true));
    dots.appendChild(dot);
  });

  applyCaption(0);
  startTimer();
}

function applyCaption(index) {
  const slide = slides[index] || DEFAULT_SLIDES[0];
  const title = slide.title || 'Protecting people. Securing operations.';
  const titleElement = document.getElementById('heroTitle');
  const textElement = document.getElementById('heroText');
  const parts = title.split('. ');
  if (titleElement) {
    titleElement.innerHTML = parts.length > 1
      ? `${escapeHtml(parts[0])}.<br><span>${escapeHtml(parts.slice(1).join('. '))}</span>`
      : escapeHtml(title);
  }
  if (textElement) textElement.textContent = slide.description || '';
}

function showSlide(index, reset = false) {
  const elements = [...document.querySelectorAll('.slide')];
  const dotElements = [...dots.children];
  if (!elements.length) return;
  elements[active]?.classList.remove('active');
  dotElements[active]?.classList.remove('active');
  active = (index + elements.length) % elements.length;
  elements[active]?.classList.add('active');
  dotElements[active]?.classList.add('active');
  applyCaption(active);
  if (reset) startTimer();
}

function startTimer() {
  clearInterval(timer);
  if (slides.length > 1) timer = setInterval(() => showSlide(active + 1), 6500);
}

document.querySelector('.slide-prev')?.addEventListener('click', () => showSlide(active - 1, true));
document.querySelector('.slide-next')?.addEventListener('click', () => showSlide(active + 1, true));

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.site-nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const clientCarousel = document.getElementById('clientCarousel');
document.getElementById('clientsPrev')?.addEventListener('click', () => clientCarousel.scrollBy({ left: -560, behavior: 'smooth' }));
document.getElementById('clientsNext')?.addEventListener('click', () => clientCarousel.scrollBy({ left: 560, behavior: 'smooth' }));

const newsGrid = document.getElementById('newsGrid');
const articleModal = document.getElementById('articleModal');
const articleModalContent = document.getElementById('articleModalContent');

function bodyToHtml(body = '') {
  const safe = escapeHtml(body).replace(/\r/g, '');
  return safe
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('## ')) return `<h3>${trimmed.slice(3)}</h3>`;
      return `<p>${trimmed.replaceAll('\n', '<br>')}</p>`;
    })
    .join('');
}

function openArticle(item) {
  if (!articleModal || !articleModalContent) return;
  articleModalContent.innerHTML = `
    <img class="article-modal-image" src="${escapeHtml(item.image_url || 'assets/slides/1.jpg')}" alt="">
    <time datetime="${escapeHtml(item.published_date)}">${escapeHtml(formatDate(item.published_date))}</time>
    <h2>${escapeHtml(item.title)}</h2>
    <div class="article-body">${bodyToHtml(item.body || item.summary)}</div>
  `;
  articleModal.hidden = false;
  document.body.classList.add('modal-open');
  articleModal.querySelector('.article-modal-close')?.focus();
}

function closeArticle() {
  if (!articleModal) return;
  articleModal.hidden = true;
  document.body.classList.remove('modal-open');
}

articleModal?.querySelector('.article-modal-close')?.addEventListener('click', closeArticle);
articleModal?.addEventListener('click', event => {
  if (event.target === articleModal) closeArticle();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && articleModal && !articleModal.hidden) closeArticle();
});

function renderNews() {
  if (!newsGrid) return;
  news = news.slice().sort((a, b) => newsDateValue(b.published_date) - newsDateValue(a.published_date));
  newsGrid.innerHTML = '';

  if (!news.length) {
    newsGrid.innerHTML = '<p>No news updates have been published yet.</p>';
    return;
  }

  news.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.innerHTML = `
      <img src="${escapeHtml(item.image_url || 'assets/slides/1.jpg')}" alt="">
      <div class="news-card-body">
        <time datetime="${escapeHtml(item.published_date)}">${escapeHtml(formatDate(item.published_date))}</time>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary || '')}</p>
        <button class="news-read-more" type="button">Read More</button>
      </div>`;
    card.querySelector('.news-read-more').addEventListener('click', () => openArticle(item));
    newsGrid.appendChild(card);
  });

  requestAnimationFrame(() => newsGrid.scrollTo({ left: 0, behavior: 'auto' }));
}

window.addEventListener('pageshow', () => newsGrid?.scrollTo({ left: 0, behavior: 'auto' }));
document.getElementById('newsPrev')?.addEventListener('click', () => newsGrid.scrollBy({ left: -440, behavior: 'smooth' }));
document.getElementById('newsNext')?.addEventListener('click', () => newsGrid.scrollBy({ left: 440, behavior: 'smooth' }));

function renderSettings() {
  const emailDisplay = document.getElementById('contactEmailDisplay');
  if (emailDisplay) emailDisplay.textContent = settings.quoteEmail;
}

const quoteForm = document.getElementById('quoteForm');
const quoteFormStatus = document.getElementById('quoteFormStatus');
quoteForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = quoteForm.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || 'Send Enquiry';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
  }
  if (quoteFormStatus) {
    quoteFormStatus.className = 'form-status';
    quoteFormStatus.textContent = 'Sending your enquiry…';
  }
  try {
    const response = await fetch(quoteForm.action, {
      method: 'POST',
      body: new FormData(quoteForm),
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Submission failed');
    quoteForm.reset();
    if (quoteFormStatus) {
      quoteFormStatus.className = 'form-status success';
      quoteFormStatus.textContent = 'Thank you. Your enquiry has been sent successfully.';
    }
  } catch (error) {
    if (quoteFormStatus) {
      quoteFormStatus.className = 'form-status error';
      quoteFormStatus.textContent = 'We could not send your enquiry. Please try again or contact us directly.';
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});

const servicesViewport = document.getElementById('servicesViewport');
if (servicesViewport) {
  const scrollServices = direction => {
    const card = servicesViewport.querySelector('article');
    const distance = card ? card.getBoundingClientRect().width + 18 : 238;
    servicesViewport.scrollBy({ left: direction * distance * 2, behavior: 'smooth' });
  };
  document.getElementById('servicesPrev')?.addEventListener('click', () => scrollServices(-1));
  document.getElementById('servicesNext')?.addEventListener('click', () => scrollServices(1));
}

async function initialiseWebsite() {
  await loadRemoteContent();
  renderSlides();
  renderNews();
  renderSettings();
}

initialiseWebsite();

// Refresh shared content when a visitor returns to the tab or Wix iframe.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) initialiseWebsite();
});
