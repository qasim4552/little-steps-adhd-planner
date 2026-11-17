/* Extra planning features; v1 backups remain readable. Amounts are integer cents. */
(function(P){
const originalBlank=P.blank,originalValidate=P.validate;
const repeats=['none','weekly','fortnightly','monthly','yearly'];
const categories=['Food & coffee','Groceries','Transport','Home','Health','Fun','Bills','Other'];
const list=s=>[{id:'main',name:s.mainAccountName||'Main account',type:'spending',balance:s.balance},...(s.accounts||[])];
const spending=(s,id='main')=>list(s).find(a=>a.id===id)?.type==='spending';
function defaults(s){for(const k of ['accounts','paychecks','envelopes','skippedBills'])if(s[k]===undefined)s[k]=[];if(s.dayNotes===undefined)s.dayNotes={};if(s.profile===undefined)s.profile={name:'',title:'My calm planner'};return s;}
P.blank=()=>defaults(originalBlank());
function occurrence(anchor,repeat,n){
 if(n===0)return anchor;
 if(repeat==='weekly'||repeat==='fortnightly')return P.nextDay(anchor,n*(repeat==='weekly'?7:14));
 const [y,m,d]=anchor.split('-').map(Number);const month=m-1+n*(repeat==='yearly'?12:1),date=new Date(Date.UTC(y,month,1));
 const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(d,last));return date.toISOString().slice(0,10);
}
function dates(item,end){const out=[];for(let n=0;n<4000;n++){const date=occurrence(item.date,item.repeat||'none',n);if(date>end)break;out.push(date);if(!item.repeat||item.repeat==='none')break;}return out;}
function billInstances(s,end=P.nextDay(P.localDay(),90)){
 const skipped=new Set(s.skippedBills||[]),stored=new Set(s.bills.map(b=>b.id)),out=[];
 for(const b of s.bills){if(!skipped.has(b.id))out.push(b);if(b.parentId||!b.repeat||b.repeat==='none')continue;
 for(const date of dates(b,end).slice(1)){const id=b.id+'@'+date;if(!stored.has(id)&&!skipped.has(id))out.push({...b,id,date,parentId:b.id,repeat:'none',paid:false,txId:null});}}
 return out.filter(b=>b.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
}
function payInstances(s,end=P.nextDay(P.localDay(),90)){
 const received=new Map(s.transactions.filter(t=>t.payKey).map(t=>[t.payKey,t]));
 return (s.paychecks||[]).flatMap(p=>dates(p,end).map(date=>{const key=p.id+'@'+date,tx=received.get(key);return {...p,...(tx?{name:tx.name,amount:tx.amount,accountId:tx.accountId}:{}),date,key,received:!!tx};})).sort((a,b)=>a.date.localeCompare(b.date));
}
function horizon(s,today){if(s.paydayMode==='manual')return P.validDay(s.payday)&&s.payday>=today?s.payday:today;const pay=payInstances(s,P.nextDay(today,366)).find(p=>!p.received&&p.date>=today&&spending(s,p.accountId));return pay?pay.date:P.validDay(s.payday)&&s.payday>=today?s.payday:today;}
function accountBalances(s,today=P.localDay()){
 return list(s).map(a=>{const tx=s.transactions.filter(t=>(t.accountId||'main')===a.id&&t.date<=today),current=a.balance+tx.reduce((v,t)=>v+(t.kind==='income'?t.amount:-t.amount),0);return {...a,current};});
}
P.summary=function(s,today=P.localDay()){
 const tx=s.transactions.filter(t=>t.date<=today&&spending(s,t.accountId));
 const income=tx.filter(t=>t.kind==='income').reduce((v,t)=>v+t.amount,0),spent=tx.filter(t=>t.kind==='expense').reduce((v,t)=>v+t.amount,0);
 const end=horizon(s,today),bills=billInstances(s,end).filter(b=>!b.paid&&spending(s,b.accountId)).reduce((v,b)=>v+b.amount,0);
 const goals=s.goals.reduce((v,g)=>v+g.current,0),starting=list(s).filter(a=>a.type==='spending').reduce((v,a)=>v+a.balance,0),current=starting+income-spent;
 const available=current-bills-s.reserve-goals,count=Math.max(1,P.days(today,end)+1);
 return {income,spent,bills,goals,current,available,count,daily:Math.floor(available/count),horizon:end};
};
P.forecast=function(s,today=P.localDay()){
 const m=P.summary(s,today),bills=billInstances(s,m.horizon),pay=payInstances(s,m.horizon);let balance=m.current;const rows=[];
 for(let i=0;i<Math.min(366,m.count);i++){const date=P.nextDay(today,i),due=bills.filter(b=>!b.paid&&spending(s,b.accountId)&&(i===0?b.date<=date:b.date===date)).reduce((v,b)=>v+b.amount,0),income=pay.filter(p=>!p.received&&p.date===date&&spending(s,p.accountId)).reduce((v,p)=>v+p.amount,0),spend=Math.max(0,m.daily);balance+=income-due-spend;rows.push({date,bills:due,income,spend,balance});}return rows;
};
function toggleBill(s,id,today=P.localDay()){
 let bill=s.bills.find(b=>b.id===id);if(!bill){const found=billInstances(s,P.nextDay(today,366)).find(b=>b.id===id);if(!found)throw Error('This bill occurrence is no longer available.');bill={...found};s.bills.push(bill);}
 if(bill.paid){s.transactions=s.transactions.filter(t=>t.id!==bill.txId);bill.paid=false;bill.txId=null;}else{bill.paid=true;bill.txId='bill:'+bill.id;s.transactions.push({id:bill.txId,name:bill.name,amount:bill.amount,date:today,kind:'expense',accountId:bill.accountId||'main',category:'Bills'});}
}
function transfer(s,from,to,amount,date,id){
 if(from===to)throw Error('Choose two different accounts.');if(!list(s).some(a=>a.id===from)||!list(s).some(a=>a.id===to))throw Error('Choose valid accounts.');
 if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Enter a positive amount.');
 if(accountBalances(s,date).find(a=>a.id===from).current<amount)throw Error('The source account does not have that amount.');
 for(const [accountId,kind,target] of [[from,'expense',to],[to,'income',from]])s.transactions.push({id:id+':'+kind,transferId:id,name:'Transfer '+(kind==='expense'?'to ':'from ')+list(s).find(a=>a.id===target).name,amount,date,kind,accountId,category:'Transfer'});
}
function receivePay(s,key,today=P.localDay()){
 const p=payInstances(s,P.nextDay(today,366)).find(p=>p.key===key);if(!p||p.received)throw Error('This paycheck has already been received or removed.');if(p.date>today)throw Error('Log pay only after it arrives.');
 s.transactions.push({id:'pay:'+p.key,payKey:p.key,amount:p.amount,name:p.name,date:today,kind:'income',accountId:p.accountId||'main',category:'Paycheck'});
}
function monthReport(s,month,today=P.localDay()){
 const tx=s.transactions.filter(t=>t.date.startsWith(month)&&t.date<=today&&!t.transferId),income=tx.filter(t=>t.kind==='income').reduce((v,t)=>v+t.amount,0),spent=tx.filter(t=>t.kind==='expense').reduce((v,t)=>v+t.amount,0),byCategory={};
 for(const t of tx.filter(t=>t.kind==='expense')){const c=t.category||'Other';byCategory[c]=(byCategory[c]||0)+t.amount;}return {income,spent,net:income-spent,byCategory,transactions:tx};
}
P.validate=function(s){
 originalValidate(s);defaults(s);const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e13,text=(x,n=120)=>typeof x==='string'&&x.trim().length>0&&x.length<=n;
 for(const key of ['accounts','paychecks','envelopes']){if(!Array.isArray(s[key])||s[key].length>1000)throw Error('Invalid '+key);const ids=new Set();for(const x of s[key]){if(!x||!text(x.id,100)||ids.has(x.id))throw Error('Invalid '+key+' record');ids.add(x.id);}}
 for(const a of s.accounts)if(a.id==='main'||!text(a.name)||!['spending','savings'].includes(a.type)||!integer(a.balance))throw Error('Invalid account');
 const validAccount=id=>id===undefined||list(s).some(a=>a.id===id);
 for(const t of s.transactions)if(!validAccount(t.accountId)||(t.category!==undefined&&!text(t.category,60))||(t.transferId!==undefined&&!text(t.transferId,100))||(t.payKey!==undefined&&!text(t.payKey,160)))throw Error('Invalid transaction account or category');
 for(const b of s.bills)if(!validAccount(b.accountId)||(b.repeat!==undefined&&!repeats.includes(b.repeat)))throw Error('Invalid bill schedule');
 for(const p of s.paychecks)if(!text(p.name)||!integer(p.amount)||!p.amount||!P.validDay(p.date)||!repeats.includes(p.repeat)||!validAccount(p.accountId))throw Error('Invalid paycheck');
 for(const e of s.envelopes)if(!text(e.name)||!text(e.category,60)||!integer(e.cap)||!e.cap)throw Error('Invalid envelope');
 if(new Set(s.envelopes.map(e=>e.category)).size!==s.envelopes.length)throw Error('Use one envelope per category.');
 if(!Array.isArray(s.skippedBills)||s.skippedBills.some(x=>!text(x,160))||s.skippedBills.length>20000)throw Error('Invalid skipped bills');
 if(!s.dayNotes||typeof s.dayNotes!=='object'||Array.isArray(s.dayNotes)||Object.entries(s.dayNotes).some(([date,note])=>!P.validDay(date)||!text(note,2000)))throw Error('Invalid day notes');
 if(!s.profile||typeof s.profile.name!=='string'||s.profile.name.length>80||!text(s.profile.title,120))throw Error('Invalid profile');
 const transfers=new Map();for(const t of s.transactions.filter(t=>t.transferId)){if(!transfers.has(t.transferId))transfers.set(t.transferId,[]);transfers.get(t.transferId).push(t);}
 for(const group of transfers.values())if(group.length!==2||group[0].kind===group[1].kind||group[0].amount!==group[1].amount||group[0].date!==group[1].date||group[0].accountId===group[1].accountId)throw Error('A transfer must keep both matching entries.');
 return s;
};
Object.assign(P,{categories,repeats,occurrence,billInstances,payInstances,accountBalances,spending,transfer,receivePay,toggleBill,monthReport,accounts:list,horizon});
if(typeof module!=='undefined')module.exports=P;
})(typeof module!=='undefined'?require('./model.js'):Planner);
