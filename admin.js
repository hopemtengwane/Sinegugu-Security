const PASSWORD='SineguguAdmin2026!';
const numbers=[1,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,37,38,42,43,44,45,51,52,54,55,56,59];
const DEFAULT_SLIDES=numbers.map(n=>({image:`assets/slides/${n}.jpg`,title:'Protecting people. Securing operations.',text:'Dependable, client-focused security solutions across demanding operating environments.'}));
const DEFAULT_NEWS=[
  {date:'2026-07-01',title:'Expanding renewable-energy security capability',summary:'Sinegugu continues to strengthen its guarding, access-control and patrol capability across wind and solar environments.',image:'assets/slides/1.jpg'},
  {date:'2026-06-15',title:'Local employment and skills development',summary:'Our community-based recruitment approach supports local participation, site knowledge and sustainable employment.',image:'assets/slides/12.jpg'},
  {date:'2026-05-20',title:'Fleet and operational readiness',summary:'Ongoing investment in vehicles, communications and supervision supports reliable service delivery across remote sites.',image:'assets/slides/25.jpg'}
];
const DEFAULT_SETTINGS={quoteEmail:'info@sinegugusecurity.co.za'};
const $=s=>document.querySelector(s);
function newsDateValue(value){
  if(!value)return 0;
  const raw=String(value).trim();
  const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if(iso)return Date.UTC(+iso[1],+iso[2]-1,+iso[3]);
  const dmy=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(raw);
  if(dmy)return Date.UTC(+dmy[3],+dmy[2]-1,+dmy[1]);
  const parsed=Date.parse(raw);
  return Number.isNaN(parsed)?0:parsed;
}
function sortNewsLatestFirst(){news.sort((a,b)=>newsDateValue(b.date)-newsDateValue(a.date));}

let slides=JSON.parse(localStorage.getItem('sineguguSlides'))||structuredClone(DEFAULT_SLIDES);
let news=JSON.parse(localStorage.getItem('sineguguNews'))||structuredClone(DEFAULT_NEWS);
let settings={...DEFAULT_SETTINGS,...(JSON.parse(localStorage.getItem('sineguguSettings')||'null')||{})};

function showAdmin(){sessionStorage.setItem('sineguguAdmin','1');$('#loginPanel').hidden=true;$('#adminPanel').hidden=false;renderSlides();renderNews();renderSettings()}
if(sessionStorage.getItem('sineguguAdmin')==='1')showAdmin();
$('#loginBtn').onclick=()=>{$('#loginError').textContent='';if($('#password').value===PASSWORD)showAdmin();else $('#loginError').textContent='Incorrect password.'};
$('#password').addEventListener('keydown',e=>{if(e.key==='Enter')$('#loginBtn').click()});
$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('sineguguAdmin');location.reload()};
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});

function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
async function imageFileToDataUrl(file,maxWidth=1600,quality=.82){
  if(!file?.type?.startsWith('image/'))throw new Error('Please choose an image file.');
  const source=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=source});
  const scale=Math.min(1,maxWidth/img.width);
  const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',quality);
}

function renderSlides(){
  const root=$('#slideEditor');
  root.innerHTML=slides.map((s,i)=>`<div class="editor-item"><img src="${esc(s.image)}" alt=""><div class="fields"><label class="wide">Replace image<input class="image-upload" data-type="slide" data-i="${i}" type="file" accept="image/*"></label><label class="wide">Title<input data-k="title" data-i="${i}" value="${esc(s.title)}"></label><label class="wide">Description<textarea data-k="text" data-i="${i}">${esc(s.text)}</textarea></label></div><div class="item-actions"><button data-act="up" data-i="${i}">↑</button><button data-act="down" data-i="${i}">↓</button><button class="danger" data-act="remove" data-i="${i}">×</button></div></div>`).join('');
  root.querySelectorAll('input[data-k],textarea').forEach(el=>el.oninput=()=>slides[+el.dataset.i][el.dataset.k]=el.value);
  root.querySelectorAll('.image-upload').forEach(el=>el.onchange=async()=>{try{slides[+el.dataset.i].image=await imageFileToDataUrl(el.files[0]);renderSlides()}catch(err){alert(err.message)}});
  root.querySelectorAll('.item-actions button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(b.dataset.act==='remove')slides.splice(i,1);if(b.dataset.act==='up'&&i>0)[slides[i-1],slides[i]]=[slides[i],slides[i-1]];if(b.dataset.act==='down'&&i<slides.length-1)[slides[i+1],slides[i]]=[slides[i],slides[i+1]];renderSlides()});
}
$('#addSlideUpload').onchange=async e=>{try{const image=await imageFileToDataUrl(e.target.files[0]);slides.push({image,title:'New slide title',text:'New slide description'});renderSlides();e.target.value=''}catch(err){alert(err.message)}};
$('#saveSlides').onclick=()=>{try{localStorage.setItem('sineguguSlides',JSON.stringify(slides));alert('Slideshow saved in this browser.')}catch{alert('The browser storage limit was reached. Remove some uploaded images or use smaller files.')}};

function renderNews(){
  sortNewsLatestFirst();
  const root=$('#newsEditor');
  root.innerHTML=news.map((n,i)=>`<div class="news-item"><div class="editor-item"><img src="${esc(n.image||'assets/slides/1.jpg')}" alt=""><div class="fields"><label>Date<input type="date" data-k="date" data-i="${i}" value="${esc(n.date)}"></label><label>Upload image<input class="image-upload" data-type="news" data-i="${i}" type="file" accept="image/*"></label><label class="wide">Headline<input data-k="title" data-i="${i}" value="${esc(n.title)}"></label><label class="wide">Summary<textarea rows="3" data-k="summary" data-i="${i}">${esc(n.summary)}</textarea></label></div><div class="item-actions"><button class="danger" data-act="remove" data-i="${i}">×</button></div></div></div>`).join('');
  root.querySelectorAll('input[data-k],textarea').forEach(el=>el.oninput=()=>news[+el.dataset.i][el.dataset.k]=el.value);
  root.querySelectorAll('.image-upload').forEach(el=>el.onchange=async()=>{try{news[+el.dataset.i].image=await imageFileToDataUrl(el.files[0],1200,.8);renderNews()}catch(err){alert(err.message)}});
  root.querySelectorAll('.item-actions button').forEach(b=>b.onclick=()=>{news.splice(+b.dataset.i,1);renderNews()});
}
$('#addNews').onclick=()=>{news.unshift({date:new Date().toISOString().slice(0,10),title:'New Sinegugu update',summary:'Add the news summary here.',image:'assets/slides/1.jpg'});renderNews()};
$('#saveNews').onclick=()=>{sortNewsLatestFirst();try{localStorage.setItem('sineguguNews',JSON.stringify(news));renderNews();alert('News saved. Latest dates will appear first.')}catch{alert('The browser storage limit was reached. Remove some uploaded images or use smaller files.')}};

function renderSettings(){$('#quoteEmail').value=settings.quoteEmail||DEFAULT_SETTINGS.quoteEmail}
$('#saveSettings').onclick=()=>{const email=$('#quoteEmail').value.trim();if(!/^\S+@\S+\.\S+$/.test(email)){alert('Please enter a valid email address.');return}settings.quoteEmail=email;localStorage.setItem('sineguguSettings',JSON.stringify(settings));alert('Quotation email saved.')};

$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({slides,news,settings},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sinegugu-site-content.json';a.click();URL.revokeObjectURL(a.href)};
$('#importFile').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(data.slides)slides=data.slides;if(data.news)news=data.news;if(data.settings)settings={...DEFAULT_SETTINGS,...data.settings};localStorage.setItem('sineguguSlides',JSON.stringify(slides));localStorage.setItem('sineguguNews',JSON.stringify(news));localStorage.setItem('sineguguSettings',JSON.stringify(settings));renderSlides();renderNews();renderSettings();alert('Content imported.')}catch{alert('Invalid JSON file.')}};
$('#resetBtn').onclick=()=>{if(confirm('Reset slideshow, news and settings to defaults?')){slides=structuredClone(DEFAULT_SLIDES);news=structuredClone(DEFAULT_NEWS);settings=structuredClone(DEFAULT_SETTINGS);localStorage.removeItem('sineguguSlides');localStorage.removeItem('sineguguNews');localStorage.removeItem('sineguguSettings');renderSlides();renderNews();renderSettings()}};
