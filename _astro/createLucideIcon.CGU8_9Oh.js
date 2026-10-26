import{r as h}from"./index.-iFofLld.js";var v={exports:{}},k={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var R;function _(){if(R)return k;R=1;var e=Symbol.for("react.transitional.element"),t=Symbol.for("react.fragment");function r(o,n,s){var c=null;if(s!==void 0&&(c=""+s),n.key!==void 0&&(c=""+n.key),"key"in n){s={};for(var u in n)u!=="key"&&(s[u]=n[u])}else s=n;return n=s.ref,{$$typeof:e,type:o,key:c,ref:n!==void 0?n:null,props:s}}return k.Fragment=t,k.jsx=r,k.jsxs=r,k}var S;function $(){return S||(S=1,v.exports=_()),v.exports}var G=$();/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=e=>e?.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function y(e,t,r=[]){if(t==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:B(e),size:24,node:t,...r.length>0?{aliases:r}:{}}}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=e=>{let t="",r=!1;for(const o of e){if(o==="-"||o==="_"||o<=" "){r=t.length>0;continue}t.length===0?t+=o.toLowerCase():t+=r?o.toUpperCase():o,r=!1}return t};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=e=>{const t=I(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=(...e)=>e.filter((t,r,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function m(e){return e!=null}function q(e,t={}){const r=t.attributeNames??{},o=i=>r[i]??i,n=e.size??e.width??a.width,s=e.size??e.height??a.height,c=e.aliases?.filter(i=>typeof i=="string"&&i.trim()!=="").map(i=>`lucide-${i}`)??[],u=[...e.name?[`lucide-${e.name}`]:[],...c],l=t.className?.split(" ").filter(Boolean)??[],x=t.includeDefaultClasses===!1?N(...l):N("lucide",...u,...l),b=t.absoluteStrokeWidth?Number(t.strokeWidth??a["stroke-width"])*Number(e.size??e.width??a.width)/Number(t.size??t.width??a.width):t.strokeWidth??a["stroke-width"];return["svg",{...Object.entries(a).reduce((i,[d,f])=>(i[o(d)]=f,i),{}),..."color"in t&&t.color&&{[o("stroke")]:t.color},..."size"in t&&m(t.size)&&{[o("width")]:t.size,[o("height")]:t.size},..."width"in t&&m(t.width)&&{[o("width")]:t.width},..."height"in t&&m(t.height)&&{[o("height")]:t.height},[o("stroke-width")]:b,...x&&{[o("class")]:x},[o("viewBox")]:`0 0 ${n} ${s}`,...t.hasA11yProp===!1?{[o("aria-hidden")]:"true"}:{},..."attributes"in t&&t.attributes},e.node.map(i=>{const[d,f,w]=i,C=t.nonScalingStroke?{[o("vector-effect")]:"non-scaling-stroke",...f}:f;return w?[d,C,w]:[d,C]})]}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function J(e,t={}){return q(e,{...t,attributeNames:{...t.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1},D=h.createContext({}),M=()=>h.useContext(D),U=h.forwardRef(({color:e,size:t,width:r,height:o,strokeWidth:n,absoluteStrokeWidth:s,nonScalingStroke:c,className:u="",children:l,iconNode:x=[],icon:b={node:x,aliases:[],size:24},...g},i)=>{const{size:d=24,strokeWidth:f=2,absoluteStrokeWidth:w=!1,nonScalingStroke:C=!1,color:A="currentColor",className:E=""}=M()??{},W=!!l||F(g),[z,j,p=[]]=J(b,{color:e??A,width:r??t??d,height:o??t??d,strokeWidth:n??f,absoluteStrokeWidth:s??w,nonScalingStroke:c??C,className:N(E,u),hasA11yProp:W,attributes:g});return h.createElement(z,{ref:i,...j},[...p.map(([L,P])=>h.createElement(L,P)),...Array.isArray(l)?l:[l]])});/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function H(e,t=[],r=[]){const o=typeof e=="string"?y(e,t,r):e,n=h.forwardRef(({className:s,...c},u)=>h.createElement(U,{ref:u,icon:o,className:s,...c}));return o.name&&(n.displayName=T(o.name)),n}export{H as c,G as j};
