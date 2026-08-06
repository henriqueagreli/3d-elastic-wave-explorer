export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export class ElasticLattice2D {
  constructor({nx=45,nz=25,dx=1,rho=1,lambda=2.2,mu=1,damping=0.001,boundary='absorbing'}={}){
    Object.assign(this,{nx,nz,dx,rho,lambda,mu,damping,boundary});
    this.n=nx*nz;
    this.ux=new Float32Array(this.n); this.uz=new Float32Array(this.n);
    this.vx=new Float32Array(this.n); this.vz=new Float32Array(this.n);
    this.ax=new Float32Array(this.n); this.az=new Float32Array(this.n);
    this.lambdaField=new Float32Array(this.n); this.muField=new Float32Array(this.n); this.rhoField=new Float32Array(this.n);
    this.lambdaField.fill(lambda); this.muField.fill(mu); this.rhoField.fill(rho);
    this.interfaceAngle=0; this.interfaceEnabled=false;
  }
  i(x,z){return z*this.nx+x}
  reset(){for(const a of [this.ux,this.uz,this.vx,this.vz,this.ax,this.az])a.fill(0)}
  setInterface(enabled,angleDeg=25,contrast=1.8){
    this.interfaceEnabled=enabled; this.interfaceAngle=angleDeg*Math.PI/180;
    const cx=this.nx*.56,cz=this.nz*.5,t=Math.tan(this.interfaceAngle);
    for(let z=0;z<this.nz;z++)for(let x=0;x<this.nx;x++){
      const q=this.i(x,z),lower=z>cz+t*(x-cx),m=enabled&&lower?contrast:1;
      this.lambdaField[q]=this.lambda*m; this.muField[q]=this.mu*m; this.rhoField[q]=this.rho*(enabled&&lower?1.15:1);
    }
  }
  impact(x,z,kind='normal',strength=1,width=2.2){
    for(let j=0;j<this.nz;j++)for(let i=0;i<this.nx;i++){
      const r2=(i-x)**2+(j-z)**2,w=Math.exp(-r2/(2*width*width))*strength,q=this.i(i,j);
      if(kind==='longitudinal')this.vx[q]+=w;
      else if(kind==='transverse')this.vz[q]+=w*Math.sign(j-z||1);
      else this.vz[q]+=w;
    }
  }
  deriv(a,x,z,axis){
    const xm=Math.max(0,x-1),xp=Math.min(this.nx-1,x+1),zm=Math.max(0,z-1),zp=Math.min(this.nz-1,z+1);
    return axis==='x'?(a[this.i(xp,z)]-a[this.i(xm,z)])/(Math.max(1,xp-xm)*this.dx):(a[this.i(x,zp)]-a[this.i(x,zm)])/(Math.max(1,zp-zm)*this.dx);
  }
  step(dt){
    const {nx,nz,dx}=this,inv=1/(dx*dx);
    for(let z=1;z<nz-1;z++)for(let x=1;x<nx-1;x++){
      const q=this.i(x,z),l=this.lambdaField[q],m=this.muField[q],r=this.rhoField[q];
      const uxx=(this.ux[this.i(x+1,z)]-2*this.ux[q]+this.ux[this.i(x-1,z)])*inv;
      const uzz=(this.ux[this.i(x,z+1)]-2*this.ux[q]+this.ux[this.i(x,z-1)])*inv;
      const wxx=(this.uz[this.i(x+1,z)]-2*this.uz[q]+this.uz[this.i(x-1,z)])*inv;
      const wzz=(this.uz[this.i(x,z+1)]-2*this.uz[q]+this.uz[this.i(x,z-1)])*inv;
      const uxz=(this.uz[this.i(x+1,z+1)]-this.uz[this.i(x+1,z-1)]-this.uz[this.i(x-1,z+1)]+this.uz[this.i(x-1,z-1)])*.25*inv;
      const wzx=(this.ux[this.i(x+1,z+1)]-this.ux[this.i(x+1,z-1)]-this.ux[this.i(x-1,z+1)]+this.ux[this.i(x-1,z-1)])*.25*inv;
      this.ax[q]=((l+2*m)*uxx+m*uzz+(l+m)*uxz)/r;
      this.az[q]=(m*wxx+(l+2*m)*wzz+(l+m)*wzx)/r;
    }
    for(let q=0;q<this.n;q++){
      this.vx[q]=(this.vx[q]+this.ax[q]*dt)*(1-this.damping); this.vz[q]=(this.vz[q]+this.az[q]*dt)*(1-this.damping);
      this.ux[q]+=this.vx[q]*dt; this.uz[q]+=this.vz[q]*dt;
    }
    this.applyBoundary();
  }
  applyBoundary(){
    const edge=(x,z)=>this.i(x,z),fixed=this.boundary==='fixed',abs=this.boundary==='absorbing';
    for(let x=0;x<this.nx;x++)for(const z of [0,this.nz-1]){const q=edge(x,z);if(fixed)this.ux[q]=this.uz[q]=this.vx[q]=this.vz[q]=0;else if(abs){this.vx[q]*=.72;this.vz[q]*=.72}}
    for(let z=0;z<this.nz;z++)for(const x of [0,this.nx-1]){const q=edge(x,z);if(fixed)this.ux[q]=this.uz[q]=this.vx[q]=this.vz[q]=0;else if(abs){this.vx[q]*=.72;this.vz[q]*=.72}}
  }
  strain(x,z){
    const exx=this.deriv(this.ux,x,z,'x'),ezz=this.deriv(this.uz,x,z,'z');
    const gxz=this.deriv(this.ux,x,z,'z')+this.deriv(this.uz,x,z,'x');
    return {exx,ezz,gxz,vol:exx+ezz};
  }
  stress(x,z){const q=this.i(x,z),{exx,ezz,gxz}=this.strain(x,z),l=this.lambdaField[q],m=this.muField[q];return {sxx:l*(exx+ezz)+2*m*exx,szz:l*(exx+ezz)+2*m*ezz,sxz:m*gxz}}
  energy(){let k=0,p=0;for(let z=1;z<this.nz-1;z++)for(let x=1;x<this.nx-1;x++){const q=this.i(x,z),r=this.rhoField[q],s=this.strain(x,z),l=this.lambdaField[q],m=this.muField[q];k+=.5*r*(this.vx[q]**2+this.vz[q]**2);p+=.5*l*s.vol*s.vol+m*(s.exx*s.exx+s.ezz*s.ezz)+.5*m*s.gxz*s.gxz}return {kinetic:k,potential:p,total:k+p}}
  speeds(){return {p:Math.sqrt((this.lambda+2*this.mu)/this.rho),s:Math.sqrt(this.mu/this.rho)}}
}
