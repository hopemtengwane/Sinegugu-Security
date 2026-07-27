const DEFAULT_SLIDES = Array.from({length:45},(_,i)=>{
  const numbers=[1,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,37,38,42,43,44,45,51,52,54,55,56,59];
  return {image:`assets/slides/${numbers[i]}.jpg`,title:'Protecting people. Securing operations.',text:'Dependable, client-focused security solutions across demanding operating environments.'};
});
const DEFAULT_NEWS=[
  {date:'2026-07-01',title:'Expanding renewable-energy security capability',summary:'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.',image:'assets/slides/1.jpg'},
  {date:'2026-06-15',title:'Local employment and skills development',summary:'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.',image:'assets/slides/12.jpg'},
  {date:'2026-05-20',title:'Fleet and operational readiness',summary:'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.',image:'assets/slides/25.jpg'}
];
const DEFAULT_SETTINGS={quoteEmail:'info@sinegugusecurity.co.za'};
function readData(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
const slides=readData('sineguguSlides',DEFAULT_SLIDES);
function newsDateValue(value){
  if(!value)return 0;
  const raw=String(value).trim();
  // ISO dates from the admin date picker.
  const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if(iso)return Date.UTC(+iso[1],+iso[2]-1,+iso[3]);
  // Also accept South African day-first dates if content is imported manually.
  const dmy=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(raw);
  if(dmy)return Date.UTC(+dmy[3],+dmy[2]-1,+dmy[1]);
  const parsed=Date.parse(raw);
  return Number.isNaN(parsed)?0:parsed;
}
const news=readData('sineguguNews',DEFAULT_NEWS)
  .slice()
  .sort((a,b)=>newsDateValue(b.date)-newsDateValue(a.date));
const settings={...DEFAULT_SETTINGS,...readData('sineguguSettings',DEFAULT_SETTINGS)};
// Migrate the earlier prototype's personal contact address to the official company address.
if(settings.quoteEmail==='msindisi.mtengwane@gmail.com'){
  settings.quoteEmail=DEFAULT_SETTINGS.quoteEmail;
  localStorage.setItem('sineguguSettings',JSON.stringify(settings));
}

const slideshow=document.getElementById('heroSlideshow');
const dots=document.getElementById('slideDots');
let active=0;
let timer;
function renderSlides(){
  slideshow.innerHTML='';dots.innerHTML='';
  slides.forEach((s,i)=>{
    const el=document.createElement('div');
    el.className='slide'+(i===0?' active':'');
    el.innerHTML=`<img src="${s.image}" alt="Sinegugu Security slide ${i+1}" loading="${i<2?'eager':'lazy'}">`;
    slideshow.appendChild(el);
    const dot=document.createElement('button');
    dot.className=i===0?'active':'';
    dot.setAttribute('aria-label',`Go to slide ${i+1}`);
    dot.onclick=()=>showSlide(i,true);
    dots.appendChild(dot);
  });
  applyCaption(0);
}
function applyCaption(i){
  const title=slides[i]?.title||'Protecting people. Securing operations.';
  const parts=title.split('. ');
  document.getElementById('heroTitle').innerHTML=parts.length>1?`${parts[0]}.<br><span>${parts.slice(1).join('. ')}</span>`:title;
  document.getElementById('heroText').textContent=slides[i]?.text||'';
}
function showSlide(i,reset=false){
  const els=[...document.querySelectorAll('.slide')],ds=[...dots.children];
  if(!els.length)return;
  els[active].classList.remove('active');ds[active]?.classList.remove('active');
  active=(i+els.length)%els.length;
  els[active].classList.add('active');ds[active]?.classList.add('active');
  applyCaption(active);
  if(reset)startTimer();
}
function startTimer(){clearInterval(timer);timer=setInterval(()=>showSlide(active+1),6500)}
document.querySelector('.slide-prev')?.addEventListener('click',()=>showSlide(active-1,true));
document.querySelector('.slide-next')?.addEventListener('click',()=>showSlide(active+1,true));
renderSlides();startTimer();

const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');
toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open)});
document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const clientCarousel=document.getElementById('clientCarousel');
document.getElementById('clientsPrev')?.addEventListener('click',()=>clientCarousel.scrollBy({left:-560,behavior:'smooth'}));
document.getElementById('clientsNext')?.addEventListener('click',()=>clientCarousel.scrollBy({left:560,behavior:'smooth'}));

const newsGrid=document.getElementById('newsGrid');
newsGrid.scrollLeft=0;
newsGrid.innerHTML=news.length?news.map(n=>`<article class="news-card"><img src="${n.image||'assets/slides/1.jpg'}" alt=""><div class="news-card-body"><time datetime="${n.date}">${new Date(n.date+'T00:00:00').toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'})}</time><h3>${n.title}</h3><p>${n.summary}</p></div></article>`).join(''):'<p>No news updates have been published yet.</p>';
requestAnimationFrame(()=>newsGrid.scrollTo({left:0,behavior:'auto'}));
window.addEventListener('pageshow',()=>newsGrid.scrollTo({left:0,behavior:'auto'}));
document.getElementById('newsPrev')?.addEventListener('click',()=>newsGrid.scrollBy({left:-440,behavior:'smooth'}));
document.getElementById('newsNext')?.addEventListener('click',()=>newsGrid.scrollBy({left:440,behavior:'smooth'}));

const emailDisplay=document.getElementById('contactEmailDisplay');
if(emailDisplay)emailDisplay.textContent=settings.quoteEmail;
const quoteForm=document.getElementById('quoteForm');
const quoteFormStatus=document.getElementById('quoteFormStatus');
quoteForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const submitButton=quoteForm.querySelector('button[type="submit"]');
  const originalText=submitButton?.textContent||'Send Enquiry';
  if(submitButton){submitButton.disabled=true;submitButton.textContent='Sending…';}
  if(quoteFormStatus){quoteFormStatus.className='form-status';quoteFormStatus.textContent='Sending your enquiry…';}
  try{
    const response=await fetch(quoteForm.action,{
      method:'POST',
      body:new FormData(quoteForm),
      headers:{Accept:'application/json'}
    });
    if(!response.ok)throw new Error('Submission failed');
    quoteForm.reset();
    if(quoteFormStatus){quoteFormStatus.className='form-status success';quoteFormStatus.textContent='Thank you. Your enquiry has been sent successfully.';}
  }catch(error){
    if(quoteFormStatus){quoteFormStatus.className='form-status error';quoteFormStatus.textContent='We could not send your enquiry. Please try again or contact us directly.';}
  }finally{
    if(submitButton){submitButton.disabled=false;submitButton.textContent=originalText;}
  }
});


// Version 6: service carousel controls.
const servicesViewport = document.getElementById('servicesViewport');
const servicesPrev = document.getElementById('servicesPrev');
const servicesNext = document.getElementById('servicesNext');
if (servicesViewport && servicesPrev && servicesNext) {
  const scrollServices = (direction) => {
    const card = servicesViewport.querySelector('article');
    const distance = card ? card.getBoundingClientRect().width + 18 : 238;
    servicesViewport.scrollBy({ left: direction * distance * 2, behavior: 'smooth' });
  };
  servicesPrev.addEventListener('click', () => scrollServices(-1));
  servicesNext.addEventListener('click', () => scrollServices(1));
}
