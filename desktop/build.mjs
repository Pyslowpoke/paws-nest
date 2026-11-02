import {packager} from '@electron/packager';
import path from 'node:path';
import fs from 'node:fs';
const localZip=process.env.DESKCAT_ELECTRON_ZIP_DIR;
const apps=await packager({dir:process.cwd(),out:process.env.DESKCAT_OUTPUT||'build',name:'爪爪小窝-Windows-v0.3',executableName:'PawsNest',platform:'win32',arch:'x64',electronVersion:'45.0.0',...(localZip?{electronZipDir:path.resolve(localZip)}:{}),appVersion:'0.3.0',buildVersion:'0.3.0',appCopyright:'Paws Nest',icon:path.resolve('app/icon.ico'),asar:true,prune:false,overwrite:true,ignore:[/^\/node_modules/,/^\/build/,/^\/test/,/^\/\.git/,/^\/pnpm-lock.yaml/,/^\/app\/chat-smoke.cjs/,/^\/app\/smoke.cjs/,/^\/app\/portfolio-smoke.cjs/,/^\/app\/portfolio-web-smoke.cjs/],win32metadata:{CompanyName:'Paws Nest',FileDescription:'爪爪小窝 · 桌边的小小陪伴',ProductName:'爪爪小窝'}});
for(const dir of apps)for(const name of fs.readdirSync('delivery'))fs.copyFileSync(path.join('delivery',name),path.join(dir,name));
console.log(apps.join('\n'));
