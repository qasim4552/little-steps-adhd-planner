'use strict';
const {app,BrowserWindow,Menu,protocol,ipcMain,session,shell,dialog}=require('electron');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
app.setName('Little Steps Planner');
const profile=process.env.LITTLE_STEPS_PROFILE_DIR?path.resolve(process.env.LITTLE_STEPS_PROFILE_DIR):path.join(app.getPath('appData'),'Little Steps Planner');
app.setPath('userData',profile);
protocol.registerSchemesAsPrivileged([{scheme:'planner',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const ORIGIN='planner://app',CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const activationPath=path.join(profile,'activation-v1.json');let window;
const CODE_HASH='f7b520f5dd5ce8f807daa4a3f1fbadb013081a53a96f3b561ecc6219aeeac993';
function activated(){try{return JSON.parse(fs.readFileSync(activationPath,'utf8')).activated===true;}catch{return false;}}
function trusted(event,activationOnly=false){const u=new URL(event.senderFrame.url);if(u.origin!=='null'&&u.protocol!=='planner:')throw Error('Unsupported caller');if(u.protocol!=='planner:'||u.hostname!=='app'||event.senderFrame!==window.webContents.mainFrame||(activationOnly&&u.pathname!=='/activation.html'))throw Error('Unsupported caller');}
function createWindow(){window=new BrowserWindow({width:1450,height:1000,minWidth:780,minHeight:640,show:false,title:'Little Steps Planner',backgroundColor:'#211e2c',icon:path.join(__dirname,'app/icon-192.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 window.once('ready-to-show',()=>{if(process.env.LITTLE_STEPS_TEST_MODE!=='1')window.show();});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(e,url)=>{try{const u=new URL(url);if(u.protocol!=='planner:'||u.hostname!=='app')e.preventDefault();}catch{e.preventDefault();}});
 window.loadURL(activated()?ORIGIN+'/#month':ORIGIN+'/activation.html');
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
app.whenReady().then(()=>{
 fs.mkdirSync(profile,{recursive:true});
 protocol.handle('planner',async request=>{try{const url=new URL(request.url);if(url.hostname!=='app'||request.method!=='GET')return new Response('Not found',{status:404});const file=decodeURIComponent(url.pathname);let target;
 if(file==='/activation.html'||file==='/activation.js')target=path.join(__dirname,file.slice(1));
 else{if(!activated())return new Response('Activation required',{status:403});const root=path.join(__dirname,'app');target=path.resolve(root,'.'+(file==='/'?'/index.html':file));const relative=path.relative(root,target);if(relative.startsWith('..')||path.isAbsolute(relative))return new Response('Not found',{status:404});}
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json'};
 return new Response(fs.readFileSync(target),{headers:{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});
 }catch{return new Response('Not found',{status:404});}});
 session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
 session.defaultSession.on('will-download',(_event,item)=>{if(process.env.LITTLE_STEPS_TEST_MODE==='1')item.setSavePath(path.join(profile,'test-backup.json'));else item.setSaveDialogOptions({title:'Save planner export',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});});
 ipcMain.handle('desktop:activate',(event,code)=>{trusted(event,true);if(typeof code!=='string'||code.length>80)return {ok:false};const normalized=code.trim().toUpperCase().replace(/[\s-]/g,'');const digest=crypto.createHash('sha256').update(normalized).digest('hex');if(!crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(CODE_HASH)))return {ok:false};
 fs.writeFileSync(activationPath,JSON.stringify({activated:true,version:1,activatedAt:new Date().toISOString()}),'utf8');setTimeout(()=>window.loadURL(ORIGIN+'/#setup'),150);return {ok:true};});
 ipcMain.handle('desktop:info',event=>{trusted(event);return {version:app.getVersion(),dataFolder:profile,platform:process.platform};});
 ipcMain.handle('desktop:open-data-folder',event=>{trusted(event);return shell.openPath(profile);});
 const menu=Menu.buildFromTemplate([{label:'File',submenu:[{label:'Download backup',accelerator:'CmdOrCtrl+Shift+S',click:()=>{if(activated())window.webContents.executeJavaScript("document.getElementById('backup').click()");}},{label:'Print / Save as PDF',accelerator:'CmdOrCtrl+P',click:()=>window.webContents.print({printBackground:true})},{type:'separator'},{label:'Open my data folder',click:()=>shell.openPath(profile)},{type:'separator'},{role:'quit'}]},{label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'View',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},{label:'Help',submenu:[{label:'About Little Steps',click:()=>dialog.showMessageBox(window,{type:'info',title:'Little Steps Planner',message:'Little Steps Planner '+app.getVersion(),detail:'Your personal offline life and money planner. Data is stored in this Windows user profile. Use My space to back up or transfer your planner.'})}]}]);Menu.setApplicationMenu(menu);createWindow();
}).catch(error=>{dialog.showErrorBox('Little Steps could not start',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>session.defaultSession.flushStorageData());
}
