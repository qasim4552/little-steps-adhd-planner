'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const localSource=path.resolve(__dirname,'../little-steps/dist'),source=fs.existsSync(path.join(localSource,'index.html'))?localSource:path.resolve(__dirname,'..'),target=path.join(__dirname,'app');fs.mkdirSync(target,{recursive:true});
const names=['index.html','style.css','features.css','notebook.css','model.js','money-model.js','planner-model.js','details-model.js','app.js','features.js','notebook.js','details.js','manifest.webmanifest','icon-192.png','icon-512.png'];
for(const name of names)fs.copyFileSync(path.join(source,name),path.join(target,name));
let html=fs.readFileSync(path.join(target,'index.html'),'utf8').replace('<script src="install-gate.js" defer></script>','');html=html.replace('</body>','<script src="desktop-ui.js" defer></script></body>');fs.writeFileSync(path.join(target,'index.html'),html);
fs.copyFileSync(path.join(__dirname,'desktop-ui.js'),path.join(target,'desktop-ui.js'));
const appjs=path.join(target,'app.js');let code=fs.readFileSync(appjs,'utf8');code=code.replace("if('serviceWorker'in navigator)","if(!window.desktopApp&&'serviceWorker'in navigator)");fs.writeFileSync(appjs,code);
const gate=fs.readFileSync(path.join(source,'install-gate.js'),'utf8'),hash=gate.match(/const CODE_HASH='([a-f0-9]{64})'/)?.[1];if(!hash)throw Error('Missing owner activation hash');
const main=path.join(__dirname,'main.cjs');let text=fs.readFileSync(main,'utf8');if(text.includes('__INSTALL_CODE_HASH__'))text=text.replace('__INSTALL_CODE_HASH__',hash);else if(!text.includes(hash))throw Error('Activation hash changed; inspect before rebuilding');fs.writeFileSync(main,text);
const secretFile=path.resolve(__dirname,'../little-steps/INSTALL-CODE.private.txt');if(fs.existsSync(secretFile)){const secret=fs.readFileSync(secretFile,'utf8').trim();for(const filename of [...names,'desktop-ui.js']){if(fs.readFileSync(path.join(target,filename)).includes(Buffer.from(secret)))throw Error('Private activation code found in app assets');}if(text.includes(secret))throw Error('Private code found in desktop source');}
console.log('Prepared desktop app assets. No personal financial data or plain activation code is included.');
