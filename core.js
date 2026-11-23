/* ===== core: helpers · state · heat · template · audit · storage · modal ===== */
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=(d=new Date())=>d.toISOString().slice(0,10);
const lc=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); // local date
const fd=s=>s?s.split('-').reverse().join('/'):'';
const fdn=s=>s?s.split('-').reverse().map(Number).join('/'):'';
const uid=()=>crypto.randomUUID();
const ph=p=>String(p||'').replace(/\D/g,'');
const np=p=>{const d=ph(p);return d.startsWith('972')?'0'+d.slice(3):(d.length===9&&d[0]==='5')?'0'+d:d};
const wan=p=>ph(p).replace(/^0/,'972');

// ---- state
let page='leads',filt='all',q='',qraw='',qt,sort={k:'date',d:-1},cfl={},cq='',tplDraft=null;
let view=(()=>{try{return localStorage.getItem('sb_view')}catch(e){return null}})()||'list';
let L=[],F=[],db=null,sb=null,ME=null,LE='',mode='...';
let H={hot:14,warm:30},TPL=DEFTPL;
try{H={...H,...JSON.parse(localStorage.getItem('sb_heat'))}}catch(e){}
try{TPL=localStorage.getItem('sb_tpl')||DEFTPL}catch(e){}

// ---- heat: days since last activity. closed = positive, never cools
const hd=l=>Math.max(0,Math.floor((Date.now()-new Date((l.upd||l.date)+'T12:00:00'))/864e5));
const hk=l=>!OPEN.includes(l.stage)?'':hd(l)<=H.hot?'hot':hd(l)<=H.warm?'warm':'cold';
function heat(l){
  if(l.stage==='closed')return '<div class="good" style="margin-top:4px">✅ סגירה</div>';
  const k=hk(l);if(!k)return '';const d=hd(l);
  return `<div class="mut" style="margin-top:4px">${HI[k]} ${HN[k]} · ${d?'לפני '+d+' ימים':'היום'}</div>`}
const closedOn=l=>(l.cf&&l.cf._closed)||l.upd||l.date||'';
const trialTxt=l=>l.stage==='booked'&&l.tDate?' · 🗓 ניסיון '+fdn(l.tDate)+(l.tTime?' '+l.tTime:''):'';

// ---- invitation message: {variables} filled from the lead
function fillTpl(t,l){
  const d={'שם':l.name,'טלפון':l.phone,'תאריך_שיעור':fdn(l.tDate),'שעה':l.tTime,'תאריך_ליד':fdn(l.date),'מקור':l.src};
  F.forEach(f=>{const v=(l.cf||{})[f.id];d[f.name]=f.type==='date'?fdn(v):v});
  return t.replace(/\{([^}]+)\}/g,(m,k)=>k in d?((d[k]===undefined||d[k]==='')?'__':d[k]):m)}

// ---- audit log + per-lead history (same table, lead_id set)
const LBL={name:'שם',phone:'טלפון',src:'מקור',date:'תאריך',stage:'שלב',note:'תיעוד',reason:'סיבה',tDate:'תאריך ניסיון',tTime:'שעת ניסיון'};
function diff(o,n){if(!o)return '';const d=[];
  for(const k in LBL){if((o[k]||'')===(n[k]||''))continue;
    d.push(LBL[k]+': '+(k==='stage'?SN[o[k]]+' → '+SN[n[k]]:k==='note'?'"'+(n[k]||'').slice(0,80)+'"':(k==='date'||k==='tDate')?(fdn(o[k])||'∅')+' → '+(fdn(n[k])||'∅'):(o[k]||'∅')+' → '+(n[k]||'∅')))}
  F.forEach(f=>{const a=(o.cf||{})[f.id]??'',b=(n.cf||{})[f.id]??'';if(a!==b)d.push(f.name+': '+(a||'∅')+' → '+(b||'∅'))});
  return d.join(' | ')}
function aud(a,l,d){if(!sb||!ME)return;
  sb.from('audit_log').insert({org_id:ME.org,user_id:ME.uid,email:ME.email||'',action:a,lead_id:l?l.id:null,lead_name:l?l.name:null,details:d||null})
    .then(({error})=>{if(error)console.warn('audit',error.message)})}

// ---- save (every lead write goes through here)
function persist(l){
  if(db){const{id,...r}=l;db.collection('leads').doc(id).set(r).catch(()=>{})}
  else try{localStorage.setItem(LS,JSON.stringify(L))}catch(e){}}
function save(l){
  const i=L.findIndex(x=>x.id===l.id),o=i<0?null:L[i];
  if(l.stage==='closed'&&!(l.cf&&l.cf._closed))l.cf={...(l.cf||{}),_closed:lc()}; // customer-since date
  const d=diff(o,l);l.upd=iso();i<0?L.push(l):L[i]=l;persist(l);
  if(!o)aud('ליד חדש',l);else if(d)aud('עדכון ליד',l,d)}
function put(l){save(l);draw()}
function saveF(){
  if(db)db.doc('config/fields').set({list:F}).catch(()=>alert('השמירה נכשלה'));
  else try{localStorage.setItem('sb_fields',JSON.stringify(F))}catch(e){}
  draw()}

// ---- Supabase adapter (small Firestore-like API used by the UI)
function mkDb(sb,org){
  const today=()=>new Date().toISOString().slice(0,10);
  const toRow=(id,o)=>({id,org_id:org,name:o.name,phone:o.phone,source:o.src||null,received_on:o.date||today(),stage:o.stage||'new',reached:o.reached||0,note:o.note||'',lost_reason:o.reason||null,trial_date:o.tDate||null,trial_time:o.tTime||null,custom:o.cf||{},last_activity:o.upd||null});
  const fromRow=r=>({name:r.name,phone:r.phone,src:r.source||'',date:r.received_on,stage:r.stage,reached:r.reached,note:r.note||'',reason:r.lost_reason||undefined,tDate:r.trial_date||'',tTime:(r.trial_time||'').slice(0,5),cf:r.custom||{},upd:r.last_activity||r.received_on});
  let pend=new Map(),ws=[],tm,reloadL=()=>{};
  const flush=async()=>{const rows=[...pend.values()],w=ws;pend=new Map();ws=[];
    const{error}=await sb.from('leads').upsert(rows);
    if(error){alert(error.code==='23505'?'המספר כבר קיים במערכת':'שגיאת שמירה: '+error.message);reloadL()}
    w.forEach(([ok,no])=>error?no(error):ok())};
  const watch=(table,fn)=>{let t;sb.channel(table+org).on('postgres_changes',{event:'*',schema:'public',table,filter:'org_id=eq.'+org},()=>{clearTimeout(t);t=setTimeout(fn,300)}).subscribe()};
  return{
    importRows:async list=>{if(!list.length)return 0;let n=0;
      const rows=list.map(x=>toRow(x.id,x));
      for(let i=0;i<rows.length;i+=500){
        const{data,error}=await sb.from('leads').upsert(rows.slice(i,i+500),{onConflict:'org_id,phone_key',ignoreDuplicates:true}).select('id');
        if(error){alert('שגיאת ייבוא: '+error.message);break}n+=data.length}
      reloadL();return n},
    collection:()=>({
      doc:id=>({
        set:o=>new Promise((ok,no)=>{pend.set(id,toRow(id,o));ws.push([ok,no]);clearTimeout(tm);tm=setTimeout(flush,60)}),
        delete:async()=>{const{error}=await sb.from('leads').delete().eq('id',id);if(error)throw error}
      }),
      onSnapshot:(next,err)=>{
        const load=async()=>{let all=[],from=0;
          for(;;){const{data,error}=await sb.from('leads').select('*').eq('org_id',org).order('received_on',{ascending:false}).order('id').range(from,from+999);
            if(error)return err&&err(error);all=all.concat(data);if(data.length<1000)break;from+=1000}
          next({docs:all.map(r=>({id:r.id,data:()=>fromRow(r)}))})};
        reloadL=load;load();watch('leads',load);return()=>{}}
    }),
    doc:()=>({
      set:async({list})=>{
        const rows=list.map((f,i)=>({id:f.id,org_id:org,name:f.name,type:f.type,options:f.opts||[],position:i}));
        if(rows.length){const{error}=await sb.from('lead_fields').upsert(rows);if(error)throw error}
        let q=sb.from('lead_fields').delete().eq('org_id',org);
        if(rows.length)q=q.not('id','in','('+rows.map(r=>r.id).join(',')+')');
        const{error:e2}=await q;if(e2)throw e2},
      onSnapshot:(next,err)=>{
        const load=async()=>{const{data,error}=await sb.from('lead_fields').select('*').eq('org_id',org).order('position');
          if(error)return err&&err(error);
          next({exists:true,data:()=>({list:data.map(r=>({id:r.id,name:r.name,type:r.type,opts:r.options||[]}))})})};
        load();watch('lead_fields',load);return()=>{}}
    })
  };
}

// ---- modal
function modal(h){$('#m').innerHTML=`<div class="ov" onclick="if(event.target===this)closeM()"><div class="md">${h}</div></div>`}
const closeM=()=>{$('#m').innerHTML=''};
