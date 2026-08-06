import {ElasticLattice2D,clamp} from './lattice.js';

const $=id=>document.getElementById(id);
const canvas=$('latticeCanvas'),ctx=canvas?.getContext('2d');
if(canvas&&ctx){
  let sim=new ElasticLattice2D(),running=true,field='magnitude',last=performance.now(),scale=1;
  const colors={neg:[0,114,178],zero:[245,245,245],pos:[213,94,0]};
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);canvas.width=Math.max(320,Math.floor(r.width*d));canvas.height=Math.max(220,Math.floor(r.height*d));scale=d}
  new ResizeObserver(resize).observe(canvas);resize();
  function rebuild(){const density=$('latticeDensity').value,n=density==='low'?[35,19]:density==='high'?[61,33]:[47,25];sim=new ElasticLattice2D({nx:n[0],nz:n[1],boundary:$('latticeBoundary').value,damping:+$('latticeDamping').value});sim.setInterface($('latticeInterface').checked,+$('interfaceAngle').value,+$('interfaceContrast').value);updateInfo()}
  function updateInfo(){const s=sim.speeds();$('latticeInfo').textContent=`Explicit isotropic lattice: cP≈${s.p.toFixed(2)} cells/s, cS≈${s.s.toFixed(2)} cells/s. ${sim.interfaceEnabled?'Inclined material interface enabled: reflected and converted P/S fronts can appear.':'Homogeneous medium.'}`}
  function mix(v,max){const q=clamp(v/max,-1,1),a=q<0?colors.neg:colors.zero,b=q<0?colors.zero:colors.pos,t=Math.abs(q);return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*t)).join(',')})`}
  function valueAt(x,z){const q=sim.i(x,z),u=Math.hypot(sim.ux[q],sim.uz[q]);if(field==='magnitude')return u;if(field==='vol')return sim.strain(x,z).vol;if(field==='shear')return sim.strain(x,z).gxz;if(field==='stress')return sim.stress(x,z).sxx;return u}
  function draw(){const W=canvas.width,H=canvas.height,cw=W/(sim.nx-1),ch=H/(sim.nz-1);ctx.clearRect(0,0,W,H);ctx.fillStyle='#e8eef2';ctx.fillRect(0,0,W,H);let max=1e-6;for(let z=1;z<sim.nz-1;z++)for(let x=1;x<sim.nx-1;x++)max=Math.max(max,Math.abs(valueAt(x,z)));max*=.75;
    for(let z=0;z<sim.nz;z++)for(let x=0;x<sim.nx;x++){const q=sim.i(x,z),v=valueAt(x,z),px=x*cw+sim.ux[q]*cw*2.2,py=z*ch+sim.uz[q]*ch*2.2;ctx.fillStyle=field==='magnitude'?`rgba(7,89,133,${clamp(Math.abs(v)/max,.08,1)})`:mix(v,max);ctx.beginPath();ctx.arc(px,py,Math.max(1.4,Math.min(cw,ch)*.16),0,Math.PI*2);ctx.fill();if((x+z)%7===0){ctx.strokeStyle='#5b21b6';ctx.lineWidth=1.2*scale;ctx.beginPath();ctx.moveTo(x*cw,z*ch);ctx.lineTo(px,py);ctx.stroke()}}
    if(sim.interfaceEnabled){const a=sim.interfaceAngle,cx=sim.nx*.56*cw,cz=sim.nz*.5*ch;ctx.strokeStyle='#111';ctx.setLineDash([8*scale,6*scale]);ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(0,cz-Math.tan(a)*cx);ctx.lineTo(W,cz+Math.tan(a)*(W-cx));ctx.stroke();ctx.setLineDash([])}
    const e=sim.energy();$('energyText').textContent=`Kinetic ${e.kinetic.toFixed(2)} · strain ${e.potential.toFixed(2)} · total ${e.total.toFixed(2)}`;
  }
  function frame(now){const dt=Math.min(.025,(now-last)/1000);last=now;if(running){const stable=.12;for(let i=0;i<3;i++)sim.step(Math.min(stable,dt*4));}draw();requestAnimationFrame(frame)}
  canvas.addEventListener('pointerdown',ev=>{const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*(sim.nx-1),z=(ev.clientY-r.top)/r.height*(sim.nz-1);sim.impact(x,z,$('latticeImpact').value,+$('impactStrength').value);});
  $('latticePlay').onclick=()=>{running=!running;$('latticePlay').textContent=running?'Pause':'Play'};
  $('latticeStep').onclick=()=>{running=false;for(let i=0;i<4;i++)sim.step(.02);draw()};
  $('latticeReset').onclick=()=>rebuild();
  $('latticeField').onchange=e=>field=e.target.value;
  for(const id of ['latticeDensity','latticeBoundary','latticeDamping','latticeInterface','interfaceAngle','interfaceContrast'])$(id).addEventListener('change',rebuild);
  rebuild();requestAnimationFrame(frame);
}
