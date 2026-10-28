import {localISO, addDays, parseISO, dateDiff, nextDayOfMonth, plan, purchaseDecision, upcomingBills, recentSpend, categoryTotals, runway, generateDemo, validateBackup} from './finance.js';

const KEY='flomo.storage.v1';
const DEFAULT = { version:1, onboarded:true, demo:false, name:'You', currency:'USD', appearance:'system', balance:0, paydayDay:15, cushion:300, monthlyReserve:0, transactions:[], bills:[], goals:[] };
const CURRENCIES=['USD','EUR','GBP','PKR','AED','CAD','AUD','INR'];
const CATEGORIES=['Food & drink','Shopping','Transport','Home','Bills','Health','Entertainment','Subscriptions','Other'];
const today=()=>localISO();
const $=(s)=>document.querySelector(s);
const escapeHTML=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=escapeHTML;
const num=(value)=>Number(value||0);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const money=(n,opts={})=>{
  try {return new Intl.NumberFormat('en-US',{style:'currency',currency:state?.currency||'USD',maximumFractionDigits:opts.compact?0:2,minimumFractionDigits:opts.compact?0:2}).format(Number(n)||0)}
  catch {return '$'+(Number(n)||0).toFixed(2)}
};
const fmt=(iso,opts={})=>new Intl.DateTimeFormat('en-US',{month:opts.long?'long':'short',day:'numeric', ...(opts.year?{year:'numeric'}:{})}).format(parseISO(iso));
const id=()=>`id_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
function getStored(){try{const raw=localStorage.getItem(KEY);const d=JSON.parse(raw);return validateBackup(d)?{...DEFAULT,...d}:null}catch{return null}}
let state=getStored();
const ui={tab:'home', modal:null, planTab:'bills', filter:'all', analysis:null, toastTimer:null, busy:false};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{notify('Local storage is full or blocked; please export a backup.')}}
function setState(update){state={...state,...update};save();render()}
function notify(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(ui.toastTimer);ui.toastTimer=setTimeout(()=>el.classList.remove('visible'),2900)}
function setAppearance(){const preference=state?.appearance||'system';const system=window.matchMedia('(prefers-color-scheme: dark)').matches;const mode=preference==='system'?(system?'dark':'light'):preference;document.documentElement.dataset.theme=mode;document.documentElement.style.colorScheme=mode;const meta=$('meta[name="theme-color"]');if(meta)meta.content=mode==='dark'?'#0d100f':'#f6f7f5'}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(!state||state.appearance==='system'){setAppearance();render()}});

const ICON={
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  activity:'<path d="M3 3v18h18"/><path d="m7 15 4-5 3 2 5-7"/>',
  spark:'<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
  targets:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  settings:'<path d="M12 3.5v2m0 13v2m8.5-8.5h-2m-13 0h-2M18.2 5.8 16.8 7.2M7.2 16.8l-1.4 1.4m12.4 0-1.4-1.4M7.2 7.2 5.8 5.8"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  down:'<path d="m7 10 5 5 5-5"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18"/><path d="M16 15h2"/>',
  trending:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  arrowup:'<path d="m7 14 5-5 5 5"/>',
  arrowdown:'<path d="m7 10 5 5 5-5"/>',
  coffee:'<path d="M4 8h13v7a6 6 0 0 1-12 0V8zm13 1h2a3 3 0 0 1 0 6h-2M4 21h15"/><path d="M8 3v2m4-2v2"/>',
  cart:'<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2 12h13l2-9H6"/>',
  car:'<path d="M5 11 7 5h10l2 6M5 18H3v-7h18v7h-2M5 18h14M7 18v2m10-2v2"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  house:'<path d="m3 11 9-8 9 8v9H3z"/><path d="M9 20v-6h6v6"/>',
  wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/>',
  repeat:'<path d="M4 11V7a3 3 0 0 1 3-3h12l-3-3m3 3-3 3M20 13v4a3 3 0 0 1-3 3H5l3 3m-3-3 3-3"/>',
  gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18"/><path d="M12 9C7 9 6 7 6 5c0-4 6-2 6 4Zm0 0c5 0 6-2 6-4 0-4-6-2-6 4Z"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  heart:'<path d="M20.8 8.6c0 4.2-8.8 11.4-8.8 11.4S3.2 12.8 3.2 8.6A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.3Z"/>',
  chart:'<path d="M4 20V10m5 10V4m5 16v-7m5 7v-11"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
  moon:'<path d="M20 16A8.5 8.5 0 0 1 8 4a8.5 8.5 0 1 0 12 12Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5m0-14.2-1.5 1.5M6.4 17.6l-1.5 1.5"/>',
  monitor:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8m-4-4v4"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
  upload:'<path d="M12 21V9m-4 4 4-4 4 4M4 7V3h16v4"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pencil:'<path d="m4 20 4-.8L20 7l-3-3L5 16l-1 4Z"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  sparkle:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3v.5"/>',
  file:'<path d="M6 2h8l5 5v15H6zM14 2v6h5M9 13h7M9 17h7"/>',
  eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  edit:'<path d="m3 21 5-.9L21 7l-4-4L4 16l-1 5Z"/>',
  leaf:'<path d="M20 4c-10 0-15 5-15 11a6 6 0 0 0 6 6c7 0 11-9 9-17Z"/><path d="M7 18c2-4 6-7 11-9"/>'
};
const icon=(name,size=20,stroke=1.8)=>`<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]||ICON.info}</svg>`;
const mark=(size=40)=>`<img class="brand-mark" src="./logo-full.png" width="${size}" height="${size}" alt="FloMo logo" />`;
const sectionTitle=(eyebrow,title,action='',actionLabel='')=>`<div class="section-heading"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${action?`<button class="text-button" data-action="${action}">${escapeHTML(actionLabel)} ${icon('chevron',16)}</button>`:''}</div>`;
const empty=(head,sub,ic='wallet')=>`<div class="empty"><div class="empty-icon">${icon(ic,26)}</div><h3>${head}</h3><p>${sub}</p></div>`;
const badge=(text,kind='good')=>`<span class="pill pill-${kind}">${escapeHTML(text)}</span>`;
function layout(){
  const labels={home:'Home',activity:'Activity',ask:'Ask FloMo',plans:'Your plans',settings:'Settings'};
  const tabs=[['home','home','Home'],['activity','activity','Activity'],['ask','spark','Ask'],['plans','targets','Plans'],['settings','settings','More']];
  return `<div class="stage">
    <div class="desktop-intro" aria-hidden="true"><div class="intro-mark">${mark(56)} <span>flomo<span class="brand-period">.</span></span></div><h1>Your money.<br/><em>A little more<br/>peace of mind.</em></h1><p>Beautifully simple decisions.<br/>Every day, on your terms.</p><div class="intro-footer">DESIGNED TO FEEL GOOD ABOUT MONEY <span>✦</span> 2026</div></div>
    <div class="phone-shell"><div class="app-scroll" id="app-scroll"><div class="app-content" id="screen">${screen()}</div></div>
      <nav class="bottom-nav" aria-label="Primary navigation">${tabs.map(([key,ic,label])=>`<button aria-label="${label}" aria-current="${ui.tab===key?'page':'false'}" class="nav-tab ${ui.tab===key?'active':''}" data-action="nav" data-tab="${key}"><span class="nav-icon">${icon(ic,key==='ask'?23:21)}</span><span class="nav-label">${label}</span></button>`).join('')}</nav>
    </div></div>${ui.modal?modal():''}`;
}
function header({greeting,small=false}={}){
  return `<header class="topbar"><div class="topbar-brand">${mark(38)}<span>flomo<span class="brand-period">.</span></span></div><div class="topbar-actions"><span class="today-label">${new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date())}</span><button aria-label="Change appearance" class="icon-button" data-action="cycle-theme">${icon(document.documentElement.dataset.theme==='dark'?'sun':'moon',19)}</button></div></header>${greeting?`<div class="page-heading ${small?'small':''}"><div class="eyebrow">${escapeHTML(greeting)}</div><h1>${escapeHTML(state.name==='You'?'Your money,':`Hey, ${state.name.split(' ')[0]}.`)} <span class="soft-heading">${small?'':"Let's make it feel easier."}</span></h1></div>`:''}`;
}
function screen(){return ({home:homeScreen,activity:activityScreen,ask:askScreen,plans:plansScreen,settings:settingsScreen}[ui.tab]||homeScreen)()}
function chartSVG(values,width=360,height=106,compact=false){
  if(!values.length)return '';
  const nums=values.map(v=>typeof v==='number'?v:v.amount);
  const lo=Math.min(...nums),hi=Math.max(...nums),range=(hi-lo)||1;
  const coords=nums.map((v,i)=>({x:3+i*(width-6)/Math.max(1,nums.length-1),y:height-10-((v-lo)/range)*(height-28)}));
  const path=coords.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fill=`${path} L ${width-3} ${height} L 3 ${height} Z`;
  const last=coords[coords.length-1];
  return `<svg class="runway-svg ${compact?'compact':''}" role="img" aria-label="Projected cash balance over the next 14 days, excluding future income" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="runwayArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee7a0" stop-opacity=".25"/><stop offset="1" stop-color="#2ee7a0" stop-opacity="0"/></linearGradient></defs><path d="${fill}" fill="url(#runwayArea)"/><path d="${path}" fill="none" stroke="#47e6a5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6"/><circle cx="${last.x}" cy="${last.y}" r="4.5" fill="#47e6a5" stroke="#10231c" stroke-width="2"/></svg>`;
}
function homeScreen(){
  const p=plan(state),up=upcomingBills(state.bills,today(),45),recent=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const daySeries=runway(state,today(),14);
  return `${header({greeting:'YOUR DAILY MONEY COMPASS'})}
    <div class="hero"><div class="hero-top"><span class="hero-eyebrow">${icon('shield',15)} YOUR SAFE SPEND</span><button class="hero-info" aria-label="How it works" data-action="explain">${icon('info',19)}</button></div>
    <div class="hero-sub">You can comfortably spend around</div><div class="hero-number">${money(p.daily,{compact:true})}<span>/day</span></div>
    <div class="hero-status"><span class="glow-dot ${p.level==='risk'?'dot-risk':''}"></span>${p.level==='good'?'On track with your plan':p.level==='caution'?'Keep an eye on your cushion':'Your planned money is fully allocated'}</div>
    <div class="hero-chart">${chartSVG(daySeries,360,90)}</div><div class="hero-chart-caption"><span>Today</span><span>Projected bill-only cash flow · 14 days</span></div>
    <div class="hero-bottom"><div><span>Available until payday</span><strong>${money(p.available,{compact:true})}</strong></div><div class="hero-divider"></div><div><span>Next payday</span><strong>${fmt(p.payday,{long:false})}</strong></div></div>
    </div>
    <div class="tiny-disclaimer">Estimate based only on the bills and balances you've entered. <button data-action="explain">How it's calculated</button></div>
    <div class="quick-grid"><button class="quick-card" data-action="open-transaction"><span class="quick-icon">${icon('plus',21)}</span><span><strong>Add an expense</strong><small>Stay up to date</small></span>${icon('chevron',18)}</button><button class="quick-card" data-action="nav" data-tab="ask"><span class="quick-icon green">${icon('spark',21)}</span><span><strong>Ask FloMo</strong><small>Think before buying</small></span>${icon('chevron',18)}</button></div>
    ${sectionTitle('THE BIG PICTURE','Your money, at a glance')}
    <div class="balance-card"><div class="balance-main"><div><span class="eyebrow">CURRENT BALANCE</span><div class="balance-number">${money(p.balance,{compact:true})}</div></div><div class="balance-symbol">${icon('wallet',26)}</div></div>
      <div class="balance-divider"></div><div class="balance-breakdown"><div><span class="stat-dot green"></span><span>Flexible money</span><strong>${money(p.available,{compact:true})}</strong></div><div><span class="stat-dot red"></span><span>Upcoming bills</span><strong>${money(p.billsTotal,{compact:true})}</strong></div><div><span class="stat-dot neutral"></span><span>Buffer + savings</span><strong>${money(p.cushion+p.reserve,{compact:true})}</strong></div></div></div>
    ${sectionTitle('COMING UP','Before your next payday','nav-plans','See all')}
    <div class="list-card">${up.length?up.slice(0,3).map(b=>billRow(b)).join(''):empty('Nothing scheduled','Add a bill to protect money for it.','calendar')}</div>
    <button class="insight-card" data-action="nav" data-tab="ask"><span class="insight-orb">${icon('spark',23)}</span><span><small>A LITTLE EXTRA CLARITY</small><strong>Thinking about buying something?</strong><span class="insight-description">See how it affects your financial breathing room.</span></span>${icon('arrow',19)}</button>
    ${sectionTitle('YOUR RECENT MOVES','Latest activity','nav-activity','View all')}
    <div class="list-card">${recent.length?recent.map(t=>transactionRow(t)).join(''):empty('No activity yet','Start with your first transaction.')}</div>
    <div class="end-note">A better relationship with money starts with clarity. <span>✦</span></div>`;
}
function txIcon(cat){return {'Food & drink':'coffee','Shopping':'cart','Transport':'car','Home':'house','Bills':'file','Health':'heart','Entertainment':'spark','Subscriptions':'repeat','Income':'trending','Savings transfer':'targets','Other':'wallet'}[cat]||'wallet'}
function transactionRow(t){const incoming=t.type==='income';return `<div class="list-row"><div class="list-icon ${incoming?'incoming':''}">${icon(txIcon(t.category),20)}</div><div class="list-text"><strong>${escapeHTML(t.note||t.category)}</strong><span>${escapeHTML(t.category)} · ${fmt(t.date)}</span></div><div class="list-price ${incoming?'positive':''}">${incoming?'+':'−'}${money(t.amount)}</div><button class="mini-action" data-action="delete-transaction" data-id="${attr(t.id)}" aria-label="Delete ${attr(t.note||t.category)}">${icon('more',19)}</button></div>`}
function billRow(b){const days=b.daysAway;return `<div class="list-row"><div class="list-icon">${icon(b.icon||'calendar',20)}</div><div class="list-text"><strong>${escapeHTML(b.name)}</strong><span>${days===0?'Due today':days===1?'Due tomorrow':`Due ${fmt(b.dueDate)}`} · Monthly</span></div><div class="list-price">${money(b.amount)}</div></div>`}
function activityScreen(){const spent=recentSpend(state.transactions,30),received=state.transactions.filter(t=>t.type==='income'&&dateDiff(t.date,today())>=0&&dateDiff(t.date,today())<30).reduce((s,t)=>s+num(t.amount),0);
  const cats=categoryTotals(state.transactions,30).slice(0,5),max=cats.length?Math.max(...cats.map(t=>t[1])):1;
  const rows=[...state.transactions].filter(t=>ui.filter==='all'||t.type===ui.filter).sort((a,b)=>b.date.localeCompare(a.date));
  return `${header()}<div class="screen-title-row"><div><div class="eyebrow">YOUR MONEY IN MOTION</div><h1 class="screen-title">Activity<span class="red-dot">.</span></h1><p class="subheading">Every little move, made visible.</p></div><button class="round-add" data-action="open-transaction" aria-label="Add transaction">${icon('plus',23)}</button></div>
  <div class="activity-summary"><div class="activity-stat"><span class="eyebrow">SPENT · 30 DAYS</span><strong>${money(spent,{compact:true})}</strong><span class="stat-caption">${icon('arrowdown',14)} Outgoing</span></div><div class="activity-stat"><span class="eyebrow">RECEIVED · 30 DAYS</span><strong>${money(received,{compact:true})}</strong><span class="stat-caption positive">${icon('arrowup',14)} Incoming</span></div></div>
  <div class="content-panel"><div class="panel-top"><div><span class="eyebrow">SPENDING MIX</span><h3>Where it went</h3></div><span class="muted-small">Last 30 days</span></div>${cats.length?`<div class="category-bars">${cats.map(([name,amt],i)=>`<div class="category-item"><div class="category-text"><span>${escapeHTML(name)}</span><strong>${money(amt,{compact:true})}</strong></div><div class="bar-track"><span class="bar-fill ${i%3===1?'bar-mid':i%3===2?'bar-muted':''}" style="width:${Math.max(5,amt/max*100)}%"></span></div></div>`).join('')}</div>`:empty('Nothing to chart','Log an expense and see it appear here.','chart')}</div>
  ${sectionTitle('THE DETAILS','All transactions')}
  <div class="segmented" role="group" aria-label="Filter transactions">${[['all','All'],['expense','Expenses'],['income','Income']].map(([key,label])=>`<button class="${ui.filter===key?'selected':''}" data-action="filter" data-filter="${key}">${label}</button>`).join('')}</div>
  <div class="list-card">${rows.length?rows.map(transactionRow).join(''):empty('No transactions here','Add something to start building your picture.','activity')}</div>
  <div class="bottom-space"></div>`;
}
function analysisMarkup(d){
  return `<div class="decision-result ${d.verdict}" tabindex="-1" id="decision-result"><div class="decision-top">${icon(d.verdict==='good'?'check':d.verdict==='risk'?'alert':'info',22)} ${badge(d.verdict==='good'?'LOOKS GOOD':d.verdict==='risk'?'NOT RECOMMENDED':'PAUSE & CONSIDER',d.verdict)}</div>
    <h2>${d.title}</h2><p>${escapeHTML(d.subtitle)}</p><div class="decision-metrics"><div><span>Flexible money after</span><strong>${money(Math.max(0,d.projected),{compact:true})}</strong></div><div><span>Daily room after</span><strong>${money(d.newDaily,{compact:true})}</strong></div></div>
    <div class="decision-rationale"><strong>Why FloMo says this</strong><ul><li>You've set aside ${money(d.billsTotal,{compact:true})} for upcoming bills.</li><li>Your protected buffer and savings are ${money(d.cushion+d.reserve,{compact:true})}.</li><li>Your next payday is ${fmt(d.payday)} (${d.days} days away).</li>${d.slowDown?`<li>This is about ${d.slowDown} day${d.slowDown===1?'':'s'} of your current daily allowance.</li>`:''}</ul></div>
    <div class="decision-foot">${icon('lock',15)} Private calculation · Not a guarantee or financial advice</div>
  </div>`;
}
function askScreen(){const p=plan(state);return `${header()}<div class="ask-identity"><div class="ask-identity-icon">${icon('spark',29)}</div><div class="eyebrow">YOUR FINANCIAL SOUNDING BOARD</div><h1>Before you buy,<br/><em>ask FloMo.</em></h1><p>Less overthinking. More knowing where you stand.</p></div>
    <div class="ask-form-card"><div class="ask-label">WHAT'S ON YOUR MIND?</div><form data-form="ask" class="form-stack">
      <label class="field-label" for="ask-purpose">What are you thinking of buying?</label><input id="ask-purpose" name="description" maxlength="130" placeholder="e.g. A weekend trip, new shoes..." value="${attr(ui.analysis?.description||'')}" required autocomplete="off" />
      <label class="field-label" for="ask-amount">How much would it cost?</label><div class="amount-input-wrap"><span>${escapeHTML(state.currency)}</span><input id="ask-amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" value="${ui.analysis?.cost||''}" required /></div>
      <div class="ask-context">${icon('shield',17)} Your current flexible money: <strong>${money(p.available,{compact:true})}</strong></div><button class="primary-button" type="submit">Check my decision ${icon('arrow',20)}</button></form></div>
    ${ui.analysis?analysisMarkup(ui.analysis):`<div class="ask-examples"><div class="eyebrow">TRY A WHAT-IF</div><div class="examples-grid">${[['A dinner out',45],['New headphones',120],['A short getaway',350],['A little treat',20]].map(([desc,n])=>`<button class="example-chip" data-action="ask-example" data-desc="${attr(desc)}" data-amount="${n}">${icon('plus',15)} ${desc}</button>`).join('')}</div></div>`}
    <div class="trust-strip">${icon('lock',17)} Your decisions stay on this device. This version uses transparent, offline rules—not a cloud AI model.</div>
    <div class="bottom-space"></div>`;}
function goalsMarkup(){const goals=state.goals;return `<div class="goals-intro"><div class="eyebrow">SAVING FOR SOMETHING?</div><p>Give your future self something to look forward to.</p></div><div class="goal-list">${goals.length?goals.map(g=>{
    const pct=clamp((num(g.saved)/Math.max(1,num(g.target)))*100,0,100);
    return `<div class="goal-card"><div class="goal-top"><div class="goal-emoji ${g.color==='red'?'red-bg':''}">${escapeHTML(g.emoji||'✦')}</div><div class="goal-title"><h3>${escapeHTML(g.name)}</h3><p>${Math.round(pct)}% there</p></div><button aria-label="Edit goal" class="mini-action" data-action="edit-goal" data-id="${attr(g.id)}">${icon('more',20)}</button></div><div class="goal-progress"><span style="width:${pct}%" class="${g.color==='red'?'red-bar':''}"></span></div><div class="goal-bottom"><div><strong>${money(g.saved,{compact:true})}</strong> <span>of ${money(g.target,{compact:true})}</span></div><button class="small-outline" data-action="add-to-goal" data-id="${attr(g.id)}">${icon('plus',15)} Add</button></div></div>`;
  }).join(''):empty('Dream a little','Create a goal and build toward it.','targets')}</div><button class="outline-button" data-action="open-goal">${icon('plus',19)} Add savings goal</button><p class="subtle-help">Goal balances are tracked separately. When you move money into savings, record an expense or adjust your balance to keep your spendable figure accurate.</p>`;}
function billsMarkup(){const upcoming=state.bills.map(b=>({...b,dueDate:nextDayOfMonth(b.day,today())})).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));return `<div class="panel-banner"><span class="banner-icon">${icon('calendar',22)}</span><div><strong>Protect your priorities.</strong><p>FloMo sets aside bills due before your next payday.</p></div></div><div class="list-card plan-bills">${state.bills.length?upcoming.map(b=>`<div class="list-row"><div class="list-icon">${icon(b.icon||'calendar',20)}</div><div class="list-text"><strong>${escapeHTML(b.name)}</strong><span>${b.active===false?'Paused · ':'Monthly · '}Due ${fmt(b.dueDate)}</span></div><div class="list-price">${money(b.amount)}</div><button class="mini-action" aria-label="Edit ${attr(b.name)}" data-action="edit-bill" data-id="${attr(b.id)}">${icon('more',20)}</button></div>`).join(''):empty('No bills yet','Track rent, subscriptions, and anything you need to protect.','calendar')}</div><button class="outline-button" data-action="open-bill">${icon('plus',19)} Add recurring bill</button>`;}
function plansScreen(){const p=plan(state);return `${header()}<div class="screen-title-row"><div><div class="eyebrow">MAKE SPACE FOR THE FUTURE</div><h1 class="screen-title">Your plans<span class="red-dot">.</span></h1><p class="subheading">Small intentions. Better tomorrows.</p></div></div>
  <div class="plans-hero"><div><span class="eyebrow">ALREADY ACCOUNTED FOR</span><strong>${money(p.billsTotal+p.cushion+p.reserve,{compact:true})}</strong><p>Protected across bills, buffer and monthly savings</p></div>${icon('shield',33)}</div>
  <div class="segmented plan-segments" role="group" aria-label="Plans type">${[['bills','Upcoming bills'],['goals','Savings goals']].map(([key,label])=>`<button class="${ui.planTab===key?'selected':''}" data-action="plan-tab" data-tab="${key}">${label}</button>`).join('')}</div>
  ${ui.planTab==='bills'?billsMarkup():goalsMarkup()}
  <div class="bottom-space"></div>`;}
function settingsScreen(){const p=plan(state);return `${header()}<div class="screen-title-row"><div><div class="eyebrow">MAKE IT YOURS</div><h1 class="screen-title">Settings<span class="red-dot">.</span></h1><p class="subheading">Everything in your hands.</p></div></div>
   <div class="settings-profile"><div class="profile-avatar">${escapeHTML((state.name||'Y').slice(0,1).toUpperCase())}</div><div><strong>${escapeHTML(state.name)}</strong><span>${state.demo?'Exploring demo data':'Your private money space'}</span></div>${badge('LOCAL ONLY')}</div>
   ${sectionTitle('PERSONALIZE','Your appearance')}
   <div class="settings-group"><div class="settings-description">FloMo follows your phone's appearance by default, with optional manual control.</div><div class="theme-options" role="group" aria-label="Color theme">${[['system','monitor','Auto'],['light','sun','Light'],['dark','moon','Dark']].map(([key,ic,label])=>`<button data-action="theme" data-theme="${key}" class="theme-opt ${state.appearance===key?'chosen':''}">${icon(ic,21)}<span>${label}</span>${state.appearance===key?icon('check',14):''}</button>`).join('')}</div></div>
   ${sectionTitle('YOUR NUMBERS','Money preferences')}
   <div class="settings-group settings-menu"><button class="setting-row" data-action="edit-profile"><span class="setting-row-icon">${icon('wallet',21)}</span><span><strong>Balance & money plan</strong><small>${money(state.balance,{compact:true})} balance · ${money(state.cushion,{compact:true})} buffer</small></span>${icon('chevron',19)}</button>
   <button class="setting-row" data-action="edit-profile"><span class="setting-row-icon">${icon('calendar',21)}</span><span><strong>Payday & savings</strong><small>Payday on the ${state.paydayDay}${state.paydayDay===1?'st':state.paydayDay===2?'nd':state.paydayDay===3?'rd':'th'} · ${money(state.monthlyReserve,{compact:true})}/month</small></span>${icon('chevron',19)}</button>
   <button class="setting-row" data-action="edit-profile"><span class="setting-row-icon">${icon('card',21)}</span><span><strong>Currency</strong><small>${escapeHTML(state.currency)} · Choose your own</small></span>${icon('chevron',19)}</button></div>
   ${sectionTitle('PRIVATE BY DESIGN','Your data stays yours')}
   <div class="settings-group settings-menu"><button class="setting-row" data-action="export"><span class="setting-row-icon">${icon('download',21)}</span><span><strong>Export your backup</strong><small>Save your data as a JSON file</small></span>${icon('chevron',19)}</button>
   <button class="setting-row" data-action="import"><span class="setting-row-icon">${icon('upload',21)}</span><span><strong>Restore from a backup</strong><small>Import a previously exported file</small></span>${icon('chevron',19)}</button>
   <button class="setting-row" data-action="explain"><span class="setting-row-icon">${icon('info',21)}</span><span><strong>How FloMo calculates</strong><small>A clear explanation of your daily number</small></span>${icon('chevron',19)}</button></div>
   <button class="danger-link" data-action="reset">${icon('trash',17)} ${state.demo?'Reset demo data':'Erase all local data'}</button>
   <div class="settings-bottom">${mark(39)}<strong>floMo<span class="brand-period">.</span></strong><small>Version 1.0 · Made for more peaceful money days.</small><p>FloMo is a private planning tool, not a bank, financial adviser, or guarantee of affordability. No account or automatic bank connections.</p></div><div class="bottom-space"></div>`;
}
function inputField({label,name,type='text',value='',placeholder='',required=true,min,step,max,maxlength}){
  return `<label class="input-field"><span>${escapeHTML(label)}</span><input name="${attr(name)}" type="${type}" ${type==='number'?'inputmode="decimal"':''} value="${attr(value)}" placeholder="${attr(placeholder)}" ${required?'required':''} ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${step!==undefined?`step="${step}"`:''} ${maxlength!==undefined?`maxlength="${maxlength}"`:''}/></label>`;
}
function modal(){
  const m=ui.modal||{};let label='',body='';
  if(m.type==='transaction'){
    label='A little money move';
    body=`<p class="modal-description">Every entry helps FloMo give you a clearer number.</p><form data-form="transaction" class="modal-form"><div class="type-toggle" role="group" aria-label="Transaction type"><label><input type="radio" name="type" value="expense" checked/><span>${icon('arrowdown',18)} Expense</span></label><label><input type="radio" name="type" value="income"/><span>${icon('arrowup',18)} Income</span></label></div>
      ${inputField({label:'Amount',name:'amount',type:'number',placeholder:'0.00',min:'0.01',step:'0.01'})}
      ${inputField({label:'What was it for?',name:'note',placeholder:'Coffee with a friend',maxlength:90})}
      <label class="input-field"><span>Category</span><select name="category">${CATEGORIES.map(c=>`<option value="${attr(c)}">${escapeHTML(c)}</option>`).join('')}</select></label>
      ${inputField({label:'Date',name:'date',type:'date',value:today(),max:today()})}
      <button class="primary-button" type="submit">Save transaction ${icon('check',20)}</button></form>`;
  } else if(m.type==='bill'){
    const b=state.bills.find(b=>b.id===m.id);label=b?'Edit monthly bill':'Add a monthly bill';
    body=`<p class="modal-description">FloMo protects bill money before telling you what's safe to spend.</p><form data-form="bill" class="modal-form">
      ${inputField({label:'Bill name',name:'name',value:b?.name||'',placeholder:'Rent, utilities, phone...',maxlength:75})}
      ${inputField({label:'Monthly amount',name:'amount',type:'number',value:b?.amount??'',min:'.01',step:'.01',placeholder:'0.00'})}
      ${inputField({label:'Day of the month (1–31)',name:'day',type:'number',value:b?.day??1,min:1,max:31,step:1})}
      <label class="toggle-field"><input type="checkbox" name="active" ${b?.active===false?'':'checked'} /><span>Count this bill in my plan</span></label>
      <button class="primary-button" type="submit">${b?'Save changes':'Add bill'} ${icon('check',20)}</button></form>
      ${b?`<button class="danger-link in-modal" data-action="remove-bill" data-id="${attr(b.id)}">${icon('trash',17)} Delete this bill</button>`:''}`;
  } else if(m.type==='goal'){
    const g=state.goals.find(x=>x.id===m.id);label=g?'Edit your goal':'A goal worth saving for';
    body=`<p class="modal-description">Big goals start with small, steady steps.</p><form class="modal-form" data-form="goal">
      ${inputField({label:'Name your goal',name:'name',value:g?.name||'',placeholder:'The next adventure',maxlength:65})}
      ${inputField({label:'Savings target',name:'target',type:'number',value:g?.target??'',min:'0.01',step:'0.01',placeholder:'0.00'})}
      ${inputField({label:'Already saved',name:'saved',type:'number',value:g?.saved??0,min:0,step:'0.01'})}
      <label class="input-field"><span>Pick a symbol</span><select name="emoji">${[['✦','A little sparkle'],['✈','Travel'],['⌂','Home'],['♥','Something lovely'],['◎','Something meaningful']].map(([e,l])=>`<option value="${e}" ${e===(g?.emoji||'✦')?'selected':''}>${e} ${l}</option>`).join('')}</select></label>
      <button class="primary-button" type="submit">${g?'Save changes':'Create goal'} ${icon('check',20)}</button></form>
      ${g?`<button class="danger-link in-modal" data-action="remove-goal" data-id="${attr(g.id)}">${icon('trash',17)} Delete goal</button>`:''}`;
  } else if(m.type==='contribute'){
    const g=state.goals.find(x=>x.id===m.id);label='Grow your goal';
    body=`<p class="modal-description">Add an amount you've set aside for <strong>${escapeHTML(g?.name||'your goal')}</strong>.</p><form class="modal-form" data-form="contribute">
      ${inputField({label:'Amount to record',name:'amount',type:'number',min:'0.01',step:'0.01',placeholder:'0.00'})}
      <label class="toggle-field"><input type="checkbox" name="deduct" checked/><span>Also subtract this from my spending balance</span></label>
      <p class="input-note">Switch this off if your balance already excludes this money.</p>
      <button class="primary-button" type="submit">Add to goal ${icon('arrow',20)}</button></form>`;
  } else if(m.type==='profile'){
    label='Your money settings';
    body=`<p class="modal-description">Adjust these when your circumstances change. Your safe-spend number updates instantly.</p><form data-form="profile" class="modal-form">
      ${inputField({label:'What should we call you?',name:'name',value:state.name,placeholder:'Your name',maxlength:45})}
      <label class="input-field"><span>Currency</span><select name="currency">${CURRENCIES.map(c=>`<option ${state.currency===c?'selected':''} value="${c}">${c}</option>`).join('')}</select></label>
      ${inputField({label:'Money currently available in accounts',name:'balance',type:'number',value:state.balance,min:0,step:'0.01'})}
      ${inputField({label:'Payday (day of the month)',name:'paydayDay',type:'number',value:state.paydayDay,min:1,max:31,step:1})}
      ${inputField({label:'Safety buffer to keep untouched',name:'cushion',type:'number',value:state.cushion,min:0,step:'0.01'})}
      ${inputField({label:'Monthly savings to reserve',name:'monthlyReserve',type:'number',value:state.monthlyReserve,min:0,step:'0.01'})}
      <button class="primary-button" type="submit">Save my plan ${icon('check',20)}</button></form>`;
  } else if(m.type==='explain'){
    label='The math, made simple';const p=plan(state);
    body=`<p class="modal-description">Your safe-spend figure is a cautious estimate based on the amounts you enter.</p><div class="math-list"><div><span>Your current balance</span><strong>${money(p.balance)}</strong></div><div><span>Minus bills due before payday</span><strong>− ${money(p.billsTotal)}</strong></div><div><span>Minus your safety buffer</span><strong>− ${money(p.cushion)}</strong></div><div><span>Minus monthly savings reserve</span><strong>− ${money(p.reserve)}</strong></div><div class="math-result"><span>Flexible money remaining</span><strong>${money(Math.max(0,p.remaining))}</strong></div><div><span>Divided across days to payday</span><strong>${p.days} days</strong></div><div class="math-final"><span>Daily safe-spend estimate</span><strong>${money(p.daily)}</strong></div></div><p class="modal-description">Bills are monthly and counted only when their next due date falls before payday. Income not yet received, unentered spending, taxes, fees, and unpredictable expenses are not automatically included. Savings goals are tracked separately; adjust your available balance when setting money aside. This is not financial advice or a guarantee.</p><button class="primary-button" data-action="close-modal">Got it ${icon('check',19)}</button>`;
  }
  return `<div class="modal-overlay" id="modal-overlay" data-action="backdrop"><section class="sheet" role="dialog" aria-modal="true" aria-label="${attr(label)}"><div class="sheet-handle"></div><div class="modal-header"><h2>${escapeHTML(label)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close window">${icon('close',20)}</button></div><div class="modal-body">${body}</div></section></div>`;
}
function welcome(){
  return `<div class="welcome"><div class="welcome-top">${mark(56)}<span class="wordmark">flomo<span class="brand-period">.</span></span><span class="welcome-edition">YOUR MONEY, REIMAGINED</span></div>
    <div class="welcome-middle"><div class="welcome-kicker">A MORE THOUGHTFUL WAY WITH MONEY <span>✦</span></div><h1>Money feels<br/>different when<br/><em>you know.</em></h1><p>Meet FloMo. Your beautifully simple guide to what you can spend, what you should protect, and the choices in between.</p>
    <div class="welcome-preview"><div class="welcome-preview-head"><div>${icon('shield',17)} SAFE TO SPEND TODAY</div><div class="welcome-green-dot"></div></div><div class="welcome-preview-amount">$86<span>/day</span></div><div class="welcome-preview-bottom"><span>Make room for what matters.</span>${icon('arrow',22)}</div></div></div>
    <div class="welcome-actions"><button class="primary-button" data-action="onboarding">Let's get clear ${icon('arrow',21)}</button><button class="welcome-demo" data-action="try-demo">Explore with sample money ${icon('arrow',17)}</button><div class="welcome-privacy">${icon('lock',16)} Private by default. No sign-up. No bank connection.</div></div></div>${ui.modal?modal():''}`;
}
function onboarding(){
  return `<div class="setup"><div class="setup-top">${mark(48)}<span>flomo<span class="brand-period">.</span></span><button class="icon-button" data-action="back-to-welcome" aria-label="Go back">${icon('close',20)}</button></div><div class="eyebrow">YOUR SPACE · SETUP</div><h1>Let's start with<br/><em>your reality.</em></h1><p>Just a few details. No account, no bank access, and you can change everything later.</p>
   <form data-form="onboard" class="modal-form setup-form">
     ${inputField({label:'What should we call you?',name:'name',placeholder:'Your first name',maxlength:45})}
     <label class="input-field"><span>Your currency</span><select name="currency">${CURRENCIES.map(c=>`<option ${c==='USD'?'selected':''} value="${c}">${c}</option>`).join('')}</select></label>
     ${inputField({label:'Money currently available',name:'balance',type:'number',min:0,step:'.01',placeholder:'e.g. 2500'})}
     ${inputField({label:'Your payday (day 1–31)',name:'paydayDay',type:'number',value:15,min:1,max:31,step:1})}
     ${inputField({label:'Buffer to keep untouched',name:'cushion',type:'number',value:300,min:0,step:'.01'})}
     ${inputField({label:'Monthly savings to reserve',name:'monthlyReserve',type:'number',value:0,min:0,step:'.01'})}
     <button class="primary-button" type="submit">Create my money space ${icon('arrow',21)}</button><p class="input-note">Add your upcoming bills from the Plans tab after setup. Until then, FloMo cannot reserve for them.</p>
   </form></div>`;
}
let onOnboarding=false;
function render(){setAppearance();const scroller=$('#app-scroll'),scrollTop=scroller?.scrollTop||0;$('#app').innerHTML=!state?(onOnboarding?onboarding():welcome()):layout();const next=$('#app-scroll');if(next)next.scrollTop=scrollTop;if(ui.modal){setTimeout(()=>$('.sheet input:not([type="checkbox"]), .sheet button')?.focus(),10)}}
function openModal(type,idValue){ui.modal={type,id:idValue};render()}
function closeModal(){ui.modal=null;render()}
function navigate(tab){ui.tab=tab;ui.modal=null;ui.analysis=tab==='ask'?ui.analysis:null;render();const el=$('#app-scroll');if(el)el.scrollTop=0}
function getFormData(form){return Object.fromEntries(new FormData(form).entries())}
function validMoney(value){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1e12}
function handleSubmit(event){const form=event.target;if(!form.dataset.form)return;event.preventDefault();const f=getFormData(form),type=form.dataset.form;
  const invalid=(msg)=>{notify(msg);return};
  if(type==='onboard'){
    if(!validMoney(f.balance)||!validMoney(f.cushion)||!validMoney(f.monthlyReserve))return invalid('Enter valid money amounts.');
    state={...DEFAULT,name:f.name.trim()||'You',currency:f.currency,balance:num(f.balance),paydayDay:clamp(Number(f.paydayDay),1,31),cushion:num(f.cushion),monthlyReserve:num(f.monthlyReserve)};
    save();onOnboarding=false;ui.tab='home';render();notify('Welcome to FloMo. Your money space is ready.');return;
  }
  if(type==='transaction'){
    if(!validMoney(f.amount)||num(f.amount)<=0)return invalid('Enter an amount greater than zero.');
    if(f.type==='expense'&&num(f.amount)>state.balance)return invalid('This expense exceeds the balance you have entered. You can adjust your balance in Settings.');
    const record={id:id(),type:f.type==='income'?'income':'expense',amount:num(f.amount),category:f.type==='income'?'Income':f.category,note:f.note.trim()||f.category,date:f.date||today(),balanceApplied:true};
    state.transactions=[record,...state.transactions];state.balance=Math.max(0,state.balance+(record.type==='income'?record.amount:-record.amount));save();closeModal();notify('Transaction saved. Your plan is up to date.');return;
  }
  if(type==='bill'){
    if(!validMoney(f.amount)||num(f.amount)<=0)return invalid('Please enter a valid bill amount.');
    const record={id:ui.modal.id||id(),name:f.name.trim(),amount:num(f.amount),day:clamp(Math.round(Number(f.day)),1,31),icon:'calendar',active:form.elements.active.checked};
    if(ui.modal.id){state.bills=state.bills.map(b=>b.id===ui.modal.id?record:b)}else{state.bills.push(record)}
    save();closeModal();notify('Bill updated in your plan.');return;
  }
  if(type==='goal'){
    if(!validMoney(f.target)||num(f.target)<=0||!validMoney(f.saved))return invalid('Please enter valid goal amounts.');
    const record={id:ui.modal.id||id(),name:f.name.trim(),target:num(f.target),saved:num(f.saved),emoji:f.emoji||'✦',color:state.goals.find(g=>g.id===ui.modal.id)?.color||'green'};
    if(ui.modal.id){state.goals=state.goals.map(g=>g.id===ui.modal.id?record:g)}else state.goals.push(record);
    save();closeModal();notify('Your goal has been saved.');return;
  }
  if(type==='contribute'){
    const g=state.goals.find(g=>g.id===ui.modal.id);if(!g)return;
    if(!validMoney(f.amount)||num(f.amount)<=0)return invalid('Enter a valid contribution.');
    const deduct=form.elements.deduct.checked;
    if(deduct&&num(f.amount)>state.balance)return invalid('This is more than your available balance.');
    g.saved+=num(f.amount);if(deduct){state.balance-=num(f.amount);state.transactions.unshift({id:id(),type:'transfer',amount:num(f.amount),category:'Savings transfer',note:`Transfer to ${g.name}`,date:today(),balanceApplied:true})}
    save();closeModal();notify('A little closer to your goal.');return;
  }
  if(type==='profile'){
    if(!validMoney(f.balance)||!validMoney(f.cushion)||!validMoney(f.monthlyReserve))return invalid('Please enter valid numbers.');
    if(!CURRENCIES.includes(f.currency))return invalid('Choose a supported currency.');
    Object.assign(state,{name:f.name.trim()||'You',currency:f.currency,balance:num(f.balance),paydayDay:clamp(Math.round(Number(f.paydayDay)),1,31),cushion:num(f.cushion),monthlyReserve:num(f.monthlyReserve)});
    save();closeModal();notify('Your money preferences are updated.');return;
  }
  if(type==='ask'){
    const amount=num(f.amount),description=(f.description||'').trim();if(!description||!amount||amount<=0||!validMoney(amount))return invalid('Add a description and a valid amount.');
    ui.analysis=purchaseDecision(state,amount,description);render();setTimeout(()=>$('#decision-result')?.scrollIntoView({behavior:'smooth',block:'center'}),110);return;
  }
}
function doExport(){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.href=url;a.download=`flomo-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('Backup downloaded. Keep it somewhere safe.')}
function doImport(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{
  try{const f=input.files?.[0];if(!f)return;if(f.size>2*1024*1024)return notify('Backup is too large (2 MB maximum).');const raw=JSON.parse(await f.text());if(!validateBackup(raw))return notify('This file is not a valid FloMo backup.');if(!window.confirm('Replace your current FloMo data with this backup?'))return;
    const cleaned={...DEFAULT,...raw};cleaned.balance=Math.max(0,num(raw.balance));cleaned.cushion=Math.max(0,num(raw.cushion));cleaned.monthlyReserve=Math.max(0,num(raw.monthlyReserve));cleaned.appearance=['system','dark','light'].includes(raw.appearance)?raw.appearance:'system';cleaned.currency=CURRENCIES.includes(raw.currency)?raw.currency:'USD';cleaned.transactions=raw.transactions.slice(0,2000);cleaned.bills=raw.bills.slice(0,300);cleaned.goals=raw.goals.slice(0,300);state=cleaned;save();ui.tab='home';render();notify('Backup restored successfully.');
  }catch{notify('Could not read that backup.')}};input.click()}
function handleClick(event){const target=event.target.closest('[data-action]');if(!target)return;const action=target.dataset.action;
  if(action==='backdrop'){if(event.target===target)closeModal();return}
  if(action==='nav'){navigate(target.dataset.tab);return}
  if(action==='nav-plans'){ui.planTab='bills';navigate('plans');return}
  if(action==='nav-activity'){navigate('activity');return}
  if(action==='open-transaction'){openModal('transaction');return}
  if(action==='open-bill'){openModal('bill');return}
  if(action==='open-goal'){openModal('goal');return}
  if(action==='edit-bill'){openModal('bill',target.dataset.id);return}
  if(action==='edit-goal'){openModal('goal',target.dataset.id);return}
  if(action==='add-to-goal'){openModal('contribute',target.dataset.id);return}
  if(action==='edit-profile'){openModal('profile');return}
  if(action==='explain'){openModal('explain');return}
  if(action==='close-modal'){closeModal();return}
  if(action==='onboarding'){onOnboarding=true;render();return}
  if(action==='back-to-welcome'){onOnboarding=false;render();return}
  if(action==='try-demo'){state=generateDemo();save();onOnboarding=false;ui.tab='home';render();notify('Welcome! You are exploring fictional sample data.');return}
  if(action==='filter'){ui.filter=target.dataset.filter;render();return}
  if(action==='plan-tab'){ui.planTab=target.dataset.tab;render();return}
  if(action==='theme'){state.appearance=target.dataset.theme;save();render();return}
  if(action==='cycle-theme'){state.appearance=document.documentElement.dataset.theme==='dark'?'light':'dark';save();render();return}
  if(action==='ask-example'){ui.analysis=purchaseDecision(state,num(target.dataset.amount),target.dataset.desc);render();setTimeout(()=>$('#decision-result')?.scrollIntoView({behavior:'smooth',block:'center'}),100);return}
  if(action==='export'){doExport();return}
  if(action==='import'){doImport();return}
  if(action==='delete-transaction'){
    const t=state.transactions.find(t=>t.id===target.dataset.id);if(!t)return;
    if(!window.confirm(`Remove “${t.note||t.category}” from your activity?`))return;
    if(t.balanceApplied)state.balance=Math.max(0,state.balance+(t.type==='income'?-num(t.amount):num(t.amount)));
    state.transactions=state.transactions.filter(x=>x.id!==t.id);save();render();notify('Transaction removed.');return;
  }
  if(action==='remove-bill'){if(!window.confirm('Delete this recurring bill?'))return;state.bills=state.bills.filter(b=>b.id!==target.dataset.id);save();closeModal();notify('Bill deleted.');return;}
  if(action==='remove-goal'){if(!window.confirm('Delete this goal? Saved amounts are only tracking figures.'))return;state.goals=state.goals.filter(g=>g.id!==target.dataset.id);save();closeModal();notify('Goal deleted.');return;}
  if(action==='reset'){if(!window.confirm(state.demo?'Reset FloMo to the original sample data?':'Erase ALL FloMo data from this browser? This cannot be undone without a backup.'))return;
    if(state.demo){state=generateDemo();save()}else{localStorage.removeItem(KEY);state=null;onOnboarding=false;ui.tab='home'}ui.analysis=null;render();notify('Local data reset.');return;
  }
}
$('#app').addEventListener('click',handleClick);
$('#app').addEventListener('submit',handleSubmit);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&ui.modal)closeModal()});
if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
