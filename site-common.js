/* 全ページ共通メニューとページ演出 */
(() => {
  const links=[['ホーム','index.html'],['キャラ紹介','character.html'],['ミニゲーム','game.html'],['お知らせ','news.html']];
  const button=document.createElement('button');button.className='site-menu-button';button.type='button';button.setAttribute('aria-label','メニューを開く');button.setAttribute('aria-expanded','false');button.innerHTML='<span></span>';
  const overlay=document.createElement('nav');overlay.className='site-menu-overlay';overlay.setAttribute('aria-label','サイトメニュー');
  const ul=document.createElement('ul');links.forEach(([label,href])=>{const li=document.createElement('li');const a=document.createElement('a');a.href=href;a.textContent=label;li.appendChild(a);ul.appendChild(li)});overlay.appendChild(ul);document.body.append(button,overlay);
  const close=()=>{overlay.classList.remove('is-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','メニューを開く')};
  button.addEventListener('click',()=>{const open=!overlay.classList.contains('is-open');overlay.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く')});
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});overlay.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  if(location.pathname.endsWith('/index.html')||location.pathname.endsWith('/')||location.pathname.endsWith('/-')){
    const gate=document.createElement('div');gate.className='entrance-overlay';gate.innerHTML='<div class="entrance-door left"></div><div class="entrance-door right"></div><div class="entrance-sign">準備中</div>';document.body.appendChild(gate);
    const start=()=>{gate.classList.add('ready');setTimeout(()=>{gate.classList.add('done');setTimeout(()=>gate.remove(),750)},1550)};
    if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
  }
  if(/^(hajime|meana|tatsuko)\.html$/.test(location.pathname.split('/').pop())){
    ['left','right'].forEach(side=>{const cloud=document.createElement('div');cloud.className='detail-cloud '+side;document.body.appendChild(cloud);requestAnimationFrame(()=>cloud.classList.add('animate'));setTimeout(()=>cloud.remove(),2400)});
  }
})();
