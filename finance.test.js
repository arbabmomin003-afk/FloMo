import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,dateDiff,nextDayOfMonth,nextPayday,plan,purchaseDecision,upcomingBills,categoryTotals,generateDemo,validateBackup} from './finance.js';

test('local calendar utilities handle month ends and leap years',()=>{
  assert.equal(nextDayOfMonth(31,'2026-02-01'),'2026-02-28');
  assert.equal(nextDayOfMonth(31,'2028-02-01'),'2028-02-29');
  assert.equal(nextDayOfMonth(7,'2026-10-29'),'2026-11-07');
  assert.equal(nextPayday(15,'2026-10-29'),'2026-11-15');
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(dateDiff('2026-10-29','2026-11-15'),17);
});

test('only upcoming bills before the next payday are reserved',()=>{
  const d={balance:3000,cushion:400,monthlyReserve:200,paydayDay:15,bills:[
    {name:'Rent',amount:1000,day:1,active:true},
    {name:'Phone',amount:50,day:10,active:true},
    {name:'After payday',amount:300,day:20,active:true},
    {name:'Paused',amount:800,day:5,active:false}
  ]};
  const result=plan(d,'2026-10-29');
  assert.equal(result.billsTotal,1050);
  assert.equal(result.remaining,1350);
  assert.equal(result.available,1350);
  assert.equal(result.days,17);
  assert.ok(Math.abs(result.daily-(1350/17))<.001);
});

test('risk cannot create a negative safe daily allowance',()=>{
  const result=plan({balance:300,cushion:500,monthlyReserve:0,paydayDay:15,bills:[]},'2026-10-29');
  assert.equal(result.available,0);
  assert.equal(result.daily,0);
  assert.equal(result.level,'risk');
});

test('purchase decision reflects reserves and opportunity cost',()=>{
  const d={balance:900,cushion:200,monthlyReserve:100,paydayDay:15,bills:[{id:'b',name:'Rent',amount:400,day:1,active:true}]};
  const low=purchaseDecision(d,10,'Coffee','2026-10-29');
  const high=purchaseDecision(d,250,'Large purchase','2026-10-29');
  assert.equal(low.verdict,'good');
  assert.equal(high.verdict,'risk');
  assert.ok(high.projected<0);
  assert.ok(low.newDaily<low.daily);
});

test('category spending excludes income, old transactions, and future entries',()=>{
  const t=[
    {type:'expense',category:'Food & drink',amount:20,date:'2026-10-29'},
    {type:'expense',category:'Food & drink',amount:10,date:'2026-10-28'},
    {type:'income',category:'Income',amount:100,date:'2026-10-28'},
    {type:'expense',category:'Other',amount:50,date:'2026-09-10'},
    {type:'expense',category:'Other',amount:60,date:'2026-11-03'}
  ];
  assert.deepEqual(categoryTotals(t,30,'2026-10-29'),[['Food & drink',30]]);
});

test('demo and backup validation',()=>{
  const sample=generateDemo('2026-10-29');
  assert.equal(sample.onboarded,true);
  assert.ok(plan(sample,'2026-10-29').daily>0);
  assert.ok(validateBackup(sample));
  assert.equal(validateBackup({...sample,transactions:null}),false);
});
