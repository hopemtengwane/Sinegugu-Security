const db = window.sineguguSupabase;
const bucket = window.SINEGUGU_SUPABASE?.mediaBucket || 'website-media';
const numbers = [1,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,37,38,42,43,44,45,51,52,54,55,56,59];
const DEFAULT_SLIDES = numbers.map((number, position) => ({
  id: crypto.randomUUID(),
  position,
  image_url: `assets/slides/${number}.jpg`,
  title: 'Protecting people. Securing operations.',
  description: 'Dependable, client-focused security solutions across demanding operating environments.',
  is_published: true
}));
const DEFAULT_NEWS = [
  { id: crypto.randomUUID(), published_date: '2026-07-01', title: 'Expanding renewable-energy security capability', summary: 'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.', body: 'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.', image_url: 'assets/slides/1.jpg', is_published: true },
  { id: crypto.randomUUID(), published_date: '2026-06-15', title: 'Local employment and skills development', summary: 'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.', body: 'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.', image_url: 'assets/slides/12.jpg', is_published: true },
  { id: crypto.randomUUID(), published_date: '2026-05-20', title: 'Fleet and operational readiness', summary: 'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.', body: 'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.', image_url: 'assets/slides/25.jpg', is_published: true }
];
const DEFAULT_SETTINGS = { quoteEmail: 'info@sinegugusecurity.co.za' };
const $ = selector => document.querySelector(selector);
let slides = [];
let news = [];
let settings = { ...DEFAULT_SETTINGS };
let deletedSlideIds = [];
let deletedNewsIds = [];

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function setStatus(message, type = '') {
  const element = $('#adminStatus');
  if (!element) return;
  element.textContent = message;
  element.className = `admin-status ${type}`.trim();
}

function createExcerpt(text = '', maxLength = 240) {
  const compact = String(text).replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

function sortNewsLatestFirst() {
  news.sort((a, b) => Date.parse(`${b.published_date}T00:00:00`) - Date.parse(`${a.published_date}T00:00:00`));
}

async function requireSession() {
  if (!db) {
    $('#loginError').textContent = 'Supabase could not be loaded. Check the configuration files.';
    return null;
  }
  const { data, error } = await db.auth.getSession();
  if (error) console.error(error);
  return data?.session || null;
}

async function showAdmin() {
  $('#loginPanel').hidden = true;
  $('#adminPanel').hidden = false;
  setStatus('Loading shared website content…');
  await loadContent();
  renderSlides();
  renderNews();
  renderSettings();
  setStatus('Connected to the shared Supabase database.', 'success');
}

async function initialiseAuth() {
  const session = await requireSession();
  if (session) await showAdmin();
}

$('#loginBtn').addEventListener('click', async () => {
  $('#loginError').textContent = '';
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!email || !password) {
    $('#loginError').textContent = 'Enter your admin email address and password.';
    return;
  }
  $('#loginBtn').disabled = true;
  $('#loginBtn').textContent = 'Signing in…';
  const { error } = await db.auth.signInWithPassword({ email, password });
  $('#loginBtn').disabled = false;
  $('#loginBtn').textContent = 'Sign in';
  if (error) {
    $('#loginError').textContent = error.message;
    return;
  }
  await showAdmin();
});

['#email', '#password'].forEach(selector => {
  $(selector).addEventListener('keydown', event => {
    if (event.key === 'Enter') $('#loginBtn').click();
  });
});

$('#logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  location.reload();
});

document.querySelectorAll('.tabs button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tabs button,.tab-panel').forEach(element => element.classList.remove('active'));
    button.classList.add('active');
    $(`#${button.dataset.tab}`).classList.add('active');
  });
});

async function loadContent() {
  const [slideResult, newsResult, settingResult] = await Promise.all([
    db.from('website_slides').select('*').order('position', { ascending: true }),
    db.from('website_news').select('*').order('published_date', { ascending: false }).order('created_at', { ascending: false }),
    db.from('website_settings').select('*')
  ]);
  const firstError = slideResult.error || newsResult.error || settingResult.error;
  if (firstError) throw firstError;
  slides = slideResult.data || [];
  news = newsResult.data || [];
  const quoteSetting = settingResult.data?.find(item => item.key === 'quote_email');
  settings.quoteEmail = typeof quoteSetting?.value === 'string' ? quoteSetting.value : DEFAULT_SETTINGS.quoteEmail;
}

async function uploadImage(file, folder) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose an image file.');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await db.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;
  const { data } = db.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function dataUrlToBlob(dataUrl) {
  const [meta, encoded] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || 'image/jpeg';
  const bytes = atob(encoded);
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new Blob([array], { type: mime });
}

async function normaliseMigratedImage(value, folder) {
  if (!value?.startsWith('data:image/')) return value || '';
  const blob = dataUrlToBlob(value);
  const file = new File([blob], `${folder}-${Date.now()}.jpg`, { type: blob.type });
  return uploadImage(file, folder);
}

function renderSlides() {
  const root = $('#slideEditor');
  root.innerHTML = slides.map((slide, index) => `
    <div class="editor-item">
      <img src="${esc(slide.image_url)}" alt="">
      <div class="fields">
        <label class="wide">Replace image<input class="image-upload" data-type="slide" data-i="${index}" type="file" accept="image/*"></label>
        <label class="wide">Title<input data-k="title" data-i="${index}" value="${esc(slide.title)}"></label>
        <label class="wide">Description<textarea data-k="description" data-i="${index}">${esc(slide.description)}</textarea></label>
        <label class="checkbox-label"><input type="checkbox" data-k="is_published" data-i="${index}" ${slide.is_published ? 'checked' : ''}> Published</label>
      </div>
      <div class="item-actions">
        <button data-act="up" data-i="${index}" aria-label="Move up">↑</button>
        <button data-act="down" data-i="${index}" aria-label="Move down">↓</button>
        <button class="danger" data-act="remove" data-i="${index}" aria-label="Remove">×</button>
      </div>
    </div>`).join('');

  root.querySelectorAll('input[data-k]:not([type="checkbox"]),textarea[data-k]').forEach(element => {
    element.addEventListener('input', () => {
      slides[Number(element.dataset.i)][element.dataset.k] = element.value;
    });
  });
  root.querySelectorAll('input[type="checkbox"][data-k]').forEach(element => {
    element.addEventListener('change', () => {
      slides[Number(element.dataset.i)][element.dataset.k] = element.checked;
    });
  });
  root.querySelectorAll('.image-upload').forEach(element => {
    element.addEventListener('change', async () => {
      try {
        setStatus('Uploading slide image…');
        slides[Number(element.dataset.i)].image_url = await uploadImage(element.files[0], 'slides');
        renderSlides();
        setStatus('Image uploaded. Save the slideshow to publish it.', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });
  });
  root.querySelectorAll('.item-actions button').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.i);
      if (button.dataset.act === 'remove') {
        if (slides[index].id) deletedSlideIds.push(slides[index].id);
        slides.splice(index, 1);
      }
      if (button.dataset.act === 'up' && index > 0) [slides[index - 1], slides[index]] = [slides[index], slides[index - 1]];
      if (button.dataset.act === 'down' && index < slides.length - 1) [slides[index + 1], slides[index]] = [slides[index], slides[index + 1]];
      renderSlides();
    });
  });
}

$('#addSlideUpload').addEventListener('change', async event => {
  try {
    setStatus('Uploading new slide…');
    const imageUrl = await uploadImage(event.target.files[0], 'slides');
    slides.push({
      id: crypto.randomUUID(),
      position: slides.length,
      image_url: imageUrl,
      title: 'New slide title',
      description: 'New slide description',
      is_published: true
    });
    event.target.value = '';
    renderSlides();
    setStatus('New slide added. Save the slideshow to publish it.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#saveSlides').addEventListener('click', async () => {
  try {
    setStatus('Saving slideshow…');
    if (deletedSlideIds.length) {
      const { error } = await db.from('website_slides').delete().in('id', deletedSlideIds);
      if (error) throw error;
    }
    const payload = slides.map((slide, position) => ({
      id: slide.id || crypto.randomUUID(),
      position,
      title: slide.title,
      description: slide.description,
      image_url: slide.image_url,
      is_published: slide.is_published !== false
    }));
    const { data, error } = await db.from('website_slides').upsert(payload).select().order('position', { ascending: true });
    if (error) throw error;
    slides = data;
    deletedSlideIds = [];
    renderSlides();
    setStatus('Slideshow published successfully.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

function renderNews() {
  sortNewsLatestFirst();
  const root = $('#newsEditor');
  root.innerHTML = news.map((item, index) => `
    <div class="news-item">
      <div class="editor-item news-editor-item">
        <img src="${esc(item.image_url || 'assets/slides/1.jpg')}" alt="">
        <div class="fields">
          <label>Date<input type="date" data-k="published_date" data-i="${index}" value="${esc(item.published_date)}"></label>
          <label>Upload image<input class="image-upload" data-type="news" data-i="${index}" type="file" accept="image/*"></label>
          <label class="wide">Headline<input data-k="title" data-i="${index}" value="${esc(item.title)}"></label>
          <label class="wide">Short summary<textarea rows="3" maxlength="360" data-k="summary" data-i="${index}">${esc(item.summary)}</textarea></label>
          <label class="wide">Full article<textarea class="article-editor" rows="14" data-k="body" data-i="${index}">${esc(item.body || item.summary)}</textarea></label>
          <label class="checkbox-label"><input type="checkbox" data-k="is_published" data-i="${index}" ${item.is_published ? 'checked' : ''}> Published</label>
        </div>
        <div class="item-actions"><button class="danger" data-act="remove" data-i="${index}" aria-label="Remove">×</button></div>
      </div>
    </div>`).join('');

  root.querySelectorAll('input[data-k]:not([type="checkbox"]),textarea[data-k]').forEach(element => {
    element.addEventListener('input', () => {
      news[Number(element.dataset.i)][element.dataset.k] = element.value;
    });
  });
  root.querySelectorAll('input[type="checkbox"][data-k]').forEach(element => {
    element.addEventListener('change', () => {
      news[Number(element.dataset.i)][element.dataset.k] = element.checked;
    });
  });
  root.querySelectorAll('.image-upload').forEach(element => {
    element.addEventListener('change', async () => {
      try {
        setStatus('Uploading news image…');
        news[Number(element.dataset.i)].image_url = await uploadImage(element.files[0], 'news');
        renderNews();
        setStatus('Image uploaded. Save the news section to publish it.', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });
  });
  root.querySelectorAll('.item-actions button').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.i);
      if (news[index].id) deletedNewsIds.push(news[index].id);
      news.splice(index, 1);
      renderNews();
    });
  });
}

$('#addNews').addEventListener('click', () => {
  news.unshift({
    id: crypto.randomUUID(),
    published_date: new Date().toISOString().slice(0, 10),
    title: 'New Sinegugu update',
    summary: 'Add a short summary for the news card.',
    body: 'Write the full article here.',
    image_url: 'assets/slides/1.jpg',
    is_published: true
  });
  renderNews();
});

$('#saveNews').addEventListener('click', async () => {
  try {
    setStatus('Saving news…');
    if (deletedNewsIds.length) {
      const { error } = await db.from('website_news').delete().in('id', deletedNewsIds);
      if (error) throw error;
    }
    const payload = news.map(item => ({
      id: item.id || crypto.randomUUID(),
      published_date: item.published_date,
      title: item.title,
      summary: item.summary,
      body: item.body || item.summary,
      image_url: item.image_url || '',
      is_published: item.is_published !== false
    }));
    const { data, error } = await db.from('website_news').upsert(payload).select().order('published_date', { ascending: false });
    if (error) throw error;
    news = data;
    deletedNewsIds = [];
    renderNews();
    setStatus('News published successfully. Wix and GitHub now read the same content.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

function renderSettings() {
  $('#quoteEmail').value = settings.quoteEmail || DEFAULT_SETTINGS.quoteEmail;
}

$('#saveSettings').addEventListener('click', async () => {
  const email = $('#quoteEmail').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setStatus('Please enter a valid email address.', 'error');
    return;
  }
  const { error } = await db.from('website_settings').upsert({ key: 'quote_email', value: email });
  if (error) {
    setStatus(error.message, 'error');
    return;
  }
  settings.quoteEmail = email;
  setStatus('Public contact email updated.', 'success');
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ slides, news, settings }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'sinegugu-site-content.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

$('#importFile').addEventListener('change', async event => {
  try {
    const data = JSON.parse(await event.target.files[0].text());
    if (Array.isArray(data.slides)) slides = data.slides.map((slide, position) => ({
      id: slide.id || crypto.randomUUID(),
      position,
      image_url: slide.image_url || slide.image,
      title: slide.title || '',
      description: slide.description || slide.text || '',
      is_published: slide.is_published !== false
    }));
    if (Array.isArray(data.news)) news = data.news.map(item => ({
      id: item.id || crypto.randomUUID(),
      published_date: item.published_date || item.date,
      title: item.title || '',
      summary: item.summary || '',
      body: item.body || item.summary || '',
      image_url: item.image_url || item.image || '',
      is_published: item.is_published !== false
    }));
    if (data.settings?.quoteEmail) settings.quoteEmail = data.settings.quoteEmail;
    renderSlides();
    renderNews();
    renderSettings();
    setStatus('Backup loaded into the editor. Use each Save button to publish it.', 'success');
  } catch (error) {
    setStatus('Invalid JSON backup file.', 'error');
  }
});

$('#migrateBrowserBtn').addEventListener('click', async () => {
  try {
    const oldSlides = JSON.parse(localStorage.getItem('sineguguSlides') || 'null');
    const oldNews = JSON.parse(localStorage.getItem('sineguguNews') || 'null');
    const oldSettings = JSON.parse(localStorage.getItem('sineguguSettings') || 'null');
    if (!oldSlides && !oldNews && !oldSettings) {
      setStatus('No earlier browser-only content was found on this GitHub Pages domain.', 'error');
      return;
    }
    setStatus('Migrating browser content and uploaded images…');
    if (oldSlides) {
      slides = [];
      for (const [position, slide] of oldSlides.entries()) {
        slides.push({
          id: crypto.randomUUID(),
          position,
          image_url: await normaliseMigratedImage(slide.image || slide.image_url, 'slides'),
          title: slide.title || '',
          description: slide.text || slide.description || '',
          is_published: true
        });
      }
    }
    if (oldNews) {
      news = [];
      for (const item of oldNews) {
        const fullText = item.body || item.summary || '';
        news.push({
          id: crypto.randomUUID(),
          published_date: item.date || item.published_date || new Date().toISOString().slice(0, 10),
          title: item.title || '',
          summary: fullText.length > 360 ? createExcerpt(fullText) : fullText,
          body: fullText,
          image_url: await normaliseMigratedImage(item.image || item.image_url, 'news'),
          is_published: true
        });
      }
    }
    if (oldSettings?.quoteEmail) settings.quoteEmail = oldSettings.quoteEmail;
    renderSlides();
    renderNews();
    renderSettings();
    setStatus('Migration prepared. Click Save slideshow, Save news and Save settings to publish.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('#seedDefaultsBtn').addEventListener('click', () => {
  slides = structuredClone(DEFAULT_SLIDES);
  news = structuredClone(DEFAULT_NEWS);
  settings = structuredClone(DEFAULT_SETTINGS);
  renderSlides();
  renderNews();
  renderSettings();
  setStatus('Default content loaded into the editor. Use the Save buttons to publish it.', 'success');
});

initialiseAuth().catch(error => {
  console.error(error);
  $('#loginError').textContent = error.message;
});
