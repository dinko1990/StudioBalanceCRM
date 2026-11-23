/* ===== pages: tasks · funnel · customers · settings · audit · import/export · draw ===== */

// ---- tasks (computed from today's date)
function tasks(){const t=lc(),tm=lc(new Date(Date.now()+864e5)),O=L.filter(l=>OPEN.includes(l.stage)),G=[];
  const add=(ic,title,hint,arr)=>{if(arr.length)G.push({ic,title,hint,arr})};
  add('🔔','שיעורי ניסיון היום','שלח תזכורת קצרה בוואטסאפ',O.filter(l=>l.tDate===t));
  add('📅','שיעורי ניסיון מחר','אשר הגעה ושלח כתובת',O.filter(l=>l.tDate===tm));
  add('❓','עבר מועד השיעור ולא עודכן','האם הגיע? עדכן ל״אימון בפועל״ או ל״כשלון״',O.filter(l=>l.stage==='booked'&&l.tDate&&l.tDate<t));
  add('📞','לידים חדשים שמחכים לשיחה','התקשר היום, הוותיקים ראשונים',O.filter(l=>l.stage==='new').sort((a,b)=>(a.date||'').localeCompare(b.date||'')));
  add('📲','דיברנו, עדיין לא נקבע שיעור','הצע מועד לשיעור ניסיון',O.filter(l=>l.stage==='phone'&&hd(l)>=1));
  add('🏁','התאמנו ולא סגרו','הצעת מנוי תוך 48 שעות מהאימון',O.filter(l=>l.stage==='attended'&&hd(l)>=1));
  add('🔁','צריך לחזור אליהם','',L.filter(l=>l.stage==='followup'));
  add('⏳','עומדים להתקרר','ניסיון אחרון לפני שהליד הופך קר',O.filter(l=>hk(l)==='warm'&&hd(l)>H.warm-4));
  return G}
function tasksHtml(){const G=tasks(),n=new Date();
  return `<h1>משימות ליום ${DAYS[n.getDay()]} ${fd(lc())}</h1>${n.getDay()===6?'<p class="mut">שבת: אפשר להכין את רשימת השיחות ליום ראשון.</p>':''}`+
  (G.map(g=>`<div class="card"><h2 style="margin:0">${g.ic} ${g.title} (${g.arr.length})</h2>${g.hint?`<div class="mut" style="margin:4px 0 8px">${g.hint}</div>`:''}${g.arr.slice(0,30).map(l=>`<div class="row fr"><span onclick="openL('${l.id}')" style="cursor:pointer;flex:1"><b>${esc(l.name)}</b> <span class="mut">${esc(l.phone)}${l.tDate?' · '+fd(l.tDate)+' '+esc(l.tTime||''):''}${hk(l)?' · '+HI[hk(l)]:''}</span></span><a class="btn" href="tel:${esc(l.phone)}">📞</a></div>`).join('')}${g.arr.length>30?`<div class="mut">ועוד ${g.arr.length-30}…</div>`:''}</div>`).join('')||'<div class="empty">אין משימות להיום 🎉</div>')}

// ---- funnel
function fallHtml(){
  const reach=i=>L.filter(l=>l.reached>=i).length,mx=Math.max(1,reach(0));
  const lost=L.filter(l=>l.stage==='lost'),fu=L.filter(l=>l.stage==='followup'),dead=L.filter(l=>l.stage==='dead'),rs={};
  lost.forEach(l=>{const r=l.reason||'לא צוין';rs[r]=(rs[r]||0)+1});
  return `<h1>מפל לקוחות</h1><p class="mut">לחיצה על שלב פותחת את הלידים שנמצאים בו עכשיו.</p><div class="card">`+IDX.map((k,i)=>{const c=reach(i),p=i?reach(i-1):c;
    return `<div class="fun ${k==='closed'?'won':''}" style="cursor:pointer" onclick="filt='${k}';go('leads')"><div class="t"><span>${SN[k]}</span><b>${c}</b></div><div class="b" style="width:${c/mx*100}%"></div><div class="d">${i?(p?Math.round(c/p*100):0)+'% מהשלב הקודם':'כל הפניות'}</div></div>`}).join('')+
  `<div class="dz">${['hot','warm','cold'].map(k=>`<div onclick="filt='h:${k}';go('leads')">${HI[k]} ${HN[k]}<br><b>${L.filter(l=>hk(l)===k).length}</b></div>`).join('')}</div>`+
  `<div class="dz">${[['lost',lost.length],['followup',fu.length],['dead',dead.length]].map(([k,c])=>`<div class="${k==='lost'?'lost':''}" onclick="filt='${k}';go('leads')">${SN[k]}<br><b>${c}</b></div>`).join('')}</div>`+
  (lost.length?`<div class="mut bad" style="margin-top:10px">סיבות כשלון: ${Object.entries(rs).sort((a,b)=>b[1]-a[1]).map(([k,v])=>esc(k)+' ('+v+')').join(' · ')}</div>`:'')+`</div>`}

// ---- customers (= closed leads)
function custHtml(){const n=L.filter(l=>l.stage==='closed').length;
  return `<h1>לקוחות (${n})</h1><p class="mut">כל ליד שנסגר הופך אוטומטית ללקוח. החזרת הסטטוס ללא-סגירה מחזירה אותו ללידים.</p><input id="cq" placeholder="חיפוש לקוח" value="${esc(cq)}" oninput="cq=this.value;cl()"><div id="cl" class="cards" style="margin-top:10px"></div>`}
function cl(){const s=cq.trim().toLowerCase(),el=$('#cl');if(!el)return;
  const R=L.filter(l=>l.stage==='closed'&&(!s||(l.name||'').toLowerCase().includes(s)||ph(l.phone).includes(s.replace(/\D/g,'')||'§'))).sort((a,b)=>closedOn(b).localeCompare(closedOn(a)));
  el.innerHTML=R.length?R.map(l=>{const d=Math.max(0,Math.round((new Date(closedOn(l))-new Date(l.date))/864e5))||0;
    return `<div class="card lead" onclick="openC('${l.id}')"><div style="flex:1"><div class="nm">${esc(l.name)}</div><div class="mut">📞 ${esc(l.phone)}</div><div class="mut">לקוח מאז ${fd(closedOn(l))} · נסגר אחרי ${d} ימים</div>${l.src?`<div class="mut">${esc(l.src)}</div>`:''}</div><span class="tag won">לקוח</span></div>`}).join(''):'<div class="empty">עדיין אין לקוחות</div>'}
function openC(id){const l=L.find(x=>x.id===id);if(!l)return;const co=closedOn(l),T=lc();
  const dd=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/864e5));
  modal(`<div class="row"><h2 style="margin:0">${esc(l.name)} <span class="tag won">לקוח</span></h2><a class="btn" href="tel:${esc(l.phone)}">📞 ${esc(l.phone)}</a></div>
  <div class="card" style="margin:10px 0"><div class="g"><div><div class="mut">לקוח מאז</div><b>${fd(co)}</b></div><div><div class="mut">ימים כלקוח</div><b>${dd(co,T)}</b></div>
  <div><div class="mut">נכנס כליד</div><b>${fd(l.date)}</b></div><div><div class="mut">נסגר אחרי</div><b>${dd(l.date,co)} ימים</b></div>${l.src?`<div><div class="mut">מקור</div><b>${esc(l.src)}</b></div>`:''}</div></div>
  ${F.length?`<div class="g">${F.map(f=>`<div><div class="mut">${esc(f.name)}</div>${finput(f,'cf_'+f.id,(l.cf||{})[f.id]??'',`saveCF('${id}')`)}</div>`).join('')}</div>`:''}
  <div class="mut" style="margin-top:10px">הערות</div><textarea id="nt" rows="3" onblur="saveN('${id}')">${esc(l.note)}</textarea>
  <a class="btn pri full" target="_blank" rel="noopener" href="https://wa.me/${wan(l.phone)}">💬 וואטסאפ</a>
  <button class="btn full" onclick="openL('${id}')">כרטיס ליד מלא</button>
  <button class="btn full" onclick="if(confirm('להחזיר ללידים (אימון בפועל)?'))setSt('${id}','attended')">החזרה ללידים</button>`)}

// ---- settings page: lead card fields · heat · invitation message
function addF(){const name=$('#fn').value.trim(),type=$('#ft').value,opts=$('#fo').value.split(',').map(x=>x.trim()).filter(Boolean);
  if(!name){alert('חסר שם לשדה');return}
  if(RES.includes(name)||F.some(f=>f.name===name)){alert('כבר יש שדה או משתנה בשם הזה');return}
  if(type==='choice'&&opts.length<2){alert('לבחירה צריך לפחות שתי אפשרויות');return}
  F.push({id:uid(),name,type,opts:type==='choice'?opts:[]});aud('הוספת שדה',null,name);saveF()}
function delF(id){const f=F.find(x=>x.id===id);if(!f)return;const k=L.filter(l=>l.cf&&l.cf[id]!==undefined).length;
  if(!confirm('למחוק את השדה "'+f.name+'"? הערכים שלו יימחקו מ-'+k+' לידים. אי אפשר לבטל.'))return;
  L=L.map(l=>{if(!l.cf||l.cf[id]===undefined)return l;const cf={...l.cf};delete cf[id];const n={...l,cf};persist(n);return n});
  F=F.filter(x=>x.id!==id);aud('מחיקת שדה',null,f.name);saveF()}
function mvF(id,d){const i=F.findIndex(x=>x.id===id),j=i+d;if(i<0||j<0||j>=F.length)return;[F[i],F[j]]=[F[j],F[i]];aud('שינוי סדר שדות');saveF()}
function editF(id){const f=F.find(x=>x.id===id),n=prompt('שם השדה',f.name);if(n===null)return;const nm=n.trim();if(!nm)return;
  if(RES.includes(nm)||F.some(x=>x.id!==id&&x.name===nm)){alert('השם תפוס');return}f.name=nm;
  if(f.type==='choice'){const o=prompt('אפשרויות מופרדות בפסיקים',(f.opts||[]).join(', '));
    if(o!==null){const a=o.split(',').map(x=>x.trim()).filter(Boolean);if(a.length>=2)f.opts=a;else alert('נדרשות לפחות שתי אפשרויות, האפשרויות לא שונו')}}
  saveF()}
async function saveH(){const h=+$('#hh').value,w=+$('#hw').value;if(!(h>=1&&w>h)){alert('ימי "פושר" חייבים להיות גדולים מימי "חם"');return}
  H={hot:h,warm:w};try{localStorage.setItem('sb_heat',JSON.stringify(H))}catch(e){}
  if(sb&&ME){const{error}=await sb.from('orgs').update({heat:H}).eq('id',ME.org);if(error){alert('השמירה נכשלה: '+error.message);return}aud('שינוי הגדרות חום',null,`חם עד ${h}, פושר עד ${w}`)}
  draw()}
function insPh(k){const t=$('#tp');if(!t||t.disabled)return;const a=t.selectionStart,b=t.selectionEnd,s='{'+k+'}';
  t.value=t.value.slice(0,a)+s+t.value.slice(b);t.focus();t.selectionStart=t.selectionEnd=a+s.length;tplDraft=t.value;tpv()}
function tpv(){const t=$('#tp'),p=$('#tpp');if(!t||!p)return;const s=$('#tpl'),l=s&&s.value?L.find(x=>x.id===s.value):null;
  p.textContent=fillTpl(t.value,l||{name:'דנה',phone:'0501234567',date:lc(),tDate:lc(),tTime:'19:30',src:'וואטסאפ',cf:{}})}
async function saveTpl(){TPL=$('#tp').value.trim()||DEFTPL;tplDraft=null;try{localStorage.setItem('sb_tpl',TPL)}catch(e){}
  if(sb&&ME){const{error}=await sb.from('orgs').update({msg:TPL}).eq('id',ME.org);if(error){alert('השמירה נכשלה: '+error.message);return}aud('עדכון תבנית הודעה')}
  alert('התבנית נשמרה');draw()}
function resetTpl(){if(!confirm('לשחזר את נוסח ההודעה המקורי?'))return;tplDraft=DEFTPL;draw()}

function setHtml(){
  const can=!sb||(ME&&ME.role!=='member'),dis=can?'':'disabled',nl=L.length,hc=k=>L.filter(l=>hk(l)===k).length;
  const stt=f=>{const v=L.map(l=>(l.cf||{})[f.id]).filter(x=>x!==undefined&&x!=='');let e='';
    if(f.type==='choice'){const m={};v.forEach(x=>m[x]=(m[x]||0)+1);e=' · '+Object.entries(m).map(([a,b])=>esc(a)+' '+b).join(', ')}
    return `מולא ב-${v.length} מתוך ${nl}${e}`};
  const PH=[...RES,...F.map(f=>f.name)],sel=L.slice().sort(byD).slice(0,100);
  return `<h1>שדות והגדרות</h1><div class="cards set" style="margin-top:8px">
  <div class="card"><h2>🪪 כרטיס ליד</h2><div class="mut">שדות החובה קבועים. שדות נוספים מופיעים בכרטיס הליד, בליד חדש ובטבלה לפי הסדר כאן.</div>
    <input id="fn" placeholder="שם שדה חדש (למשל: גיל)"><div class="g"><select id="ft"><option value="text">טקסט</option><option value="number">מספר</option><option value="date">תאריך</option><option value="choice">בחירה מרשימה</option></select><button class="btn pri" style="margin-top:8px" onclick="addF()">+ הוספה</button></div>
    <input id="fo" placeholder="לבחירה מרשימה: אפשרויות מופרדות בפסיקים">
    <div class="card" style="margin:12px 0 0;padding:12px"><div style="display:flex;flex-wrap:wrap;gap:6px"><span class="tag">🔒 שם</span><span class="tag">🔒 תאריך ליד</span><span class="tag">🔒 טלפון</span><span class="tag">🔒 שלב</span></div>
    ${F.map((f,i)=>`<div class="row fr"><span style="flex:1"><b>${esc(f.name)}</b> <span class="mut">${TY[f.type]}</span><div class="mut">${stt(f)}</div></span><span style="white-space:nowrap"><button class="btn sm" ${i?'':'disabled'} onclick="mvF('${f.id}',-1)">▲</button> <button class="btn sm" ${i<F.length-1?'':'disabled'} onclick="mvF('${f.id}',1)">▼</button> <button class="btn sm" onclick="editF('${f.id}')">✎</button> <button class="btn sm bad" onclick="delF('${f.id}')">🗑</button></span></div>`).join('')||'<div class="fr mut">עדיין אין שדות נוספים.</div>'}
    <div class="fr mut">קבועים בכרטיס: מקור · תיעוד שיחה · שיעור ניסיון · היסטוריה</div></div></div>
  <div class="card"><h2>🌡 חום ליד</h2><div class="mut">לפי ימים מהפעילות האחרונה. סגירה חיובית, הופכת ללקוח ולא מתקררת.</div>
    <div class="g"><div><div class="mut">🔥 חם: עד (ימים)</div><input id="hh" type="number" min="1" value="${H.hot}" ${dis}></div><div><div class="mut">🌤 פושר: עד (ימים)</div><input id="hw" type="number" min="2" value="${H.warm}" ${dis}></div></div>
    <div class="mut" style="margin-top:8px">❄️ קר: מעל זה. כרגע: 🔥 ${hc('hot')} · 🌤 ${hc('warm')} · ❄️ ${hc('cold')}</div>${can?'<button class="btn pri full" onclick="saveH()">שמירה</button>':''}</div>
  <div class="card"><h2>💬 הודעת הזמנה לשיעור ניסיון</h2><div class="mut">לחיצה על משתנה מכניסה אותו להודעה, והוא מתמלא מנתוני הליד (חסר = __). ההודעה מופיעה בכרטיס ליד בשלב "אימון מתואם".</div>
    <div class="chips" style="flex-wrap:wrap;margin-top:8px">${PH.map(k=>`<button class="chip" data-k="${esc(k)}" onclick="insPh(this.dataset.k)">{${esc(k)}}</button>`).join('')}</div>
    <textarea id="tp" rows="14" oninput="tplDraft=this.value;tpv()" ${dis}>${esc(tplDraft??TPL)}</textarea>
    <div class="mut" style="margin-top:8px">תצוגה מקדימה על:</div><select id="tpl" onchange="tpv()"><option value="">דוגמה</option>${sel.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
    <pre class="pv" id="tpp"></pre>${can?'<button class="btn pri full" onclick="saveTpl()">שמירת התבנית</button><button class="btn full" onclick="resetTpl()">שחזור נוסח מקורי</button>':''}</div></div>`}

// ---- audit page (owner / admin)
let AU=[];
const auditHtml=()=>'<h1>יומן פעילות</h1><div class="row" style="flex-wrap:wrap;margin-bottom:10px"><select id="auu" onchange="auRows()" style="margin:0;flex:1"></select><input id="aus" placeholder="חיפוש" oninput="auRows()" style="margin:0;flex:2"></div><div class="tw card"><table><thead><tr><th>זמן</th><th>משתמש</th><th>פעולה</th><th>ליד</th><th>פרטים</th></tr></thead><tbody id="aur"><tr><td colspan="5" class="empty">טוען…</td></tr></tbody></table></div>';
async function loadAudit(){const{data,error}=await sb.from('audit_log').select('*').eq('org_id',ME.org).order('created_at',{ascending:false}).limit(500);
  const el=$('#aur');if(!el)return;if(error){el.innerHTML=`<tr><td colspan="5">${esc(error.message)}</td></tr>`;return}
  AU=data;$('#auu').innerHTML='<option value="">כל המשתמשים</option>'+[...new Set(AU.map(a=>a.email))].map(e=>`<option>${esc(e)}</option>`).join('');auRows()}
function auRows(){const u=$('#auu').value,s=$('#aus').value.toLowerCase();
  const R=AU.filter(a=>(!u||a.email===u)&&(!s||((a.lead_name||'')+(a.details||'')+a.action).toLowerCase().includes(s)));
  $('#aur').innerHTML=R.map(a=>`<tr><td>${new Date(a.created_at).toLocaleString('he-IL')}</td><td>${esc(a.email)}</td><td>${esc(a.action)}</td><td>${esc(a.lead_name||'')}</td><td style="white-space:normal">${esc(a.details||'')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">אין רשומות</td></tr>'}

// ---- export / import
async function exportCSV(){
  aud('ייצוא CSV',null,L.length+' לידים');
  const hdr=['שם','תאריך','טלפון','סטטוס','מקור','תיעוד','סיבת כשלון','שלב מקסימלי',...F.map(f=>f.name)];
  const qt=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=L.map(l=>[l.name,l.date,l.phone,SN[l.stage],l.src,l.note,l.reason||'',l.reached||0,...F.map(f=>(l.cf||{})[f.id]??'')]);
  const csv='\uFEFF'+[hdr,...rows].map(r=>r.map(qt).join(',')).join('\r\n'),fn='leads-'+iso()+'.csv';
  let dl=null;try{if(window.claude)dl=await claude.use('downloads')}catch(e){}
  if(dl)return dl.save({filename:fn,data:csv}).catch(()=>{});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=fn;document.body.appendChild(a);a.click();a.remove()}

function impM(){modal(`<h2>ייבוא לידים</h2><p class="mut">בחר קובץ CSV (באקסל: שמירה בשם ← CSV), או הדבק שורות מהטבלה. שורת כותרות מזוהה אוטומטית: שם, תאריך, טלפון, סטטוס, מקור, תיעוד, ושמות השדות הנוספים. בלי כותרות הסדר הוא שם, תאריך, טלפון, סטטוס, מקור, תיעוד. לידים עם טלפון שכבר קיים מדולגים.</p><input id="ifl" type="file" accept=".csv,.tsv,.txt,text/csv" onchange="readF(this.files[0])"><textarea id="ix" rows="6" placeholder="או הדבק כאן"></textarea><button class="btn pri full" onclick="doImp()">ייבוא</button>`)}
function readF(f){if(!f)return;const r=new FileReader();r.onload=()=>{const b=new Uint8Array(r.result);let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){t=new TextDecoder('windows-1255').decode(b)}$('#ix').value=t.replace(/^\uFEFF/,'')};r.readAsArrayBuffer(f)}
function parseT(t){const first=t.split('\n')[0]||'';const dl=[['\t',first.split('\t').length],[';',first.split(';').length],[',',first.split(',').length]].sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let r=[],c='',inq=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(inq){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else inq=false}else c+=ch}
    else if(ch==='"')inq=true;
    else if(ch===dl){r.push(c);c=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';rows.push(r);r=[]}
    else c+=ch}
  if(c!==''||r.length){r.push(c);rows.push(r)}
  return rows.map(x=>x.map(v=>v.trim())).filter(x=>x.some(v=>v))}
const ns=s=>/ממומן/.test(s)?'ממומן (מטא)':/צאפ|טסאפ/.test(s)?'וואטסאפ':/דרך/.test(s)?'דרך מישהו/י':(s||'');
function pd(s){if(/^\d{4}-\d{2}-\d{2}/.test(s))return String(s).slice(0,10);const m=String(s||'').trim().match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);if(!m)return iso();let y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000;return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
function doImp(){
  const rows=parseT($('#ix').value);if(!rows.length){alert('אין שורות לייבוא');return}
  const pat={name:/^שם|name/i,date:/תאריך|date/i,phone:/טלפון|נייד|phone/i,stat:/סט|שלב|status/i,src:/מקור|source/i,note:/תי?עוד|תיאור|שיחה|הערה|הערות|note/i,reason:/סיבה|סיבת|reason/i,reach:/מקסימלי|reached/i};
  const hasH=rows[0].some(c=>/טלפון|תאריך|שם|סט|phone|name/i.test(c))&&!rows[0].some(c=>/^[\d\s+-]{9,}$/.test(c));
  let m={name:0,date:1,phone:2,stat:3,src:4,note:5},cfm={};
  if(hasH){const h=rows.shift();m={};
    h.forEach((c,i)=>{const f=F.find(f=>f.name===c);if(f){cfm[f.id]=i;return}const k=Object.keys(pat).find(k=>m[k]===undefined&&pat[k].test(c));if(k)m[k]=i});
    if(m.name===undefined){const used=[...Object.values(m),...Object.values(cfm)];const i=h.findIndex((_,i)=>!used.includes(i));if(i>=0)m.name=i}
    if(m.note===undefined){const used=[...Object.values(m),...Object.values(cfm)];let best=-1,bl=0;h.forEach((_,i)=>{if(used.includes(i))return;const len=rows.reduce((t,r)=>t+(r[i]||'').length,0);if(len>bl){bl=len;best=i}});if(best>=0)m.note=best}}
  if(m.name===undefined||m.phone===undefined){alert('לא נמצאו עמודות שם וטלפון');return}
  const seen=new Map(L.map(l=>[np(l.phone),l]));let sk=0,up=0;const fresh=[];
  rows.forEach(r=>{const g=k=>m[k]===undefined?'':(r[m[k]]||'');
    const name=g('name'),p=np(g('phone'));
    if(!name||p.length<9){sk++;return}
    if(seen.has(p)){const ex=seen.get(p),nt=g('note');
      if(nt&&!ex.note&&!fresh.includes(ex)){ex.note=nt;up++;persist(ex)}else sk++;return}
    const stat=g('stat'),note=g('note');
    const st=(ST.find(s=>stat&&(stat.includes(s[1])||s[1].includes(stat)))||['new'])[0];
    const x={id:uid(),name,phone:p,date:pd(g('date')),upd:pd(g('date')),src:ns(g('src')),stage:st,reached:Math.max(0,IDX.indexOf(st)),note};
    const cf={};F.forEach(f=>{const v=cfm[f.id]!==undefined?r[cfm[f.id]]:'';if(v)cf[f.id]=f.type==='number'?(+v||v):f.type==='date'?pd(v):v});
    if(Object.keys(cf).length)x.cf=cf;
    if(st==='lost'){const rr=REA.find(z=>note.includes(z));x.reason=g('reason')||rr||'אחר'}
    const rc=parseInt(g('reach'));if(rc>=0&&rc<=4)x.reached=Math.max(x.reached,rc);
    seen.set(p,x);fresh.push(x)});
  const done=n=>{aud('ייבוא לידים',null,`נוספו ${n}, דולגו ${sk}, עודכנו ${up}`);alert(`נוספו ${n} לידים חדשים. תיעוד הושלם ב-${up} קיימים. דולגו ${sk} (טלפון קיים או חסר פרטים).`)};
  closeM();
  if(db&&db.importRows){db.importRows(fresh).then(done);return}
  fresh.forEach(x=>{L.push(x);persist(x)});draw();done(fresh.length)}

// ---- navigation + main render
const go=p=>{page=p;draw();scrollTo(0,0)};
function sideHtml(){
  const tn=tasks().reduce((a,g)=>a+g.arr.length,0),adm=sb&&ME&&ME.role!=='member',nc=L.filter(l=>l.stage==='closed').length;
  const nv=(k,i,t,b)=>`<button class="nv ${page===k?'on':''}" onclick="go('${k}')"><span>${i}</span>${t}${b?` <span class="tag">${b}</span>`:''}</button>`;
  const status=mode==='db'?'✓ נשמר במסד נתונים':mode==='local'?'נשמר רק במכשיר הזה':mode==='err'?'שגיאת חיבור':'מתחבר…';
  return `<aside class="side"><div class="brand">Studio Balance</div>${nv('tasks','✅','משימות',tn)}${nv('fall','📊','מפל')}${nv('leads','👥','לידים')}${nv('customers','🤝','לקוחות',nc)}${nv('settings','⚙','שדות')}<button class="nv" onclick="impM()"><span>⬆</span>ייבוא</button><button class="nv" onclick="exportCSV()"><span>⬇</span>ייצוא</button>${adm?nv('users','👤','משתמשים')+nv('audit','🕘','יומן'):''}${sb?'<button class="nv" onclick="logout()"><span>⎋</span>יציאה</button>':''}<div class="mut st">v${VERSION} · ${status}</div></aside>`}
const PAGES={tasks:tasksHtml,fall:fallHtml,users:usersHtml,audit:auditHtml,customers:custHtml,settings:setHtml,leads:leadsHtml};
function draw(){
  const a=document.activeElement,k=page+view,same=draw.k===k;
  if(same&&page==='leads'&&view==='table'&&a&&a.closest&&a.closest('#tb'))return;                       // don't interrupt cell editing
  if(same&&page==='settings'&&a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest('.main'))return;  // don't wipe typing
  if(same&&page==='customers'&&a&&a.id==='cq'){cl();return}
  const old=same?document.querySelector('.tw,.cards,.cols'):null,sp=old&&[old.scrollTop,old.scrollLeft],f=a&&a.id==='q';
  draw.k=k;
  $('#app').innerHTML=`<div class="shell">${sideHtml()}<main class="main">${(PAGES[page]||leadsHtml)()}</main></div>`;
  if(page==='leads')list();else if(page==='users')loadUsers();else if(page==='audit')loadAudit();else if(page==='customers')cl();else if(page==='settings')tpv();
  const nw=document.querySelector('.tw,.cards,.cols');if(nw&&sp){nw.scrollTop=sp[0];nw.scrollLeft=sp[1]}
  if(f){const e=$('#q');if(e){e.focus();e.setSelectionRange(qraw.length,qraw.length)}}}
