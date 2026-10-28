'use strict';
const fs=require('fs');
const {chromium}=require('playwright');
const URL='https://grupo-lobo-empresas-servicos-previa-v1.onrender.com/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const out='visual-empresas-servicos';fs.mkdirSync(out,{recursive:true});
 let total=0;
 try{
 for(const screen of [{id:'mobile',width:390,height:844},{id:'desktop',width:1365,height:900}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},deviceScaleFactor:1,locale:'pt-BR'});
  const errors=[];page.on('pageerror',e=>errors.push('JS: '+e.message));
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:65000});
  if(!response||response.status()>=400)errors.push('HTTP '+(response?.status()??'none'));
  const htmlSize=await page.evaluate(()=>document.documentElement.outerHTML.length);
  console.log('DOCUMENTO '+screen.id+' '+JSON.stringify({http:response?.status(),url:page.url(),htmlSize,title:await page.title(),head:((await page.locator('body').innerText()).slice(0,500))}));
  await page.screenshot({path:out+'/'+screen.id+'-diagnostico.png',fullPage:false,timeout:10000}).catch(()=>{});
  await page.locator('.v5-portrait img').first().waitFor({state:'visible',timeout:10000});
  const h1=await page.locator('h1').first().innerText();
  if(!h1.includes('PRESENTES'))errors.push('Título errado: '+h1);
  if(await page.locator('.reward-photo').count()!==12)errors.push('Faltam fotos em cartões de prêmios');
  if(await page.locator('.reward-logo').count()<8)errors.push('Faltam logomarcas de produtos');
  await page.locator('img').evaluateAll(els=>els.forEach(i=>{i.loading='eager';i.decoding='sync'}));
  await page.waitForTimeout(6000);
  const photos=await page.locator('.reward-photo').evaluateAll(els=>els.map((x,i)=>({index:i,loaded:x.complete&&x.naturalWidth>=350,src:x.currentSrc,px:x.naturalWidth})));
  const logos=await page.locator('.reward-logo').evaluateAll(els=>els.map((x,i)=>({index:i,loaded:x.complete&&x.naturalWidth>0,src:x.currentSrc})));
  const hero=await page.locator('.v5-portrait>img').evaluate(x=>({loaded:x.complete&&x.naturalWidth>=750,px:x.naturalWidth}));
  const overflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth);
  if(overflow>24)errors.push('Overflow horizontal '+overflow+'px');
  if(!hero.loaded)errors.push('Foto principal não carregou em alta resolução');
  if(photos.filter(x=>!x.loaded).length)errors.push('Fotos não carregadas: '+JSON.stringify(photos.filter(x=>!x.loaded)));
  if(logos.filter(x=>!x.loaded).length)errors.push('Logos não carregadas: '+JSON.stringify(logos.filter(x=>!x.loaded)));
  for(const id of ['presentes','calcular','whatsapp','painel','alcance'])if(await page.locator('#'+id).count()!==1)errors.push('Seção ausente '+id);
  await page.screenshot({path:out+'/'+screen.id+'.png',fullPage:true,animations:'disabled',timeout:40000});
  const result={screen:screen.id,errors,hero,photos,logos,overflow};
  fs.writeFileSync(out+'/'+screen.id+'.json',JSON.stringify(result,null,2));
  console.log(screen.id+' '+(errors.length?'FALHOU':'PASSOU')+' '+JSON.stringify(result).slice(0,16000));
  if(errors.length)total++;
  await page.close();
 }
 }finally{await browser.close()}
 if(total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
