'use strict';
const fs=require('fs');
const {chromium}=require('playwright');
const URL='https://grupo-lobo-empresas-servicos-v3.onrender.com/v4.html?visual_probe=v4';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const out='visual-empresas-servicos';fs.mkdirSync(out,{recursive:true});
 let total=0;
 try{
 for(const screen of [{id:'mobile',width:390,height:844},{id:'desktop',width:1365,height:900}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},deviceScaleFactor:1,locale:'pt-BR'});
  const errors=[];page.on('pageerror',e=>errors.push('JS: '+e.message));
  const uniqueUrl=URL+'&viewport='+screen.id+'&revision=c12dc93a';
  const response=await page.goto(uniqueUrl,{waitUntil:'domcontentloaded',timeout:65000});
  if(!response||response.status()>=400)errors.push('HTTP '+(response?.status()??'none'));
  const htmlSize=await page.evaluate(()=>document.documentElement.outerHTML.length);
  console.log('DOCUMENTO '+screen.id+' '+JSON.stringify({http:response?.status(),url:page.url(),htmlSize,title:await page.title(),head:((await page.locator('body').innerText()).slice(0,500))}));
  await page.screenshot({path:out+'/'+screen.id+'-diagnostico.png',fullPage:false,timeout:10000}).catch(()=>{});
  await page.locator('.v5-portrait img').first().waitFor({state:'visible',timeout:10000});
  const h1=await page.locator('h1').first().innerText();
  if(!h1.includes('PRESENTES'))errors.push('Título errado: '+h1);
  if((await page.locator('body').innerText()).includes('Imagem da marca')===false&&await page.locator('.camarote-card').count()!==8)errors.push('Conteúdo V4 em cache, 8 camarotes não encontrados');
  if(await page.locator('.reward-photo').count()!==10)errors.push('Faltam fotos em cartões de prêmios');
  if(await page.locator('.reward-logo').count()<6)errors.push('Faltam logomarcas de produtos');
  const heroText=(await page.locator('body').innerText());
  for(const label of ['Camisas Bahia e Vitória','Carolina Herrera','Natura','Mary Kay','Óticas Ernesto','Ótica Salvador'])
    if(!heroText.includes(label))errors.push('Ausente: '+label);
  if(heroText.toLowerCase().includes('não constitui promessa'))errors.push('Texto comercial proibido permaneceu');
  if(await page.locator('.camarote-card').count()!==8)errors.push('A grade não tem 8 camarotes em cartões iguais');
  if(await page.locator('.reward-body h3').filter({hasText:'Ingressos para o Carnaval'}).count()!==0)errors.push('Camarote destacado continua no catálogo');
  const ratio=await page.locator('.camarote-card').evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().width/el.getBoundingClientRect().height*100)/100));
  if(ratio.some(v=>Math.abs(v-1)>.08))errors.push('Camarotes sem cards quadrados: '+JSON.stringify(ratio));
  if(await page.locator('.brand-four .brand-square').count()!==4)errors.push('Perfumes não têm quatro marcas iguais');
  const equalBrands=await page.locator('.perfume-media .brand-square').evaluateAll(els=>els.map(x=>({w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})));
  if(equalBrands.length!==4||equalBrands.some(x=>Math.abs(x.w-equalBrands[0].w)>3||Math.abs(x.h-equalBrands[0].h)>3))errors.push('Marcas de perfume sem destaque igualitário: '+JSON.stringify(equalBrands));
  if(await page.locator('.brand-two .brand-square').count()!==2)errors.push('Óticas não têm duas marcas equivalentes');
  if(await page.locator('.team-photo-right').count()!==1)errors.push('Imagem de camisa do Vitória não encontrada');
  if(await page.locator('.strip,.benefits').count()>0)errors.push('Bloco repetido após a capa');
  const wa=await page.locator('#whatsapp .chat-head').first().evaluate(el=>getComputedStyle(el).backgroundColor);
  if(!['rgb(7, 94, 78)','rgb(7, 94, 79)'].includes(wa))errors.push('WhatsApp sem cabeçalho verde: '+wa);
  const headerText=await page.locator('.header .brand').first().innerText();
  if(!headerText.includes('Clube'))errors.push('Cabeçalho não segue marca Clube VIP da referência');
  await page.locator('img').evaluateAll(els=>els.forEach(i=>{i.loading='eager';i.decoding='sync'}));
  await page.waitForTimeout(6000);
  const photos=await page.locator('.reward-photo').evaluateAll(els=>els.map((x,i)=>({index:i,loaded:x.complete&&x.naturalWidth>=350,src:x.currentSrc,px:x.naturalWidth})));
  const logos=await page.locator('.reward-logo').evaluateAll(els=>els.map((x,i)=>({index:i,loaded:x.complete&&x.naturalWidth>0,src:x.currentSrc})));
  const brands=await page.locator('.brand-square img,.team-photo-right,.camarote-card img').evaluateAll(els=>els.map((x,i)=>({index:i,loaded:x.complete&&x.naturalWidth>0,src:x.currentSrc})));
  if(brands.some(x=>!x.loaded))errors.push('Imagens V4 indisponíveis: '+JSON.stringify(brands.filter(x=>!x.loaded)));

  const hero=await page.locator('.v5-portrait>img').evaluate(x=>({loaded:x.complete&&x.naturalWidth>=750,px:x.naturalWidth}));
  const overflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-document.documentElement.clientWidth);
  if(overflow>24)errors.push('Overflow horizontal '+overflow+'px');
  if(!hero.loaded)errors.push('Foto principal não carregou em alta resolução');
  if(photos.filter(x=>!x.loaded).length)errors.push('Fotos não carregadas: '+JSON.stringify(photos.filter(x=>!x.loaded)));
  if(logos.filter(x=>!x.loaded).length)errors.push('Logos não carregadas: '+JSON.stringify(logos.filter(x=>!x.loaded)));
  for(const id of ['presentes','calcular','whatsapp','painel','alcance'])if(await page.locator('#'+id).count()!==1)errors.push('Seção ausente '+id);
  const range=page.locator('#range');
  await range.evaluate(el=>{el.value='20000';el.dispatchEvent(new Event('input',{bubbles:true}))});
  if(!(await page.locator('#creditos').innerText()).includes('6.000'))errors.push('Simulador de 30% não recalculou R$ 20 mil');
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  for(const kind of ['before','after']){
   await page.locator('[data-copy="msg-'+kind+'"]').click();
   await page.waitForTimeout(130);
   const copied=await page.evaluate(()=>navigator.clipboard.readText()).catch(e=>'CLIPBOARD_ERROR: '+e.message);
   if(copied.length<100||copied.includes('CLIPBOARD_ERROR'))errors.push('Botão WhatsApp '+kind+' não copiou mensagem: '+copied.slice(0,90));
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(150);
  await page.screenshot({path:out+'/'+screen.id+'.png',fullPage:true,animations:'disabled',timeout:40000});
  const result={screen:screen.id,errors,hero,photos,logos,brands,overflow};
  fs.writeFileSync(out+'/'+screen.id+'.json',JSON.stringify(result,null,2));
  console.log(screen.id+' '+(errors.length?'FALHOU':'PASSOU')+' '+JSON.stringify(result).slice(0,16000));
  if(errors.length)total++;
  await page.close();
 }
 }finally{await browser.close()}
 if(total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
