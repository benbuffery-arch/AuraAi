/* AuraAi v5 Final */
const CONFIG = {
  FORM_ENDPOINT: "", // e.g. "https://formspree.io/f/xyzabcd"
  STRIPE_URL: "./success.html?mock=stripe" // replace with your Stripe Payment Link
};
const qs=(s,e=document)=>e.querySelector(s),qsa=(s,e=document)=>Array.from(e.querySelectorAll(s));
const money=n=>n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});

function computeEstimate(x){
  const sector=x.sector||"other", rev=+x.rev||0, gm=Math.min(95,Math.max(1,+x.gm||40)),
        staff=Math.max(1,Math.round(+x.staff||1)), rate=Math.max(1,+x.rate||25),
        util=Math.min(100,Math.max(1,+x.util||60)), tools=Math.max(0,Math.round(+x.tools||0)),
        seat=Math.max(0,+x.seat||25), ads=Math.max(0,+x.ads||0), roas=Math.max(.1,+x.roas||1.5),
        noshow=!!x.noshow;
  const T={trades:{util:75,vendor:.008},spa:{util:70,vendor:.006},clinic:{util:72,vendor:.006},contractor:{util:73,vendor:.01},other:{util:70,vendor:.006}}[sector]||{util:70,vendor:.006};
  const current=util/100, target=T.util/100, lift=Math.max(0,target-current);
  const hours=staff*160, labourBase=hours*rate, labourLow=labourBase*lift*.35, labourHigh=labourBase*lift*.65;
  const extraTools=Math.max(0,tools-5), saasBase=tools*seat, saasLow=Math.min(.15,extraTools*.02)*saasBase, saasHigh=Math.min(.30,.04*extraTools)*saasBase;
  const gmPct=gm/100, cogs=rev*(1-gmPct), vendorLow=T.vendor*cogs, vendorHigh=T.vendor*2.2*cogs;
  let ns=[0,0]; if(noshow){ const a=(sector==="spa"||sector==="clinic")?[.03,.07]:[.01,.03]; ns=[12*rev*a[0]*gmPct, 12*rev*a[1]*gmPct]; }
  let adsTrim=[0,0]; if(ads>0){ const f=(roas<2)?[.05,.15]:[.02,.06]; adsTrim=[12*ads*f[0],12*ads*f[1]]; }
  const low=Math.round(12*labourLow + 12*saasLow + 12*vendorLow + ns[0] + adsTrim[0]);
  const high=Math.round(12*labourHigh + 12*saasHigh + 12*vendorHigh + ns[1] + adsTrim[1]);
  return {low,high};
}

function initScan(){
  const s1=qs("#step1"), s2=qs("#step2"), tease=qs("#teaser");
  if(!s1||!s2||!tease) return;
  qs("#toStep2")?.addEventListener("click",(e)=>{
    e.preventDefault();
    const n=qs("input[name='name']").value.trim(), em=qs("input[name='email']").value.trim();
    if(!n||!em){ alert("Enter your name and work email."); return; }
    s1.style.display="none"; s2.style.display="block"; window.scrollTo({top:s2.offsetTop-20,behavior:"smooth"});
  });
  qs("#calc")?.addEventListener("click",(e)=>{
    e.preventDefault();
    const x={sector:qs("#sector")?.value||"other",rev:qs("#rev")?.value,gm:qs("#gm")?.value,staff:qs("#staff2")?.value,rate:qs("#rate")?.value,util:qs("#util")?.value,tools:qs("#tools")?.value,seat:qs("#seat")?.value,ads:qs("#ads")?.value,roas:qs("#roas")?.value,noshow:qs("#noshow")?.checked};
    const {low,high}=computeEstimate(x);
    qs("#estRange").textContent = `${money(low)} – ${money(high)} / yr`;
    s2.style.display="none"; tease.style.display="block"; window.scrollTo({top:tease.offsetTop-20,behavior:"smooth"});
  });
  qsa(".unlock").forEach(a=>a.addEventListener("click",(e)=>{e.preventDefault(); location.href = CONFIG.STRIPE_URL;}));
  qs("#calc")?.addEventListener("click", async ()=>{
    if(!CONFIG.FORM_ENDPOINT) return;
    try{ const fd=new FormData(qs("#scanForm"));
      await fetch(CONFIG.FORM_ENDPOINT,{method:"POST",body:fd,headers:{Accept:"application/json"}});
    }catch(_){}
  });
}

function initTimer(){
  const el = document.getElementById("countdown"); if(!el) return;
  let t=599; const tick=()=>{const m=String(Math.floor(t/60)).padStart(2,"0"), s=String(t%60).padStart(2,"0"); el.textContent=`${m}:${s}`; t=Math.max(0,t-1);};
  tick(); setInterval(tick,1000);
}

function initDashboard(){
  if(!qs("#dashboard")) return;
  qs("#hello").textContent="Welcome Ben, your audit is 78% complete.";
  qs("#confirmed").textContent=money(9440)+" / yr confirmed";
  qs("#nextStep").textContent="Upload last 3 months supplier invoices (CSV/PDF)";
}

document.addEventListener("DOMContentLoaded", ()=>{ initScan(); initTimer(); initDashboard(); });