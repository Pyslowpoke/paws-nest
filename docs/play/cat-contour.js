(function(){
  'use strict';
  function createDeformer(source){
    const tokens=source.match(/[MCLZ]|-?\d+(?:\.\d+)?/gi);
    if(!tokens||tokens.some(t=>/^[a-z]$/i.test(t)&&!['M','C','L','Z'].includes(t)))throw new Error('Unsupported contour');
    return function(headAngle=0,headY=0,earAngle=0){
      const result=[];
      for(let i=0;i<tokens.length;){
        if(/^[MCLZ]$/i.test(tokens[i])){result.push(tokens[i++]);continue;}
        let x=Number(tokens[i++]),y=Number(tokens[i++]);
        if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid contour point');
        const ew=x<83?Math.max(0,Math.min(1,(135-y)/45)):0;
        const ea=earAngle*ew*Math.PI/180,ex=x-55,ey=y-126;
        x=55+ex*Math.cos(ea)-ey*Math.sin(ea);y=126+ex*Math.sin(ea)+ey*Math.cos(ea);
        const weight=Math.max(0,Math.min(1,(220-y)/25)),angle=headAngle*weight*Math.PI/180,dx=x-95,dy=y-197;
        result.push((95+dx*Math.cos(angle)-dy*Math.sin(angle)).toFixed(3),(197+dx*Math.sin(angle)+dy*Math.cos(angle)+headY*weight).toFixed(3));
      }
      return result.join(' ');
    };
  }
  const api={createDeformer};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.CatContour=api;
})();
