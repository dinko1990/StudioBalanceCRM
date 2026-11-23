/* ===== app: startup ===== */
async function initClaude(){ // fallback when Supabase keys are empty (Claude preview db, else this device only)
  try{db=window.claude?await claude.use('db'):null}catch(e){db=null}
  if(db){mode='db';
    const t=setTimeout(()=>{mode='err';draw()},10000);
    db.doc('config/fields').onSnapshot(s=>{F=(s.exists&&s.data().list)||[];draw()},()=>{});
    db.collection('leads').onSnapshot(s=>{clearTimeout(t);L=s.docs.map(x=>({...x.data(),id:x.id}));mode='db';draw()},()=>{clearTimeout(t);mode='err';draw()});
  }else{mode='local';
    try{L=JSON.parse(localStorage.getItem(LS))||[]}catch(e){L=[]}
    try{F=JSON.parse(localStorage.getItem('sb_fields'))||[]}catch(e){F=[]}
    draw()}}

async function init(){
  if(!(SUPABASE_URL&&SUPABASE_ANON_KEY&&window.supabase))return initClaude();
  sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'){started=false;loginUI()}});
  const{data}=await sb.auth.getSession();
  data.session?startSb():loginUI()}

draw();init();
