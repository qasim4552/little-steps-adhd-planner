/* Pure money model. All financial values are integer minor units. */
(function(root){
const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const epoch=d=>Date.parse(d+'T00:00:00Z');
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(epoch(d))&&new Date(epoch(d)).toISOString().slice(0,10)===d;
const days=(a,b)=>Math.round((epoch(b)-epoch(a))/86400000);
const nextDay=(d,n)=>new Date(epoch(d)+n*86400000).toISOString().slice(0,10);
const cents=n=>Math.round(Number(n)*100);
const currencies=['USD','PKR','GBP','EUR','CAD','AUD','INR','AED','SAR','QAR','BDT','NZD','SGD','MYR','ZAR'];
function blank(){return {version:1,currency:'USD',balance:0,reserve:0,payday:'',configured:false,transactions:[],bills:[],goals:[],tasks:[],notes:[],wishes:[],energy:{},theme:'light',savedAt:null};}
function summary(s,today=localDay()){
 const tx=s.transactions.filter(t=>t.date<=today);
 const income=tx.filter(t=>t.kind==='income').reduce((a,t)=>a+t.amount,0);
 const spent=tx.filter(t=>t.kind==='expense').reduce((a,t)=>a+t.amount,0);
 const horizon=validDay(s.payday)&&s.payday>=today?s.payday:today;
 const bills=s.bills.filter(b=>!b.paid&&b.date<=horizon).reduce((a,b)=>a+b.amount,0);
 const goals=s.goals.reduce((a,g)=>a+g.current,0);
 const current=s.balance+income-spent;
 const available=current-bills-s.reserve-goals;
 const count=Math.max(1,days(today,horizon)+1);
 return {income,spent,bills,goals,current,available,count,daily:Math.floor(available/count),horizon};
}
function forecast(s,today=localDay()){
 const m=summary(s,today),out=[];let balance=m.current;
 const n=Math.min(366,m.count),daily=Math.max(0,m.daily);
 for(let i=0;i<n;i++){const date=nextDay(today,i);const due=s.bills.filter(b=>!b.paid&&(i===0?b.date<=date:b.date===date)).reduce((a,b)=>a+b.amount,0);balance-=due+daily;out.push({date,bills:due,spend:daily,balance});}
 return out;
}
function validate(s){
 const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e13;
 const text=(t,max=2000)=>typeof t==='string'&&t.trim().length>0&&t.length<=max;
 if(!s||s.version!==1||!currencies.includes(s.currency)||!integer(s.balance)||!integer(s.reserve)||typeof s.configured!=='boolean'||!(s.payday===''||validDay(s.payday))||!['light','dark'].includes(s.theme))throw Error('Invalid planner settings.');
 for(const k of ['transactions','bills','goals','tasks','notes','wishes']){if(!Array.isArray(s[k])||s[k].length>20000)throw Error('Invalid '+k);const ids=new Set();for(const x of s[k]){if(!x||!text(x.id,100)||ids.has(x.id))throw Error('Invalid record ID');ids.add(x.id);}}
 for(const t of s.transactions)if(!text(t.name,120)||!integer(t.amount)||t.amount===0||!validDay(t.date)||!['income','expense'].includes(t.kind))throw Error('Invalid transaction');
 for(const b of s.bills)if(!text(b.name,120)||!integer(b.amount)||b.amount===0||!validDay(b.date)||typeof b.paid!=='boolean'||(b.paid&&!s.transactions.some(t=>t.id===b.txId&&t.amount===b.amount&&t.kind==='expense')))throw Error('Invalid bill');
 for(const g of s.goals)if(!text(g.name,120)||!integer(g.target)||g.target===0||!integer(g.current))throw Error('Invalid goal');
 for(const t of s.tasks)if(!text(t.text,160)||!validDay(t.date)||typeof t.done!=='boolean')throw Error('Invalid task');
 for(const n of s.notes)if(!text(n.text))throw Error('Invalid note');
 for(const w of s.wishes)if(!text(w.name,120)||!integer(w.amount)||w.amount===0||!Number.isFinite(w.created)||!['waiting','skipped','bought'].includes(w.status))throw Error('Invalid wish');
 if(!s.energy||typeof s.energy!=='object'||Array.isArray(s.energy)||Object.entries(s.energy).some(([d,e])=>!validDay(d)||!['low','steady','high'].includes(e)))throw Error('Invalid check-in');
 return s;
}
const model={localDay,validDay,days,nextDay,cents,blank,summary,forecast,validate,currencies};root.Planner=model;if(typeof module!=='undefined')module.exports=model;
})(typeof globalThis!=='undefined'?globalThis:this);
