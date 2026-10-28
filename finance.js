/** FloMo's entirely local, deterministic planning engine.
 * Estimates are guidance, not a guarantee that purchases are affordable.
 */
export const DAY = 86400000;
export function localISO(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function parseISO(iso) {
  const [y,m,d] = String(iso).split('-').map(Number);
  return new Date(y,m-1,d,12,0,0,0);
}
export function addDays(iso, count) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + count);
  return localISO(date);
}
export function dateDiff(fromISO, toISO) {
  return Math.round((parseISO(toISO) - parseISO(fromISO))/DAY);
}
export function dateInMonth(year, monthIndex, preferredDay) {
  const last = new Date(year,monthIndex+1,0).getDate();
  return localISO(new Date(year,monthIndex,Math.min(Math.max(1,Number(preferredDay)||1),last),12));
}
export function nextDayOfMonth(preferredDay, fromISO = localISO(), strictFuture=false) {
  const date = parseISO(fromISO);
  let next = dateInMonth(date.getFullYear(),date.getMonth(),preferredDay);
  if (next < fromISO || (strictFuture && next === fromISO)) {
    next = dateInMonth(date.getFullYear(),date.getMonth()+1,preferredDay);
  }
  return next;
}
export function nextPayday(paydayDay, today = localISO()) {
  return nextDayOfMonth(paydayDay, today, true);
}
export function upcomingBills(bills=[], today=localISO(), horizon=45) {
  return bills.filter(b=>b.active !== false && Number(b.amount)>0).map(b=>({
    ...b, dueDate: nextDayOfMonth(b.day, today), daysAway: dateDiff(today,nextDayOfMonth(b.day,today))
  })).filter(b=>b.daysAway<=horizon).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
}
export function plan(data,today=localISO()) {
  const balance=Number(data.balance)||0;
  const payday=nextPayday(data.paydayDay||15,today);
  const days=Math.max(1,dateDiff(today,payday));
  const due=upcomingBills(data.bills||[],today,Math.max(45,days)).filter(b=>b.dueDate<payday);
  const billsTotal=due.reduce((sum,b)=>sum+Number(b.amount),0);
  const cushion=Math.max(0,Number(data.cushion)||0);
  const reserve=Math.max(0,Number(data.monthlyReserve)||0);
  const remaining=balance-billsTotal-cushion-reserve;
  const available=Math.max(0,remaining);
  const daily=available/days;
  return {balance,payday,days,due,billsTotal,cushion,reserve,remaining,available,daily,
    level: remaining <= 0 ? 'risk' : remaining / Math.max(1,balance) < .18 ? 'caution' : 'good'
  };
}
export function purchaseDecision(data, amount, description='', today=localISO()) {
  const p=plan(data,today);
  const cost=Number(amount);
  if (!Number.isFinite(cost)||cost<=0) return null;
  const projected=p.remaining-cost;
  let verdict, title, subtitle;
  if(p.remaining<=0 || cost>p.available) {
    verdict='risk'; title='A better moment to wait.';
    subtitle='This would go beyond the amount left after the bills and buffer you have recorded.';
  } else if(cost>p.daily*1.8 || cost>p.available*.34) {
    verdict='caution'; title='Possible, with a trade-off.';
    subtitle='You can cover it on paper, but it uses a meaningful part of your flexible money.';
  } else {
    verdict='good'; title='This looks manageable.';
    subtitle='Based on what you have recorded, the purchase fits inside your flexible spending amount.';
  }
  const newDaily=Math.max(0,projected)/p.days;
  const slowDown=cost>p.daily ? Math.ceil(cost/Math.max(p.daily,1)) : 0;
  return { ...p, cost, description, projected, newDaily, slowDown, verdict, title, subtitle };
}
export function recentSpend(transactions=[],days=7,today=localISO()) {
  return transactions.filter(t=>t.type==='expense' && dateDiff(t.date,today)>=0 && dateDiff(t.date,today)<days)
    .reduce((sum,t)=>sum+Number(t.amount||0),0);
}
export function categoryTotals(transactions=[],days=30,today=localISO()) {
  const map={};
  transactions.filter(t=>t.type==='expense' && dateDiff(t.date,today)>=0 && dateDiff(t.date,today)<days)
    .forEach(t=>{map[t.category||'Other']=(map[t.category||'Other']||0)+Number(t.amount||0)});
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}
export function runway(data,today=localISO(),numberOfDays=14) {
  const upcoming = upcomingBills(data.bills||[],today,Math.max(numberOfDays,45));
  const items=[];let total=Number(data.balance)||0;
  for(let day=0;day<=numberOfDays;day++){
    const date=addDays(today,day);
    if(day>0) upcoming.filter(b=>b.dueDate===date).forEach(b=>{total-=Number(b.amount)});
    items.push({date,amount:total});
  }
  return items;
}
export function generateDemo(today=localISO()) {
  const base = parseISO(today), plus = (n) => addDays(today,n);
  return {
    version:1, onboarded:true, demo:true, name:'Alex', currency:'USD', appearance:'system',
    balance:4860, paydayDay:parseISO(plus(18)).getDate(),
    cushion:850,monthlyReserve:300,
    transactions:[
      {id:'dt1',type:'expense',amount:46.8,category:'Food & drink',note:'Groceries',date:plus(-1),balanceApplied:false},
      {id:'dt2',type:'expense',amount:29,category:'Shopping',note:'Weekend essentials',date:plus(-2),balanceApplied:false},
      {id:'dt3',type:'income',amount:2450,category:'Income',note:'Monthly salary',date:plus(-4),balanceApplied:false},
      {id:'dt4',type:'expense',amount:15.99,category:'Subscriptions',note:'Music subscription',date:plus(-5),balanceApplied:false},
      {id:'dt5',type:'expense',amount:68.3,category:'Food & drink',note:'Dinner with friends',date:plus(-7),balanceApplied:false},
      {id:'dt6',type:'expense',amount:12.5,category:'Transport',note:'Transit',date:plus(-10),balanceApplied:false},
      {id:'dt7',type:'expense',amount:120,category:'Shopping',note:'New running shoes',date:plus(-13),balanceApplied:false}
    ],
    bills:[
      {id:'b1',name:'Rent',amount:1120,day:parseISO(plus(4)).getDate(),icon:'house',active:true},
      {id:'b2',name:'Phone & internet',amount:64,day:parseISO(plus(8)).getDate(),icon:'wifi',active:true},
      {id:'b3',name:'Subscriptions',amount:32,day:parseISO(plus(12)).getDate(),icon:'repeat',active:true}
    ],
    goals:[
      {id:'g1',name:'Summer escape',target:1800,saved:720,emoji:'✈',color:'green'},
      {id:'g2',name:'Emergency fund',target:5000,saved:1850,emoji:'✦',color:'red'}
    ]
  };
}
export function validateBackup(obj) {
  return Boolean(obj && obj.version===1 && obj.onboarded === true && Array.isArray(obj.transactions) && Array.isArray(obj.bills) && Array.isArray(obj.goals) && typeof obj.currency === 'string' && Number.isFinite(Number(obj.balance)) && Number.isFinite(Number(obj.paydayDay)));
}
