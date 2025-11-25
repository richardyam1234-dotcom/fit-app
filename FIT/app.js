
const stateKey = 'fit_state_v1';
let state = JSON.parse(localStorage.getItem(stateKey) || '{}');
if(!state.user) state.user = {weight:90,height:167,age:19,calGoal:1300};
if(!state.days) state.days = {};
function save(){ localStorage.setItem(stateKey, JSON.stringify(state)); }

document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',e=>{
  document.querySelectorAll('.nav button').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(e.target.dataset.tab).classList.add('active');
}));

function todayKey(){ const d=new Date(); return d.toISOString().slice(0,10); }
function ensureDay(key){ if(!state.days[key]) state.days[key] = {food:[],shopping:[],fasts:[],workouts:[]}; }

document.getElementById('metaCal').innerText = state.user.calGoal;
document.getElementById('peso').innerText = state.user.weight;
renderDashboard();
renderShopping();
renderFoodLog();
initChart();

document.getElementById('startJejum').addEventListener('click', ()=> startFast());
document.getElementById('stopJejum').addEventListener('click', ()=> stopFast());

function startFast(){
  const k = todayKey(); ensureDay(k);
  const f = {start: Date.now(), id: 'f'+Date.now()};
  state.days[k].currentFast = f;
  state.days[k].fasts.push(f);
  save(); notify('Seu jejum começou'); renderDashboard();
}
function stopFast(){
  const k = todayKey(); ensureDay(k);
  const f = state.days[k].currentFast;
  if(!f) return alert('Nenhum jejum em curso');
  f.end = Date.now();
  delete state.days[k].currentFast;
  save(); notify('Seu jejum acabou'); renderDashboard(); renderFastHistory();
}

function renderDashboard(){
  const k = todayKey(); ensureDay(k);
  const today = state.days[k];
  document.getElementById('calDia').innerText = today.food.reduce((s,x)=>s+(x.kcal||0),0);
  document.getElementById('jejumStatus').innerText = today.currentFast ? 'Em jejum' : 'Não em jejum';
  const checks = document.getElementById('checks'); checks.innerHTML='';
  ['jejum','agua','treino','caminhada'].forEach(c=>{
    const el = document.createElement('label'); el.className='card';
    el.innerHTML = `<input type="checkbox" data-check="${c}" ${today[c]?'checked':''}> ${c}`;
    checks.appendChild(el);
    el.querySelector('input').addEventListener('change', e=>{ today[c]=e.target.checked; save(); });
  });
  renderFastHistory();
}

function renderFastHistory(){
  const ul = document.getElementById('fastHistory'); ul.innerHTML='';
  const k = todayKey(); ensureDay(k);
  state.days[k].fasts.slice().reverse().forEach(f=>{
    const li = document.createElement('li');
    li.innerText = new Date(f.start).toLocaleString() + (f.end?(' → '+new Date(f.end).toLocaleString()):' (em curso)');
    ul.appendChild(li);
  });
}

function notify(text){
  if(Notification && Notification.permission==='granted'){ navigator.serviceWorker.getRegistration().then(r=>{ if(r) r.showNotification(text); else alert(text); }); }
  else if(Notification && Notification.permission!=='denied'){ Notification.requestPermission().then(p=>{ if(p==='granted') notify(text); else alert(text); }); }
  else alert(text);
}

function renderShopping(){
  const k = todayKey(); ensureDay(k);
  const div = document.getElementById('shoppingList'); div.innerHTML='';
  state.days[k].shopping.forEach((it,idx)=>{
    const row=document.createElement('div'); row.className='card';
    row.innerHTML = `<label><input type="checkbox" data-i="${idx}" ${it.bought?'checked':''}> ${it.name} - qtd: <input data-qty="${idx}" value="${it.qty||1}" style="width:60px"> R$: <input data-price="${idx}" value="${it.price||0}" style="width:80px"></label>`;
    div.appendChild(row);
  });
  const total = state.days[k].shopping.reduce((s,i)=>s + (i.price?Number(i.price):0),0);
  document.getElementById('shoppingTotal').innerText = 'Total R$ '+total.toFixed(2);
  div.querySelectorAll('input[type="checkbox"]').forEach(ch=>ch.addEventListener('change', e=>{ const i=e.target.dataset.i; state.days[todayKey()].shopping[i].bought=e.target.checked; save(); renderShopping(); }));
  div.querySelectorAll('input[data-qty], input[data-price]').forEach(inp=>inp.addEventListener('change', e=>{ const i=e.target.dataset.qty||e.target.dataset.price; const row = state.days[todayKey()].shopping[i]; row.qty = Number(document.querySelector('[data-qty=\"'+i+'\"]').value||0); row.price = Number(document.querySelector('[data-price=\"'+i+'\"]').value||0); save(); renderShopping(); }));
}

document.getElementById('addItem').addEventListener('click', ()=>{ const name = prompt('Nome do item'); if(!name) return; const k=todayKey(); ensureDay(k); state.days[k].shopping.push({id:'s'+Date.now(),name,qty:1,price:0,bought:false}); save(); renderShopping(); });

document.getElementById('foodForm').addEventListener('submit', e=>{ e.preventDefault(); const k=todayKey(); ensureDay(k); const name=document.getElementById('foodName').value; const qty=Number(document.getElementById('foodQty').value||1); const kcal=Number(document.getElementById('foodKcal').value||0); state.days[k].food.push({id:'f'+Date.now(),name,qty,kcal}); save(); renderFoodLog(); renderDashboard(); });
function renderFoodLog(){ const k=todayKey(); ensureDay(k); const ul=document.getElementById('foodLog'); ul.innerHTML=''; state.days[k].food.forEach(f=>{ const li=document.createElement('li'); li.className='card'; li.innerText = `${f.name} - ${f.qty} - ${f.kcal} kcal`; ul.appendChild(li); }); }

let chart=null;
function initChart(){ const ctx = document.getElementById('chart').getContext('2d'); chart = new Chart(ctx, { type:'line', data:{ labels:[], datasets:[{label:'Calorias (últimos 7 dias)', data:[], fill:false}] }, options:{responsive:true} }); refreshChart(); }
function refreshChart(){ const labels=[]; const data=[]; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); labels.push(k); const day = state.days[k]||{food:[]}; data.push(day.food.reduce((s,x)=>s+(x.kcal||0),0)); } chart.data.labels = labels; chart.data.datasets[0].data = data; chart.update(); }

if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }
if(Notification && Notification.permission!=='granted') Notification.requestPermission().then(()=>{});
