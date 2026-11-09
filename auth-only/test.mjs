import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,validateClaims,createController,handlePageShow,PROJECT,APP_ID} from './core.mjs';
const config={activation:'APPROVED_AUTH_ONLY_TEST',projectId:PROJECT,appId:APP_ID,apiKey:'AIza'+'x'.repeat(35),authDomain:PROJECT+'.firebaseapp.com',appOrigin:'https://9royal.github.io'};
const user={uid:'fixture-user',email:'adult@example.invalid',emailVerified:true,providerData:[{providerId:'google.com'}]};
const claims={sub:user.uid,user_id:user.uid,email:user.email,email_verified:true,aud:PROJECT,iss:'https://securetoken.google.com/'+PROJECT,firebase:{sign_in_provider:'google.com'}};
test('strict config accepts approved tuple',()=>assert.equal(validateConfig(config).projectId,PROJECT));
for(const key of Object.keys(config))test('reject missing '+key,()=>{const c={...config};delete c[key];assert.throws(()=>validateConfig(c));});
for(const key of ['databaseURL','storageBucket','measurementId','secret','scopes','extra'])test('reject additional '+key,()=>assert.throws(()=>validateConfig({...config,[key]:'x'})));
for(const key of Object.keys(config))test('reject changed '+key,()=>assert.throws(()=>validateConfig({...config,[key]:'wrong'})));
test('reject null config',()=>assert.throws(()=>validateConfig(null)));
test('valid claims',()=>validateClaims(user,claims,'google.com'));
for(const key of ['sub','user_id','email','email_verified','aud','iss','firebase'])test('reject claim '+key,()=>assert.throws(()=>validateClaims(user,{...claims,[key]:'wrong'},'google.com')));
for(const key of ['uid','email','emailVerified','providerData'])test('reject user '+key,()=>assert.throws(()=>validateClaims({...user,[key]:null},claims,'google.com')));
test('reject non Google result',()=>assert.throws(()=>validateClaims(user,claims,'password')));
function fixture(overrides={}){const states=[];let out=0;const adapter={login:async()=>({user,providerId:'google.com'}),token:async()=>({claims}),signOut:async()=>{out++;},...overrides};return {controller:createController(adapter,s=>states.push(s)),states,out:()=>out};}
test('success follows signout',async()=>{const f=fixture();await f.controller.run();assert.deepEqual(f.states,['working','success']);assert.equal(f.out(),1);});
test('claims failure still signs out',async()=>{const f=fixture({token:async()=>({claims:{}})});await f.controller.run();assert.equal(f.states.at(-1),'failed');assert.equal(f.out(),1);});
for(const [code,state] of [['auth/popup-closed-by-user','cancelled'],['auth/cancelled-popup-request','cancelled'],['auth/popup-blocked','popup-blocked'],['secret raw error','failed']])test('safe failure '+state+code,async()=>{const f=fixture({login:async()=>{throw {code,message:'never disclose'};}});await f.controller.run();assert.equal(f.states.at(-1),state);assert.equal(f.out(),1);});
test('repeated click guarded',async()=>{let release,calls=0;const f=fixture({login:()=>{calls++;return new Promise(r=>release=r);}});const pending=f.controller.run();await f.controller.run();assert.equal(calls,1);release({user,providerId:'google.com'});await pending;});
test('signout failure not success; retry required',async()=>{let calls=0;const f=fixture({signOut:async()=>{if(++calls===1)throw Error('private');}});await f.controller.run();await f.controller.run();assert.equal(calls,1);assert.equal(f.states.at(-1),'signout-failed');await f.controller.retrySignOut();assert.equal(f.states.at(-1),'signed-out');assert.ok(!f.states.includes('success'));});
test('stale operation suppressed but signed out',async()=>{let release;const f=fixture({login:()=>new Promise(r=>release=r)});const pending=f.controller.run();f.controller.invalidate();release({user,providerId:'google.com'});await pending;assert.deepEqual(f.states,['working']);assert.equal(f.out(),1);});

test('bfcache restore reloads rather than claiming old cleanup',()=>{let n=0;handlePageShow(true,()=>n++);assert.equal(n,1);});
test('normal pageshow does not reload',()=>{let n=0;handlePageShow(false,()=>n++);assert.equal(n,0);});
