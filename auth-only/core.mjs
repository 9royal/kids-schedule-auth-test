export const PROJECT = 'kids-planner-c7e84';
export const APP_ID = '1:361762727829:web:9d9f959ec7f2a89774b89c';
export function validateConfig(raw) {
 const keys=['activation','projectId','appId','apiKey','authDomain','appOrigin'];
 if (!raw || Object.keys(raw).length!==keys.length || Object.keys(raw).some(k=>!keys.includes(k))) throw Error('CONFIG');
 if(raw.activation!=='APPROVED_AUTH_ONLY_TEST'||raw.projectId!==PROJECT||raw.appId!==APP_ID||raw.appOrigin!=='https://9royal.github.io'||raw.authDomain!==PROJECT+'.firebaseapp.com'||!/^AIza[\w-]{35}$/.test(raw.apiKey)) throw Error('CONFIG');
 return Object.freeze({...raw});
}
// Consistency only, not browser-side signature verification or authorization.
// Trust here is the Firebase service sign-in response over TLS.
export function validateClaims(user, claims, providerId) {
 if(!user||!claims||providerId!=='google.com'||claims.firebase?.sign_in_provider!=='google.com'||!user.providerData?.some(p=>p.providerId==='google.com')||user.emailVerified!==true||claims.email_verified!==true||typeof user.email!=='string'||!user.email||claims.email!==user.email||typeof user.uid!=='string'||!user.uid||claims.sub!==user.uid||claims.user_id!==user.uid||claims.aud!==PROJECT||claims.iss!=='https://securetoken.google.com/'+PROJECT) throw Error('CLAIMS');
}
export function safeError(error) {
 switch(error?.code) {
 case 'auth/popup-closed-by-user': case 'auth/cancelled-popup-request': return 'cancelled';
 case 'auth/popup-blocked': return 'popup-blocked';
 default: return 'failed';
 }
}
export function createController(adapter, report) {
 let busy=false, needsSignOut=false, generation=0;
 return {
 async run() {
 if(busy||needsSignOut)return; busy=true; const id=++generation;
 let result=null, token=null, outcome='failed'; report('working');
 try { result=await adapter.login(); token=await adapter.token(result.user); validateClaims(result.user,token.claims,result.providerId); outcome='success'; }
 catch(error){outcome=safeError(error);}
 finally {
 result=null; token=null;
 try {await adapter.signOut();needsSignOut=false;}catch{needsSignOut=true;outcome='signout-failed';}
 busy=false; if(id===generation)report(outcome);
 }
 },
 async retrySignOut(){
 if(busy||!needsSignOut)return;busy=true;const id=++generation;
 try{await adapter.signOut();needsSignOut=false;if(id===generation)report('signed-out');}
 catch{if(id===generation)report('signout-failed');}finally{busy=false;}
 },
 invalidate(){++generation;}
 };
}

export function handlePageShow(persisted, reload) { if(persisted) reload(); }
