import {ElasticLattice2D,clamp} from './lattice.js';

const host=document.querySelector('main');
const physicsPanel=[...document.querySelectorAll('details.panel')][0];
const section=document.createElement('section');
section.className='panel v2-panel';
section.innerHTML=`<h2>V2 · Dynamic elastic lattice laboratory</h2>
<p>This view integrates the 2-D isotropic elastodynamic equations in time. Tap the material to launch an impulse, then observe traveling fronts, reflections, P/S separation and interface mode conversion. It remains an educational finite-difference model, not a validated FE solver.</p>
<div class="grid-controls">
<label>Impact<select id="latticeImpact"><option value="normal">Normal</option><option value="longitudinal">Longitudinal</option><option value="transverse">Transverse dipole</option></select></label>
<label>Strength <input id="impactStrength" type="range" min="0.2" max="2.5" step="0.1" value="1"></label>
<label>Field<select id="latticeField"><option value="magnitude">Displacement magnitude</option><option value="vol">Volumetric strain</option><option value="shear">Shear strain</option><option value="stress">Normal stress proxy</option></select></label>
<label>Boundary<select id="latticeBoundary"><option value="absorbing">Absorbing</option><option value="free">Free</option><option value="fixed">Fixed</option></select></label>
<label>Density<select id="latticeDensity"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></label>
<label>Damping <input id="latticeDamping" type="range" min="0" max="0.02" step="0.001" value="0.001"></label>
<label class="check"><input id="latticeInterface" type="checkbox"> Inclined interface</label>
<label>Interface angle <input id="interfaceAngle" type="range" min="-45" max="45" step="1" value="25"></label>
<label>Stiffness contrast <input id="interfaceContrast" type="range" min="1" max="3" step="0.1" value="1.8"></label>
</div>
<div class="transport"><button id="latticePlay" class="primary">Pause</button><button id="latticeStep">Single step</button><button id="latticeReset">Reset lattice</button></div>
<p id="latticeInfo"></p><p id="energyText"></p>
<canvas id="latticeCanvas" width="900" height="480" style="width:100%;height:min(52vw,430px);min-height:260px;border:1px solid #9aabb5;border-radius:10px;touch-action:none"></canvas>
<div class="legend-row"><b>Encoding:</b> particle displacement is shown geometrically with purple vectors; signed strain/stress uses blue–neutral–orange. The dashed line is the material interface.</div>
<details><summary>V2 equations and interpretation</summary><p>For isotropic plane strain, ρü=(λ+μ)∇(∇·u)+μ∇²u. The solver uses centered spatial differences and explicit time stepping. P speed is √((λ+2μ)/ρ); S speed is √(μ/ρ). At the inclined stiffness/density interface, the numerical field naturally produces reflected and transmitted components with mixed polarization. Grid dispersion, stair-stepped interfaces and imperfect absorbing boundaries are visible limitations.</p></details>`;
host.insertBefore(section,physicsPanel||null);

const $=id=>document.getElementById(id);
const canvas=$('latticeCanvas'),ctx=canvas.getContext('2d');
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
const e=sim.energy();$('energyText').textContent=`Kinetic ${e.kinetic.toFixed(2)} · strain ${e.potential.toFixed(2)} · total ${e.total.toFixed(2)}`}
function frame(now){const dt=Math.min(.025,(now-last)/1000);last=now;if(running){for(let i=0;i<3;i++)sim.step(dt*1.2)}draw();requestAnimationFrame(frame)}
canvas.addEventListener('pointerdown',ev=>{const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*(sim.nx-1),z=(ev.clientY-r.top)/r.height*(sim.nz-1);sim.impact(x,z,$('latticeImpact').value,+$('impactStrength').value)});
$('latticePlay').onclick=()=>{running=!running;$('latticePlay').textContent=running?'Pause':'Play'};
$('latticeStep').onclick=()=>{running=false;for(let i=0;i<4;i++)sim.step(.02);draw()};
$('latticeReset').onclick=rebuild;$('latticeField').onchange=e=>field=e.target.value;
for(const id of ['latticeDensity','latticeBoundary','latticeDamping','latticeInterface','interfaceAngle','interfaceContrast'])$(id).addEventListener('change',rebuild);
rebuild();requestAnimationFrame(frame);
