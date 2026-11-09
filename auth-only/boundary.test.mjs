import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=n=>readFile(new URL(n,import.meta.url),'utf8');
test('SDK only app and auth, no legacy imports',async()=>{
 const text=await read('main.ts');
 assert.deepEqual([...text.matchAll(/import\('([^']+)'\)/g)].map(m=>m[1]),['firebase/app','firebase/auth','firebase/auth']);
 assert.ok(text.indexOf('validateConfig(__AUTH_ONLY_CONFIG__)')<text.indexOf("import('firebase/app')"));
 assert.match(text,/initializeAuth\(app,\{persistence:sdk.inMemoryPersistence/);
 assert.doesNotMatch(text,/getAuth\(|localStorage|sessionStorage|addScope|offline|console\./);
});
test('no external image/font/script in HTML',async()=>{
 const html=await read('index.html');
 assert.match(html,/name="robots" content="noindex,nofollow"/);
 assert.doesNotMatch(html,/(src|href)="https?:/);
});
test('CSP denies worker and no DB or websocket endpoints',async()=>{
 const src=await read('vite.config.mjs');
 assert.match(src,/worker-src 'none'/);
 assert.match(src,/modulePreload:false/);
 assert.match(src,/sourcemap:false/);
 assert.match(src,/Unexpected Auth-only import/);
});

test('runtime blocks SDK imports for invalid config and wrong origin',async()=>{
 const {transpileModule,ModuleKind,ScriptTarget}=await import('typescript');
 const {runInNewContext}=await import('node:vm');
 let code=await read('main.ts');
 code=code.replace(/^import .*$/gm,'').replace("import('firebase/app')",'loadApp()').replace("import('firebase/auth')",'loadAuth()');
 code=transpileModule(code,{compilerOptions:{target:ScriptTarget.ES2022,module:ModuleKind.None}}).outputText;
 const {validateConfig,createController,handlePageShow,PROJECT,APP_ID}=await import('./core.mjs');
 for(const [config,origin] of [[null,'https://9royal.github.io'],[{activation:'APPROVED_AUTH_ONLY_TEST',projectId:PROJECT,appId:APP_ID,apiKey:'AIza'+'x'.repeat(35),authDomain:PROJECT+'.firebaseapp.com',appOrigin:'https://9royal.github.io'},'https://other.example.invalid']]){
 let imports=0;const nodes=new Map();const context={validateConfig,createController,handlePageShow,__AUTH_ONLY_CONFIG__:config,document:{querySelector:key=>{if(!nodes.has(key))nodes.set(key,{disabled:true,addEventListener(){},dataset:{}});return nodes.get(key);}},location:{origin},window:{addEventListener(){}},loadApp(){imports++;throw Error('unexpected');},loadAuth(){imports++;throw Error('unexpected');}};
 runInNewContext(code,context);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(imports,0);assert.equal(nodes.get('#start').disabled,true);
 }
});
