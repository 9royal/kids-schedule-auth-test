import {validateConfig,createController,handlePageShow} from './core.mjs';
import './style.css';
declare const __AUTH_ONLY_CONFIG__: unknown;
const status=document.querySelector<HTMLElement>('#status')!;
const start=document.querySelector<HTMLButtonElement>('#start')!;
const retry=document.querySelector<HTMLButtonElement>('#retry')!;
const messages:Record<string,string>={
working:'正在檢查登入，結束後會自動登出。',
success:'登入資訊檢查通過，且已完成登出。未讀取課表或資料庫。',
cancelled:'已取消登入，且已完成登出清理。',
'popup-blocked':'瀏覽器阻擋了登入視窗。允許此網站的彈出視窗後可重試。',
failed:'登入或資訊檢查未通過，且已完成登出清理。',
'signout-failed':'無法確認登出完成。請按「重試登出」；不要將此結果視為成功。',
'signed-out':'已完成登出清理。可重新測試。'};
async function prepare(){
 const config=validateConfig(__AUTH_ONLY_CONFIG__);
 if(location.origin!==config.appOrigin)throw Error('ORIGIN');
 const [{initializeApp},sdk]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
 const app=initializeApp({projectId:config.projectId,appId:config.appId,apiKey:config.apiKey,authDomain:config.authDomain},'standalone-auth-only');
 const auth=sdk.initializeAuth(app,{persistence:sdk.inMemoryPersistence,popupRedirectResolver:sdk.browserPopupRedirectResolver});
 const provider=new sdk.GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 const controller=createController({
 login:()=>sdk.signInWithPopup(auth,provider),
 token:(user:import('firebase/auth').User)=>sdk.getIdTokenResult(user,true),
 signOut:()=>sdk.signOut(auth),
 },(state:string)=>{
 status.textContent=messages[state]??messages.failed;
 status.dataset.state=state;
 start.disabled=state==='working'||state==='signout-failed';
 retry.hidden=state!=='signout-failed';
 });
 start.addEventListener('click',()=>{void controller.run();});
 retry.addEventListener('click',()=>{void controller.retrySignOut();});
 window.addEventListener('pagehide',()=>{controller.invalidate();void sdk.signOut(auth).catch(()=>{});});
 status.textContent='準備完成。請由成人自行點擊開始，並選擇已同意測試的帳號。'; start.disabled=false;
}
window.addEventListener('pageshow',event=>handlePageShow(event.persisted,()=>location.reload()));
void prepare().catch(()=>{status.textContent='測試頁尚未啟用，或設定檢查未通過。無法開始登入。';});
