export const TAU = Math.PI * 2;

export function displacement(type, p, t, cfg={}) {
  const A=cfg.amplitude??1, k=TAU/(cfg.wavelength??4), w=TAU*(cfg.frequency??1), q=k*p.x-w*t;
  const c=Math.cos(q), s=Math.sin(q), depth=Math.max(0,-p.z), decay=Math.exp(-0.85*k*depth);
  switch(type){
    case 'p': return {x:A*c,y:0,z:0,scalar:-A*k*s,field:'normal'};
    case 'sh': return {x:0,y:A*c,z:0,scalar:A*k*s,field:'shear'};
    case 'sv': return {x:0,y:0,z:A*c,scalar:A*k*s,field:'shear'};
    case 'rayleigh': return {x:-0.72*A*decay*s,y:0,z:A*decay*c,scalar:-A*k*decay*s,field:'normal'};
    case 'a0': { const z=p.z, wz=A*c, ux=0.45*A*k*z*s; return {x:ux,y:0,z:wz,scalar:-A*k*k*z*c,field:'normal'}; }
    case 's0': { const ux=A*c, uz=-0.22*A*k*p.z*s; return {x:ux,y:0,z:uz,scalar:-A*k*s,field:'normal'}; }
    default:return{x:0,y:0,z:0,scalar:0,field:'normal'};
  }
}
export function flexuralOmega(k,D=1,rho=1,h=1){return Math.sqrt(D/(rho*h))*k*k}
export function flexuralPhaseVelocity(k,D=1,rho=1,h=1){return flexuralOmega(k,D,rho,h)/k}
export function flexuralGroupVelocity(k,D=1,rho=1,h=1){return 2*flexuralPhaseVelocity(k,D,rho,h)}
export function nondispersiveOmega(k,c=1){return c*k}
