(() => {
  const native=window.desktopCat;if(!native?.initial)return;
  window.desktopSurface=new URLSearchParams(location.search).get('surface')==='pet'?'pet':'house';
  document.documentElement.classList.add('native-'+window.desktopSurface);
  localStorage.setItem('deskcat-mvp-v1',JSON.stringify(native.initial.pet));
  window.desktopSnapshot=native.initial;
  window.DeskcatCompanion={create:()=>({open:()=>native.command('show-pet'),close:()=>{},isOpen:()=>window.desktopSnapshot.petVisible})};
  native.onState(s=>{window.desktopSnapshot=s;window.DeskcatController?.receive(s.pet);window.dispatchEvent(new CustomEvent('desktop-state',{detail:s}));});
  native.onAction(action=>{const c=window.DeskcatController;if(!c)return;if(action==='sleepNest')c.sleepAt('nest',true);else if(action==='sleepDesk')c.sleepAt('desk',true);else if(action==='wake')c.wake(true);else if(action==='leave-house')c.leave();else if(Object.hasOwn(window.DeskcatPet.actions,action))c.interact(action,true);});
})();
