/* In-app installation gate. This is a UI access check, not server-side licensing. */
(function(){
const CODE_HASH='f7b520f5dd5ce8f807daa4a3f1fbadb013081a53a96f3b561ecc6219aeeac993';
const button=document.getElementById('install'),nativeInstall=button.onclick,card=button.closest('article');
let unlocked=false;
const panel=document.createElement('div');panel.id='installation-details';panel.hidden=true;
for(const p of [...card.querySelectorAll('p')])panel.appendChild(p);
card.insertBefore(panel,button);panel.appendChild(button);
const trigger=document.createElement('button');trigger.id='unlock-install';trigger.className='primary';trigger.textContent='Unlock app installation';card.insertBefore(trigger,panel);
const explanation=document.createElement('p');explanation.id='install-access-note';explanation.textContent='An access code is required to reveal the app installation option.';card.insertBefore(explanation,trigger);
const dialog=document.createElement('dialog');dialog.id='install-code-dialog';dialog.setAttribute('aria-labelledby','install-code-title');dialog.innerHTML='<form id="install-code-form"><div class="row"><h2 id="install-code-title">App installation access</h2><button type="button" id="cancel-install-code" aria-label="Close">×</button></div><p>Enter the code supplied by the planner owner.</p><label>Access code<input id="install-access-code" name="code" type="password" autocomplete="off" spellcheck="false" required maxlength="80" aria-describedby="install-code-error"></label><p id="install-code-error" role="alert" hidden></p><div class="inline"><button class="primary" type="submit">Unlock installation</button><button type="button" id="cancel-install-code-bottom" class="quiet">Cancel</button></div></form>';
document.body.appendChild(dialog);
const close=()=>{dialog.close();document.getElementById('install-access-code').value='';};document.getElementById('cancel-install-code').onclick=close;document.getElementById('cancel-install-code-bottom').onclick=close;
trigger.onclick=()=>{document.getElementById('install-code-form').reset();document.getElementById('install-code-error').hidden=true;dialog.showModal();document.getElementById('install-access-code').focus();};
button.onclick=async()=>{if(!unlocked)return trigger.click();await nativeInstall();};
document.getElementById('install-code-form').onsubmit=async e=>{e.preventDefault();const error=document.getElementById('install-code-error'),submit=e.currentTarget.querySelector('[type=submit]');submit.disabled=true;
try{const code=document.getElementById('install-access-code').value.trim().toUpperCase().replace(/[\s-]/g,'');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));const hash=[...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
if(hash!==CODE_HASH){error.textContent='That code is not correct. Please check it and try again.';error.hidden=false;return;}
unlocked=true;panel.hidden=false;trigger.hidden=true;explanation.textContent='App installation is unlocked for this page session. Choose Install app below.';close();button.focus();
}catch{error.textContent='Could not verify the code. Open the planner over HTTPS or localhost and try again.';error.hidden=false;}finally{submit.disabled=false;}};
})();
