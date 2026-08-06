import test from 'node:test';
import assert from 'node:assert/strict';
import {ElasticLattice2D,clamp} from '../lattice.js';

test('clamp limits both sides',()=>{assert.equal(clamp(-2,-1,1),-1);assert.equal(clamp(2,-1,1),1)});
test('P speed is greater than S speed for positive lambda',()=>{const s=new ElasticLattice2D().speeds();assert.ok(s.p>s.s);assert.ok(s.s>0)});
test('longitudinal impact initializes x velocity',()=>{const s=new ElasticLattice2D({nx:15,nz:11});s.impact(7,5,'longitudinal',1);const q=s.i(7,5);assert.ok(s.vx[q]>0);assert.equal(s.vz[q],0)});
test('normal impact initializes z velocity',()=>{const s=new ElasticLattice2D({nx:15,nz:11});s.impact(7,5,'normal',1);assert.ok(s.vz[s.i(7,5)]>0)});
test('interface changes lower material properties',()=>{const s=new ElasticLattice2D({nx:21,nz:15});s.setInterface(true,0,2);assert.ok(s.muField[s.i(10,13)]>s.muField[s.i(10,1)])});
test('solver produces finite energy after stepping',()=>{const s=new ElasticLattice2D({nx:21,nz:15});s.impact(10,7,'normal',.2);for(let i=0;i<8;i++)s.step(.01);const e=s.energy();assert.ok(Number.isFinite(e.total));assert.ok(e.total>0)});
test('fixed boundaries remain zero',()=>{const s=new ElasticLattice2D({nx:15,nz:11,boundary:'fixed'});s.vx[s.i(0,5)]=1;s.step(.01);assert.equal(s.vx[s.i(0,5)],0);assert.equal(s.ux[s.i(0,5)],0)});
