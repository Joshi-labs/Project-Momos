import{c as f,j as b}from"./createLucideIcon.yNpIB8_5.js";import{R as j,r as w}from"./index.CHQCpkZ9.js";/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D={name:"clock",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]};D.node;const T=f(D);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _={name:"gift",size:24,node:[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8",key:"1sqzm4"}],["path",{d:"M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5",key:"kc0143"}],["rect",{x:"3",y:"7",width:"18",height:"4",rx:"1",key:"1hberx"}]]};_.node;const U=f(_);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C={name:"loader-circle",size:24,node:[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],aliases:["loader-2"]};C.node;const A=f(C);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I={name:"refresh-cw",size:24,node:[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]};I.node;const G=f(I),u=new Map;function q({src:o,alt:z,className:L=""}){const[y,l]=w.useState(()=>u.get(o)||null);return w.useEffect(()=>{if(!o)return;if(u.has(o)){l(u.get(o));return}const c=new Image;c.crossOrigin="anonymous",c.src=o,c.onload=()=>{try{const d=document.createElement("canvas"),a=c.naturalWidth||c.width||512,m=c.naturalHeight||c.height||512;d.width=a,d.height=m;const g=d.getContext("2d");if(!g)return;g.drawImage(c,0,0);const k=g.getImageData(0,0,a,m),i=k.data,e=new Uint8Array(a*m),s=[],r=t=>i[t]>235&&i[t+1]>235&&i[t+2]>235;for(let t=0;t<a;t++){r(t*4)&&(s.push(t),e[t]=1);const n=(m-1)*a+t;r(n*4)&&(s.push(n),e[n]=1)}for(let t=0;t<m;t++){const n=t*a;!e[n]&&r(n*4)&&(s.push(n),e[n]=1);const h=t*a+(a-1);!e[h]&&r(h*4)&&(s.push(h),e[h]=1)}let M=0;for(;M<s.length;){const t=s[M++],n=t%a,h=Math.floor(t/a),p=t*4,R=i[p],$=i[p+1],E=i[p+2],x=Math.min(R,$,E);x>248?i[p+3]=0:i[p+3]=Math.round((248-x)/13*255),n>0&&!e[t-1]&&r((t-1)*4)&&(e[t-1]=1,s.push(t-1)),n<a-1&&!e[t+1]&&r((t+1)*4)&&(e[t+1]=1,s.push(t+1)),h>0&&!e[t-a]&&r((t-a)*4)&&(e[t-a]=1,s.push(t-a)),h<m-1&&!e[t+a]&&r((t+a)*4)&&(e[t+a]=1,s.push(t+a))}g.putImageData(k,0,0);const v=d.toDataURL("image/png");u.set(o,v),l(v)}catch(d){console.error("Error removing background from image:",d),l(o)}},c.onerror=()=>{l(o)}},[o]),b.jsx("img",{src:y||o,alt:z,className:`${L} transition-opacity duration-150 ${y?"opacity-100":"opacity-0"}`})}const W=j.memo(q);export{T as C,U as G,A as L,G as R,W as T};
