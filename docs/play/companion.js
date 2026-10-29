(function(){
  'use strict';
  function clampPosition(x,y,width,height,viewportWidth,viewportHeight){
    const margin=8;
    return {x:Math.max(margin,Math.min(Math.max(margin,viewportWidth-width-margin),x)),y:Math.max(margin,Math.min(Math.max(margin,viewportHeight-height-margin),y))};
  }
  function create(){
    const panel=document.getElementById('companionDock'),handle=document.getElementById('companionHandle'),canvas=document.getElementById('companionCanvas'),restore=document.getElementById('companionRestore'),cat=document.getElementById('catButton');
    const marker=document.createComment('cat-home');cat.before(marker);
    let mounted=false,drag=null,position=null;
    try{const p=JSON.parse(localStorage.getItem('deskcat-dock-v1'));if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))position=p;}catch{}
    function savePosition(){try{localStorage.setItem('deskcat-dock-v1',JSON.stringify(position));}catch{}}
    function move(x,y){const r=panel.getBoundingClientRect();position=clampPosition(x,y,r.width,r.height,innerWidth,innerHeight);panel.style.left=position.x+'px';panel.style.top=position.y+'px';}
    function open(){mounted=true;document.body.classList.add('companion-active');canvas.append(cat);panel.hidden=false;restore.hidden=true;move(position?.x??innerWidth-240,position?.y??innerHeight-370);handle.focus();}
    function close(returnFocus=false){if(!mounted)return;mounted=false;marker.after(cat);panel.hidden=true;restore.hidden=true;document.body.classList.remove('companion-active');drag=null;if(returnFocus)document.getElementById('companionLaunch').focus();}
    handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:r.left,y:r.top};handle.setPointerCapture(e.pointerId);e.preventDefault();});
    handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;move(drag.x+e.clientX-drag.startX,drag.y+e.clientY-drag.startY);});
    function endDrag(e){if(drag&&drag.id===e.pointerId){drag=null;savePosition();}}
    handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);
    handle.addEventListener('keydown',e=>{const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},d=directions[e.key];if(!d)return;e.preventDefault();const r=panel.getBoundingClientRect(),step=e.shiftKey?30:10;move(r.left+d[0]*step,r.top+d[1]*step);savePosition();});
    document.getElementById('companionHide').addEventListener('click',()=>{panel.hidden=true;restore.hidden=false;restore.focus();});
    restore.addEventListener('click',()=>{panel.hidden=false;restore.hidden=true;move(position?.x??8,position?.y??8);handle.focus();});
    document.getElementById('companionReturn').addEventListener('click',()=>close(true));
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    window.addEventListener('resize',()=>{if(mounted&&!panel.hidden)move(position?.x??8,position?.y??8);});
    return {open,close,isOpen:()=>mounted};
  }
  const api={create,clampPosition};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.DeskcatCompanion=api;
})();
