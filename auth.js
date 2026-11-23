/* ===== auth: OTP login · session start · users admin ===== */
let started=false,cool=0,coolT;

function startCool(){
  cool=60;clearInterval(coolT);
  coolT=setInterval(()=>{cool--;const b=$('#rs');
    if(b){b.disabled=cool>0;b.textContent=cool>0?'שליחה חוזרת ('+cool+')':'שליחה חוזרת'}
    if(cool<=0)clearInterval(coolT)},1000)}

function loginUI(msg,step){
  const code=step==='code';
  $('#app').innerHTML=`<div style="max-width:380px;margin:12vh auto;padding:0 16px"><div class="card">
  <h1>Studio Balance</h1>
  <p class="mut">${code?'שלחנו קוד בן 6 ספרות אל '+esc(LE):'כניסה עם קוד חד-פעמי באימייל'}</p>
  ${code?`<input id="cd" inputmode="numeric" maxlength="6" pattern="[0-9]*" autocomplete="one-time-code" placeholder="000000" style="text-align:center;font-size:24px;letter-spacing:8px" onkeydown="if(event.key==='Enter')verifyCode()" oninput="this.value=this.value.replace(/\\D/g,'');if(this.value.length===6)verifyCode()">
  <button id="vb" class="btn pri full" onclick="verifyCode()">כניסה</button>
  <button id="rs" class="btn full" onclick="sendCode(1)" ${cool>0?'disabled':''}>${cool>0?'שליחה חוזרת ('+cool+')':'שליחה חוזרת'}</button>
  <button class="btn full" onclick="loginUI()">שינוי אימייל</button>`
  :`<input id="em" type="email" autocomplete="email" placeholder="אימייל" value="${esc(LE)}" onkeydown="if(event.key==='Enter')sendCode()">
  <button id="sb" class="btn pri full" onclick="sendCode()">שליחת קוד</button>`}
  <div class="mut bad" style="margin-top:8px">${esc(msg||'')}</div>
  <div class="mut" style="margin-top:6px">v${VERSION}</div></div></div>`;
  const e=$(code?'#cd':'#em');if(e)e.focus()}

async function sendCode(resend){
  const em=resend?LE:($('#em').value.trim().toLowerCase());
  if(!/^\S+@\S+\.\S+$/.test(em))return loginUI('כתובת אימייל לא תקינה');
  LE=em;
  const b=$(resend?'#rs':'#sb');if(b)b.disabled=true;
  const{error}=await sb.auth.signInWithOtp({email:em,options:{shouldCreateUser:true}});
  if(error){
    const m=error.message||'';
    const txt=/not on the users list|not allowed|hook|403/i.test(m)?'האימייל הזה לא ברשימת המשתמשים'
      :/rate|too many|429|seconds/i.test(m)?'נשלחו יותר מדי בקשות, נסה שוב בעוד דקה'
      :'לא הצלחנו לשלוח קוד: '+m;
    return loginUI(txt,resend?'code':undefined)}
  startCool();loginUI(resend?'הקוד נשלח שוב':'','code')}

async function verifyCode(){
  const el=$('#cd'),t=(el.value||'').replace(/\D/g,'');
  if(t.length!==6)return loginUI('יש להזין קוד בן 6 ספרות','code');
  const b=$('#vb');if(b)b.disabled=true;
  const{error}=await sb.auth.verifyOtp({email:LE,token:t,type:'email'});
  if(error)return loginUI('קוד שגוי או שפג תוקפו','code');
  clearInterval(coolT);await startSb();aud('התחברות')}

async function logout(){await sb.auth.signOut();location.reload()}

async function startSb(){
  if(started)return;started=true;
  $('#app').innerHTML='<div class="empty">טוען…</div>';
  await sb.rpc('join_by_invite');
  const{data:{user}}=await sb.auth.getUser();
  let{data:mem,error}=await sb.from('memberships').select('org_id,role').eq('user_id',user.id).limit(1);
  if(error){mode='err';draw();return}
  if(!mem.length){
    const{data:need}=await sb.rpc('setup_needed');
    if(!need){$('#app').innerHTML=`<div style="max-width:380px;margin:12vh auto;padding:0 16px"><div class="card"><h2>אין לך גישה עדיין</h2><p class="mut">${esc(user.email)} לא מוזמן. בקש מבעל הסטודיו להזמין אותך, ואז היכנס שוב.</p><button class="btn full" onclick="logout()">יציאה</button></div></div>`;return}
    const name=prompt('שם הסטודיו?','Studio Balance');if(!name)return logout();
    const{data:o,error:e2}=await sb.rpc('create_org',{org_name:name});
    if(e2){alert(e2.message);mode='err';draw();return}
    mem=[{org_id:o,role:'owner'}]}
  ME={org:mem[0].org_id,role:mem[0].role,uid:user.id,email:user.email};
  try{const{data:o}=await sb.from('orgs').select('heat,msg').eq('id',ME.org).single();
    if(o){if(o.heat)H={...H,...o.heat};if(o.msg)TPL=o.msg}}catch(e){}
  db=mkDb(sb,ME.org);mode='db';
  db.doc('config/fields').onSnapshot(s=>{F=(s.exists&&s.data().list)||[];draw()},()=>{});
  db.collection('leads').onSnapshot(s=>{L=s.docs.map(x=>({...x.data(),id:x.id}));mode='db';draw()},()=>{mode='err';draw()})}

// ---- users page (owner / admin)
const usersHtml=()=>'<h1>משתמשים</h1><div id="usr" class="empty">טוען…</div>';
async function loadUsers(){
  const[{data:mem},{data:inv}]=await Promise.all([sb.from('memberships').select('user_id,email,role').eq('org_id',ME.org),sb.from('invites').select('id,email,role').eq('org_id',ME.org)]);
  const RL={owner:'בעלים',admin:'מנהל',member:'משתמש'},el=$('#usr');if(!el)return;
  el.className='';
  el.innerHTML=`<div class="card"><h2>משתמשים פעילים</h2>${(mem||[]).map(m=>`<div class="row fr"><span>${esc(m.email||'משתמש')} <span class="tag">${RL[m.role]}</span>${m.user_id===ME.uid?' <span class="mut">(אתה)</span>':''}</span>${m.role!=='owner'&&m.user_id!==ME.uid?`<button class="btn bad" onclick="rmMember('${m.user_id}')">הסרה</button>`:''}</div>`).join('')}</div>
  <div class="card"><h2>הזמנות ממתינות</h2>${(inv||[]).map(i=>`<div class="row fr"><span>${esc(i.email)} <span class="tag">${RL[i.role]}</span></span><button class="btn" onclick="rmInvite('${i.id}')">ביטול</button></div>`).join('')||'<div class="mut">אין הזמנות ממתינות.</div>'}
  <h2 style="margin-top:16px">הזמנת משתמש</h2><p class="mut">המוזמן נכנס עם האימייל הזה וקוד חד-פעמי, ומצטרף אוטומטית.</p>
  <input id="ie" type="email" placeholder="אימייל"><select id="ir"><option value="member">משתמש (לידים בלבד)</option><option value="admin">מנהל (גם ניהול משתמשים)</option></select><button class="btn pri full" onclick="addInvite()">שליחת הזמנה</button></div>`}
async function addInvite(){const email=$('#ie').value.trim().toLowerCase(),role=$('#ir').value;if(!email)return;
  const{error}=await sb.from('invites').insert({org_id:ME.org,email,role});
  if(error)return alert(error.code==='23505'?'כבר הוזמן אימייל זה':'שגיאה: '+error.message);
  aud('הזמנת משתמש',null,email+' · '+role);loadUsers()}
async function rmInvite(id){await sb.from('invites').delete().eq('id',id);aud('ביטול הזמנה');loadUsers()}
async function rmMember(u){if(!confirm('להסיר את המשתמש? הוא לא יוכל להיכנס יותר.'))return;
  const{error}=await sb.from('memberships').delete().eq('org_id',ME.org).eq('user_id',u);
  if(error)alert(error.message);else aud('הסרת משתמש',null,u);loadUsers()}
