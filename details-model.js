/* User-editable setup; never rewrites recorded transactions while adjusting schedules. */
(function(P){
const blank=P.blank,validate=P.validate;
function defaults(s){if(s.paydayMode===undefined)s.paydayMode='auto';if(s.mainAccountName===undefined)s.mainAccountName='Main account';return s;}
P.blank=()=>defaults(blank());
P.validate=function(s){validate(s);defaults(s);if(!['auto','manual'].includes(s.paydayMode)||typeof s.mainAccountName!=='string'||!s.mainAccountName.trim()||s.mainAccountName.length>120)throw Error('Check the payday method and main account name.');for(const k of ['accounts','paychecks','bills','goals','envelopes'])for(const x of s[k]||[])if(x.notes!==undefined&&(typeof x.notes!=='string'||x.notes.length>2000))throw Error('Notes must be under 2,000 characters.');return s;};
P.editBillSchedule=function(s,billId,data,newId){const bill=s.bills.find(b=>b.id===billId&&!b.parentId);if(!bill)throw Error('Choose an original bill schedule.');const hasPaid=bill.paid;s.bills=s.bills.filter(b=>b.parentId!==billId||b.paid);
 if(hasPaid){bill.repeat='none';s.bills.push({id:newId,name:data.name,amount:data.amount,date:data.date,repeat:data.repeat,accountId:data.accountId,notes:data.notes||'',paid:false,txId:null});}
 else Object.assign(bill,{name:data.name,amount:data.amount,date:data.date,repeat:data.repeat,accountId:data.accountId,notes:data.notes||''});
};
if(typeof module!=='undefined')module.exports=P;
})(typeof module!=='undefined'?require('./planner-model.js'):Planner);
