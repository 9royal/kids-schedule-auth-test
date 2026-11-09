import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateConfig} from './core.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(()=>{
 const input=process.env.AUTH_ONLY_CONFIG_JSON;
 const config=input?validateConfig(JSON.parse(input)):null;
 const output=resolve(root,process.env.AUTH_ONLY_OUTPUT||'../dist-auth-only');
 if(existsSync(output)&&readdirSync(output).length)throw Error('Output must be a new empty directory; refusing stale artifacts');
 const csp=["default-src 'none'","script-src 'self'"+(config?" https://apis.google.com":""),"style-src 'self'","img-src 'self'","font-src 'none'","connect-src"+(config?" https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://"+config.authDomain:" 'none'"),"frame-src"+(config?" https://"+config.authDomain:" 'none'"),"object-src 'none'","base-uri 'none'","form-action 'none'","worker-src 'none'","manifest-src 'none'"].join('; ');
 return {root,base:'./',publicDir:false,envPrefix:[],define:{__AUTH_ONLY_CONFIG__:JSON.stringify(config)},
 plugins:[{name:'auth-only-containment',
 transformIndexHtml:{order:'pre',handler(html){return html.replace('__AUTH_ONLY_CSP__',csp).replace('./main.ts',config?'./main.ts':'./locked.ts');}},
 generateBundle(_,bundle){
 const modules=[];
 for(const asset of Object.values(bundle)){
 if(asset.type!=='chunk')continue;
 for(const id of Object.keys(asset.modules)){
 const p=id.replaceAll('\\','/');modules.push(p);
 const local=p.startsWith(root.replaceAll('\\','/')) && /\/(main\.ts|locked\.ts|core\.mjs|style\.css|index\.html)$/.test(p);
 const dependency=/\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:@firebase\/(?:app|auth|component|logger|util)|firebase\/(?:app|auth)|idb|tslib)\//.test(p);
 const virtual=p.startsWith('\0') && /vite\/(?:preload-helper|modulepreload-polyfill)/.test(p);
 if(!local&&!dependency&&!virtual)throw Error('Unexpected Auth-only import: '+p);
 }
 if(/firebaseio\.com|firebasedatabase\.app|wss:|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(asset.code))throw Error('Forbidden bundle content');
 }
 this.emitFile({type:'asset',fileName:'module-audit.json',source:JSON.stringify({moduleCount:modules.length,modules:modules.map(p=>p.includes('/node_modules/')?p.slice(p.indexOf('/node_modules/')+1):p.slice(p.lastIndexOf('/')+1))},null,2)});
 }}],
 build:{outDir:output,emptyOutDir:false,sourcemap:false,modulePreload:false,minify:true,rollupOptions:{input:root+'index.html'}}
 };
});
