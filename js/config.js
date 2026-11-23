/* ===== config: keys + constants (edit here) ===== */
const VERSION='1.2.1';
// Supabase -> Project Settings -> API. anon/publishable key ONLY, never service_role.
const SUPABASE_URL='https://wrpwwndetbucdrlukhkr.supabase.co',SUPABASE_ANON_KEY='sb_publishable_2GK_tLuZRP03MnEb_Vb0iQ_jiJQ0Y5c';

// lead stages
const ST=[['new','ליד חדש'],['phone','שיחת טלפון'],['booked','אימון מתואם'],['attended','אימון בפועל'],['closed','סגירה'],['lost','כשלון'],['followup','צריך לחזור'],['dead','ליד שמת']];
const SN=Object.fromEntries(ST);
const IDX=['new','phone','booked','attended','closed'];   // funnel order
const OPEN=['new','phone','booked','attended'];            // stages that can cool down
const SRC=['וואטסאפ','ממומן (מטא)','דרך מישהו/י'];
const REA=['לא מהאיזור','התחיל במקום אחר','לא רלוונטי','מחיר','אחר'];

const HI={hot:'🔥',warm:'🌤',cold:'❄️'},HN={hot:'חם',warm:'פושר',cold:'קר'};
const DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const TY={text:'טקסט',number:'מספר',date:'תאריך',choice:'בחירה'};
const RES=['שם','טלפון','תאריך_שיעור','שעה','תאריך_ליד','מקור']; // reserved message variables
const LS='sb_leads';

// default invitation message ({variables} are filled from the lead)
const DEFTPL=`היי {שם} 😊

שובצת לשיעור ניסיון בתאריך {תאריך_שיעור}
בשעה {שעה}

*יש לחתום על הצהרת הבריאות בלינק המצורף טרם הגעתך לשיעור. 🖊️

*שינוי מועד השיבוץ עד 24 שעות לפני.

אין זיכוי על שיעור ניסיון-ניתן לממש עד שבועיים מיום הרכישה.

*כתובת הסטודיו-כוכב הים 14 חופית. 🗺️

*מומלץ להגיע כמה דקות לפני השיעור כדי להתמקם בנחת.

תהנה 🌻

https://docs.google.com/forms/d/e/1FAIpQLScahNXAH30hvVKIMrVCvCfXevrNtOkuIBmK8J9zzBF-QCGzOQ/viewform?usp=dialog`;
