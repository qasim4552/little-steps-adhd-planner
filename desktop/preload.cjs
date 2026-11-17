'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopApp',Object.freeze({isDesktop:true,activate:code=>ipcRenderer.invoke('desktop:activate',code),getInfo:()=>ipcRenderer.invoke('desktop:info'),openDataFolder:()=>ipcRenderer.invoke('desktop:open-data-folder')}));
