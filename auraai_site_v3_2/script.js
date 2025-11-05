(function(){
  const $ = (s)=>document.querySelector(s);
  const fmt = (n)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});

  function estimateSavings(){
    const sectorEl = document.getElementById("sector");
    const revEl = document.getElementById("rev");
    if(!sectorEl || !revEl){ return; }

    const valNum = (id, def=0)=>{ const el=document.getElementById(id); const v=el?parseFloat(el.value):NaN; return isNaN(v)?def:v; };
    const valInt = (id, def=0)=>{ const el=document.getElementById(id); const v=el?parseInt(el.value,10):NaN; return isNaN(v)?def:v; };

    const sector = sectorEl.value || "other";
    const rev = valNum("rev", 0);
    const gm = Math.min(95, Math.max(1, valNum("gm", 40)));
    const staff = Math.max(1, valInt("staff", 1));
    const rate = Math.max(1, valNum("rate", 25));
    const util = Math.min(100, Math.max(1, valNum("util", 60)));
    const tools = Math.max(0, valInt("tools", 0));
    const seat = Math.max(0, valNum("seat", 25));
    const ads = Math.max(0, valNum("ads", 0));
    const roas = Math.max(0.1, valNum("roas", 1.5));
    const hasNoShow = !!(document.getElementById("noshow") && document.getElementById("noshow").checked);

    const targets = {trades:{util:75, vendorDrift:0.008}, spa:{util:70, vendorDrift:0.006}, clinic:{util:72, vendorDrift:0.006}, contractor:{util:73, vendorDrift:0.01}, other:{util:70, vendorDrift:0.006}};
    const T = targets[sector] || targets.other;

    const currentUtil = util/100.0, targetUtil = T.util/100.0, lift = Math.max(0, targetUtil - currentUtil);
    const labourBase = staff * 160 * rate;
    const labourEffLow = labourBase * lift * 0.35, labourEffHigh = labourBase * lift * 0.65;

    const extraTools=Math.max(0,tools-5), saasBase=tools*seat;
    const saasWasteLow=Math.min(0.15,extraTools*0.02)*saasBase, saasWasteHigh=Math.min(0.30,extraTools*0.04)*saasBase;

    const gmPct = gm/100.0, cogsMonthly = rev*(1-gmPct);
    const vendorLow=T.vendorDrift*cogsMonthly, vendorHigh=(T.vendorDrift*2.2)*cogsMonthly;

    let noshowAnnual=[0,0];
    if(hasNoShow){
      const fillLow = (sector==="spa"||sector==="clinic")?0.03:0.01;
      const fillHigh = (sector==="spa"||sector==="clinic")?0.07:0.03;
      const ngpLow = rev*fillLow*gmPct, ngpHigh = rev*fillHigh*gmPct;
      noshowAnnual=[ngpLow*12, ngpHigh*12];
    }

    let adsAnnual=[0,0];
    if(ads>0){
      const shaveLow=(roas<2.0)?0.05:0.02, shaveHigh=(roas<2.0)?0.15:0.06;
      adsAnnual=[ads*shaveLow*12, ads*shaveHigh*12];
    }

    const low = Math.round(labourEffLow*12 + saasWasteLow*12 + vendorLow*12 + noshowAnnual[0] + adsAnnual[0]);
    const high = Math.round(labourEffHigh*12 + saasWasteHigh*12 + vendorHigh*12 + noshowAnnual[1] + adsAnnual[1]);

    const out = document.getElementById("roiOut"); if(out){ out.textContent = `${fmt(low)} – ${fmt(high)} / yr`; }

    const parts=[
      {label:"Labour efficiency", low:Math.round(labourEffLow*12), high:Math.round(labourEffHigh*12)},
      {label:"SaaS waste", low:Math.round(saasWasteLow*12), high:Math.round(saasWasteHigh*12)},
      {label:"Vendor drift", low:Math.round(vendorLow*12), high:Math.round(vendorHigh*12)},
      {label:"No-show recovery", low:Math.round(noshowAnnual[0]), high:Math.round(noshowAnnual[1])},
      {label:"Ad spend trim", low:Math.round(adsAnnual[0]), high:Math.round(adsAnnual[1])}
    ].filter(x=>x.low>0||x.high>0);
    const maxVal=Math.max(...parts.map(p=>p.high),1);
    const rows=parts.map(p=>{
      const w1=Math.max(2,Math.round((p.low/maxVal)*100)), w2=Math.max(2,Math.round((p.high/maxVal)*100));
      return `<div class="row"><div class="lab">${p.label}</div><div class="bars"><div class="bar low" style="width:${w1}%"></div><div class="bar high" style="width:${w2}%"></div></div><div class="val">${fmt(p.low)} – ${fmt(p.high)}</div></div>`;
    }).join("");
    const breakdown = document.getElementById("breakdown");
    if(breakdown){ breakdown.innerHTML = rows || "<p class='muted'>Add more inputs to see a breakdown.</p>"; }
  }

  function init(){
    const calcBtn=document.getElementById("calc");
    if(calcBtn){ if(!calcBtn.getAttribute("type")) calcBtn.setAttribute("type","button"); calcBtn.addEventListener("click", estimateSavings); }
  }
  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();