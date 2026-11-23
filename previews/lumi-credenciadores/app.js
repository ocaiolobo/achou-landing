(()=>{'use strict';
const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress=$('#reading-progress');
function updateScroll(){const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?100*scrollY/h:0)+'%';}
addEventListener('scroll',updateScroll,{passive:true});addEventListener('resize',updateScroll);updateScroll();
const menu=$('#mobileMenu'),nav=$('#mobileNavigation');
if(menu&&nav){menu.addEventListener('click',()=>{let expanded=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(expanded));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));}
if('IntersectionObserver' in window&&!prefersReduced){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}})},{threshold:.08,rootMargin:'0px 0px -12px 0px'});$$('.reveal').forEach(el=>io.observe(el));}else $$('.reveal').forEach(el=>el.classList.add('visible'));
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
function updateResults(row){if(!row)return;$$('.earnings-row').forEach(x=>{let active=x===row;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});
const volume=Number(row.dataset.volume),rate=Number(row.dataset.rate),first=volume*rate/100,recurring=volume*.04;
$('#firstMonthResult').textContent=brl(first);$('#selectedRate').textContent=rate+'%';$('#monthlyResult').innerHTML=brl(recurring)+' <span>/mês</span>';
const firstBar=$('.comp-first'), recurringBar=$('.comp-recurring');if(firstBar)firstBar.style.width='100%';if(recurringBar)recurringBar.style.width=Math.min(100,Math.round(recurring/first*100))+'%';
}
$$('.earnings-row').forEach(btn=>btn.addEventListener('click',()=>updateResults(btn)));updateResults($('.earnings-row.active'));
const scriptField=['Olá! Tudo bem? Aqui é da equipe de credenciamento LUMI Energia.','','A LUMI apresenta uma solução de economia de até 30% na conta de luz, sem obras nem taxa de adesão ao desconto.','','Eu posso conferir sua conta de luz e explicar como funciona. Se quiser aderir, envio a proposta e orientações para os documentos e assinatura digital. Você analisa tudo antes de assinar.'].join('\n');
async function copyText(value,button){const original=button.innerHTML;try{await navigator.clipboard.writeText(value);button.textContent='Copiado! ✓';}catch(err){let field=document.createElement('textarea');field.value=value;document.body.appendChild(field);field.select();try{document.execCommand('copy');button.textContent='Copiado! ✓';}catch(_){button.textContent='Não foi possível copiar';}field.remove();}setTimeout(()=>button.innerHTML=original,1800);}
const whats=$('#copyWhatsapp');if(whats){whats.addEventListener('click',()=>copyText($('#whatsappText').textContent.trim(),whats));}
const second=$('#copyWhatsappSecond');if(second){second.addEventListener('click',()=>copyText($('#whatsappTextSecond').textContent.trim(),second));}
const field=$('#copyField');if(field)field.addEventListener('click',()=>copyText(scriptField,field));
const dialog=$('#signupDialog');const signup=$('#openSignup');if(dialog&&signup){signup.addEventListener('click',()=>{if(dialog.showModal)dialog.showModal();else alert('Esta é uma prévia. O cadastro será conectado após aprovação.');});}
})();