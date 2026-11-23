/* ===== leads: filters · cards · board · Excel table · lead card · history ===== */
const tcl=x=>x==='lost'?'lost':x==='closed'?'won':['followup','dead'].includes(x)?'x':'';
const fm=l=>filt==='all'?l.stage!=='dead':filt.includes(':')?hk(l)===filt.slice(2):l.stage===filt;
const srch=l=>{const s=q.trim().toLowerCase();return !s||(l.name||'').toLowerCase().includes(s)||ph(l.phone).includes(s.replace(/\D/g,'')||'§')};
const byD=(a,b)=>(b.date||'').localeCompare(a.date||'');
function setV(v){view=v;try{localStorage.setItem('sb_view',v)}catch(e){}draw()}
function qd(v,now){qraw=v;clearTimeout(qt);const run=()=>{q=v;list()};now?run():qt=setTimeout(run,450)}

// ---- screen
function leadsHtml(){
  const nAll=L.filter(l=>l.stage!=='dead').length;
  const chips=[['all','הכול ('+nAll+')'],...['hot','warm','cold'].map(k=>['h:'+k,HI[k]+' '+HN[k]+' ('+L.filter(l=>hk(l)===k).length+')']),...ST.map(x=>[x[0],x[1]+' ('+L.filter(l=>l.stage===x[0]).length+')'])];
  return `<div class="row" style="margin-bottom:10px;flex-wrap:wrap"><input id="q" placeholder="חיפוש שם או טלפון (Enter לחיפוש מיידי)" value="${esc(qraw)}" oninput="qd(this.value)" onkeydown="if(event.key==='Enter')qd(this.value,1)" style="margin:0;flex:1;min-width:200px"><div class="chips" style="margin:0">${[['list','כרטיסים'],['board','עמודות'],['table','טבלה']].map(v=>`<button class="chip ${view===v[0]?'on':''}" onclick="setV('${v[0]}')">${v[1]}</button>`).join('')}</div><button class="btn pri" onclick="addM()">+ ליד חדש</button></div>`+
  (view==='board'?'':`<div class="chips">${chips.map(x=>`<button class="chip ${filt===x[0]?'on':''} ${x[0]==='lost'?'negchip':''}" data-s="${x[0]==='all'||x[0].includes(':')?'':x[0]}" onclick="filt='${x[0]}';draw()">${x[1]}</button>`).join('')}</div>`)+
  `<div id="list" class="${view==='list'?'cards':''}"></div>`}

function list(){
  if(L.length){if(view==='board')return board();if(view==='table')return table()}
  const R=L.filter(l=>fm(l)&&srch(l)).sort(byD);
  $('#list').innerHTML=R.length?R.map(l=>`<div class="card lead"><span class="grip" onpointerdown="dstart(event,'${l.id}')">⠿</span><div style="flex:1" onclick="openL('${l.id}')"><div class="nm">${esc(l.name)}</div><div class="mut">📞 ${esc(l.phone)} · 📅 ${fd(l.date)}${l.src?' · '+esc(l.src):''}${trialTxt(l)}</div>${l.note?`<div class="mut">${esc(l.note.slice(0,60))}</div>`:''}</div><div onclick="openL('${l.id}')" style="text-align:end"><span class="tag ${tcl(l.stage)}">${SN[l.stage]}</span>${heat(l)}</div></div>`).join(''):
  `<div class="empty">${L.length?'אין תוצאות':'עדיין אין לקוחות.<br>הוסף ליד, או הדבק את הטבלה מהאקסל.'}<br><br><button class="btn" onclick="impM()">ייבוא מאקסל</button></div>`}

// ---- board (drag a card onto a column / chip)
function board(){
  const R=L.filter(srch);
  $('#list').innerHTML=`<div class="cols">`+ST.map(([k,t])=>{const C=R.filter(l=>l.stage===k).sort(byD);
    return `<div class="col ${k==='lost'?'negc':''}" data-s="${k}"><h3>${t} (${C.length})</h3>${C.map(l=>`<div class="card lead" style="padding:10px"><span class="grip" onpointerdown="dstart(event,'${l.id}')">⠿</span><div style="flex:1" onclick="openL('${l.id}')"><div class="nm" style="font-size:15px">${esc(l.name)}</div><div class="mut">${esc(l.phone)}<br>${fd(l.date)}${trialTxt(l)}</div>${heat(l)}</div></div>`).join('')||'<div class="mut">ריק</div>'}</div>`}).join('')+`</div>`}
let drag=null;
function dstart(e,id){e.preventDefault();const l=L.find(x=>x.id===id),g=document.createElement('div');g.className='ghost';g.textContent=l.name;document.body.appendChild(g);drag={id,g,t:null};dmove(e);window.addEventListener('pointermove',dmove);window.addEventListener('pointerup',dend,{once:true})}
function dmove(e){if(!drag)return;drag.g.style.left=e.clientX+'px';drag.g.style.top=e.clientY+'px';
  const el=document.elementFromPoint(e.clientX,e.clientY),z=el&&el.closest('[data-s]');
  document.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot'));
  if(z&&z.dataset.s){z.classList.add('hot');drag.t=z.dataset.s}else drag.t=null;
  if(e.clientY<70)scrollBy(0,-12);else if(e.clientY>innerHeight-70)scrollBy(0,12);
  const c=document.querySelector('.cols');if(c){if(e.clientX<50)c.scrollLeft-=12;else if(e.clientX>innerWidth-50)c.scrollLeft+=12}}
function dend(){window.removeEventListener('pointermove',dmove);if(!drag)return;
  const{g,t,id}=drag;g.remove();drag=null;document.querySelectorAll('.hot').forEach(x=>x.classList.remove('hot'));
  const l=L.find(x=>x.id===id);if(t&&l&&l.stage!==t){setSt(id,t);if(t!=='lost')closeM()}}

// ---- Excel-like table: editable cells, per-column filters, sortable
const cols=()=>[{k:'name',t:'שם',e:'text'},{k:'phone',t:'טלפון',e:'text'},{k:'date',t:'תאריך',e:'date'},{k:'stage',t:'שלב',e:'sel',o:ST},{k:'src',t:'מקור',e:'sel',o:SRC.map(s=>[s,s])},{k:'heat',t:'חום',e:'sel',o:Object.entries(HN),ro:1},
  ...F.map(f=>({k:'f'+f.id,t:f.name,e:f.type==='choice'?'sel':f.type,o:(f.opts||[]).map(x=>[x,x]),f})),{k:'upd',t:'עדכון אחרון',e:'text',ro:1},{k:'note',t:'תיעוד',e:'text'}];
const gv=(l,c)=>c.k==='heat'?hk(l):c.k==='upd'?(l.upd||l.date||''):c.f?((l.cf||{})[c.f.id]??''):(l[c.k]??'');
const sv=(l,c)=>c.k==='heat'?hd(l):c.k==='stage'?ST.findIndex(x=>x[0]===l.stage):gv(l,c);
const cm=(l,C)=>C.every(c=>{const v=cfl[c.k];if(!v)return true;const x=String(gv(l,c));return c.e==='sel'?x===v:x.toLowerCase().includes(v.toLowerCase())});
function sortT(k){sort=sort.k===k?{k,d:-sort.d}:{k,d:1};list()}
function cfq(k,v){cfl[k]=v;tbody()}
function cell(l,c){const v=gv(l,c);
  if(c.k==='heat')return `<div style="padding:8px">${l.stage==='closed'?'✅':hk(l)?HI[hk(l)]+' '+hd(l)+' ימים':'—'}</div>`;
  if(c.k==='upd')return `<div style="padding:8px">${fd(v)}</div>`;
  const a=`onchange="ce(this,'${l.id}','${c.k}')"`;
  if(c.e==='sel')return `<select ${a}><option value=""></option>${c.o.some(([x])=>x===v)||v===''?'':`<option selected>${esc(v)}</option>`}${c.o.map(([x,y])=>`<option value="${esc(x)}" ${x===v?'selected':''}>${esc(y)}</option>`).join('')}</select>`;
  return `<input type="${c.e==='number'?'number':c.e==='date'?'date':'text'}" value="${esc(v)}" ${a}>`}
function ce(el,id,k){const o=L.find(x=>x.id===id),l={...o};let v=el.value;
  if(k==='phone'){v=np(v);if(L.some(x=>x.id!==id&&np(x.phone)===v)){alert('המספר כבר קיים');el.value=o.phone;return}el.value=v}
  if(k==='name'&&!v.trim()){el.value=o.name;return}
  if(k[0]==='f'){const f=F.find(x=>x.id===k.slice(1));l.cf={...(l.cf||{})};v===''?delete l.cf[f.id]:l.cf[f.id]=f.type==='number'?+v:v}
  else if(k==='stage'){if(!v){el.value=o.stage;return}l.stage=v;const i=IDX.indexOf(v);if(i>=0)l.reached=Math.max(l.reached||0,i)}
  else l[k]=v;
  save(l)}
function table(){const C=cols();
  $('#list').innerHTML=`<div class="tw card"><table class="xl"><thead><tr><th></th>${C.map(x=>`<th class="sh" onclick="sortT('${x.k}')">${esc(x.t)} ${sort.k===x.k?(sort.d>0?'▲':'▼'):''}</th>`).join('')}</tr><tr class="flt"><th></th>${C.map(x=>`<th>${x.e==='sel'?`<select onchange="cfq('${x.k}',this.value)"><option value="">הכל</option>${x.o.map(([a,b])=>`<option value="${esc(a)}" ${cfl[x.k]===a?'selected':''}>${esc(b)}</option>`).join('')}</select>`:`<input placeholder="סינון" value="${esc(cfl[x.k]||'')}" oninput="cfq('${x.k}',this.value)">`}</th>`).join('')}</tr></thead><tbody id="tb"></tbody></table></div>`;
  tbody()}
function tbody(){const C=cols(),c=C.find(x=>x.k===sort.k)||C[2],el=$('#tb');if(!el)return;
  const R=L.filter(l=>fm(l)&&srch(l)&&cm(l,C));
  R.sort((a,b)=>{const x=sv(a,c),y=sv(b,c),ex=x===''||x==null,ey=y===''||y==null;if(ex&&ey)return 0;if(ex)return 1;if(ey)return -1;return(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'he'))*sort.d});
  el.innerHTML=R.length?R.slice(0,500).map(l=>`<tr><td><button class="btn sm" onclick="openL('${l.id}')">↗</button></td>${C.map(x=>`<td>${cell(l,x)}</td>`).join('')}</tr>`).join('')+(R.length>500?`<tr><td colspan="${C.length+1}" class="mut">מוצגות 500 מתוך ${R.length}. צמצם בסינון.</td></tr>`:''):`<tr><td colspan="${C.length+1}" class="empty">אין תוצאות</td></tr>`}

// ---- shared field input (lead card, customer card, new lead)
function finput(f,id,v,oc){const a=oc?`onchange="${oc}"`:'';
  if(f.type==='choice')return `<select id="${id}" ${a}><option value=""></option>${(f.opts||[]).map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  return `<input id="${id}" type="${f.type==='number'?'number':f.type==='date'?'date':'text'}" value="${esc(v)}" ${a}>`}

// ---- new lead (mandatory: name, phone, date, stage; extra fields follow the settings order)
function addM(){modal(`<h2>ליד חדש</h2><input id="n" placeholder="שם"><input id="p" placeholder="טלפון" type="tel">
  <div class="g"><div><div class="mut">תאריך ליד</div><input id="d" type="date" value="${iso()}"></div>
  <div><div class="mut">שלב</div><select id="ns">${ST.map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></div>
  <div><div class="mut">מקור</div><select id="s">${SRC.map(o=>`<option>${o}</option>`).join('')}</select></div>
  ${F.map(f=>`<div><div class="mut">${esc(f.name)}</div>${finput(f,'nf_'+f.id,'')}</div>`).join('')}</div>
  <button class="btn pri full" onclick="saveNew()">שמירה</button>`)}
function saveNew(){
  const name=$('#n').value.trim(),phone=$('#p').value.trim();
  if(!name||!phone){alert('חסר שם או טלפון');return}
  const p=np(phone);if(p.length<9){alert('טלפון לא תקין');return}
  const dup=L.find(l=>np(l.phone)===p);if(dup){alert('המספר כבר קיים אצל '+dup.name);return}
  const st=$('#ns').value,cf={};
  F.forEach(f=>{const e=$('#nf_'+f.id);if(e&&e.value!=='')cf[f.id]=f.type==='number'?+e.value:e.value});
  const x={id:uid(),name,phone:p,src:$('#s').value,date:$('#d').value||iso(),stage:st,reached:Math.max(0,IDX.indexOf(st)),note:''};
  if(Object.keys(cf).length)x.cf=cf;
  put(x);closeM()}

// ---- lead card
function editB(id,k,el){const o=L.find(x=>x.id===id),l={...o};let v=el.value.trim();
  if(k==='phone'){v=np(v);if(v.length<9){alert('טלפון לא תקין');el.value=o.phone;return}
    if(L.some(x=>x.id!==id&&np(x.phone)===v)){alert('המספר כבר קיים');el.value=o.phone;return}}
  if((k==='name'||k==='date')&&!v){el.value=o[k];return}
  l[k]=v;put(l);if(k==='name'||k==='phone')openL(id)}
function setSt(id,s){const l={...L.find(x=>x.id===id),stage:s},i=IDX.indexOf(s);if(i>=0)l.reached=Math.max(l.reached||0,i);put(l);openL(id)}
const setR=(id,r)=>{put({...L.find(x=>x.id===id),reason:r});openL(id)};
function saveN(id){const l=L.find(x=>x.id===id),v=$('#nt');if(l&&v&&v.value!==l.note)put({...l,note:v.value})}
function saveCF(id){const l=L.find(x=>x.id===id),cf={...(l.cf||{})};
  F.forEach(f=>{const e=$('#cf_'+f.id);if(e){if(e.value==='')delete cf[f.id];else cf[f.id]=f.type==='number'?+e.value:e.value}});put({...l,cf})}
function saveT(id,adv){const l=L.find(x=>x.id===id),n={...l,tDate:$('#td').value,tTime:$('#tt').value};
  if(adv&&IDX.indexOf(n.stage)<2&&!['lost','followup'].includes(n.stage)){n.stage='booked';n.reached=Math.max(n.reached||0,2)}
  put(n);msgPrev(id)}
// invitation message: live preview (booked stage) + WhatsApp / copy
function msgPrev(id){const p=$('#mp'),l=L.find(x=>x.id===id);if(p&&l)p.textContent=fillTpl(TPL,l)}
function wsend(id,a){saveT(id,1);a.href='https://wa.me/'+wan(L.find(x=>x.id===id).phone)+'?text='+encodeURIComponent(fillTpl(TPL,L.find(x=>x.id===id)))}
function cpMsg(id){navigator.clipboard.writeText(fillTpl(TPL,L.find(x=>x.id===id))).then(()=>alert('ההודעה הועתקה'),()=>alert('ההעתקה נכשלה'))}

// per-lead history (audit_log rows with this lead_id)
async function loadHist(id){const el=$('#hs'),l=L.find(x=>x.id===id);if(!el||!l)return;let rows=[];
  if(sb&&ME){const{data,error}=await sb.from('audit_log').select('created_at,email,action,details').eq('org_id',ME.org).eq('lead_id',id).order('created_at',{ascending:false}).limit(100);
    if(error){el.textContent='שגיאה: '+error.message;return}rows=data}
  el.innerHTML=rows.map(a=>`<div class="hi"><b>${esc(a.action)}</b> · ${new Date(a.created_at).toLocaleString('he-IL')}<div class="mut">${esc(a.email||'')}${a.details?' — '+esc(a.details):''}</div></div>`).join('')+
    `<div class="hi"><b>נכנס כליד</b> · ${fd(l.date)}${l.src?' · '+esc(l.src):''}</div>`+(sb?'':'<div class="mut">היסטוריה מלאה זמינה רק עם מסד נתונים.</div>')}

function openL(id){const l=L.find(x=>x.id===id);if(!l)return;
  const booked=l.stage==='booked',wa=`<a class="btn pri full" target="_blank" rel="noopener" href="#" onclick="wsend('${id}',this)">שליחת הודעת שיבוץ בוואטסאפ</a>`;
  modal(`<div class="row"><input value="${esc(l.name)}" onchange="editB('${id}','name',this)" style="margin:0;font-weight:700;font-size:17px"><a class="btn" href="tel:${esc(l.phone)}" style="white-space:nowrap">📞</a></div>
  <div class="g"><div><div class="mut">טלפון</div><input value="${esc(l.phone)}" inputmode="tel" onchange="editB('${id}','phone',this)"></div>
  <div><div class="mut">תאריך ליד</div><input type="date" value="${esc(l.date)}" onchange="editB('${id}','date',this)"></div></div>
  <div class="mut" style="margin-top:10px">שלב</div>
  <div class="stg">${ST.map(([k,t])=>`<button class="sc ${l.stage===k?'on':''} ${k==='lost'?'neg':k==='closed'?'pos':''}" onclick="setSt('${id}','${k}')">${t}</button>`).join('')}</div>
  ${l.stage==='lost'?`<div class="mut" style="margin-top:8px">סיבה</div><div class="stg">${REA.map(r=>`<button class="sc ${l.reason===r?'on':''}" onclick="setR('${id}','${r}')">${r}</button>`).join('')}</div>`:''}
  ${l.stage==='closed'?`<div class="good" style="margin-top:8px">✅ לקוח מאז ${fd(closedOn(l))} <button class="btn sm" onclick="openC('${id}')">כרטיס לקוח</button></div>`:''}
  <div class="g" style="margin-top:10px"><div><div class="mut">מקור</div><select onchange="editB('${id}','src',this)"><option value=""></option>${(SRC.includes(l.src)||!l.src?SRC:[...SRC,l.src]).map(o=>`<option ${o===l.src?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
  ${F.map(f=>`<div><div class="mut">${esc(f.name)}</div>${finput(f,'cf_'+f.id,(l.cf||{})[f.id]??'',`saveCF('${id}')`)}</div>`).join('')}</div>
  <div class="mut" style="margin-top:10px">תיעוד שיחה</div><textarea id="nt" rows="3" onblur="saveN('${id}')">${esc(l.note)}</textarea>
  <div class="mut" style="margin-top:10px">שיעור ניסיון</div><div class="g"><input id="td" type="date" value="${l.tDate||''}" onchange="saveT('${id}')"><input id="tt" type="time" value="${l.tTime||''}" onchange="saveT('${id}')"></div>
  ${booked?`<div class="card" style="margin:10px 0 0;padding:12px"><b>💬 הודעת הזמנה לשיעור ניסיון</b>${l.tDate?'':'<div class="bad">בחר תאריך ושעה לשיעור כדי שההודעה תתמלא.</div>'}<pre class="pv" id="mp">${esc(fillTpl(TPL,l))}</pre><button class="btn full" onclick="cpMsg('${id}')">העתקת ההודעה</button>${wa}<div class="mut">נפתח בוואטסאפ מוכן, ואתה לוחץ שליחה. עריכת הנוסח: שדות ← הודעה.</div></div>`:`${wa}<div class="mut">ההודעה נפתחת מוכנה לפי התבנית (שדות ← הודעה), ואתה לוחץ שליחה.</div>`}
  <details style="margin-top:12px" ontoggle="if(this.open)loadHist('${id}')"><summary class="mut" style="cursor:pointer">🕘 היסטוריה</summary><div id="hs" class="mut">טוען…</div></details>
  <div class="mut" style="margin-top:12px">לא מוחקים לידים. ליד שלא רלוונטי יותר עובר ל״ליד שמת״.</div>`)}
