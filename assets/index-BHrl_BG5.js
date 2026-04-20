(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const he=globalThis,Ce=he.ShadowRoot&&(he.ShadyCSS===void 0||he.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ee=Symbol(),Ve=new WeakMap;let ct=class{constructor(e,a,s){if(this._$cssResult$=!0,s!==Ee)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=a}get styleSheet(){let e=this.o;const a=this.t;if(Ce&&e===void 0){const s=a!==void 0&&a.length===1;s&&(e=Ve.get(a)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Ve.set(a,e))}return e}toString(){return this.cssText}};const gt=t=>new ct(typeof t=="string"?t:t+"",void 0,Ee),$=(t,...e)=>{const a=t.length===1?t[0]:e.reduce((s,r,i)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+t[i+1],t[0]);return new ct(a,t,Ee)},ft=(t,e)=>{if(Ce)t.adoptedStyleSheets=e.map(a=>a instanceof CSSStyleSheet?a:a.styleSheet);else for(const a of e){const s=document.createElement("style"),r=he.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=a.cssText,t.appendChild(s)}},He=Ce?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let a="";for(const s of e.cssRules)a+=s.cssText;return gt(a)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:bt,defineProperty:yt,getOwnPropertyDescriptor:$t,getOwnPropertyNames:wt,getOwnPropertySymbols:xt,getPrototypeOf:_t}=Object,be=globalThis,qe=be.trustedTypes,At=qe?qe.emptyScript:"",kt=be.reactiveElementPolyfillSupport,te=(t,e)=>t,me={toAttribute(t,e){switch(e){case Boolean:t=t?At:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let a=t;switch(e){case Boolean:a=t!==null;break;case Number:a=t===null?null:Number(t);break;case Object:case Array:try{a=JSON.parse(t)}catch{a=null}}return a}},Pe=(t,e)=>!bt(t,e),We={attribute:!0,type:String,converter:me,reflect:!1,useDefault:!1,hasChanged:Pe};Symbol.metadata??=Symbol("metadata"),be.litPropertyMetadata??=new WeakMap;let W=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,a=We){if(a.state&&(a.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((a=Object.create(a)).wrapped=!0),this.elementProperties.set(e,a),!a.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(e,s,a);r!==void 0&&yt(this.prototype,e,r)}}static getPropertyDescriptor(e,a,s){const{get:r,set:i}=$t(this.prototype,e)??{get(){return this[a]},set(n){this[a]=n}};return{get:r,set(n){const c=r?.call(this);i?.call(this,n),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??We}static _$Ei(){if(this.hasOwnProperty(te("elementProperties")))return;const e=_t(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(te("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(te("properties"))){const a=this.properties,s=[...wt(a),...xt(a)];for(const r of s)this.createProperty(r,a[r])}const e=this[Symbol.metadata];if(e!==null){const a=litPropertyMetadata.get(e);if(a!==void 0)for(const[s,r]of a)this.elementProperties.set(s,r)}this._$Eh=new Map;for(const[a,s]of this.elementProperties){const r=this._$Eu(a,s);r!==void 0&&this._$Eh.set(r,a)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const a=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const r of s)a.unshift(He(r))}else e!==void 0&&a.push(He(e));return a}static _$Eu(e,a){const s=a.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,a=this.constructor.elementProperties;for(const s of a.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ft(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,a,s){this._$AK(e,s)}_$ET(e,a){const s=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,s);if(r!==void 0&&s.reflect===!0){const i=(s.converter?.toAttribute!==void 0?s.converter:me).toAttribute(a,s.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,a){const s=this.constructor,r=s._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const i=s.getPropertyOptions(r),n=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:me;this._$Em=r;const c=n.fromAttribute(a,i.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(e,a,s,r=!1,i){if(e!==void 0){const n=this.constructor;if(r===!1&&(i=this[e]),s??=n.getPropertyOptions(e),!((s.hasChanged??Pe)(i,a)||s.useDefault&&s.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,s))))return;this.C(e,a,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,a,{useDefault:s,reflect:r,wrapped:i},n){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??a??this[e]),i!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(a=void 0),this._$AL.set(e,a)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(a){Promise.reject(a)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[r,i]of this._$Ep)this[r]=i;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[r,i]of s){const{wrapped:n}=i,c=this[r];n!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,i,c)}}let e=!1;const a=this._$AL;try{e=this.shouldUpdate(a),e?(this.willUpdate(a),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(a)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(a)}willUpdate(e){}_$AE(e){this._$EO?.forEach(a=>a.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(a=>this._$ET(a,this[a])),this._$EM()}updated(e){}firstUpdated(e){}};W.elementStyles=[],W.shadowRootOptions={mode:"open"},W[te("elementProperties")]=new Map,W[te("finalized")]=new Map,kt?.({ReactiveElement:W}),(be.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Oe=globalThis,Je=t=>t,ge=Oe.trustedTypes,Ke=ge?ge.createPolicy("lit-html",{createHTML:t=>t}):void 0,dt="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+M,St=`<${lt}>`,j=document,re=()=>j.createComment(""),se=t=>t===null||typeof t!="object"&&typeof t!="function",Me=Array.isArray,It=t=>Me(t)||typeof t?.[Symbol.iterator]=="function",_e=`[ 	
\f\r]`,ee=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Ge=/>/g,T=RegExp(`>|${_e}(?:([^\\s"'>=/]+)(${_e}*=${_e}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ye=/'/g,Ze=/"/g,pt=/^(?:script|style|textarea|title)$/i,ut=t=>(e,...a)=>({_$litType$:t,strings:e,values:a}),o=ut(1),H=ut(2),K=Symbol.for("lit-noChange"),y=Symbol.for("lit-nothing"),Xe=new WeakMap,z=j.createTreeWalker(j,129);function ht(t,e){if(!Me(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ke!==void 0?Ke.createHTML(e):e}const Ct=(t,e)=>{const a=t.length-1,s=[];let r,i=e===2?"<svg>":e===3?"<math>":"",n=ee;for(let c=0;c<a;c++){const d=t[c];let h,g,p=-1,A=0;for(;A<d.length&&(n.lastIndex=A,g=n.exec(d),g!==null);)A=n.lastIndex,n===ee?g[1]==="!--"?n=Fe:g[1]!==void 0?n=Ge:g[2]!==void 0?(pt.test(g[2])&&(r=RegExp("</"+g[2],"g")),n=T):g[3]!==void 0&&(n=T):n===T?g[0]===">"?(n=r??ee,p=-1):g[1]===void 0?p=-2:(p=n.lastIndex-g[2].length,h=g[1],n=g[3]===void 0?T:g[3]==='"'?Ze:Ye):n===Ze||n===Ye?n=T:n===Fe||n===Ge?n=ee:(n=T,r=void 0);const u=n===T&&t[c+1].startsWith("/>")?" ":"";i+=n===ee?d+St:p>=0?(s.push(h),d.slice(0,p)+dt+d.slice(p)+M+u):d+M+(p===-2?c:u)}return[ht(t,i+(t[a]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class ie{constructor({strings:e,_$litType$:a},s){let r;this.parts=[];let i=0,n=0;const c=e.length-1,d=this.parts,[h,g]=Ct(e,a);if(this.el=ie.createElement(h,s),z.currentNode=this.el.content,a===2||a===3){const p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(r=z.nextNode())!==null&&d.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(const p of r.getAttributeNames())if(p.endsWith(dt)){const A=g[n++],u=r.getAttribute(p).split(M),m=/([.?@])?(.*)/.exec(A);d.push({type:1,index:i,name:m[2],strings:u,ctor:m[1]==="."?Pt:m[1]==="?"?Ot:m[1]==="@"?Mt:ye}),r.removeAttribute(p)}else p.startsWith(M)&&(d.push({type:6,index:i}),r.removeAttribute(p));if(pt.test(r.tagName)){const p=r.textContent.split(M),A=p.length-1;if(A>0){r.textContent=ge?ge.emptyScript:"";for(let u=0;u<A;u++)r.append(p[u],re()),z.nextNode(),d.push({type:2,index:++i});r.append(p[A],re())}}}else if(r.nodeType===8)if(r.data===lt)d.push({type:2,index:i});else{let p=-1;for(;(p=r.data.indexOf(M,p+1))!==-1;)d.push({type:7,index:i}),p+=M.length-1}i++}}static createElement(e,a){const s=j.createElement("template");return s.innerHTML=e,s}}function F(t,e,a=t,s){if(e===K)return e;let r=s!==void 0?a._$Co?.[s]:a._$Cl;const i=se(e)?void 0:e._$litDirective$;return r?.constructor!==i&&(r?._$AO?.(!1),i===void 0?r=void 0:(r=new i(t),r._$AT(t,a,s)),s!==void 0?(a._$Co??=[])[s]=r:a._$Cl=r),r!==void 0&&(e=F(t,r._$AS(t,e.values),r,s)),e}class Et{constructor(e,a){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=a}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:a},parts:s}=this._$AD,r=(e?.creationScope??j).importNode(a,!0);z.currentNode=r;let i=z.nextNode(),n=0,c=0,d=s[0];for(;d!==void 0;){if(n===d.index){let h;d.type===2?h=new de(i,i.nextSibling,this,e):d.type===1?h=new d.ctor(i,d.name,d.strings,this,e):d.type===6&&(h=new Dt(i,this,e)),this._$AV.push(h),d=s[++c]}n!==d?.index&&(i=z.nextNode(),n++)}return z.currentNode=j,r}p(e){let a=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,a),a+=s.strings.length-2):s._$AI(e[a])),a++}}class de{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,a,s,r){this.type=2,this._$AH=y,this._$AN=void 0,this._$AA=e,this._$AB=a,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const a=this._$AM;return a!==void 0&&e?.nodeType===11&&(e=a.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,a=this){e=F(this,e,a),se(e)?e===y||e==null||e===""?(this._$AH!==y&&this._$AR(),this._$AH=y):e!==this._$AH&&e!==K&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):It(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==y&&se(this._$AH)?this._$AA.nextSibling.data=e:this.T(j.createTextNode(e)),this._$AH=e}$(e){const{values:a,_$litType$:s}=e,r=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=ie.createElement(ht(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(a);else{const i=new Et(r,this),n=i.u(this.options);i.p(a),this.T(n),this._$AH=i}}_$AC(e){let a=Xe.get(e.strings);return a===void 0&&Xe.set(e.strings,a=new ie(e)),a}k(e){Me(this._$AH)||(this._$AH=[],this._$AR());const a=this._$AH;let s,r=0;for(const i of e)r===a.length?a.push(s=new de(this.O(re()),this.O(re()),this,this.options)):s=a[r],s._$AI(i),r++;r<a.length&&(this._$AR(s&&s._$AB.nextSibling,r),a.length=r)}_$AR(e=this._$AA.nextSibling,a){for(this._$AP?.(!1,!0,a);e!==this._$AB;){const s=Je(e).nextSibling;Je(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class ye{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,a,s,r,i){this.type=1,this._$AH=y,this._$AN=void 0,this.element=e,this.name=a,this._$AM=r,this.options=i,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=y}_$AI(e,a=this,s,r){const i=this.strings;let n=!1;if(i===void 0)e=F(this,e,a,0),n=!se(e)||e!==this._$AH&&e!==K,n&&(this._$AH=e);else{const c=e;let d,h;for(e=i[0],d=0;d<i.length-1;d++)h=F(this,c[s+d],a,d),h===K&&(h=this._$AH[d]),n||=!se(h)||h!==this._$AH[d],h===y?e=y:e!==y&&(e+=(h??"")+i[d+1]),this._$AH[d]=h}n&&!r&&this.j(e)}j(e){e===y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class Pt extends ye{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===y?void 0:e}}class Ot extends ye{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==y)}}class Mt extends ye{constructor(e,a,s,r,i){super(e,a,s,r,i),this.type=5}_$AI(e,a=this){if((e=F(this,e,a,0)??y)===K)return;const s=this._$AH,r=e===y&&s!==y||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,i=e!==y&&(s===y||r);r&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Dt{constructor(e,a,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=a,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}}const Tt=Oe.litHtmlPolyfillSupport;Tt?.(ie,de),(Oe.litHtmlVersions??=[]).push("3.3.2");const zt=(t,e,a)=>{const s=a?.renderBefore??e;let r=s._$litPart$;if(r===void 0){const i=a?.renderBefore??null;s._$litPart$=r=new de(e.insertBefore(re(),i),i,void 0,a??{})}return r._$AI(t),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const De=globalThis;class f extends W{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const a=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=zt(a,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return K}}f._$litElement$=!0,f.finalized=!0,De.litElementHydrateSupport?.({LitElement:f});const jt=De.litElementPolyfillSupport;jt?.({LitElement:f});(De.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const w=t=>(e,a)=>{a!==void 0?a.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Nt={attribute:!0,type:String,converter:me,reflect:!1,hasChanged:Pe},Rt=(t=Nt,e,a)=>{const{kind:s,metadata:r}=a;let i=globalThis.litPropertyMetadata.get(r);if(i===void 0&&globalThis.litPropertyMetadata.set(r,i=new Map),s==="setter"&&((t=Object.create(t)).wrapped=!0),i.set(a.name,t),s==="accessor"){const{name:n}=a;return{set(c){const d=e.get.call(this);e.set.call(this,c),this.requestUpdate(n,d,t,!0,c)},init(c){return c!==void 0&&this.C(n,void 0,t,c),c}}}if(s==="setter"){const{name:n}=a;return function(c){const d=this[n];e.call(this,c),this.requestUpdate(n,d,t,!0,c)}}throw Error("Unsupported decorator location: "+s)};function l(t){return(e,a)=>typeof a=="object"?Rt(t,e,a):((s,r,i)=>{const n=r.hasOwnProperty(i);return r.constructor.createProperty(i,s),n?Object.getOwnPropertyDescriptor(r,i):void 0})(t,e,a)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function x(t){return l({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Bt=(t,e,a)=>(a.configurable=!0,a.enumerable=!0,Reflect.decorate&&typeof e!="object"&&Object.defineProperty(t,e,a),a);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Lt(t,e){return(a,s,r)=>{const i=n=>n.renderRoot?.querySelector(t)??null;return Bt(a,s,{get(){return i(this)}})}}var Ut=Object.defineProperty,Vt=Object.getOwnPropertyDescriptor,E=(t,e,a,s)=>{for(var r=s>1?void 0:s?Vt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&Ut(e,a,r),r};let ke=class extends f{render(){return o`<slot></slot>`}};ke.styles=$`
    :host {
      display: block;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      padding: var(--space-5);
      color: var(--fg);
      transition: transform var(--dur-base) var(--ease-out-quart),
        box-shadow var(--dur-base) var(--ease-out-quart);
    }
    :host([interactive]:hover),
    :host([interactive]:focus-within) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-lifted);
    }
    :host([deep]) {
      background: var(--bg-deep);
      color: var(--fg-inverse);
    }
  `;ke=E([w("va-card")],ke);let G=class extends f{constructor(){super(...arguments),this.variant="primary",this.disabled=!1,this.type="button"}render(){return o`<button
      class=${this.variant}
      ?disabled=${this.disabled}
      type=${this.type}
      @click=${t=>{if(this.disabled){t.stopPropagation();return}}}
    >
      <slot></slot>
    </button>`}};G.styles=$`
    :host {
      display: inline-block;
    }
    button {
      font: var(--type-body);
      font-weight: 700;
      letter-spacing: 0.01em;
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-5);
      min-height: 44px;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-spring),
        background var(--dur-base) var(--ease-in-out),
        box-shadow var(--dur-base) var(--ease-in-out);
      border: 2px solid transparent;
    }
    button:active:not([disabled]) { transform: scale(0.97); }
    button[disabled] { opacity: 0.4; cursor: not-allowed; }

    button.primary {
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
    }
    button.primary:hover:not([disabled]) { background: #1a2033; }

    button.urgent {
      background: var(--wv-redwood);
      color: var(--fg-inverse);
    }
    button.urgent:hover:not([disabled]) { background: #9a4338; }

    button.ghost {
      background: transparent;
      color: var(--fg);
      border-color: var(--wv-cadet-blue);
    }
    button.ghost:hover:not([disabled]) { background: rgba(39, 50, 72, 0.06); }

    button:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }
  `;E([l({type:String})],G.prototype,"variant",2);E([l({type:Boolean})],G.prototype,"disabled",2);E([l({type:String})],G.prototype,"type",2);G=E([w("va-button")],G);let Y=class extends f{constructor(){super(...arguments),this.count=0,this.label="credos",this.urgent=!1}render(){return o`<span class="count">${this.count}</span><span class="label">${this.label}</span>`}};Y.styles=$`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
      color: var(--fg);
      font: var(--type-body);
      font-weight: 700;
      box-shadow: var(--shadow-card);
      transition: transform var(--dur-base) var(--ease-spring), background var(--dur-base);
    }
    :host([urgent]) { background: var(--accent-urgent); color: var(--fg-inverse); }
    .count { font-variant-numeric: tabular-nums; font-size: 18px; }
    .label { font-weight: 400; font-size: 13px; opacity: 0.7; }
  `;E([l({type:Number})],Y.prototype,"count",2);E([l({type:String})],Y.prototype,"label",2);E([l({type:Boolean})],Y.prototype,"urgent",2);Y=E([w("va-chip")],Y);function ve(t){const e=Math.max(0,Math.ceil(t/1e3)),a=Math.floor(e/60),s=e%60;return`${a}:${s.toString().padStart(2,"0")}`}let Qe=null,et=null;function Ht(t){const e=t==="polite"?Qe:et;if(e)return e;const a=document.createElement("div");return a.setAttribute("aria-live",t),a.setAttribute("aria-atomic","true"),a.className="sr-only",a.style.cssText="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;",document.body.appendChild(a),t==="polite"?Qe=a:et=a,a}function ae(t,e="polite"){if(typeof document>"u")return;const a=Ht(e);a.textContent="",setTimeout(()=>{a.textContent=t},40)}var qt=Object.defineProperty,Wt=Object.getOwnPropertyDescriptor,le=(t,e,a,s)=>{for(var r=s>1?void 0:s?Wt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&qt(e,a,r),r};let N=class extends f{constructor(){super(...arguments),this.startedAt=0,this.durationMs=0,this.ring=!1,this.now=Date.now(),this.lastAnnounced=-1}connectedCallback(){super.connectedCallback(),this.interval=window.setInterval(()=>{this.now=Date.now(),this.maybeAnnounce()},250)}disconnectedCallback(){super.disconnectedCallback(),this.interval&&clearInterval(this.interval)}get remainingMs(){return this.startedAt?Math.max(0,this.durationMs-(this.now-this.startedAt)):this.durationMs}maybeAnnounce(){const t=Math.ceil(this.remainingMs/1e3);[10,5,3,2,1].includes(t)&&t!==this.lastAnnounced&&(ae(`${t} seconds`,"assertive"),this.lastAnnounced=t)}update(t){super.update(t);const e=this.remainingMs;Math.ceil(e/1e3)<=10?this.setAttribute("urgent",""):this.removeAttribute("urgent")}render(){const t=this.remainingMs;if(this.ring){const a=2*Math.PI*54,s=this.durationMs>0?t/this.durationMs:0,r=a*(1-s);return o`
        <div class="ring" role="timer" aria-live="polite" aria-label="time remaining: ${ve(t)}">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle class="track" cx="60" cy="60" r=${54}></circle>
            <circle class="progress" cx="60" cy="60" r=${54} stroke-dasharray=${a} stroke-dashoffset=${r}></circle>
          </svg>
          <span class="label">${ve(t)}</span>
        </div>
      `}return o`<span role="timer" aria-live="off">${ve(t)}</span>`}};N.styles=$`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font: var(--type-mono);
      font-size: 18px;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
      color: var(--fg);
      font-variant-numeric: tabular-nums;
      transition: background var(--dur-base) var(--ease-in-out),
        color var(--dur-base) var(--ease-in-out);
    }
    :host([urgent]) {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      animation: pulse 1s var(--ease-in-out) infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    .ring {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
    }
    svg { position: absolute; inset: 0; transform: rotate(-90deg); }
    circle.track { fill: none; stroke: rgba(39,50,72,0.1); stroke-width: 8; }
    circle.progress {
      fill: none;
      stroke: var(--wv-cadet-blue);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.2s linear, stroke var(--dur-base);
    }
    :host([urgent]) circle.progress { stroke: var(--accent-urgent); }
    .label { position: relative; font-weight: 700; }
  `;le([l({type:Number})],N.prototype,"startedAt",2);le([l({type:Number})],N.prototype,"durationMs",2);le([l({type:Boolean})],N.prototype,"ring",2);le([x()],N.prototype,"now",2);N=le([w("va-countdown")],N);const J=[{id:"radical-transparency",name:"Radical Transparency",description:"your company’s operations, data, and decisions are visible, internally and externally. trust is your brand."},{id:"equity-inclusion",name:"Equity & Inclusion",description:"you commit to diverse leadership, fair labour, and access for historically excluded communities."},{id:"climate-action-priority",name:"Climate Action Priority",description:"you lead with bold sustainability goals: zero emissions, regenerative systems, and climate justice in your supply chain."},{id:"accountability",name:"Accountability",description:"you own your impact — good or bad — and act on it."},{id:"community",name:"Community",description:"your company is shaped by the needs and assets of the communities you serve."},{id:"maximum-profitability",name:"Maximum Profitability",description:"your growth strategy centres on profit. investors love you."},{id:"speed-to-market",name:"Speed to Market",description:"you outpace the competition with fast launches and iteration. agility is your edge."},{id:"scalable-simplicity",name:"Scalable Simplicity",description:"your offering is lean, modular, and easy to replicate. efficiency opens global doors."},{id:"global-brand-recognition",name:"Global Brand Recognition",description:"everyone knows your name. you’re sexy, social, and spotlighted."},{id:"resilience-culture",name:"Resilience Culture",description:"you plan for shocks. flexibility and grit guide your team."},{id:"psychological-safety",name:"Psychological Safety",description:"your team thrives on experimentation, failure, and feedback. people speak up and grow."},{id:"empathic-leadership",name:"Empathic Leadership",description:"you lead with compassion and care. people are more than productivity."},{id:"customer-commitment",name:"Customer Commitment",description:"you serve with precision. their needs drive every choice."},{id:"responsible-ai-tech-ethics",name:"Responsible AI / Tech Ethics",description:"your tech respects autonomy, avoids bias, and protects data with care."},{id:"futures-thinking",name:"Futures Thinking",description:"you build not for today, but for the world we’re heading toward: flexible, regenerative, humane."},{id:"design-for-dignity",name:"Design for Dignity",description:"beauty, accessibility, and function are embedded in your product for everyone."},{id:"trust-as-currency",name:"Trust as Currency",description:"customers, partners, and employees believe in you. credibility compounds."},{id:"design-excellence",name:"Design Excellence",description:"you prize beauty and function equally. good design is good business."},{id:"affordable-access",name:"Affordable Access",description:"you never price people out. affordability and impact go hand in hand."},{id:"culture-of-reflection",name:"Culture of Reflection",description:"your org makes time to pause, learn, and evolve together."}];function k(t){return J.find(e=>e.id===t)}var Jt=Object.defineProperty,Kt=Object.getOwnPropertyDescriptor,$e=(t,e,a,s)=>{for(var r=s>1?void 0:s?Kt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&Jt(e,a,r),r};let Z=class extends f{constructor(){super(...arguments),this.valueId="",this.big=!1,this.zone=""}render(){const t=k(this.valueId);return t?o`
      <div class="name">${t.name}</div>
      <div class="desc">${t.description}</div>
    `:o``}};Z.styles=$`
    :host {
      display: block;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      padding: var(--space-4);
      transition: transform var(--dur-base) var(--ease-out-quart),
        box-shadow var(--dur-base) var(--ease-out-quart);
      cursor: grab;
    }
    :host([big]) {
      padding: var(--space-6) var(--space-7);
      text-align: center;
    }
    .name { font: var(--type-h2); font-weight: 700; }
    :host([big]) .name { font: var(--type-display); }
    .desc { margin-top: var(--space-2); color: var(--fg); opacity: 0.85; }
    :host([big]) .desc { font-size: 18px; line-height: 1.5; margin-top: var(--space-4); }
    :host([zone='must']) { border-left: 4px solid var(--wv-redwood); }
    :host([zone='nice']) { border-left: 4px solid var(--wv-burnt-sienna); }
    :host([zone='wont']) { border-left: 4px solid var(--wv-cadet-blue); opacity: 0.7; }
  `;$e([l({type:String})],Z.prototype,"valueId",2);$e([l({type:Boolean})],Z.prototype,"big",2);$e([l({type:String})],Z.prototype,"zone",2);Z=$e([w("va-value-card")],Z);const Se=[{id:"ethos",name:"ETHOS",sector:"fashion",profile:"a fashion startup aiming to scale sustainably but facing intense pressure from fast fashion competitors.",challenge:"your team must grow quickly to meet demand, but every shortcut you take could compromise your brand’s ethical standards and environmental commitments.",logoKey:"ethos"},{id:"opened",name:"OpenEd",sector:"edtech",profile:"a learning platform promising equity in digital education, yet struggling with limited tech access in rural and underserved regions.",challenge:"investors want rapid user growth, but how do you ensure access and inclusion for the most marginalised students?",logoKey:"opened"},{id:"growup",name:"GrowUp",sector:"agritech",profile:"an agritech company innovating regenerative farming tools while under pressure from stakeholders for quick returns and market dominance.",challenge:"maintain ecological integrity while scaling rapidly and satisfying impatient investors.",logoKey:"growup"},{id:"care-ai",name:"Care.ai",sector:"health tech",profile:"a health tech platform designed to personalise care using AI, while navigating data privacy, algorithmic bias, and ethical guardrails.",challenge:"every decision about speed, personalisation, and partnerships has implications for trust, equity, and health outcomes.",logoKey:"care-ai"},{id:"bluecircuits",name:"BlueCircuits",sector:"hardware",profile:"a hardware startup building modular electronics to reduce e-waste, while competing with cheaper, disposable products in the market.",challenge:"you must convince consumers and suppliers that ethical design and circular economy thinking are worth the cost and disruption.",logoKey:"bluecircuits"},{id:"coact",name:"CoAct",sector:"consulting",profile:"a collaborative impact consultancy offering climate strategy to corporate clients, while refusing greenwashing and performative CSR.",challenge:"can you uphold integrity and push for transformation while keeping large clients happy and contracts flowing?",logoKey:"coact"},{id:"homehatch",name:"HomeHatch",sector:"real estate",profile:"a real estate tech startup aimed at sustainable, affordable housing access, working within policy and zoning constraints.",challenge:"you’re caught between innovation, neighbourhood resistance, and rising construction costs. can you stay mission-aligned?",logoKey:"homehatch"},{id:"ripple",name:"Ripple",sector:"fintech",profile:"a fintech platform promoting financial inclusion for migrant workers, challenged by regulatory constraints and fraud risk.",challenge:"your business depends on trust and accessibility, but navigating compliance and risk aversion is slowing down your innovation.",logoKey:"ripple"}];function Te(t){return Se.find(e=>e.id===t)}function vt(t){const e="/portfolio/assets/values-auction/",a=t.startsWith("/")?t.slice(1):t;return`${e}${a}`}var Ft=Object.defineProperty,Gt=Object.getOwnPropertyDescriptor,pe=(t,e,a,s)=>{for(var r=s>1?void 0:s?Gt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&Ft(e,a,r),r};let R=class extends f{constructor(){super(...arguments),this.startupId="",this.wonValues=[],this.purposeStatement="",this.teamName=""}render(){const t=Te(this.startupId);return t?o`
      <div class="wrap">
        <header>
          <div class="logo"><img src=${vt(`logos/${t.logoKey}.svg`)} alt="" /></div>
          <div>
            <div class="team-label">${this.teamName}</div>
            <h2>${t.name}</h2>
            <span class="sector">${t.sector}</span>
          </div>
        </header>
        <p>${t.profile}</p>
        <p class="challenge">${t.challenge}</p>
        ${this.wonValues.length?o`<div class="won" aria-label="values you locked in">
              ${this.wonValues.map(e=>o`<span class="won-pill">${k(e)?.name??e}</span>`)}
            </div>`:null}
        ${this.purposeStatement?o`<div class="purpose" aria-label="purpose statement">${this.purposeStatement}</div>`:null}
      </div>
    `:o``}};R.styles=$`
    :host { display: block; }
    .wrap {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-card);
    }
    header { display: flex; align-items: center; gap: var(--space-4); }
    .logo {
      width: 72px; height: 72px;
      border-radius: var(--radius-md);
      background: var(--wv-champagne);
      display: grid; place-items: center;
    }
    .logo img { width: 56px; height: 56px; }
    h2 { font: var(--type-h1); margin: 0; }
    .sector {
      display: inline-block;
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
      font-size: 13px;
      margin-top: var(--space-2);
    }
    p { margin-top: var(--space-4); }
    .challenge { color: var(--accent-warm); }
    .won { margin-top: var(--space-5); display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .won-pill {
      background: var(--wv-champagne);
      border: 1px solid var(--wv-burnt-sienna);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 700;
    }
    .purpose {
      margin-top: var(--space-5);
      padding: var(--space-4);
      background: var(--wv-champagne);
      border-radius: var(--radius-md);
      font-style: italic;
    }
    .team-label { font-size: 13px; opacity: 0.7; }
  `;pe([l({type:String})],R.prototype,"startupId",2);pe([l({type:Array})],R.prototype,"wonValues",2);pe([l({type:String})],R.prototype,"purposeStatement",2);pe([l({type:String})],R.prototype,"teamName",2);R=pe([w("va-company-card")],R);var Yt=Object.defineProperty,Zt=Object.getOwnPropertyDescriptor,Q=(t,e,a,s)=>{for(var r=s>1?void 0:s?Zt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&Yt(e,a,r),r};let D=class extends f{constructor(){super(...arguments),this.currentHigh=0,this.credosRemaining=0,this.disabled=!1,this.open=!1,this.amount=0}update(t){super.update(t),t.has("currentHigh")&&!this.open&&(this.amount=this.currentHigh+5)}toggle(){this.disabled||(this.open=!this.open,this.open&&this.amount<this.currentHigh+1&&(this.amount=this.currentHigh+5))}confirm(){const t=Math.min(this.credosRemaining,Math.max(this.currentHigh+1,Math.floor(this.amount)));this.dispatchEvent(new CustomEvent("place-bid",{detail:{amount:t},bubbles:!0,composed:!0})),this.open=!1}render(){if(!this.open)return o`<button
        class="cta"
        ?disabled=${this.disabled}
        @click=${this.toggle}
        aria-label="place a bid"
      >bid</button>`;const t=this.currentHigh+1,e=this.credosRemaining;return o`
      <div class="panel" role="group" aria-label="bid amount">
        <label>
          <span class="sr-only">amount</span>
          <input
            type="number"
            .value=${String(this.amount)}
            min=${t}
            max=${e}
            @input=${a=>this.amount=Number(a.target.value)}
            @keydown=${a=>{a.key==="Enter"&&this.confirm()}}
          />
        </label>
        <button class="confirm" @click=${this.confirm} aria-label="confirm bid">bid ${this.amount}</button>
        <button class="cancel" @click=${()=>this.open=!1}>cancel</button>
      </div>
    `}};D.styles=$`
    :host { display: inline-block; }
    .cta {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      border-radius: var(--radius-pill);
      padding: var(--space-4) var(--space-7);
      font: var(--type-h2);
      border: none;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-spring);
      box-shadow: var(--shadow-card-lifted);
    }
    .cta:active:not([disabled]) { transform: scale(0.96); }
    .cta[disabled] { opacity: 0.4; cursor: not-allowed; }
    .cta:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }

    .panel {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-card-lifted);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    input {
      font: var(--type-h2);
      font-variant-numeric: tabular-nums;
      width: 6ch;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg-card);
    }
    .confirm {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-4);
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .cancel {
      background: transparent;
      color: var(--fg);
      border: 1px solid var(--fg);
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
    }
  `;Q([l({type:Number})],D.prototype,"currentHigh",2);Q([l({type:Number})],D.prototype,"credosRemaining",2);Q([l({type:Boolean})],D.prototype,"disabled",2);Q([x()],D.prototype,"open",2);Q([x()],D.prototype,"amount",2);D=Q([w("va-bid-button")],D);var Xt=Object.defineProperty,Qt=Object.getOwnPropertyDescriptor,ze=(t,e,a,s)=>{for(var r=s>1?void 0:s?Qt(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&Xt(e,a,r),r};let ne=class extends f{constructor(){super(...arguments),this.credos=0,this.start=150}render(){const t=this.start>0?Math.max(0,Math.min(1,this.credos/this.start)):0;return o`
      <span class="coin" aria-hidden="true">¢</span>
      <span class="count" aria-live="polite">${this.credos}</span>
      <span class="label">credos</span>
      <span class="bar" aria-hidden="true"><span class="bar-fill" style="width: ${t*100}%"></span></span>
    `}};ne.styles=$`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      background: var(--bg-card);
      border-radius: var(--radius-pill);
      padding: var(--space-2) var(--space-4);
      box-shadow: var(--shadow-card);
      font-weight: 700;
    }
    .coin {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: var(--wv-burnt-sienna);
      display: grid; place-items: center;
      color: var(--fg-inverse);
      font-size: 12px;
    }
    .count { font-variant-numeric: tabular-nums; font-size: 18px; }
    .label { font-weight: 400; opacity: 0.7; font-size: 13px; }
    .bar {
      margin-left: var(--space-3);
      width: 64px;
      height: 6px;
      background: rgba(39, 50, 72, 0.1);
      border-radius: var(--radius-pill);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--wv-cadet-blue);
      transition: width var(--dur-slow) var(--ease-out-quart);
    }
  `;ze([l({type:Number})],ne.prototype,"credos",2);ze([l({type:Number})],ne.prototype,"start",2);ne=ze([w("va-credos-stack")],ne);const v={arrival:{heading:"welcome. you’re about to play for what matters.",subheading:"enter your name to join the session.",nameLabel:"your name",joinButton:"join",waitingForFacilitator:"we’re waiting for the facilitator to start. stretch a little."},grouping:{heading:"pick the strategy archetype that feels least like you.",options:[{key:"builder",label:"the builder — ship, measure, ship again."},{key:"diplomat",label:"the diplomat — align everyone before a single move."},{key:"rebel",label:"the rebel — burn the playbook and see what catches."},{key:"steward",label:"the steward — protect what’s fragile, invest in what lasts."}]},scene:{ready:"i’ve read it. ready."},strategy:{prompt:"drag each value into a zone. your team must agree before the auction.",zones:{must:"must have",nice:"would be nice",wont:"won’t fight for"}},auction:{live:"live now.",refundNeverHappens:"no refunds. once spent, gone.",restrategise:"two minutes. regroup. adjust."},reflection:{prompts:["which values did you secure that you didn’t intend to?","which did you miss?","what did this force you to trade off?","what kind of company have you just become?"],purpose:"in one sentence, what does your company exist to do?",placeholder:"we exist to..."},regather:{cta:"share your identity card.",qr:"scan to keep playing — windedvertigo.com/play"}};var ea=Object.defineProperty,ta=Object.getOwnPropertyDescriptor,ue=(t,e,a,s)=>{for(var r=s>1?void 0:s?ta(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&ea(e,a,r),r};let B=class extends f{constructor(){super(...arguments),this.intentions={},this.softCeilings={},this.credos=150,this.dragId=null}zoneFor(t){return this.intentions[t]??null}onDragStart(t,e){this.dragId=e,t.dataTransfer?.setData("text/plain",e),t.dataTransfer.effectAllowed="move"}onDrop(t,e){t.preventDefault();const a=t.dataTransfer?.getData("text/plain")??this.dragId;a&&(this.emitIntention(a,e),this.dragId=null,t.currentTarget.classList.remove("drop"))}onDragOver(t){t.preventDefault(),t.currentTarget.classList.add("drop")}onDragLeave(t){t.currentTarget.classList.remove("drop")}emitIntention(t,e){this.dispatchEvent(new CustomEvent("intention",{detail:{valueId:t,zone:e},bubbles:!0,composed:!0}))}emitCeiling(t,e){this.dispatchEvent(new CustomEvent("ceiling",{detail:{valueId:t,amount:e},bubbles:!0,composed:!0}))}onKey(t,e){const a=t.key.toLowerCase();if(a==="m")this.emitIntention(e,"must");else if(a==="n")this.emitIntention(e,"nice");else if(a==="w")this.emitIntention(e,"wont");else if(a==="backspace"||a==="delete")this.emitIntention(e,null);else return;t.preventDefault()}renderCard(t){const e=k(t);if(!e)return null;const a=this.softCeilings[t]??0,s=this.zoneFor(t);return o`
      <div
        class="card"
        draggable="true"
        tabindex="0"
        role="button"
        aria-label="${e.name}. zone ${s??"unassigned"}. press m for must, n for nice, w for won\u2019t."
        @dragstart=${r=>this.onDragStart(r,t)}
        @keydown=${r=>this.onKey(r,t)}
      >
        <div class="name">${e.name}</div>
        ${s==="must"||s==="nice"?o`<div class="ceiling">
              <label class="sr-only" for="ceil-${t}">soft ceiling for ${e.name}</label>
              <input
                id="ceil-${t}"
                type="number"
                min="0"
                max=${this.credos}
                .value=${String(a)}
                @change=${r=>this.emitCeiling(t,Number(r.target.value))}
              /><span style="font-size:12px;opacity:0.7">credo ceiling</span>
            </div>`:null}
      </div>
    `}render(){const t=J.filter(r=>!this.intentions[r.id]),e=J.filter(r=>this.intentions[r.id]==="must"),a=J.filter(r=>this.intentions[r.id]==="nice"),s=J.filter(r=>this.intentions[r.id]==="wont");return o`
      <p class="hint">${v.strategy.prompt}</p>
      <div class="grid">
        <section
          class="zone"
          data-zone="deck"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${r=>this.onDrop(r,null)}
        >
          <h3>deck</h3>
          <div class="deck-hint">drag or focus + press m / n / w.</div>
          ${t.map(r=>this.renderCard(r.id))}
        </section>
        <section
          class="zone"
          data-zone="must"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${r=>this.onDrop(r,"must")}
        >
          <h3>${v.strategy.zones.must}</h3>
          ${e.map(r=>this.renderCard(r.id))}
        </section>
        <section
          class="zone"
          data-zone="nice"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${r=>this.onDrop(r,"nice")}
        >
          <h3>${v.strategy.zones.nice}</h3>
          ${a.map(r=>this.renderCard(r.id))}
        </section>
        <section
          class="zone"
          data-zone="wont"
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${r=>this.onDrop(r,"wont")}
        >
          <h3>${v.strategy.zones.wont}</h3>
          ${s.map(r=>this.renderCard(r.id))}
        </section>
      </div>
    `}};B.styles=$`
    :host { display: block; }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
    @media (min-width: 768px) {
      .grid { grid-template-columns: repeat(4, 1fr); }
    }
    .zone {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      min-height: 240px;
      border: 2px dashed transparent;
      transition: border-color var(--dur-base);
    }
    .zone.drop { border-color: var(--accent-urgent); }
    .zone h3 { font: var(--type-h2); margin-bottom: var(--space-2); font-size: 16px; }
    .zone[data-zone='must'] h3 { color: var(--wv-redwood); }
    .zone[data-zone='nice'] h3 { color: var(--wv-burnt-sienna); }
    .zone[data-zone='wont'] h3 { color: var(--wv-cadet-blue); opacity: 0.6; }
    .card {
      background: var(--wv-champagne);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-2);
      font-size: 14px;
      cursor: grab;
      outline: none;
    }
    .card:focus { box-shadow: 0 0 0 3px var(--wv-cadet-blue); }
    .card.focused { box-shadow: 0 0 0 3px var(--wv-redwood); }
    .card .name { font-weight: 700; }
    .card .ceiling {
      margin-top: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .card .ceiling input {
      width: 5ch;
      padding: 2px var(--space-2);
      border: 1px solid var(--wv-cadet-blue);
      border-radius: var(--radius-sm);
    }
    .hint { font-size: 13px; opacity: 0.7; margin-bottom: var(--space-3); }
    .deck-hint { font-size: 13px; opacity: 0.7; }
  `;ue([l({type:Object})],B.prototype,"intentions",2);ue([l({type:Object})],B.prototype,"softCeilings",2);ue([l({type:Number})],B.prototype,"credos",2);ue([x()],B.prototype,"dragId",2);B=ue([w("va-strategy-board")],B);const fe=[{id:"arrival",order:0,name:"arrival",durationMs:3*6e4,mode:"plenary"},{id:"grouping",order:1,name:"grouping",durationMs:3*6e4,mode:"plenary-to-team"},{id:"scene",order:2,name:"set the scene",durationMs:4*6e4,mode:"team-room"},{id:"strategy",order:3,name:"team strategy",durationMs:5*6e4,mode:"team-room"},{id:"auction",order:4,name:"auction",durationMs:10*6e4,mode:"plenary"},{id:"reflection",order:5,name:"reflection",durationMs:5*6e4,mode:"team-room"},{id:"regather",order:6,name:"regather",durationMs:5*6e4,mode:"plenary"}];function je(t){const e=fe.find(a=>a.id===t);if(!e)throw new Error(`unknown act: ${t}`);return e}function aa(t){const e=je(t);return fe.find(s=>s.order===e.order+1)?.id??null}var ra=Object.defineProperty,sa=Object.getOwnPropertyDescriptor,Ne=(t,e,a,s)=>{for(var r=s>1?void 0:s?sa(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&ra(e,a,r),r};let oe=class extends f{constructor(){super(...arguments),this.current="arrival",this.interactive=!1}onClick(t){this.interactive&&this.dispatchEvent(new CustomEvent("jump-act",{detail:{to:t},bubbles:!0,composed:!0}))}render(){const t=fe.find(e=>e.id===this.current).order;return o`
      <ol role="list" aria-label="session acts">
        ${fe.map(e=>{const a=e.order<t?"done":e.order===t?"current":"upcoming";return o`<li>
            <button
              class="pill ${a}"
              ?disabled=${!this.interactive}
              aria-current=${a==="current"?"step":"false"}
              @click=${()=>this.onClick(e.id)}
            >${e.order}. ${e.name}</button>
          </li>`})}
      </ol>
    `}};oe.styles=$`
    :host { display: block; }
    ol {
      list-style: none;
      display: flex;
      gap: var(--space-2);
      padding: 0;
      margin: 0;
      flex-wrap: wrap;
    }
    button.pill {
      border: none;
      background: var(--bg-card);
      color: var(--fg);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      opacity: 0.55;
      transition: background var(--dur-base), opacity var(--dur-base);
    }
    button.pill.done { opacity: 0.8; }
    button.pill.current {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      opacity: 1;
    }
    button.pill:not([disabled]):hover { opacity: 1; }
    button[disabled] { cursor: default; }
    button:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }
  `;Ne([l({type:String})],oe.prototype,"current",2);Ne([l({type:Boolean})],oe.prototype,"interactive",2);oe=Ne([w("va-act-timeline")],oe);const ia="modulepreload",na=function(t){return"/portfolio/assets/values-auction/"+t},tt={},oa=function(e,a,s){let r=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),c=n?.nonce||n?.getAttribute("nonce");r=Promise.allSettled(a.map(d=>{if(d=na(d),d in tt)return;tt[d]=!0;const h=d.endsWith(".css"),g=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${g}`))return;const p=document.createElement("link");if(p.rel=h?"stylesheet":ia,h||(p.as="script"),p.crossOrigin="",p.href=d,c&&p.setAttribute("nonce",c),document.head.appendChild(p),h)return new Promise((A,u)=>{p.addEventListener("load",A),p.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(n){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=n,window.dispatchEvent(c),!c.defaultPrevented)throw n}return r.then(n=>{for(const c of n||[])c.status==="rejected"&&i(c.reason);return e().catch(i)})};async function ca(t){const e=await fetch("/api/identity-card",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t)});if(!e.ok)throw new Error(`identity-card render failed: ${e.status}`);return await e.blob()}var da=Object.defineProperty,la=Object.getOwnPropertyDescriptor,L=(t,e,a,s)=>{for(var r=s>1?void 0:s?la(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&da(e,a,r),r};let I=class extends f{constructor(){super(...arguments),this.startupId="",this.teamName="",this.wonValues=[],this.purposeStatement="",this.sessionCode=""}async download(){try{const t=await ca({startupId:this.startupId,teamName:this.teamName,wonValues:this.wonValues,purposeStatement:this.purposeStatement,sessionCode:this.sessionCode}),e=URL.createObjectURL(t),a=document.createElement("a");a.href=e,a.download=`${this.startupId}-identity-card.png`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(e)}catch{if(!this.cardEl)return;const{toPng:e}=await oa(async()=>{const{toPng:r}=await import("./index-Ck5JAjSO.js");return{toPng:r}},[]),a=await e(this.cardEl),s=document.createElement("a");s.href=a,s.download=`${this.startupId}-identity-card.png`,s.click()}}render(){const t=Te(this.startupId);return o`
      <div class="frame">
        <div class="card" role="img" aria-label="company identity card for ${t?.name??"your company"}">
          <header>
            <div class="logo"><img src=${vt(`logos/${t?.logoKey??"ethos"}.svg`)} alt="" /></div>
            <div>
              <div class="team">${this.teamName}</div>
              <h3>${t?.name}</h3>
            </div>
          </header>
          <div class="body">
            <div class="purpose">${this.purposeStatement||"a company in search of its purpose."}</div>
            <div class="pills">
              ${this.wonValues.map(e=>o`<span class="pill">${k(e)?.name??e}</span>`)}
            </div>
          </div>
          <footer>
            <span>values auction \u2022 winded.vertigo</span>
            <span>session ${this.sessionCode}</span>
          </footer>
        </div>
        <va-button variant="primary" @click=${()=>this.download()}>download png</va-button>
      </div>
    `}};I.styles=$`
    :host { display: block; }
    .frame {
      display: grid;
      gap: var(--space-4);
      justify-items: center;
    }
    .card {
      width: 100%;
      max-width: 600px;
      aspect-ratio: 1200 / 630;
      background: var(--wv-champagne);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      box-shadow: var(--shadow-card-lifted);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: var(--space-3);
    }
    header { display: flex; align-items: center; gap: var(--space-3); }
    .logo { width: 48px; height: 48px; border-radius: var(--radius-sm); background: var(--wv-white); display: grid; place-items: center; }
    .logo img { width: 40px; height: 40px; }
    h3 { margin: 0; font: var(--type-h2); }
    .team { font-size: 12px; opacity: 0.7; }
    .body { display: flex; flex-direction: column; gap: var(--space-3); }
    .purpose { font-style: italic; font-size: 14px; line-height: 1.4; }
    .pills { display: flex; flex-wrap: wrap; gap: 4px; }
    .pill {
      background: var(--wv-white);
      border: 1px solid var(--wv-burnt-sienna);
      border-radius: var(--radius-pill);
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    footer { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.7; }
  `;L([l({type:String})],I.prototype,"startupId",2);L([l({type:String})],I.prototype,"teamName",2);L([l({type:Array})],I.prototype,"wonValues",2);L([l({type:String})],I.prototype,"purposeStatement",2);L([l({type:String})],I.prototype,"sessionCode",2);L([Lt(".card")],I.prototype,"cardEl",2);I=L([w("va-identity-card")],I);var pa=Object.defineProperty,ua=Object.getOwnPropertyDescriptor,we=(t,e,a,s)=>{for(var r=s>1?void 0:s?ua(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&pa(e,a,r),r};let X=class extends f{constructor(){super(...arguments),this.lines=[],this.displayName="",this.text=""}submit(t){t.preventDefault();const e=this.text.trim();e&&(this.dispatchEvent(new CustomEvent("channel-send",{detail:{text:e,who:this.displayName,at:Date.now()},bubbles:!0,composed:!0})),this.text="")}render(){return o`
      <header>team channel</header>
      <div class="lines" aria-live="polite">
        ${this.lines.slice(-20).map(t=>o`
          <div class="line"><span class="who">${t.who}</span>${t.text}</div>
        `)}
      </div>
      <form @submit=${this.submit}>
        <label class="sr-only" for="chan-input">message your team</label>
        <input
          id="chan-input"
          type="text"
          placeholder="say something to your team"
          .value=${this.text}
          @input=${t=>this.text=t.target.value}
        />
        <button type="submit" aria-label="send">send</button>
      </form>
    `}};X.styles=$`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      min-height: 240px;
      max-height: 100%;
      box-shadow: var(--shadow-card);
      border-left: 4px solid var(--accent-warm);
    }
    header { font: var(--type-h2); font-size: 14px; opacity: 0.7; margin-bottom: var(--space-2); }
    .lines { flex: 1; overflow-y: auto; }
    .line { margin-bottom: var(--space-2); font-size: 14px; }
    .who { font-weight: 700; color: var(--accent-warm); margin-right: var(--space-2); }
    form { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
    input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border: 1px solid rgba(39,50,72,0.2);
      border-radius: var(--radius-sm);
      background: var(--wv-champagne);
    }
    button {
      background: var(--accent-warm);
      color: var(--fg-inverse);
      border: none;
      border-radius: var(--radius-sm);
      padding: 0 var(--space-4);
      font-weight: 700;
      cursor: pointer;
    }
  `;we([l({type:Array})],X.prototype,"lines",2);we([l({type:String})],X.prototype,"displayName",2);we([x()],X.prototype,"text",2);X=we([w("va-team-channel")],X);function Re(){return Math.random().toString(36).slice(2,10)}const at=["cadet","redwood","sienna","champagne","deep","sand"];function rt(t){return at[t%at.length]}const ha={cadet:"team cadet",redwood:"team redwood",sienna:"team sienna",champagne:"team champagne",deep:"team deep",sand:"team sand"};function va(t){return ha[t]}function q(t,e){const a=t.participants.find(s=>s.id===e);if(!(!a||!a.teamId))return t.teams.find(s=>s.id===a.teamId)}function ma(t,e){if(!t.actStartedAt)return t.actDurationMs;if(t.paused)return Math.max(0,t.actDurationMs-0);const a=e-t.actStartedAt;return Math.max(0,t.actDurationMs-a)}function ga(t,e,a){const s=a-e;return t.events.filter(i=>i.type==="bidPlaced"&&i.at>=s).length/(e/6e4)}function fa(t,e,a){const s=a-e;return t.teams.filter(r=>{const i=[...t.events].reverse().find(n=>n.type==="bidPlaced"&&n.payload.teamId===r.id);return i?i.at<s:!0})}function ba(t){const e={};for(const a of t.teams)for(const s of a.wonValues)e[s]||(e[s]=[]),e[s].push(a.id);return e}H`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10l6 6"/><path d="M4 20l10-10"/><path d="M8 6l6 6"/><path d="M11 3l6 6"/></svg>`,H`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,H`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,H`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,H`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>`,H`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;const Be=o`<span class="wv-wordmark" aria-label="winded.vertigo">winded.vertigo</span>`;var ya=Object.defineProperty,$a=Object.getOwnPropertyDescriptor,P=(t,e,a,s)=>{for(var r=s>1?void 0:s?$a(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&ya(e,a,r),r};let S=class extends f{constructor(){super(...arguments),this.sessionCode="",this.participantId="",this.displayName="",this.nameInput="",this.archetype="",this.reflectionIndex=0,this.purposeDraft=""}dispatchAction(t){this.dispatchEvent(new CustomEvent("va-action",{detail:t,bubbles:!0,composed:!0}))}handleJoin(t){t.preventDefault();const e=this.nameInput.trim();e&&(this.displayName=e,this.participantId=Re(),this.dispatchAction({type:"joinParticipant",participantId:this.participantId,displayName:e,at:Date.now()}))}pickArchetype(t){this.archetype=t,this.dispatchAction({type:"chooseArchetype",participantId:this.participantId,archetype:t,at:Date.now()})}renderArrival(){return this.participantId?o`
        <div>
          <h1 class="heading">hi ${this.displayName}.</h1>
          <p class="sub">${v.arrival.waitingForFacilitator}</p>
          <div class="dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      `:o`
      <h1 class="heading">${v.arrival.heading}</h1>
      <p class="sub">${v.arrival.subheading}</p>
      <form @submit=${this.handleJoin}>
        <label>
          <span class="sr-only">${v.arrival.nameLabel}</span>
          <input
            type="text"
            aria-label=${v.arrival.nameLabel}
            placeholder=${v.arrival.nameLabel}
            .value=${this.nameInput}
            @input=${t=>this.nameInput=t.target.value}
            autocomplete="off"
            required
          />
        </label>
        <va-button variant="primary" type="submit" @click=${this.handleJoin}>${v.arrival.joinButton}</va-button>
      </form>
    `}renderGrouping(){const t=q(this.state,this.participantId);return t?o`
        <h1 class="heading">you\u2019re with ${t.name}.</h1>
        <p class="sub">the others are finding their seats.</p>
      `:o`
      <h1 class="heading">${v.grouping.heading}</h1>
      <div class="tiles" role="radiogroup" aria-label="strategy archetype">
        ${v.grouping.options.map(e=>o`
          <button
            class="tile ${this.archetype===e.key?"selected":""}"
            role="radio"
            aria-checked=${this.archetype===e.key}
            @click=${()=>this.pickArchetype(e.key)}
          >
            <strong>${e.label.split(" — ")[0]}</strong>
            <span>${e.label.split(" — ")[1]??""}</span>
          </button>
        `)}
      </div>
    `}renderScene(){const t=q(this.state,this.participantId);if(!t)return this.renderWaiting();const e=Te(t.startupId);return e?o`
      <va-company-card
        .startupId=${e.id}
        .wonValues=${t.wonValues}
        .teamName=${t.name}
      ></va-company-card>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-5);">
        <va-credos-stack .credos=${t.credos}></va-credos-stack>
        <va-button variant="primary" @click=${()=>{}}>${v.scene.ready}</va-button>
      </div>
    `:this.renderWaiting()}renderStrategy(){const t=q(this.state,this.participantId);return t?o`
      <va-strategy-board
        .intentions=${t.intentions}
        .softCeilings=${t.softCeilings}
        .credos=${t.credos}
        @intention=${e=>this.dispatchAction({type:"setIntention",teamId:t.id,valueId:e.detail.valueId,zone:e.detail.zone,at:Date.now()})}
        @ceiling=${e=>this.dispatchAction({type:"setSoftCeiling",teamId:t.id,valueId:e.detail.valueId,amount:e.detail.amount,at:Date.now()})}
      ></va-strategy-board>
    `:this.renderWaiting()}renderAuction(){const t=q(this.state,this.participantId),e=this.state.currentAuction;if(!e)return o`
        <h1 class="heading">${v.auction.restrategise}</h1>
        <p class="sub">${v.auction.refundNeverHappens}</p>
        ${t?o`<va-credos-stack .credos=${t.credos}></va-credos-stack>`:null}
      `;const a=k(e.valueId),s=e.highBid?this.state.teams.find(r=>r.id===e.highBid.teamId):null;return o`
      <div class="auction-stage">
        <p aria-live="polite" style="opacity:0.7">${v.auction.live}</p>
        <va-value-card big .valueId=${e.valueId}></va-value-card>
        <va-countdown ring .startedAt=${e.startedAt} .durationMs=${e.durationMs}></va-countdown>
        <div class="high-bid" aria-live="assertive">
          ${e.highBid?o`<strong>${e.highBid.amount}</strong> credos &middot; ${s?.name??"a team"}`:o`<span>no bids yet.</span>`}
        </div>
        ${t?o`
              <div style="display:flex; align-items:center; gap: var(--space-4)">
                <va-credos-stack .credos=${t.credos}></va-credos-stack>
                <va-bid-button
                  .currentHigh=${e.highBid?.amount??0}
                  .credosRemaining=${t.credos}
                  ?disabled=${t.credos<=(e.highBid?.amount??0)}
                  @place-bid=${r=>this.dispatchAction({type:"placeBid",teamId:t.id,amount:r.detail.amount,at:Date.now()})}
                ></va-bid-button>
              </div>
            `:null}
        <small aria-hidden="true">${a?.description}</small>
      </div>
    `}renderReflection(){const t=q(this.state,this.participantId);if(!t)return this.renderWaiting();const e=v.reflection.prompts,a=Math.min(this.reflectionIndex,e.length);return o`
      <va-company-card
        .startupId=${t.startupId}
        .wonValues=${t.wonValues}
        .purposeStatement=${t.purposeStatement??""}
        .teamName=${t.name}
      ></va-company-card>
      ${a<e.length?o`
            <div class="reflection-prompt" style="margin-top:var(--space-5)">
              <p><strong>${e[a]}</strong></p>
              <va-button
                variant="primary"
                @click=${()=>this.reflectionIndex=a+1}
                style="margin-top: var(--space-4)"
              >next</va-button>
            </div>
          `:o`
            <div class="reflection-prompt" style="margin-top:var(--space-5)">
              <label for="purpose"><strong>${v.reflection.purpose}</strong></label>
              <textarea
                id="purpose"
                placeholder=${v.reflection.placeholder}
                .value=${t.purposeStatement??this.purposeDraft}
                @input=${s=>{const r=s.target.value;this.purposeDraft=r,this.dispatchAction({type:"writePurpose",teamId:t.id,statement:r,at:Date.now()})}}
              ></textarea>
            </div>
          `}
    `}renderRegather(){const t=q(this.state,this.participantId);return t?o`
      <h1 class="heading">${v.regather.cta}</h1>
      <va-identity-card
        .startupId=${t.startupId}
        .teamName=${t.name}
        .wonValues=${t.wonValues}
        .purposeStatement=${t.purposeStatement??""}
        .sessionCode=${this.sessionCode}
      ></va-identity-card>
      <p style="margin-top: var(--space-5); opacity:0.7">${v.regather.qr}</p>
    `:this.renderWaiting()}renderWaiting(){return o`<p class="sub">${v.arrival.waitingForFacilitator}</p>`}updated(t){if(super.updated(t),t.has("state")&&this.state?.broadcast){const e=t.get("state");(!e||e.broadcast?.at!==this.state.broadcast.at)&&ae(this.state.broadcast.message,"polite")}}render(){if(!this.state)return o`<p>loading...</p>`;let t;switch(this.state.currentAct){case"arrival":t=this.renderArrival();break;case"grouping":t=this.renderGrouping();break;case"scene":t=this.renderScene();break;case"strategy":t=this.renderStrategy();break;case"auction":t=this.renderAuction();break;case"reflection":t=this.renderReflection();break;case"regather":t=this.renderRegather();break}return o`
      <div class="page">
        <header>
          ${Be}
          <span style="font: var(--type-mono); opacity: 0.7">session ${this.sessionCode}</span>
        </header>
        ${t}
        ${this.state.broadcast?o`<div class="toast" role="status">${this.state.broadcast.message}</div>`:null}
      </div>
    `}};S.styles=$`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--bg);
      color: var(--fg);
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: var(--space-5) var(--space-4);
      position: relative;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
    }
    .heading { font: var(--type-h1); margin-bottom: var(--space-4); }
    .sub { font-size: 18px; opacity: 0.8; margin-bottom: var(--space-5); }
    form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 420px; }
    input[type='text'] {
      padding: var(--space-3);
      font: var(--type-h2);
      border: 2px solid var(--wv-cadet-blue);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
    }
    .dots { display: inline-flex; gap: var(--space-2); }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--wv-cadet-blue); opacity: 0.6;
      animation: breathe 2s var(--ease-in-out) infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.3s; }
    .dot:nth-child(3) { animation-delay: 0.6s; }
    @keyframes breathe { 50% { opacity: 1; transform: scale(1.2); } }

    .tiles {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    @media (min-width: 640px) { .tiles { grid-template-columns: repeat(2, 1fr); } }
    .tile {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      text-align: left;
      font: var(--type-body);
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform var(--dur-base) var(--ease-spring), border-color var(--dur-base);
    }
    .tile:hover, .tile.selected {
      transform: translateY(-2px);
      border-color: var(--wv-cadet-blue);
    }
    .tile.selected { border-color: var(--accent-urgent); }
    .tile strong { display: block; font-size: 18px; margin-bottom: var(--space-1); }

    .auction-stage {
      display: grid;
      place-items: center;
      padding: var(--space-6) 0;
      gap: var(--space-5);
    }
    .high-bid {
      display: inline-flex; gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
    }
    .dim { opacity: 0.2; pointer-events: none; }

    .reflection-prompt {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      max-width: 640px;
    }
    textarea {
      width: 100%;
      min-height: 120px;
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--wv-white);
      resize: vertical;
      font: var(--type-body);
      margin-top: var(--space-3);
    }
    .toast {
      position: fixed;
      bottom: var(--space-5);
      left: 50%;
      transform: translateX(-50%);
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-card-lifted);
      z-index: 10;
    }
  `;P([l({attribute:!1})],S.prototype,"state",2);P([l({type:String})],S.prototype,"sessionCode",2);P([x()],S.prototype,"participantId",2);P([x()],S.prototype,"displayName",2);P([x()],S.prototype,"nameInput",2);P([x()],S.prototype,"archetype",2);P([x()],S.prototype,"reflectionIndex",2);P([x()],S.prototype,"purposeDraft",2);S=P([w("va-participant")],S);var wa=Object.defineProperty,xa=Object.getOwnPropertyDescriptor,U=(t,e,a,s)=>{for(var r=s>1?void 0:s?xa(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&wa(e,a,r),r};let C=class extends f{constructor(){super(...arguments),this.sessionCode="",this.now=Date.now(),this.onBlockValueId=null,this.broadcastText="",this.showJumpConfirm=null}connectedCallback(){super.connectedCallback(),this.ticker=window.setInterval(()=>this.now=Date.now(),500)}disconnectedCallback(){super.disconnectedCallback(),this.ticker&&clearInterval(this.ticker)}dispatch(t){this.dispatchEvent(new CustomEvent("va-action",{detail:t,bubbles:!0,composed:!0}))}advance(){const t=aa(this.state.currentAct);t&&this.dispatch({type:"advanceAct",to:t,at:Date.now()})}jumpTo(t){this.showJumpConfirm=t}confirmJump(){this.showJumpConfirm&&(this.dispatch({type:"advanceAct",to:this.showJumpConfirm,at:Date.now()}),this.showJumpConfirm=null)}autoAssignTeams(){const t=this.state.participants;if(t.length===0)return;const e=Math.max(1,Math.min(8,Math.ceil(t.length/4))),a={builder:[],diplomat:[],rebel:[],steward:[],none:[]};for(const n of t)a[n.archetype??"none"].push(n.id);const s=[...a.rebel,...a.diplomat,...a.builder,...a.steward,...a.none],r=Array.from({length:e},()=>[]);s.forEach((n,c)=>r[c%e].push(n));const i=r.map((n,c)=>({teamId:`team-${Re()}`,name:va(rt(c)),colour:rt(c),startupId:Se[c%Se.length].id,participantIds:n}));this.dispatch({type:"assignTeams",assignments:i,at:Date.now()})}extend(t){this.dispatch({type:"extendAct",addMs:t,at:Date.now()})}broadcast(){const t=this.broadcastText.trim();t&&(this.dispatch({type:"broadcast",message:t,at:Date.now()}),this.broadcastText="")}startAuction(t){this.dispatch({type:"startAuction",valueId:t,durationMs:3e4,at:Date.now()})}lockIn(){this.dispatch({type:"lockIn",at:Date.now()})}render(){if(!this.state)return o`<p>loading...</p>`;const t=this.state,e=ga(t,6e4,this.now),a=fa(t,6e4,this.now),s=ma(t,this.now);return o`
      <div class="app">
        <header class="bar">
          <div style="display: flex; align-items: center; gap: var(--space-4)">
            ${Be}
            <span style="font: var(--type-mono)">session ${this.sessionCode}</span>
          </div>
          <va-act-timeline
            interactive
            .current=${t.currentAct}
            @jump-act=${r=>this.jumpTo(r.detail.to)}
          ></va-act-timeline>
          <div style="display: flex; gap: var(--space-2); align-items: center">
            <va-countdown .startedAt=${t.actStartedAt??0} .durationMs=${t.actDurationMs}></va-countdown>
            <va-button variant="ghost" @click=${()=>this.extend(6e4)}>+1 min</va-button>
            <va-button variant="primary" @click=${()=>this.advance()}>next act \u2192</va-button>
          </div>
        </header>

        <aside class="pane">
          <h2>live signal</h2>
          <div class="kpi">
            <div class="tile"><div>teams</div><strong>${t.teams.length}</strong></div>
            <div class="tile"><div>people</div><strong>${t.participants.length}</strong></div>
            <div class="tile"><div>bids / min</div><strong>${e.toFixed(1)}</strong></div>
            <div class="tile"><div>silent</div><strong>${a.length}</strong></div>
          </div>
          <h2>credos</h2>
          ${[...t.teams].sort((r,i)=>i.credos-r.credos).map(r=>o`
            <div class="team-row">
              <span>${r.name}</span>
              <strong>${r.credos}</strong>
            </div>
          `)}
        </aside>

        <main class="pane">
          <h2>stage</h2>
          ${this.renderStage()}
          <div style="margin-top: var(--space-5)">
            <h2>broadcast</h2>
            <form style="display:flex; gap: var(--space-2)" @submit=${r=>{r.preventDefault(),this.broadcast()}}>
              <label class="sr-only" for="broadcast">broadcast message</label>
              <input
                id="broadcast"
                type="text"
                placeholder="push a sentence to every participant"
                .value=${this.broadcastText}
                @input=${r=>this.broadcastText=r.target.value}
              />
              <va-button variant="primary" type="submit" @click=${()=>this.broadcast()}>send</va-button>
            </form>
          </div>
          <div style="margin-top: var(--space-5)">
            <h2>tools</h2>
            <div class="tools">
              ${t.currentAct==="grouping"&&t.teams.length===0?o`<va-button variant="primary" @click=${()=>this.autoAssignTeams()}>auto-assign teams</va-button>`:null}
              <va-button variant="ghost" @click=${()=>this.extend(3e4)}>extend 30s</va-button>
              <va-button variant="ghost" @click=${()=>this.dispatch({type:"pauseSession",paused:!t.paused,at:Date.now()})}>${t.paused?"resume":"pause"}</va-button>
            </div>
          </div>
        </main>

        <aside class="pane">
          <h2>deck (${t.valueDeck.length} left)</h2>
          ${t.currentAct==="auction"?o`
                ${t.currentAuction&&!t.currentAuction.lockedIn?o`
                      <div class="onblock-slot">
                        <strong>${k(t.currentAuction.valueId)?.name}</strong>
                        <div>high: ${t.currentAuction.highBid?.amount??"—"}</div>
                        <div>${ve(s)}</div>
                        <va-button variant="urgent" @click=${()=>this.lockIn()}>lock in</va-button>
                      </div>
                    `:o`<p style="opacity:0.7">pick a card below to put on the block.</p>`}
                <div class="deck">
                  ${t.valueDeck.map(r=>o`
                    <button
                      class=${this.onBlockValueId===r?"onblock":""}
                      ?disabled=${!!t.currentAuction&&!t.currentAuction.lockedIn}
                      @click=${()=>this.startAuction(r)}
                    >
                      ${k(r)?.name}
                    </button>
                  `)}
                </div>
              `:o`<p style="opacity:0.7">auction starts in act 4.</p>`}
        </aside>
      </div>

      ${this.showJumpConfirm?o`
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="jmp-title">
              <div class="box">
                <h2 id="jmp-title">you\u2019re about to jump acts</h2>
                <p>this is irreversible for the session feel. continue?</p>
                <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4); justify-content: flex-end">
                  <va-button variant="ghost" @click=${()=>this.showJumpConfirm=null}>cancel</va-button>
                  <va-button variant="primary" @click=${()=>this.confirmJump()}>continue</va-button>
                </div>
              </div>
            </div>
          `:null}
    `}renderStage(){const t=this.state;if(t.currentAct==="arrival")return o`<p>${t.participants.length} people joined. press <strong>next act</strong> when ready.</p>`;if(t.currentAct==="grouping")return o`
        <p>${t.participants.filter(e=>e.archetype).length} of ${t.participants.length} picked an archetype.</p>
      `;if(t.currentAct==="strategy"){const e=t.teams.map(a=>({name:a.name,must:Object.values(a.intentions).filter(s=>s==="must").length}));return o`
        <ul>
          ${e.map(a=>o`<li>${a.name}: ${a.must} \u2018must have\u2019 values</li>`)}
        </ul>
      `}if(t.currentAct==="auction"){const e=t.currentAuction;return e?o`
        <div>
          <strong>${k(e.valueId)?.name}</strong>
          <p>${k(e.valueId)?.description}</p>
          <p>high: <strong>${e.highBid?`${e.highBid.amount} credos (${t.teams.find(a=>a.id===e.highBid.teamId)?.name})`:"no bids yet"}</strong></p>
        </div>
      `:o`<p>no card on the block.</p>`}return t.currentAct==="reflection"?o`
        <ul>
          ${t.teams.map(e=>o`<li>${e.name}: ${e.purposeStatement?"wrote purpose":"still drafting"}</li>`)}
        </ul>
      `:t.currentAct==="regather"?o`<p>let every team share one line from their identity card.</p>`:null}};C.styles=$`
    :host { display: block; min-height: 100dvh; }
    .app {
      display: grid;
      grid-template-columns: 260px 1fr 320px;
      min-height: 100dvh;
      gap: var(--space-4);
      padding: var(--space-4);
    }
    @media (max-width: 1100px) { .app { grid-template-columns: 1fr; } }
    header.bar {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--bg-card);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
    }
    .pane {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-card);
      overflow-y: auto;
    }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--space-3); opacity: 0.7; }
    .kpi { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
    .kpi .tile { padding: var(--space-3); border-radius: var(--radius-sm); background: var(--wv-champagne); }
    .kpi .tile strong { font-size: 22px; }
    .team-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid rgba(39, 50, 72, 0.06);
    }
    .deck {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
    }
    .deck button {
      background: var(--wv-champagne);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
    }
    .deck button.onblock { border-color: var(--accent-urgent); }
    .onblock-slot {
      padding: var(--space-4);
      background: var(--wv-champagne);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }
    .modal {
      position: fixed; inset: 0;
      display: grid; place-items: center;
      background: rgba(39, 50, 72, 0.4);
      z-index: 20;
    }
    .modal .box {
      background: var(--bg-card);
      padding: var(--space-5);
      border-radius: var(--radius-md);
      max-width: 420px;
    }
    input[type='text'] {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid rgba(39, 50, 72, 0.2);
      width: 100%;
      font: var(--type-body);
    }
    .tools { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  `;U([l({attribute:!1})],C.prototype,"state",2);U([l({type:String})],C.prototype,"sessionCode",2);U([x()],C.prototype,"now",2);U([x()],C.prototype,"onBlockValueId",2);U([x()],C.prototype,"broadcastText",2);U([x()],C.prototype,"showJumpConfirm",2);C=U([w("va-facilitator")],C);var _a=Object.defineProperty,Aa=Object.getOwnPropertyDescriptor,Le=(t,e,a,s)=>{for(var r=s>1?void 0:s?Aa(e,a):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(r=(s?n(e,a,r):n(r))||r);return s&&r&&_a(e,a,r),r};let ce=class extends f{constructor(){super(...arguments),this.sessionCode=""}render(){if(!this.state)return o`<p>loading...</p>`;const t=this.state;if(t.currentAct==="auction"&&t.currentAuction&&!t.currentAuction.lockedIn){const e=t.currentAuction,a=k(e.valueId),s=e.highBid?t.teams.find(r=>r.id===e.highBid.teamId):null;return o`
        <div class="stage auction">
          <div class="big-name">${a?.name}</div>
          <div class="ring-wrap">
            <va-countdown ring .startedAt=${e.startedAt} .durationMs=${e.durationMs}></va-countdown>
          </div>
          <div class="bid" aria-live="assertive">
            ${e.highBid?o`${e.highBid.amount} credos \u2022 ${s?.name}`:"awaiting first bid"}
          </div>
        </div>
      `}if(t.currentAct==="reflection")return o`
        <div class="grid-cards">
          ${t.teams.map(e=>o`
            <va-company-card
              .startupId=${e.startupId}
              .wonValues=${e.wonValues}
              .purposeStatement=${e.purposeStatement??""}
              .teamName=${e.name}
            ></va-company-card>
          `)}
        </div>
      `;if(t.currentAct==="regather"){const e=ba(t),a=Object.entries(e).sort((s,r)=>r[1].length-s[1].length);return o`
        <div style="padding: var(--space-5); text-align: center">
          <h1 style="font: var(--type-display)">what did we choose?</h1>
        </div>
        <div class="pattern">
          ${a.map(([s,r])=>o`
            <div class="pattern-tile">
              <strong>${k(s)?.name}</strong>
              <span>${r.length} team${r.length===1?"":"s"}</span>
            </div>
          `)}
        </div>
      `}return o`
      <div class="stage">
        ${Be}
        <div class="code">${this.sessionCode}</div>
        <div class="count">${t.participants.length} people in the room \u2022 ${t.teams.length} teams</div>
      </div>
    `}};ce.styles=$`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--bg-deep);
      color: var(--fg-inverse);
      font: var(--type-body);
    }
    .stage {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--space-7);
      text-align: center;
    }
    .code {
      font: var(--type-mono);
      font-size: clamp(40px, 8vw, 72px);
      margin-top: var(--space-5);
    }
    .count {
      margin-top: var(--space-5);
      font-size: clamp(18px, 2vw, 24px);
      opacity: 0.7;
    }
    .auction {
      display: grid;
      place-items: center;
      gap: var(--space-6);
    }
    .big-name {
      font: var(--type-display);
      font-size: clamp(48px, 8vw, 120px);
      line-height: 1;
    }
    .bid {
      font-size: clamp(24px, 4vw, 48px);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-pill);
      background: var(--accent-urgent);
    }
    .ring-wrap { transform: scale(2.5); }
    .grid-cards {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      padding: var(--space-6);
    }
    .pattern {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      padding: var(--space-6);
    }
    .pattern-tile {
      background: rgba(255,255,255,0.05);
      padding: var(--space-4);
      border-radius: var(--radius-md);
    }
    .pattern-tile strong { display: block; font-size: 18px; margin-bottom: var(--space-2); }
  `;Le([l({attribute:!1})],ce.prototype,"state",2);Le([l({type:String})],ce.prototype,"sessionCode",2);ce=Le([w("va-wall")],ce);function ka(t){const e=t.startsWith("#")?t.slice(1):t,[a,s]=e.split("?"),r=a.startsWith("/")?a.slice(1):a,n=new URLSearchParams(s??"").get("code")??"DEMO";return{path:["join","facilitate","wall"].includes(r)?r:"join",code:n}}function Sa(t){const e=()=>t(ka(location.hash));return window.addEventListener("hashchange",e),e(),()=>window.removeEventListener("hashchange",e)}const Ia=150,st=1;function Ie(t,e,a){return{id:t,createdAt:a,facilitatorId:e,currentAct:"arrival",actDurationMs:je("arrival").durationMs,teams:[],participants:[],valueDeck:J.map(s=>s.id),completedAuctions:[],events:[mt("sessionCreated",a,{sessionId:t,facilitatorId:e})]}}function mt(t,e,a){return{id:`${e}-${t}-${Math.random().toString(36).slice(2,8)}`,at:e,type:t,payload:a}}function _(t,e,a,s){return{...t,events:[...t.events,mt(e,a,s)]}}function Ae(t,e){switch(e.type){case"createSession":return Ie(e.sessionId,e.facilitatorId,e.at);case"joinParticipant":{if(t.participants.some(r=>r.id===e.participantId))return t;const a={id:e.participantId,displayName:e.displayName,teamId:null,joinedAt:e.at,lastSeenAt:e.at},s={...t,participants:[...t.participants,a]};return _(s,"participantJoined",e.at,{participantId:a.id,displayName:a.displayName})}case"chooseArchetype":{const a=t.participants.map(r=>r.id===e.participantId?{...r,archetype:e.archetype,lastSeenAt:e.at}:r),s={...t,participants:a};return _(s,"archetypeChosen",e.at,{participantId:e.participantId,archetype:e.archetype})}case"assignTeams":{const a=e.assignments.map(n=>({id:n.teamId,name:n.name,colour:n.colour,startupId:n.startupId,credos:Ia,intentions:{},softCeilings:{},wonValues:[]})),s=new Map;for(const n of e.assignments)for(const c of n.participantIds)s.set(c,n.teamId);const r=t.participants.map(n=>{const c=s.get(n.id);return c?{...n,teamId:c}:n}),i={...t,teams:a,participants:r};return _(i,"teamAssigned",e.at,{assignments:e.assignments})}case"advanceAct":{const a=e.to,s=je(a),r={...t,currentAct:a,actStartedAt:e.at,actDurationMs:s.durationMs,startedAt:t.startedAt??e.at};return _(r,"actAdvanced",e.at,{to:a,from:t.currentAct})}case"extendAct":{const a={...t,actDurationMs:t.actDurationMs+e.addMs};return _(a,"facilitatorExtended",e.at,{addMs:e.addMs})}case"pauseSession":{const a={...t,paused:e.paused};return _(a,"facilitatorPaused",e.at,{paused:e.paused})}case"setIntention":{const a=t.teams.map(r=>r.id===e.teamId?{...r,intentions:{...r.intentions,[e.valueId]:e.zone}}:r),s={...t,teams:a};return _(s,"intentionSet",e.at,{teamId:e.teamId,valueId:e.valueId,zone:e.zone})}case"setSoftCeiling":{const a=Math.max(0,Math.floor(e.amount)),s=t.teams.map(i=>i.id===e.teamId?{...i,softCeilings:{...i.softCeilings,[e.valueId]:a}}:i),r={...t,teams:s};return _(r,"softCeilingSet",e.at,{teamId:e.teamId,valueId:e.valueId,amount:a})}case"startAuction":{if(t.currentAuction&&!t.currentAuction.lockedIn||!t.valueDeck.includes(e.valueId))return t;const a={valueId:e.valueId,startedAt:e.at,durationMs:e.durationMs,lockedIn:!1},s={...t,currentAuction:a};return _(s,"auctionStarted",e.at,{valueId:e.valueId})}case"placeBid":{const a=t.currentAuction;if(!a||a.lockedIn)return t;const s=t.teams.find(c=>c.id===e.teamId);if(!s)return t;const r=a.highBid?a.highBid.amount+st:st;if(e.amount<r||e.amount>s.credos)return t;const i={teamId:e.teamId,amount:e.amount,at:e.at},n={...t,currentAuction:{...a,highBid:i}};return _(n,"bidPlaced",e.at,{teamId:e.teamId,amount:e.amount,valueId:a.valueId})}case"lockIn":{const a=t.currentAuction;if(!a||a.lockedIn)return t;let s=t.teams,r=a;if(a.highBid){const c=a.highBid.teamId,d=a.highBid.amount;s=t.teams.map(h=>h.id===c?{...h,credos:Math.max(0,h.credos-d),wonValues:[...h.wonValues,a.valueId]}:h),r={...a,lockedIn:!0,winnerTeamId:c}}else r={...a,lockedIn:!0};const i=t.valueDeck.filter(c=>c!==a.valueId),n={...t,teams:s,valueDeck:i,currentAuction:void 0,completedAuctions:[...t.completedAuctions,r]};return _(n,"valueLocked",e.at,{valueId:a.valueId,winnerTeamId:r.winnerTeamId??null,amount:a.highBid?.amount??0})}case"writePurpose":{const a=t.teams.map(r=>r.id===e.teamId?{...r,purposeStatement:e.statement}:r),s={...t,teams:a};return _(s,"purposeWritten",e.at,{teamId:e.teamId})}case"broadcast":{const a={...t,broadcast:{message:e.message,at:e.at}};return _(a,"facilitatorBroadcast",e.at,{message:e.message})}case"override":{const a={...t,...e.patch};return _(a,"facilitatorOverride",e.at,{reason:e.reason})}default:return t}}class it{constructor(e,a){this.listeners=new Set,this.state=e,this.senderId=a.senderId,this.authoritative=a.authoritative??!1}getState(){return this.state}subscribe(e){return this.listeners.add(e),e(this.state),()=>{this.listeners.delete(e)}}setState(e){if(e!==this.state){this.state=e;for(const a of this.listeners)a(this.state)}}dispatch(e){if(this.authoritative){const a=Ae(this.state,e);this.setState(a),this.transport&&this.transport.send({type:"state",payload:a,at:Date.now(),sender:this.senderId})}else if(this.transport)this.transport.send({type:"action",payload:e,at:Date.now(),sender:this.senderId});else{const a=Ae(this.state,e);this.setState(a)}}attachTransport(e){this.transport=e,this.unsubscribeTransport?.(),this.unsubscribeTransport=e.subscribe(a=>this.onTransportMessage(a))}onTransportMessage(e){if(e.sender!==this.senderId){if(e.type==="state"){this.setState(e.payload);return}if(e.type==="action"&&this.authoritative){const a=e.payload;if(a.type==="syncRequest"){this.transport?.send({type:"state",payload:this.state,at:Date.now(),sender:this.senderId});return}const s=Ae(this.state,a);this.setState(s),this.transport?.send({type:"state",payload:s,at:Date.now(),sender:this.senderId})}}}receiveState(e){this.setState(e)}}class nt{constructor(){this.handlers=new Set}async connect(e,a){this.sessionId=e,this.role=a;const s=`values-auction:${e}`;this.channel=new BroadcastChannel(s),this.channel.addEventListener("message",r=>{const i=r.data;for(const n of this.handlers)n(i)})}send(e){if(!this.channel)throw new Error("transport not connected");this.channel.postMessage(e)}subscribe(e){return this.handlers.add(e),()=>{this.handlers.delete(e)}}disconnect(){this.channel?.close(),this.channel=void 0,this.handlers.clear()}get info(){return{sessionId:this.sessionId,role:this.role}}}const Ca={};class ot{constructor(e={}){this.handlers=new Set,this.queue=[];const a=Ca?.VITE_WS_URL;this.url=e.url??a??this.defaultUrl()}defaultUrl(){const e=location.protocol==="https:"?"wss":"ws";{const a="/portfolio/assets/values-auction/",s=location.host,r=`${a}ws`.replace(/\/+/g,"/");return`${e}://${s}${r}`}}async connect(e,a){this.sessionId=e,this.role=a,await this.open()}open(){return new Promise(e=>{const a=new URLSearchParams({session:this.sessionId,role:this.role});this.ws=new WebSocket(`${this.url}?${a.toString()}`),this.ws.addEventListener("open",()=>{for(;this.queue.length>0;){const s=this.queue.shift();s&&this.ws.send(JSON.stringify(s))}e()}),this.ws.addEventListener("message",s=>{try{const r=JSON.parse(s.data);for(const i of this.handlers)i(r)}catch{}}),this.ws.addEventListener("close",()=>{this.scheduleReconnect()}),this.ws.addEventListener("error",()=>{this.ws?.close()})})}scheduleReconnect(){this.reconnectTimer||(this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=void 0,this.sessionId&&this.role&&this.open().catch(()=>this.scheduleReconnect())},2e3))}send(e){this.ws&&this.ws.readyState===WebSocket.OPEN?this.ws.send(JSON.stringify(e)):this.queue.push(e)}subscribe(e){return this.handlers.add(e),()=>{this.handlers.delete(e)}}disconnect(){this.reconnectTimer&&clearTimeout(this.reconnectTimer),this.ws?.close(),this.ws=void 0,this.handlers.clear()}}const Ea={PROD:!0};function Pa(){const t=Ea??{},e=t.VITE_TRANSPORT;return e==="socket"?new ot:e==="broadcast"?new nt:t.PROD?new ot:new nt}async function Oa(){const t=document.getElementById("app"),e=Re();let a,s,r="",i="join",n=null,c=null;const d=(u,m)=>{if(c===u&&n)return n;t.innerHTML="";let b;return u==="facilitate"?b=document.createElement("va-facilitator"):u==="wall"?b=document.createElement("va-wall"):b=document.createElement("va-participant"),b.sessionCode=m,t.appendChild(b),b.addEventListener("va-action",O=>{const V=O.detail;s?.dispatch(V)}),n=b,c=u,b},h=u=>{const m=d(i,r);m.state=u,m.sessionCode=r},g=(u,m)=>{if(!u||m.events.length===u.events.length)return;const b=m.events[m.events.length-1];if(b.type==="bidPlaced"){const O=m.teams.find(V=>V.id===b.payload.teamId);ae(`${O?.name??"a team"} bid ${b.payload.amount}`,"assertive")}b.type==="valueLocked"&&ae("locked in.","assertive"),b.type==="facilitatorBroadcast"&&ae(`broadcast: ${b.payload.message}`,"polite")},p=()=>{t.innerHTML="",n=null,c=null},A=async(u,m)=>{if(m===r&&a){u!==i&&(p(),i=u,h(s.getState()));return}a&&a.disconnect(),p(),r=m,i=u;const O=Ie(m,e,Date.now()),V=u==="facilitate";s=new it(O,{senderId:e,authoritative:V});let Ue;s.subscribe(xe=>{h(xe),g(Ue,xe),Ue=xe}),a=Pa(),await a.connect(m,u==="facilitate"?"facilitator":u==="wall"?"wall":"participant"),s.attachTransport(a),V?a.send({type:"state",payload:O,at:Date.now(),sender:e}):a.send({type:"action",payload:{type:"syncRequest",at:Date.now()},at:Date.now(),sender:e})};Sa(({path:u,code:m})=>{A(u,m).catch(b=>{console.error("transport connect failed",b),s||(s=new it(Ie(m,e,Date.now()),{senderId:e,authoritative:u==="facilitate"}),s.subscribe(O=>h(O)))})}),setTimeout(()=>{const u=`${location.origin}${location.pathname}`;console.info("%cvalues auction","font-weight:700; color:#273248"),console.info(`facilitator: ${u}#/facilitate?code=DEMO`),console.info(`participant: ${u}#/join?code=DEMO`),console.info(`wall:        ${u}#/wall?code=DEMO`)},200)}Oa().catch(t=>{console.error(t),document.body.innerHTML=`<pre style="padding:24px;color:#b15043">${t.stack}</pre>`});
//# sourceMappingURL=index-BHrl_BG5.js.map
