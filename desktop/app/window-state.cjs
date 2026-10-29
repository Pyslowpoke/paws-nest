'use strict';
function fit(bounds, displays) {
  const b={width:360,height:470,...bounds};
  const center={x:b.x+b.width/2,y:b.y+b.height/2};
  const areas=displays.map(d=>d.workArea||d);
  const a=areas.reduce((best,a)=>{
    const distance=Math.hypot(center.x-Math.max(a.x,Math.min(a.x+a.width,center.x)),center.y-Math.max(a.y,Math.min(a.y+a.height,center.y)));
    return !best||distance<best.distance?{a,distance}:best;
  },null).a;
  return {x:Math.round(Math.max(a.x,Math.min(a.x+a.width-b.width,b.x))),y:Math.round(Math.max(a.y,Math.min(a.y+a.height-b.height,b.y))),width:b.width,height:b.height};
}
module.exports={fit};
