(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43216,93021,e=>{"use strict";let t,r;var a=e.i(31067),i=e.i(71645),s=e.i(90072),o=e.i(90874),n=s,l=s;let u=new l.Box3,c=new l.Vector3;class f extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,r=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),r.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(r,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let r;e instanceof Float32Array?r=e:Array.isArray(e)&&(r=new Float32Array(e));let a=new l.InstancedInterleavedBuffer(r,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(a,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(a,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let r=this.boundingSphere.center;this.boundingBox.getCenter(r);let a=0;for(let i=0,s=e.count;i<s;i++)c.fromBufferAttribute(e,i),a=Math.max(a,r.distanceToSquared(c)),c.fromBufferAttribute(t,i),a=Math.max(a,r.distanceToSquared(c));this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var d=s,h=e.i(8560),p=e.i(31497);class m extends d.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:d.UniformsUtils.clone(d.UniformsUtils.merge([h.UniformsLib.common,h.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new d.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${p.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let v=p.version>=125?"uv1":"uv2",g=new n.Vector4,x=new n.Vector3,b=new n.Vector3,y=new n.Vector4,w=new n.Vector4,M=new n.Vector4,S=new n.Vector3,P=new n.Matrix4,_=new n.Line3,j=new n.Vector3,C=new n.Box3,T=new n.Sphere,D=new n.Vector4;function R(e,t,a){return D.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),D.multiplyScalar(1/D.w),D.x=r/a.width,D.y=r/a.height,D.applyMatrix4(e.projectionMatrixInverse),D.multiplyScalar(1/D.w),Math.abs(Math.max(D.x,D.y))}class E extends n.Mesh{constructor(e=new f,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,a=new Float32Array(2*t.count);for(let e=0,i=0,s=t.count;e<s;e++,i+=2)x.fromBufferAttribute(t,e),b.fromBufferAttribute(r,e),a[i]=0===i?0:a[i-1],a[i+1]=a[i]+x.distanceTo(b);let i=new n.InstancedInterleavedBuffer(a,2,1);return e.setAttribute("instanceDistanceStart",new n.InterleavedBufferAttribute(i,1,0)),e.setAttribute("instanceDistanceEnd",new n.InterleavedBufferAttribute(i,1,1)),this}raycast(e,a){let i,s,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,f=this.geometry,d=this.material;if(r=d.linewidth+u,null===f.boundingSphere&&f.computeBoundingSphere(),T.copy(f.boundingSphere).applyMatrix4(c),o)i=.5*r;else{let e=Math.max(l.near,T.distanceToPoint(t.origin));i=R(l,e,d.resolution)}if(T.radius+=i,!1!==t.intersectsSphere(T)){if(null===f.boundingBox&&f.computeBoundingBox(),C.copy(f.boundingBox).applyMatrix4(c),o)s=.5*r;else{let e=Math.max(l.near,C.distanceToPoint(t.origin));s=R(l,e,d.resolution)}C.expandByScalar(s),!1!==t.intersectsBox(C)&&(o?function(e,a){let i=e.matrixWorld,s=e.geometry,o=s.attributes.instanceStart,l=s.attributes.instanceEnd,u=Math.min(s.instanceCount,o.count);for(let s=0;s<u;s++){_.start.fromBufferAttribute(o,s),_.end.fromBufferAttribute(l,s),_.applyMatrix4(i);let u=new n.Vector3,c=new n.Vector3;t.distanceSqToSegment(_.start,_.end,c,u),c.distanceTo(u)<.5*r&&a.push({point:c,pointOnLine:u,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:s,uv:null,[v]:null})}}(this,a):function(e,a,i){let s=a.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,c=u.attributes.instanceStart,f=u.attributes.instanceEnd,d=Math.min(u.instanceCount,c.count),h=-a.near;t.at(1,M),M.w=1,M.applyMatrix4(a.matrixWorldInverse),M.applyMatrix4(s),M.multiplyScalar(1/M.w),M.x*=o.x/2,M.y*=o.y/2,M.z=0,S.copy(M),P.multiplyMatrices(a.matrixWorldInverse,l);for(let a=0;a<d;a++){if(y.fromBufferAttribute(c,a),w.fromBufferAttribute(f,a),y.w=1,w.w=1,y.applyMatrix4(P),w.applyMatrix4(P),y.z>h&&w.z>h)continue;if(y.z>h){let e=y.z-w.z,t=(y.z-h)/e;y.lerp(w,t)}else if(w.z>h){let e=w.z-y.z,t=(w.z-h)/e;w.lerp(y,t)}y.applyMatrix4(s),w.applyMatrix4(s),y.multiplyScalar(1/y.w),w.multiplyScalar(1/w.w),y.x*=o.x/2,y.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,_.start.copy(y),_.start.z=0,_.end.copy(w),_.end.z=0;let u=_.closestPointToPointParameter(S,!0);_.at(u,j);let d=n.MathUtils.lerp(y.z,w.z,u),p=d>=-1&&d<=1,m=S.distanceTo(j)<.5*r;if(p&&m){_.start.fromBufferAttribute(c,a),_.end.fromBufferAttribute(f,a),_.start.applyMatrix4(l),_.end.applyMatrix4(l);let r=new n.Vector3,s=new n.Vector3;t.distanceSqToSegment(_.start,_.end,s,r),i.push({point:s,pointOnLine:r,distance:t.origin.distanceTo(s),object:e,face:null,faceIndex:a,uv:null,[v]:null})}}}(this,l,a))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(g),this.material.uniforms.resolution.value.set(g.z,g.w))}}class A extends f{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,r=new Float32Array(2*t);for(let a=0;a<t;a+=3)r[2*a]=e[a],r[2*a+1]=e[a+1],r[2*a+2]=e[a+2],r[2*a+3]=e[a+3],r[2*a+4]=e[a+4],r[2*a+5]=e[a+5];return super.setPositions(r),this}setColors(e,t=3){let r=e.length-t,a=new Float32Array(2*r);if(3===t)for(let i=0;i<r;i+=t)a[2*i]=e[i],a[2*i+1]=e[i+1],a[2*i+2]=e[i+2],a[2*i+3]=e[i+3],a[2*i+4]=e[i+4],a[2*i+5]=e[i+5];else for(let i=0;i<r;i+=t)a[2*i]=e[i],a[2*i+1]=e[i+1],a[2*i+2]=e[i+2],a[2*i+3]=e[i+3],a[2*i+4]=e[i+4],a[2*i+5]=e[i+5],a[2*i+6]=e[i+6],a[2*i+7]=e[i+7];return super.setColors(a,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class k extends E{constructor(e=new A,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let z=i.forwardRef(function({points:e,color:t=0xffffff,vertexColors:r,linewidth:n,lineWidth:l,segments:u,dashed:c,...d},h){var p,v;let g=(0,o.useThree)(e=>e.size),x=i.useMemo(()=>u?new E:new k,[u]),[b]=i.useState(()=>new m),y=(null==r||null==(p=r[0])?void 0:p.length)===4?4:3,w=i.useMemo(()=>{let a=u?new f:new A,i=e.map(e=>{let t=Array.isArray(e);return e instanceof s.Vector3||e instanceof s.Vector4?[e.x,e.y,e.z]:e instanceof s.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(a.setPositions(i.flat()),r){t=0xffffff;let e=r.map(e=>e instanceof s.Color?e.toArray():e);a.setColors(e.flat(),y)}return a},[e,u,r,y]);return i.useLayoutEffect(()=>{x.computeLineDistances()},[e,x]),i.useLayoutEffect(()=>{c?b.defines.USE_DASH="":delete b.defines.USE_DASH,b.needsUpdate=!0},[c,b]),i.useEffect(()=>()=>{w.dispose(),b.dispose()},[w]),i.createElement("primitive",(0,a.default)({object:x,ref:h},d),i.createElement("primitive",{object:w,attach:"geometry"}),i.createElement("primitive",(0,a.default)({object:b,attach:"material",color:t,vertexColors:!!r,resolution:[g.width,g.height],linewidth:null!=(v=null!=n?n:l)?v:1,dashed:c,transparent:4===y},d)))});e.s(["Line",0,z],43216);var L=e.i(95393),U=s;let F=parseInt(s.REVISION.replace(/\D+/g,""));class O extends U.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${F>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let N=e=>new U.Vector3().setFromSpherical(new U.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),I=i.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:a=0,factor:s=4,fade:o=!1,speed:n=1},l)=>{let u=i.useRef(null),[c,f,d]=i.useMemo(()=>{let i=[],o=[],n=Array.from({length:r},()=>(.5+.5*Math.random())*s),l=new U.Color,u=e+t,c=t/r;for(let e=0;e<r;e++)u-=c*Math.random(),i.push(...N(u).toArray()),l.setHSL(e/r,a,.9),o.push(l.r,l.g,l.b);return[new Float32Array(i),new Float32Array(o),new Float32Array(n)]},[r,t,s,e,a]);(0,L.useFrame)(e=>u.current&&(u.current.uniforms.time.value=e.clock.elapsedTime*n));let[h]=i.useState(()=>new O);return i.createElement("points",{ref:l},i.createElement("bufferGeometry",null,i.createElement("bufferAttribute",{attach:"attributes-position",args:[c,3]}),i.createElement("bufferAttribute",{attach:"attributes-color",args:[f,3]}),i.createElement("bufferAttribute",{attach:"attributes-size",args:[d,1]})),i.createElement("primitive",{ref:u,object:h,attach:"material",blending:U.AdditiveBlending,"uniforms-fade-value":o,depthWrite:!1,transparent:!0,vertexColors:!0}))});e.s(["Stars",0,I],93021)},63071,37773,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(95393),i=e.i(78140),s=e.i(90072);let o=new s.Color("#ead9b8"),n=new s.Color("#c9b28a"),l=new s.Color("#4a9a3f"),u=new s.Color("#2f7a45"),c=new s.Color("#7a8396"),f=new s.Color("#4e5870");function d(e,t,r){let a=Math.imul(e,0x165667b1)+Math.imul(t,0x27d4eb2f)+Math.imul(r,0x55fdc781);return a=Math.imul(a^a>>>13,0x4bf19f61),((a^=a>>>16)>>>0)/0x100000000}let h=e=>e*e*(3-2*e);function p(e,t,r){let a=0,i=.5,o=1;for(let n=0;n<4;n++)a+=function(e,t,r){let a=Math.floor(e),i=Math.floor(t),o=h(e-a),n=h(t-i),l=d(a,i,r),u=d(a+1,i,r),c=d(a,i+1,r),f=d(a+1,i+1,r);return s.MathUtils.lerp(s.MathUtils.lerp(l,u,o),s.MathUtils.lerp(c,f,o),n)}(e*o,t*o,r+17*n)*i,i*=.5,o*=2.1;return a/.9375}let m=(e,t,r)=>h(s.MathUtils.clamp((r-e)/(t-e),0,1));function v(e,t,r={}){let{radius:a=3.6,amplitude:i=1,cliff:d=1.1,terrace:h,flatTop:g}=r,x=t=>a*(1+(p(1.3*Math.cos(t)+7.3,1.3*Math.sin(t)+2.1,e)-.5)*.5),b=(e,t)=>Math.hypot(e,t)/x(Math.atan2(t,e)),y=(r,a)=>{let s=b(r,a),o=x(Math.atan2(a,r)),n=1-m(.5,.98,s),l=m(-.3,1,-r*t/o),u=(.35+2.4*Math.pow(p(.42*r+.37*e,.42*a-.11*e,e+101),1.6))*n*(.55+l*d)*i;void 0!==g&&(u=Math.min(u,g)),h&&(u=Math.floor(u/h)*h+u%h*.08);let c=.14+.25*(1-Math.min(1,s));return s<=1?c+u:c-(s-1)*3.2},w=1.65*a,M=[],S=[],P=new s.Color,_=0,j=(e,t)=>{let r=-w+e/52*w*2,a=-w+t/52*w*2,i=y(r,a);return[r,i,a]},C=(t,r,a)=>{var i,s;let d,h,v,g;M.push(...t,...r,...a);let x=(d=y(i=(t[0]+r[0]+a[0])/3,s=(t[2]+r[2]+a[2])/3),h=b(i,s),v=Math.hypot(y(i+.3,s)-y(i-.3,s),y(i,s+.3)-y(i,s-.3))/.6,v>1.05+((g=p(.9*i+3,.9*s+3,e+55))-.5)*.3||d>2.4?P.copy(c).lerp(f,.7*g):d<.36||h>.93?P.copy(o).lerp(n,.8*m(.86,1,h)+.3*(d<.2)):P.copy(l).lerp(u,.9*g+.15*v),P);for(let e=0;e<3;e++)S.push(x.r,x.g,x.b)};for(let e=0;e<52;e++)for(let t=0;t<52;t++){let r=j(e,t),a=j(e+1,t),i=j(e,t+1),s=j(e+1,t+1);_=Math.max(_,r[1]),-1.6>Math.max(r[1],a[1],i[1],s[1])||((e+t)%2?(C(r,i,a),C(a,i,s)):(C(r,s,a),C(r,i,s)))}let T=new s.BufferGeometry;T.setAttribute("position",new s.Float32BufferAttribute(M,3)),T.setAttribute("color",new s.Float32BufferAttribute(S,3)),T.computeVertexNormals();let D=[],R=[];for(let e=0;e<=72;e++){let t=e/72*Math.PI*2,r=x(t);D.push(Math.cos(t)*(r-.15),0,Math.sin(t)*(r-.15),Math.cos(t)*(r+.75),0,Math.sin(t)*(r+.75)),e<72&&R.push(2*e,2*e+1,2*e+2,2*e+1,2*e+3,2*e+2)}let E=new s.BufferGeometry;return E.setAttribute("position",new s.Float32BufferAttribute(D,3)),E.setIndex(R),E.computeVertexNormals(),{geometry:T,foam:E,height:y,coast:x,t:b,maxHeight:_}}function g(e,t,r,a=.25){let i=e.height(t,r);for(let s=0;s<6;s++){let o=s/6*Math.PI*2;i=Math.max(i,e.height(t+Math.cos(o)*a,r+Math.sin(o)*a))}return i}function x(e,t,r,a=.25){let i=e.height(t,r),s=i;for(let o=0;o<6;o++){let n=o/6*Math.PI*2,l=e.height(t+Math.cos(n)*a,r+Math.sin(n)*a);i=Math.min(i,l),s=Math.max(s,l)}return s-i}function b(e,t,a){let i=JSON.stringify(a??{});return(0,r.useMemo)(()=>v(e,t,JSON.parse(i)),[e,t,i])}e.s(["buildTerrain",0,v,"groundAt",0,g,"unevenness",0,x,"useTerrain",0,b],37773);let y="#fea0c0",w="#c9d4f5";function M(e){let t=16807*e+1;return()=>(t=16807*t%0x7fffffff)/0x7fffffff}function S(e,t,r,a=-1/0){let i=M(t),s=e.attributes.position,o=new Map;for(let e=0;e<s.count;e++){let t=s.getX(e),n=s.getY(e),l=s.getZ(e);if(n<a)continue;let u=`${Math.round(100*Math.atan2(l,t))}:${Math.round(100*n)}`,c=o.get(u);void 0===c&&(c=1+(i()-.5)*2*r,o.set(u,c)),s.setX(e,t*c),s.setZ(e,l*c)}return s.needsUpdate=!0,e.computeVertexNormals(),e}function P({position:e,toon:r,lean:a,height:i=1.3,seed:s,twist:o}){let n=M(s),l=o??n()*Math.PI*2;return(0,t.jsxs)("group",{position:e,rotation:[0,l,a],children:[(0,t.jsx)("mesh",{material:r.trunk,"position-y":i/2,"rotation-z":.08,castShadow:!0,children:(0,t.jsx)("cylinderGeometry",{args:[.06,.11,i,6]})}),[0,1,2,3,4,5].map(e=>(0,t.jsx)("mesh",{material:r.grass,"position-y":i,rotation:[.55+e%2*.15,e*Math.PI*2/6,0],castShadow:!0,children:(0,t.jsx)("coneGeometry",{args:[.18,1,3]})},e)),[0,1,2].map(e=>(0,t.jsx)("mesh",{material:r.coconut,position:[.12*Math.cos(2.1*e),i-.08,.12*Math.sin(2.1*e)],children:(0,t.jsx)("sphereGeometry",{args:[.07,6,5]})},`c${e}`))]})}function _({position:e,toon:a,seed:i,scale:o=1}){let n=(0,r.useMemo)(()=>S(new s.ConeGeometry(1.2,2.2,9,3),i,.22),[i]),l=(0,r.useMemo)(()=>S(new s.ConeGeometry(.75,1,8,2),i+7,.2),[i]);return(0,t.jsxs)("group",{position:e,scale:o,children:[(0,t.jsx)("mesh",{geometry:n,material:a.rock,"position-y":1.1,castShadow:!0}),(0,t.jsx)("mesh",{geometry:l,material:a.dark,"position-y":2,castShadow:!0})]})}function j({side:e,toon:r,from:a=3}){return(0,t.jsx)("group",{"rotation-y":e>0?Math.PI:0,"position-y":.05,children:[0,1,2,3,4,5].map(e=>(0,t.jsxs)("group",{position:[a+.42*e,0,.6],children:[(0,t.jsx)("mesh",{material:r.wood,"position-y":.18,children:(0,t.jsx)("boxGeometry",{args:[.38,.06,1.1]})}),e%2==0&&[-.45,.45].map(e=>(0,t.jsx)("mesh",{material:r.trunk,position:[0,-.2,e],children:(0,t.jsx)("cylinderGeometry",{args:[.05,.05,.8,5]})},e))]},e))})}function C({toon:e}){let i=(0,r.useRef)(null);return(0,a.useFrame)(({clock:e})=>{i.current&&(i.current.intensity=3+2.5*Math.sin(2*e.elapsedTime))}),(0,t.jsxs)("group",{children:[[0,1,2,3].map(r=>(0,t.jsx)("mesh",{material:r%2?e.red:e.white,"position-y":.35+.6*r,castShadow:!0,children:(0,t.jsx)("cylinderGeometry",{args:[.3-.02*r,.34-.02*r,.6,10]})},r)),(0,t.jsx)("mesh",{material:e.navy,"position-y":2.85,children:(0,t.jsx)("cylinderGeometry",{args:[.3,.26,.3,10]})}),(0,t.jsx)("mesh",{material:e.gold,"position-y":3.05,children:(0,t.jsx)("sphereGeometry",{args:[.16,8,6]})}),(0,t.jsx)("mesh",{material:e.red,"position-y":3.3,children:(0,t.jsx)("coneGeometry",{args:[.34,.3,10]})}),(0,t.jsx)("pointLight",{ref:i,color:"#ffe9a8",intensity:3,distance:12,position:[0,3.05,0]})]})}function T({radius:e}){let i=(0,r.useRef)(null);return(0,a.useFrame)(({clock:e})=>{let t=i.current;if(!t)return;let r=e.elapsedTime;t.material.opacity=.22+.1*Math.sin(1.3*r),t.scale.setScalar(1+.02*Math.sin(1.3*r))}),(0,t.jsxs)("mesh",{ref:i,"rotation-x":-Math.PI/2,"position-y":-.09,children:[(0,t.jsx)("ringGeometry",{args:[e,e+.9,48]}),(0,t.jsx)("meshBasicMaterial",{color:"#e8f0ff",transparent:!0,opacity:.25,depthWrite:!1})]})}function D({url:e,footprint:a,onHeight:o}){let{scene:n}=(0,i.useGLTF)(e),l=(0,r.useMemo)(()=>{n.updateWorldMatrix(!0,!0);let e=new s.Box3().setFromObject(n),t=e.getSize(new s.Vector3),r=e.getCenter(new s.Vector3),i=a/Math.max(t.x,t.z);return{scale:i,height:t.y*i,offset:new s.Vector3(-r.x*i,-e.min.y*i,-r.z*i)}},[n,a]);return(0,r.useEffect)(()=>o(l.height),[l.height,o]),(0,t.jsx)("group",{position:l.offset,scale:l.scale,children:(0,t.jsx)("primitive",{object:n})})}function R({index:e,side:a,terrain:i,toon:s,last:o}){let n=(0,r.useMemo)(()=>{let t=M(e+77),r=(e,r,a,s)=>{let o=[];for(let n=0;n<e;n++){let e=t()*Math.PI*2,n=.2+.8*t(),l=i.coast(e)*n,u=Math.cos(e)*l,c=Math.sin(e)*l,f=g(i,u,c,r);x(i,u,c,r)<a&&s(u,c,f,n)&&o.push([u,f-.04,c])}return o},s=r(60,.22,.3,(e,r,i,s)=>s>.6&&s<.9&&i<.75&&(e*a<.6||.35>t())).slice(0,4+e%2),o=r(80,.2,.35,(e,t,r,a)=>a<.8&&r>.4&&r<1.9).slice(0,7),n=r(40,.4,1.2,(e,t,r,i)=>i<.7&&r>1.6&&-e*a>0).slice(0,2);return{palms:s.map((r,a)=>({p:r,lean:.1+.2*t(),twist:Math.atan2(r[2],-r[0]),h:1.1+.6*t(),seed:10*e+a})),bushes:o.map(e=>({p:e,s:.18+.18*t()})),crags:n.map((r,a)=>({p:r,s:.45+.3*t(),seed:7*e+a}))}},[e,a,i]),l=a>0?Math.PI:0,u=i.coast(l)-.35;return(0,t.jsxs)("group",{children:[(0,t.jsx)("mesh",{geometry:i.geometry,material:s.land,castShadow:!0,receiveShadow:!0}),(0,t.jsx)(E,{geometry:i.foam}),n.palms.map((e,r)=>(0,t.jsx)(P,{position:e.p,toon:s,lean:e.lean,twist:e.twist,height:e.h,seed:e.seed},r)),n.bushes.map((e,r)=>(0,t.jsx)("mesh",{material:s.bush,position:[e.p[0],e.p[1]+.45*e.s,e.p[2]],scale:[1,.8,1],castShadow:!0,children:(0,t.jsx)("sphereGeometry",{args:[e.s,7,5]})},r)),n.crags.map((e,r)=>(0,t.jsx)(_,{position:[e.p[0],e.p[1]-.2,e.p[2]],toon:s,seed:e.seed,scale:e.s},r)),(0,t.jsx)(j,{side:a,toon:s,from:u}),o&&(0,t.jsx)("group",{position:[-1.1*a,g(i,-1.1*a,-.6,.35)-.05,-.6],children:(0,t.jsx)(C,{toon:s})})]})}function E({geometry:e}){let i=(0,r.useRef)(null);return(0,a.useFrame)(({clock:e})=>{let t=i.current;if(!t)return;let r=e.elapsedTime;t.material.opacity=.2+.1*Math.sin(1.3*r),t.scale.setScalar(1+.015*Math.sin(1.3*r))}),(0,t.jsx)("mesh",{ref:i,geometry:e,"position-y":-.12,children:(0,t.jsx)("meshBasicMaterial",{color:"#e8f0ff",transparent:!0,opacity:.25,depthWrite:!1})})}function A({url:e,index:a,footprint:o,onHeight:n}){let l=(0,i.useGLTF)(e),u=null==a?l.scene:l.scenes[a],c=(0,r.useMemo)(()=>{u.updateWorldMatrix(!0,!0),u.traverse(e=>{e.isMesh&&(e.castShadow=e.receiveShadow=!0)});let e=new s.Box3;u.traverse(t=>{t.isMesh&&t.visible&&e.expandByObject(t)});let t=e.getSize(new s.Vector3),r=e.getCenter(new s.Vector3),a=o/Math.max(t.x,t.z);return{scale:a,height:e.max.y*a,offset:new s.Vector3(-r.x*a,0,-r.z*a)}},[u,o]);return(0,r.useEffect)(()=>n(c.height),[c.height,n]),(0,t.jsx)("group",{position:c.offset,scale:c.scale,children:(0,t.jsx)("primitive",{object:u})})}e.s(["Clouds",0,function({toon:e}){let i=(0,r.useRef)(null),s=(0,r.useMemo)(()=>{let e=M(99);return Array.from({length:20},(t,r)=>({x:(r%2?1:-1)*(11+16*e()),y:6.5+3.5*e(),z:-(7*r)+14,s:.9+1.1*e(),puffs:Array.from({length:7},(t,r)=>({x:(r-3)*.55+(e()-.5)*.3,y:(e()-.2)*.35,r:.55+.45*e()}))}))},[]);return(0,a.useFrame)(({clock:e})=>{i.current?.children.forEach((t,r)=>{t.position.x=s[r].x+2*Math.sin(.08*e.elapsedTime+r)})}),(0,t.jsx)("group",{ref:i,children:s.map((r,a)=>(0,t.jsxs)("group",{position:[r.x,r.y,r.z],scale:[r.s,.65*r.s,r.s],children:[r.puffs.map((r,a)=>(0,t.jsx)("mesh",{material:e.white,position:[r.x,Math.max(0,r.y),0],children:(0,t.jsx)("sphereGeometry",{args:[r.r,10,8]})},a)),(0,t.jsx)("mesh",{material:e.white,"position-y":-.1,scale:[1,.25,1],children:(0,t.jsx)("sphereGeometry",{args:[2,10,6]})})]},a))})},"Foam",0,E,"Island",0,function({index:e,position:i,reached:o,course:n,toon:l,last:u,landmark:c,model:f,sculpted:d=!1,setModel:h,style:p=d?"sculpted":"current",load:m=!0}){let[v,g]=(0,r.useState)(0),x=(0,r.useRef)(null),E=(0,r.useRef)(null),k=(0,r.useRef)(0),z=(0,r.useRef)(0),L=Math.sign(i.x)||1;(0,r.useMemo)(()=>M(e+3),[e]);let U=(0,r.useMemo)(()=>S(new s.CylinderGeometry(2.3,2.7,.6,16,1),e+11,.1),[e]),F=(0,r.useMemo)(()=>S(new s.CylinderGeometry(3,3.5,1.4,16,1),e+23,.06),[e]),O=(0,r.useMemo)(()=>{let t=M(e+41);return Array.from({length:6},()=>({a:t()*Math.PI*2,d:.9+1.2*t(),s:.18+.16*t()}))},[e]),N=(0,r.useMemo)(()=>{let t=M(e+61);return Array.from({length:3},(e,r)=>({a:r/3*Math.PI*2+.9*t(),d:1.3+.8*t(),lean:(t()-.5)*.5,h:1.1+.6*t()}))},[e]),I=b(e+1,L),B="sculpted"===p,G="set"===p&&!!h,V=v>0,H=G?V?v+2:I.maxHeight+1.9:B?I.maxHeight+1.9:f?.4+v+1.2:4.4,W=[1.7*L,B?I.height(1.7*L,1.3):.8,1.3],$=[.9*L,B?I.height(.9*L,1.4)+.15:.95,1.4];return(0,a.useFrame)(({clock:t},r)=>{let a=o.current?.[e]??!1,i=t.elapsedTime;if(x.current&&(x.current.material.color.set(a?y:w),x.current.rotation.y=.25*Math.sin(3*i+e)),E.current){E.current.position.y=H+.18*Math.sin(1.1*i+e);let t=(n?.current?.dir??1)<0?Math.PI:0;k.current+=(t-k.current)*(1-Math.exp(-(2.2*r))),E.current.rotation.y=k.current+.4*Math.sin(.35*i+e),z.current++%30==0&&E.current.traverse(e=>void(e.isMesh&&(e.castShadow=!0)))}}),(0,t.jsxs)("group",{position:[i.x,G?.3:B?.1:.45,i.z],children:[!B&&!G&&(0,t.jsx)(T,{radius:3.4}),!B&&!G&&(0,t.jsx)("mesh",{geometry:F,material:l.sand,"position-y":-.5}),!B&&!G&&(0,t.jsx)("mesh",{material:l.wetSand,"position-y":-.1,"rotation-x":-Math.PI/2,children:(0,t.jsx)("ringGeometry",{args:[2.75,3.25,24]})}),G?(0,t.jsxs)(t.Fragment,{children:[!V&&(0,t.jsx)(R,{index:e,side:L,terrain:I,toon:l,last:u}),(0,t.jsx)("group",{"rotation-y":1.3*e,children:(0,t.jsx)(r.Suspense,{fallback:null,children:m&&(0,t.jsx)(A,{url:h,footprint:9.5,onHeight:g})})})]}):B?(0,t.jsx)(R,{index:e,side:L,terrain:I,toon:l,last:u}):f?(0,t.jsx)("group",{"position-y":.2,children:(0,t.jsx)(r.Suspense,{fallback:null,children:m&&(0,t.jsx)(D,{url:f,footprint:7.2,onHeight:g})})}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("mesh",{geometry:U,material:l.grass,"position-y":.5}),(0,t.jsx)(_,{position:[.5*L,.75,-.6],toon:l,seed:e+5,scale:u?.7:.9+e%2*.25}),O.map((e,r)=>(0,t.jsx)("mesh",{material:l.bush,position:[Math.cos(e.a)*e.d,.8+.5*e.s,Math.sin(e.a)*e.d],scale:[1,.8,1],children:(0,t.jsx)("sphereGeometry",{args:[e.s,7,5]})},r)),N.map((r,a)=>(0,t.jsx)(P,{position:[Math.cos(r.a)*r.d,.8,Math.sin(r.a)*r.d],toon:l,lean:r.lean,height:r.h,seed:10*e+a},a))]}),!B&&!G&&(0,t.jsx)(j,{side:L,toon:l}),!G&&(0,t.jsx)("mesh",{material:l.navy,position:[W[0],W[1]+.8,W[2]],castShadow:!0,children:(0,t.jsx)("cylinderGeometry",{args:[.04,.04,1.6,4]})}),(0,t.jsxs)("mesh",{ref:x,position:[W[0]+.32,W[1]+1.35,W[2]],visible:!G,children:[(0,t.jsx)("planeGeometry",{args:[.6,.4]}),(0,t.jsx)("meshToonMaterial",{color:w,side:s.DoubleSide})]}),u&&!G&&(0,t.jsxs)(t.Fragment,{children:[!f&&!B&&!G&&(0,t.jsx)("group",{position:[-1.2*L,.8,-.9],children:(0,t.jsx)(C,{toon:l})}),(0,t.jsxs)("group",{position:$,"rotation-y":.4*L,children:[(0,t.jsx)("mesh",{material:l.wood,children:(0,t.jsx)("boxGeometry",{args:[.7,.4,.45]})}),(0,t.jsx)("mesh",{material:l.gold,"position-y":.28,children:(0,t.jsx)("cylinderGeometry",{args:[.23,.23,.7,8,1,!1,0,Math.PI]})})]})]}),(0,t.jsx)("group",{ref:E,position:[0,H,0],scale:.75,children:(0,t.jsx)(r.Suspense,{fallback:null,children:m&&c})})]})},"IslandSetModel",0,A,"Jetty",0,j,"Lighthouse",0,C,"Palm",0,P,"Rock",0,_,"SculptedLand",0,R,"useToon",0,function(){return(0,r.useMemo)(()=>{let e=new Uint8Array([90,170,255]),t=new s.DataTexture(e,3,1,s.RedFormat);t.magFilter=s.NearestFilter,t.minFilter=s.NearestFilter,t.needsUpdate=!0;let r=e=>new s.MeshToonMaterial({color:e,gradientMap:t});return{sand:r("#e8d8ba"),wetSand:r("#cdb98f"),grass:r("#3f8a3a"),dark:r("#2d6f4a"),bush:r("#2a6a3a"),rock:r("#5d6b7a"),trunk:r("#8f5a2e"),wood:r("#7a4a26"),coconut:r("#5a3a1e"),white:r("#f4f1ea"),red:r("#d23a2f"),navy:r("#1d2850"),gold:r("#f2c94c"),pink:r(y),land:new s.MeshToonMaterial({vertexColors:!0,gradientMap:t})}},[])}],63071)},30977,e=>{"use strict";e.i(47167);var t=e.i(43476),r=e.i(71645),a=e.i(17249),i=e.i(75056),s=e.i(95393),o=e.i(90874),n=e.i(43257),l=e.i(48455),u=e.i(43216),c=e.i(93021),f=e.i(78140),d=e.i(90072),h=e.i(37801),p=e.i(22494),m=e.i(85516),v=e.i(7189),g=e.i(17959),x=e.i(2662),b=e.i(63071),y=e.i(37773),w=e.i(59788);let M="#c9d4f5",S=(0,h.isPhone)()?"./models/merry-m.glb":"./models/merry-2k.glb",P=(0,h.isPhone)()?"./models/elena-standing-m.glb":"./models/elena-standing-d.glb",_=["./models/isle-a.glb","./models/isle-e.glb","./models/isle-c.glb","./models/isle-d.glb","./models/isle-b.glb"],j=["./models/island-t01.glb","./models/island-t02.glb","./models/island-t04.glb","./models/island-t06.glb","./models/island-t08.glb"],C=-Math.PI/2,T=new d.Vector3(0,0,12),D=[[6.5,0,-20],[-6.5,0,-44],[6.5,0,-68],[-6.5,0,-92],[3.5,0,-116]].map(([e,t,r])=>new d.Vector3(e,t,r)),R=new d.Vector3(2,0,-175),E=[T,...D.map(e=>new d.Vector3(e.x-6*Math.sign(e.x),0,e.z+.5)),R],A=E.length-1,k=e=>e<=5?e:5+(e-5)*.5,z=new d.CatmullRomCurve3(E,!1,"catmullrom",.6),L=e=>e*e*(3-2*e),U=e=>Math.min(1,Math.max(0,e)),F=e=>L(U((e-.02)/.17)),O={radius:.6,lift:.15,pan:.35,lookPan:.15,azimuth:-25,lookY:.15,fov:37,light:"warm"},N={studio:{name:"Studio",env:1,key:["#fff4e6",24],rim:["#9fdcff",12],fill:["#ffffff",0]},soft:{name:"Soft",env:1.5,key:["#ffffff",10],rim:["#ffffff",6],fill:["#ffffff",6]},warm:{name:"Warm key",env:.7,key:["#ffd9a8",34],rim:["#7fb8ff",10],fill:["#ffe9d0",4]},golden:{name:"Golden hour",env:.6,key:["#ffb86b",40],rim:["#ff8fb0",16],fill:["#ffd0a0",6]},moon:{name:"Moonlit",env:.45,key:["#dfe8ff",18],rim:["#fea0c0",20],fill:["#8fa6ff",4]},neon:{name:"Neon",env:.5,key:["#fea0c0",30],rim:["#5be0ff",26],fill:["#7a5cff",6]},dramatic:{name:"Dramatic",env:.25,key:["#fff4e6",34],rim:["#9fdcff",30],fill:["#ffffff",0]},flat:{name:"Flat",env:2,key:["#ffffff",0],rim:["#ffffff",0],fill:["#ffffff",0]}},I=(e,[t,r])=>{e&&(e.color.set(t),e.intensity=r,e.visible=r>0)},B={night:{name:"Night",heroSky:"#1c2b6a",mapSky:"#0f1f4d",hemi:["#dfe8ff","#0f1f4d",.8],sun:["#ffffff",1.5],fill:["#fea0c0",.6],sea:"#0e2d68",stars:!0},dusk:{name:"Dusk",heroSky:"#4a2f78",mapSky:"#22285e",hemi:["#ffd4b8","#1a2050",1.1],sun:["#ffb37a",2],fill:["#fea0c0",1],sea:"#1b3f86",stars:!0},day:{name:"Day",heroSky:"#79bdff",mapSky:"#5aa0f0",hemi:["#ffffff","#2b5aa8",1.3],sun:["#fff6e0",2.8],fill:["#c9d4f5",.5],sea:"#1f74d0",stars:!1},golden:{name:"Golden hour",heroSky:"#ffb36b",mapSky:"#c86f63",hemi:["#ffe0b0","#4a2a3a",1.2],sun:["#ffcf8a",3],fill:["#ff8fb0",.9],sea:"#2a63b0",stars:!1},candy:{name:"Candy",heroSky:"#3a1f6e",mapSky:"#1a1f50",hemi:["#fea0c0","#1d2850",1.1],sun:["#ffe4ec",2.2],fill:["#5be0ff",1],sea:"#2d3f93",stars:!0}},G="golden",V=new d.Color("#050d24"),H=new d.Color("#0d2a60"),W=[[1,.35,.13,10],[-.55,1,.11,6.2],[.8,-.6,.09,3.4],[-.3,-1,.06,1.9]];function $(e,t,r){let a=0;for(let[i,s,o,n]of W){let l=Math.hypot(i,s),u=2*Math.PI/n,c=Math.sqrt(9.8/u),f=u*(i/l*e+-(s/l*t)-c*r*.35);a+=o/u*Math.sin(f)}return a}function q({mood:e,retro:a}){let i=(0,r.useRef)(null),o=(0,r.useMemo)(()=>{let e,t,r;return e={uTime:{value:0},uOffset:{value:new d.Vector2},tShore:{value:null},uShoreRes:{value:new d.Vector2(1,1)},uNear:{value:.1},uFar:{value:1e3},uShoreOn:{value:0},uDeep:{value:0}},t=new d.MeshPhysicalMaterial({color:"#0e2d68",roughness:.28,metalness:.08,clearcoat:.7,clearcoatRoughness:.3,transparent:!0}),r=W.map(([e,t,r,a])=>`wave(p, vec2(${e.toFixed(2)}, ${t.toFixed(2)}), ${r.toFixed(2)}, ${a.toFixed(2)}, uTime, off, tangent, binormal, crest);`).join("\n"),t.onBeforeCompile=t=>{t.uniforms.uTime=e.uTime,t.uniforms.uOffset=e.uOffset,t.uniforms.tShore=e.tShore,t.uniforms.uShoreRes=e.uShoreRes,t.uniforms.uNear=e.uNear,t.uniforms.uFar=e.uFar,t.uniforms.uShoreOn=e.uShoreOn,t.uniforms.uDeep=e.uDeep,t.vertexShader=`
      uniform float uTime;
      uniform vec2 uOffset;
      varying float vCrest;
      void wave(vec2 p, vec2 dir, float steep, float len, float t, inout vec3 off, inout vec3 tangent, inout vec3 binormal, inout float crest) {
        vec2 d = normalize(dir);
        float k = 6.28318 / len;
        float c = sqrt(9.8 / k);
        float f = k * (dot(d, p) - c * t * 0.35);
        float a = steep / k;
        off += vec3(d * a * cos(f), a * sin(f));
        tangent += vec3(-d.x * d.x * steep * sin(f), -d.x * d.y * steep * sin(f), d.x * steep * cos(f));
        binormal += vec3(-d.x * d.y * steep * sin(f), -d.y * d.y * steep * sin(f), d.y * steep * cos(f));
        crest += sin(f) * steep;
      }
      ${t.vertexShader}`.replace("#include <beginnormal_vertex>",`vec3 waveOff = vec3(0.0);
         vec3 tangent = vec3(1.0, 0.0, 0.0);
         vec3 binormal = vec3(0.0, 1.0, 0.0);
         float crest = 0.0;
         { vec2 p = position.xy + uOffset; vec3 off = vec3(0.0); ${r} waveOff = off; }
         vCrest = crest;
         vec3 objectNormal = normalize(cross(tangent, binormal));
         #ifdef USE_TANGENT
           vec3 objectTangent = vec3(tangent.xyz);
         #endif`).replace("#include <begin_vertex>","vec3 transformed = position + waveOff;"),t.fragmentShader=`varying float vCrest;
      uniform sampler2D tShore;
      uniform vec2 uShoreRes;
      uniform float uNear;
      uniform float uFar;
      uniform float uShoreOn;
      uniform float uDeep;
      uniform float uTime;
      float shoreLinear(float z) { return (2.0 * uNear * uFar) / (uFar + uNear - (z * 2.0 - 1.0) * (uFar - uNear)); }
      ${t.fragmentShader}`.replace("#include <color_fragment>",`#include <color_fragment>
       // Foam along the crests, a touch of teal in the troughs.
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.22, 0.42) * (1.0 - uDeep * 0.7), smoothstep(-0.5, 0.0, -vCrest) * 0.35);
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.92, 1.0), smoothstep(0.42, 0.62, vCrest) * 0.75);
       // The shoreline: how much water lies over the ground behind this pixel (from the depth pre-pass). Where it
       // is shallow the water thins out and a band of foam laps against the land.
       if (uShoreOn > 0.5) {
         vec2 suv = gl_FragCoord.xy / uShoreRes;
         float water = shoreLinear(texture2D(tShore, suv).x) - shoreLinear(gl_FragCoord.z);
         // A tight, clean line right at the water's edge, and a soft wash a little further out that breathes.
         float edge = 1.0 - smoothstep(0.02, 0.22, water);
         float wash = (1.0 - smoothstep(0.15, 0.7, water)) * (0.5 + 0.5 * sin(water * 9.0 - uTime * 1.4 + vCrest * 1.5));
         float foam = clamp(edge * 0.9 + wash * 0.3, 0.0, 1.0);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), foam);
         diffuseColor.a *= smoothstep(0.0, 0.18, water);
       }`)},{material:t,uniforms:e}},[]);(0,r.useEffect)(()=>()=>o.material.dispose(),[o]);let n=!(0,h.isPhone)(),l=(0,r.useMemo)(()=>({target:new d.WebGLRenderTarget(1,1,{depthTexture:new d.DepthTexture(1,1)}),depth:new d.MeshDepthMaterial}),[]);(0,r.useEffect)(()=>()=>{l.target.dispose(),l.depth.dispose()},[l]);let u=(0,r.useMemo)(()=>new d.Vector2,[]),c=(0,r.useRef)(null);return(0,s.useFrame)(({camera:t,clock:r,gl:s,scene:f})=>{var d,h,p,m;let v=i.current;if(!v)return;v.position.set(2*Math.round(t.position.x/2),0,2*Math.round(t.position.z/2));let g=e.current?.deep??0;d=r.elapsedTime,h=v.position.x,p=v.position.z,m=e.current?.sea??B.night.sea,o.uniforms.uTime.value=d,o.uniforms.uOffset.value.set(h,-p),o.uniforms.uDeep.value=g,o.material.color.set(m).lerp(V,g),o.material.clearcoat=.7-.45*g,c.current?.color.copy(H).lerp(V,g),n&&(!function(e,t,r,a,i,s){e.shadowMap.autoUpdate=!1,e.shadowMap.needsUpdate=!0;let o=Math.max(1,Math.floor(s.x)),n=Math.max(1,Math.floor(s.y));(a.target.width!==o||a.target.height!==n)&&a.target.setSize(o,n);let l=[];t.traverse(e=>{if(!e.visible)return;let t=e.material;(e.userData.paint||e.isPoints||e.isLine||e.isLine2||e.isLineSegments2||e.isSprite||t&&t.transparent)&&(e.visible=!1,l.push(e))});let u=t.overrideMaterial;for(let i of(t.overrideMaterial=a.depth,e.setRenderTarget(a.target),e.clear(),e.render(t,r),e.setRenderTarget(null),t.overrideMaterial=u,l))i.visible=!0;i.uniforms.tShore.value=a.target.depthTexture,i.uniforms.uShoreRes.value.copy(s),i.uniforms.uNear.value=r.near,i.uniforms.uFar.value=r.far,i.uniforms.uShoreOn.value=1}(s,f,t,l,o,s.getDrawingBufferSize(u)),a?.current&&0!==a.current.mode||s.render(f,t))},+!!n),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("mesh",{ref:i,material:o.material,"rotation-x":-Math.PI/2,receiveShadow:!0,userData:{paint:!0},renderOrder:-1,children:(0,t.jsx)("planeGeometry",{args:[150,150,170,170]})}),(0,t.jsxs)("mesh",{"rotation-x":-Math.PI/2,position:[0,-2.5,-40],userData:{paint:!0},children:[(0,t.jsx)("planeGeometry",{args:[700,700]}),(0,t.jsx)("meshStandardMaterial",{ref:c,color:"#0d2a60",roughness:.6})]})]})}let Q=["Keynote","Workshop & Serious Game","Gamification Concept"],X=["./images/cartridges/keynote-stage.webp","./images/cartridges/workshop-v2.webp","./images/cartridges/concept-whiteboard.webp"],K=["#262c40","#262c40","#262c40"];function Y({index:e,font:r}){switch(e){case 0:return(0,t.jsx)("group",{scale:1.8,children:(0,t.jsx)(g.CartridgesPower,{font:r,titles:Q,plastics:K,images:X})});case 1:return(0,t.jsx)(g.MicPower,{});case 2:return(0,t.jsx)("group",{scale:2.2,children:(0,t.jsx)(g.BooksPower,{})});case 3:return(0,t.jsxs)("group",{scale:1.6,children:[(0,t.jsx)(ee,{font:r,text:Z("LinkedIn"),color:"#fea0c0",position:[-1,1.75,-.7],width:2.4}),(0,t.jsx)(ee,{font:r,text:Z("Instagram"),color:"#c9d4f5",position:[1.5,1.95,-.8],width:2.4}),(0,t.jsx)("group",{position:[-1.1,0,0],rotation:[.15,Math.PI+.35,-.12],children:(0,t.jsx)(x.SocialCartridge,{platform:"LinkedIn",plastic:"#fea0c0"})}),(0,t.jsx)("group",{position:[1.1,.2,-.2],rotation:[.15,Math.PI-.35,.12],children:(0,t.jsx)(x.SocialCartridge,{platform:"Instagram",plastic:"#c9d4f5"})})]});default:return(0,t.jsxs)("group",{children:[(0,t.jsx)("group",{position:[-1.9,-.1,.5],children:(0,t.jsx)(g.SnesPad,{width:3.9,rotation:[Math.PI/2-.65,-.25,.08]})}),(0,t.jsx)("group",{position:[1.9,.2,-.3],children:(0,t.jsx)(g.SnesPad,{width:3.9,rotation:[Math.PI/2-.6,.2,-.08]})})]})}}function J(e,t,r,a=2048,i=560){let s=document.createElement("canvas");s.width=a,s.height=i;let o=s.getContext("2d");o.fillStyle=r,o.textAlign="center",o.textBaseline="middle";let n=i-40;for(o.font=`700 ${n}px ${e}`;o.measureText(t).width>a-48&&n>100;)o.font=`700 ${n-=10}px ${e}`;o.fillText(t,a/2,.54*i);let l=new d.CanvasTexture(s);return l.colorSpace=d.SRGBColorSpace,l.anisotropy=8,l}let Z=e=>`${Math.round((a.CHANNELS.find(t=>t.platform===e)?.count??0)/1e3)}K`;function ee({font:e,text:a,color:i,position:s,width:o}){let n=(0,r.useMemo)(()=>J(e,a,i,1024,720),[e,a,i]);return(0,r.useEffect)(()=>()=>n.dispose(),[n]),(0,t.jsxs)("mesh",{position:s,children:[(0,t.jsx)("planeGeometry",{args:[o,720*o/1024]}),(0,t.jsx)("meshBasicMaterial",{map:n,transparent:!0,toneMapped:!1,depthWrite:!1})]})}function et({progress:e,onHeading:a,onReady:i,mood:n,font:l,retro:u,heroCam:c,studio:p,course:v}){let g=(0,r.useRef)(null),x=(0,h.isPhone)(),b=(0,r.useMemo)(()=>J(l,"VOYAGE","#fea0c0",2048,560),[l]);(0,r.useEffect)(()=>()=>b.dispose(),[b]);let y=(0,r.useRef)({tick:-1,position:new d.Vector3,rotation:new d.Euler}),{scene:w}=(0,f.useGLTF)(S),M=(0,r.useRef)(null),P=(0,r.useRef)(z.getPoint(0).clone()),_=(0,r.useRef)(!1),j=(0,r.useRef)(new d.Vector3),T=(0,r.useRef)(!1),E=(0,r.useRef)(null),{camera:G}=(0,o.useThree)(),V=(0,r.useRef)(null),H=(0,r.useRef)(null),W=(0,r.useRef)(null),q=(0,r.useRef)(null),Q=(0,r.useMemo)(()=>{w.updateWorldMatrix(!0,!0);let e=new d.Box3().setFromObject(w),t=e.getSize(new d.Vector3),r=e.getCenter(new d.Vector3),a=3.6/Math.max(t.x,t.z),i=new d.Raycaster(new d.Vector3(-1.85,e.max.y+1,-.45),new d.Vector3(0,-1,0)).intersectObject(w,!0).filter(r=>r.point.y>e.min.y+.15*t.y);return{scale:a,deck:i.length?Math.min(...i.map(e=>e.point.y)):r.y,offset:new d.Vector3(-r.x*a,-e.min.y*a-.1,-r.z*a)}},[w]);return(0,s.useFrame)(({clock:t,scene:r},i)=>{let s,o=M.current;if(!o)return;let l=t.elapsedTime,f=d.MathUtils.clamp(k(e.current??0),0,A),h=f/A,p=z.getPoint(h);_.current&&8>p.distanceTo(j.current)?P.current.lerp(p,1-Math.exp(-(4*i))):(P.current.copy(p),_.current=!0),j.current.copy(p);let m=z.getTangent(Math.min(h+.002,1)),b=P.current.x,w=P.current.z,S=d.MathUtils.lerp(.25,1,F(e.current??0));o.position.set(b,$(b,w,l)*S,w);let Q=function(e,t,r){if(!e)return 1;if(!r)return e.dir=1,e.lastP=t,1;let a=t-e.lastP;return Math.abs(a)>5e-4&&(e.dir=a>0?1:-1,e.lastP=t),t<.03&&(e.dir=1),e.dir}(v.current,f,!x),X=Math.atan2(m.x,m.z)+Math.PI+C+(Q<0?Math.PI:0);if(T.current){let e=Math.atan2(Math.sin(X-o.rotation.y),Math.cos(X-o.rotation.y));o.rotation.y+=e*(1-Math.exp(-(2.2*i)))}else o.rotation.y=X,T.current=!0;let K=($(b+1,w,l)-$(b-1,w,l))/2,Y=($(b,w+1,l)-$(b,w-1,l))/2;o.rotation.z=d.MathUtils.lerp(o.rotation.z,-(.6*K)*S,.1),o.rotation.x=d.MathUtils.lerp(o.rotation.x,.6*Y*S,.1),o.updateMatrixWorld();let J=V.current?V.current.getWorldPosition(new d.Vector3):P.current.clone().add(new d.Vector3(0,2,0)),Z=new d.Vector3(-Math.cos(o.rotation.y),0,Math.sin(o.rotation.y)),ee=new d.Vector3(-Z.z,0,Z.x),et=F(f),er=c?.current??O,ea=N[er.light]??N.studio;I(H.current,ea.key),I(W.current,ea.rim),I(q.current,ea.fill);let ei=et*Math.PI+(x?0:(1-et)*er.azimuth*(Math.PI/180)),es=Math.sqrt(et),eo=d.MathUtils.lerp(x?2:er.radius,x?10:7.5,es),en=d.MathUtils.lerp(x?.6:er.lift,x?3.2:2.8,es),el=Z.clone().multiplyScalar(Math.cos(ei)).addScaledVector(ee,Math.sin(ei)),eu=(1-et)*(x?.5:er.pan),ec=J.clone().addScaledVector(el,eo).addScaledVector(ee,eu).add(new d.Vector3(0,en,0)),ef=L(U((et-.5)*2)),ed=J.clone().addScaledVector(Z,1.5*ef).addScaledVector(ee,(1-et)*(x?.2:er.lookPan)).add(new d.Vector3(0,d.MathUtils.lerp(x?.12:er.lookY,-.6,ef),0)),eh=x?38:d.MathUtils.lerp(er.fov,38,es);Math.abs(G.fov-eh)>.01&&(G.fov=eh,G.updateProjectionMatrix());let ep=P.current.clone().addScaledVector(Z,x?-18:-15).add(new d.Vector3(0,x?15:12.5,0)),em=P.current.clone().addScaledVector(Z,5).add(new d.Vector3(0,2.2,0)),ev=L(U((f-.17)/.33));g.current&&(g.current.material.opacity=(1-et)*(1-ev));let eg=ec.lerp(ep,ev),ex=ed.lerp(em,ev);if(f>5.5){let e=L(U((f-5.5)/(A-5.5))),t=d.MathUtils.lerp(x?10:8,x?24:20,e),r=d.MathUtils.lerp(2,3.2,e);eg=P.current.clone().addScaledVector(Z,-t).add(new d.Vector3(0,r,0)),ex=P.current.clone().addScaledVector(Z,4).add(new d.Vector3(0,1.4,0))}let eb=eg.sub(J);if(E.current?E.current.lerp(eb,1-Math.exp(-(3*i))):E.current=eb,G.position.copy(J).add(E.current),G.lookAt(ex),(s=u.current)&&!1!==s.twos&&(1===s.mode||4===s.mode)){let e=Math.floor(12*l),t=y.current;e!==t.tick?(t.tick=e,t.position.copy(o.position),t.rotation.copy(o.rotation)):(o.position.copy(t.position),o.rotation.copy(t.rotation))}let ey=new d.Color(n.current?.heroSky??B.night.heroSky).lerp(new d.Color(n.current?.mapSky??B.night.mapSky),ev);r.background?.copy(ey),r.fog&&(r.fog.color.copy(ey),r.fog.near=d.MathUtils.lerp(34,32,ev),r.fog.far=d.MathUtils.lerp(90,75,ev));let ew=f>5?R:D[Math.min(4,Math.max(0,Math.ceil(f)-1))];a(Math.atan2(ew.x-P.current.x,-(ew.z-P.current.z)))}),(0,t.jsx)("group",{ref:M,children:(0,t.jsxs)("group",{position:Q.offset,scale:Q.scale,children:[(0,t.jsx)("primitive",{object:w}),(0,t.jsxs)("mesh",{ref:g,position:x?[-1.45,Q.deck+1.405,-.67]:[-1.45,Q.deck+.9,-.715],scale:x?.285:.37,"rotation-y":-Math.PI/2,children:[(0,t.jsx)("planeGeometry",{args:[3.4,.9296875]}),(0,t.jsx)("meshBasicMaterial",{map:b,transparent:!0,depthWrite:!1,toneMapped:!1})]}),(0,t.jsx)("group",{ref:V,position:[-1.85,Q.deck+.475,-.45],"rotation-y":-Math.PI/2,children:(0,t.jsxs)(r.Suspense,{fallback:null,children:[(0,t.jsx)(er,{studio:p,heroCam:c}),(0,t.jsx)(m.SceneReady,{onReady:i})]})}),(0,t.jsx)("pointLight",{ref:H,position:[-4.35,Q.deck+2.5,1.2],color:"#ffd9a8",intensity:34,distance:12}),(0,t.jsx)("pointLight",{ref:W,position:[-.25,Q.deck+2.2,-1.6],color:"#7fb8ff",intensity:10,distance:7}),(0,t.jsx)("pointLight",{ref:q,position:[-3.05,Q.deck+.6,-2.2],color:"#ffe9d0",intensity:4,distance:6})]})})}function er({studio:e,heroCam:a}){let{scene:i}=(0,f.useGLTF)(P),o=(0,r.useRef)("");return(0,s.useFrame)(()=>{var t,r;let s=(a?.current??O).light;o.current!==s&&(t=e.environment,r=(N[s]??N.studio).env,t&&(i.traverse(e=>{if(e.isMesh)for(let a of Array.isArray(e.material)?e.material:[e.material])"envMap"in a&&(a.envMap!==t&&(a.envMap=t,a.needsUpdate=!0),a.envMapIntensity=r)}),1))&&(o.current=s)}),(0,t.jsx)(g.Fitted,{object:i,height:.95})}function ea({scene:e}){return(0,t.jsxs)(n.Environment,{scene:e,resolution:128,frames:1,children:[(0,t.jsx)(l.Lightformer,{intensity:3.2,position:[0,2,8],scale:[14,10,1],color:"#ffffff"}),(0,t.jsx)(l.Lightformer,{intensity:1.2,position:[-8,4,2],"rotation-y":Math.PI/2,scale:[10,8,1],color:"#fff3e2"}),(0,t.jsx)(l.Lightformer,{intensity:1,position:[8,3,-2],"rotation-y":-Math.PI/2,scale:[10,8,1],color:"#cfe9ff"}),(0,t.jsx)(l.Lightformer,{intensity:.8,position:[0,10,0],"rotation-x":Math.PI/2,scale:[12,12,1],color:"#e6f3ff"})]})}function ei({value:e}){let t=(0,o.useThree)(e=>e.gl);return(0,r.useEffect)(()=>{t.toneMappingExposure=e},[t,e]),null}function es({mood:e,toon:a}){let i=(0,r.useMemo)(()=>[(0,y.buildTerrain)(21,1,{radius:16,amplitude:1.1,cliff:1.4}),(0,y.buildTerrain)(22,-1,{radius:11,amplitude:.9}),(0,y.buildTerrain)(23,1,{radius:20,amplitude:1.3,cliff:1.6})],[]),s=(0,r.useMemo)(()=>{let e,t,r,a;return(e=document.createElement("canvas")).width=e.height=256,(r=(t=e.getContext("2d")).createRadialGradient(128,128,0,128,128,128)).addColorStop(0,"rgba(255,255,255,0.9)"),r.addColorStop(.25,"rgba(255,255,255,0.35)"),r.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=r,t.fillRect(0,0,256,256),(a=new d.CanvasTexture(e)).colorSpace=d.SRGBColorSpace,a},[]);(0,r.useEffect)(()=>()=>s.dispose(),[s]);let o=e.stars,n=o?"#c9d4f5":e.sun[0];return(0,t.jsxs)("group",{children:[[[34,84],[-6,98],[-44,90]].map(([e,r],s)=>(0,t.jsx)("mesh",{geometry:i[s].geometry,material:a.land,position:[e,-.3,r]},s)),(0,t.jsxs)("group",{position:[36,18,100],children:[(0,t.jsxs)("mesh",{children:[(0,t.jsx)("circleGeometry",{args:[6,48]}),(0,t.jsx)("meshBasicMaterial",{color:o?"#f3efdc":"#fff1c4",fog:!1,side:d.DoubleSide,toneMapped:!1})]}),(0,t.jsx)("sprite",{scale:[46,46,1],"position-z":-.5,children:(0,t.jsx)("spriteMaterial",{map:s,color:n,transparent:!0,opacity:o?.5:.75,depthWrite:!1,fog:!1})})]})]})}function eo({progress:e,mood:a,shadows:i}){let o=(0,r.useRef)(null),n=(0,r.useMemo)(()=>new d.Object3D,[]);return(0,s.useFrame)(()=>{let t=o.current;if(!t)return;let r=z.getPoint(d.MathUtils.clamp(k(e.current??0),0,A)/A);t.position.set(r.x+9,18,r.z+6),n.position.copy(r),n.updateMatrixWorld()}),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("directionalLight",{ref:o,target:n,intensity:a.sun[1],color:a.sun[0],castShadow:i,"shadow-mapSize":[2048,2048],"shadow-bias":-4e-4,"shadow-normalBias":.02,"shadow-camera-left":-24,"shadow-camera-right":24,"shadow-camera-top":24,"shadow-camera-bottom":-24,"shadow-camera-near":2,"shadow-camera-far":60}),(0,t.jsx)("primitive",{object:n})]})}function en({progress:e,onHeading:a,onReady:i,font:n,mood:l,moodRef:f,islands:p,retro:m,heroCam:v}){let g=(0,b.useToon)(),x="current"!==p,y=(0,o.useThree)(),w=(0,r.useMemo)(()=>new d.Scene,[]);(0,r.useEffect)(()=>{},[y.scene,y.camera]);let S=x&&!(0,h.isPhone)(),P=(0,r.useRef)([,,,,,].fill(!1)),C=(0,r.useRef)({dir:1,lastP:0}),T=(0,r.useRef)(null),[R,E]=(0,r.useState)(2),[L,U]=(0,r.useState)(!1),F=(0,r.useCallback)(()=>{U(!0),i?.()},[i]);(0,s.useFrame)(()=>{let t=e.current??0;for(let e=0;e<5;e++)P.current[e]=t>=e+1-.15;if(T.current){let e=z.getPoint(d.MathUtils.clamp(k(t),0,A)/A),r=0;for(let t=1;t<5;t++)D[t].distanceTo(e)<D[r].distanceTo(e)&&(r=t);let a=T.current,i=a.userData.island!==r;a.userData.island=r,a.position.set(D[r].x,D[r].y+2.4,D[r].z);let s=P.current[r]?14:2;a.intensity=i?s:d.MathUtils.lerp(a.intensity,s,.03)}let r=L?5:Math.min(5,Math.max(2,Math.ceil(t)+2));E(e=>e===r?e:r)});let O=(0,r.useMemo)(()=>z.getPoints(260).map(e=>[e.x,.5,e.z]),[]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("hemisphereLight",{args:l.hemi}),(0,t.jsx)(eo,{progress:e,mood:l,shadows:S}),(0,t.jsx)("directionalLight",{position:[-8,3,8],intensity:l.fill[1],color:l.fill[0]}),x&&(0,t.jsx)("directionalLight",{position:[-6,5,-12],intensity:.9,color:M}),l.stars&&(0,t.jsx)(c.Stars,{radius:120,depth:40,count:1500,factor:3,fade:!0}),(0,t.jsx)(ea,{scene:w}),(0,t.jsx)("pointLight",{ref:T,color:"#fea0c0",intensity:2,distance:9}),(0,t.jsx)(q,{mood:f,retro:m}),(0,t.jsx)(es,{mood:l,toon:g}),(0,t.jsx)(u.Line,{points:O,color:M,transparent:!0,opacity:.5,dashed:!0,dashSize:.5,gapSize:.45,lineWidth:1.5}),D.map((e,r)=>(0,t.jsx)(b.Island,{index:r,position:e,reached:P,course:C,toon:g,last:4===r,landmark:(0,t.jsx)(Y,{index:r,font:n}),model:_[r],setModel:j[r],style:p,load:r<R},r)),(0,t.jsx)(r.Suspense,{fallback:null,children:(0,t.jsx)(et,{progress:e,onHeading:a,onReady:F,mood:f,font:n,retro:m,heroCam:v,studio:w,course:C})}),(0,t.jsx)(b.Clouds,{toon:g})]})}function el(e){let t=e.load.bind(e);e.load=(e,r,a,i)=>t(e,r,e=>{(0,m.heartbeat)(),a?.(e)},i)}e.s(["DEFAULT_MOOD",0,G,"HERO_CAM",0,O,"HERO_LIGHTS",0,N,"Horizon",0,es,"ISLANDS",0,5,"MOODS",0,B,"Sea",0,q,"WATER",0,[{id:"current",label:"Current",deep:0},{id:"darker",label:"Darker",deep:.5},{id:"deep",label:"Deep",deep:.9}],"default",0,function({progress:e,onHeading:a,onReady:s,mood:o=G,exposure:n=1,islands:l="sculpted",retro:u,heroCam:c,water:h=0}){f.useGLTF.preload(S,!0,!0,el),f.useGLTF.preload(P,!0,!0,el);let m=(0,v.useLoadedHeadlineFont)(),g=B[o]??B.night,x=(0,r.useMemo)(()=>h?{...g,deep:h}:g,[g,h]),b=(0,r.useRef)(u??{mode:0,fps:0});(0,r.useEffect)(()=>{b.current=u??{mode:0,fps:0}},[u]);let y=(0,r.useRef)(x);return(0,r.useEffect)(()=>{y.current=x},[x]),(0,t.jsxs)(i.Canvas,{frameloop:"always",dpr:p.SCENE_DPR,camera:{position:[-5.5,1.9,13.5],fov:38},gl:{antialias:!0},onCreated:({gl:e})=>{e.toneMapping=d.NeutralToneMapping},shadows:!0,children:[(0,t.jsx)("color",{attach:"background",args:[x.heroSky]}),(0,t.jsx)("fog",{attach:"fog",args:[x.heroSky,34,90]}),(0,t.jsx)(ei,{value:n}),m&&(0,t.jsx)(en,{progress:e,onHeading:a,onReady:s,font:m,mood:x,moodRef:y,islands:l,retro:b,heroCam:c}),u&&0!==u.mode&&(0,t.jsx)(w.RetroPost,{controls:b})]})},"waveHeight",0,$])},59788,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(95393),i=e.i(90874),s=e.i(90072);let o={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var n=s;class l{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}let u=new n.OrthographicCamera(-1,1,1,-1,0,1);class c extends n.BufferGeometry{constructor(){super(),this.setAttribute("position",new n.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new n.Float32BufferAttribute([0,2,0,0,2,0],2))}}let f=new c;class d{constructor(e){this._mesh=new n.Mesh(f,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,u)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class h extends l{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof s.ShaderMaterial?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=s.UniformsUtils.clone(e.uniforms),this.material=new s.ShaderMaterial({name:void 0!==e.name?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new d(this.material)}render(e,t,r){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=r.texture),this._fsQuad.material=this.material,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this._fsQuad.render(e)}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class p extends l{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,r){let a,i,s=e.getContext(),o=e.state;o.buffers.color.setMask(!1),o.buffers.depth.setMask(!1),o.buffers.color.setLocked(!0),o.buffers.depth.setLocked(!0),this.inverse?(a=0,i=1):(a=1,i=0),o.buffers.stencil.setTest(!0),o.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),o.buffers.stencil.setFunc(s.ALWAYS,a,0xffffffff),o.buffers.stencil.setClear(i),o.buffers.stencil.setLocked(!0),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),o.buffers.color.setLocked(!1),o.buffers.depth.setLocked(!1),o.buffers.color.setMask(!0),o.buffers.depth.setMask(!0),o.buffers.stencil.setLocked(!1),o.buffers.stencil.setFunc(s.EQUAL,1,0xffffffff),o.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),o.buffers.stencil.setLocked(!0)}}class m extends l{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class v{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),void 0===t){const r=e.getSize(new s.Vector2);this._width=r.width,this._height=r.height,(t=new s.WebGLRenderTarget(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:s.HalfFloatType})).texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new h(o),this.copyPass.material.blending=s.NoBlending,this.timer=new s.Timer}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);-1!==t&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),void 0===e&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),r=!1;for(let t=0,a=this.passes.length;t<a;t++){let a=this.passes[t];if(!1!==a.enabled){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,r),a.needsSwap){if(r){let t=this.renderer.getContext(),r=this.renderer.state.buffers.stencil;r.setFunc(t.NOTEQUAL,1,0xffffffff),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),r.setFunc(t.EQUAL,1,0xffffffff)}this.swapBuffers()}void 0!==p&&(a instanceof p?r=!0:a instanceof m&&(r=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(void 0===e){let t=this.renderer.getSize(new s.Vector2);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,(e=this.renderTarget1.clone()).setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let r=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(r,a),this.renderTarget2.setSize(r,a);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(r,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class g extends l{constructor(e,t,r=null,a=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=r,this.clearColor=a,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new s.Color}render(e,t,r){let a,i,s=e.autoClear;e.autoClear=!1,null!==this.overrideMaterial&&(i=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),null!==this.clearColor&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),null!==this.clearAlpha&&(a=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),!0==this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:r),!0===this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),null!==this.clearColor&&e.setClearColor(this._oldClearColor),null!==this.clearAlpha&&e.setClearAlpha(a),null!==this.overrideMaterial&&(this.scene.overrideMaterial=i),e.autoClear=s}}let x={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class b extends l{constructor(){super(),this.isOutputPass=!0,this.uniforms=s.UniformsUtils.clone(x.uniforms),this.material=new s.RawShaderMaterial({name:x.name,uniforms:this.uniforms,vertexShader:x.vertexShader,fragmentShader:x.fragmentShader}),this._fsQuad=new d(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,r){this.uniforms.tDiffuse.value=r.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},s.ColorManagement.getTransfer(this._outputColorSpace)===s.SRGBTransfer&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===s.LinearToneMapping?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===s.ReinhardToneMapping?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===s.CineonToneMapping?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===s.ACESFilmicToneMapping?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===s.AgXToneMapping?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===s.NeutralToneMapping?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===s.CustomToneMapping&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),!0===this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this._fsQuad.render(e)}dispose(){this.material.dispose(),this._fsQuad.dispose()}}let y=["Off","Cel anime","VHS","CRT","Cel V2","Game Boy","16-bit","Super 8","Riso","Manga","Comic","Pastel","Watercolour","Manga 2"],w=new Set([4,8,9,10,12,13]),M=[[],[{label:"Steps",value:.4},{label:"Ink",value:.85},{label:"Saturation",value:.5},{label:"Grain",value:.35}],[{label:"Wobble",value:.5},{label:"Bleed",value:.5},{label:"Noise",value:.5},{label:"Tracking",value:.6}],[{label:"Curvature",value:.5},{label:"Scanlines",value:.6},{label:"Mask",value:.5},{label:"Brightness",value:.5}],[{label:"Ink",value:.8},{label:"Boil",value:.5},{label:"Halation",value:.6},{label:"Shadow tint",value:.6}],[{label:"Resolution",value:.55},{label:"Contrast",value:.5},{label:"Grid",value:.5},{label:"Dither",value:.8}],[{label:"Resolution",value:.5},{label:"Colour depth",value:.5},{label:"Dither",value:.7},{label:"Scanlines",value:.4}],[{label:"Grain",value:.5},{label:"Weave",value:.5},{label:"Vignette",value:.7},{label:"Flicker",value:.5}],[{label:"Dot size",value:.4},{label:"Pink",value:.85},{label:"Misregistration",value:.5},{label:"Ink",value:.9}],[{label:"Tone size",value:.4},{label:"Contrast",value:.5},{label:"Tone density",value:.7},{label:"Ink",value:.9}],[{label:"Dot size",value:.45},{label:"Saturation",value:.7},{label:"Outline",value:.8},{label:"Paper",value:.5}],[{label:"Glow",value:.81},{label:"Pastel",value:.82},{label:"Steps",value:0},{label:"Sparkle",value:.22}],[{label:"Paper",value:.6},{label:"Bleed",value:.5},{label:"Pigment edges",value:.7},{label:"Granulation",value:.5}],[{label:"Tone size",value:.4},{label:"Colour",value:.6},{label:"Tone density",value:.6},{label:"Ink",value:.9}]],S=e=>(M[e]??[]).map(e=>e.value),P={uniforms:{tDiffuse:{value:null},uTime:{value:0},uMode:{value:0},uRes:{value:new s.Vector2(1,1)},uP:{value:new s.Vector4(.5,.5,.5,.5)},tNormal:{value:null},tDepth:{value:null},uNear:{value:.1},uFar:{value:100},uSeed:{value:0}},vertexShader:`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform int uMode;
    uniform vec2 uRes;
    uniform vec4 uP;
    uniform sampler2D tNormal;
    uniform sampler2D tDepth;
    uniform float uNear;
    uniform float uFar;
    uniform float uSeed;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    vec3 posterize(vec3 c, float n) { return floor(c * n + 0.5) / n; }
    float vignette(vec2 uv, float k) { vec2 d = (uv - 0.5) * vec2(1.0, 0.85); return 1.0 - k * pow(length(d) * 1.5, 2.5); }
    // Smooth value noise, for the hand-painted wobble and the breaks in the lines.
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    // Ordered dither: the 4x4 Bayer matrix built from the 2x2 one, 0-15/16.
    float bayer2(vec2 p) { return p.x * 2.0 + p.y * 3.0 - 4.0 * p.x * p.y; }
    float bayer4(vec2 p) { return (4.0 * bayer2(mod(p, 2.0)) + bayer2(mod(floor(p / 2.0), 2.0))) / 16.0; }
    // A halftone screen: dots on a grid turned by angle, cell pixels apart, growing with value (0-1 coverage).
    float halftone(vec2 pix, float angle, float cell, float value) {
      float sn = sin(angle), cs = cos(angle);
      vec2 r = vec2(cs * pix.x - sn * pix.y, sn * pix.x + cs * pix.y) / cell;
      vec2 f = fract(r) - 0.5;
      return smoothstep(0.06, -0.06, length(f) - sqrt(clamp(value, 0.0, 1.0)) * 0.62);
    }
    // Depth buffer value to a 0-1 linear distance.
    float linearDepth(vec2 uv) {
      float z = texture2D(tDepth, uv).x;
      float n = uNear, f = uFar;
      float view = (2.0 * n * f) / (f + n - (z * 2.0 - 1.0) * (f - n));
      return clamp((view - n) / (f - n), 0.0, 1.0);
    }
    // Outer lines from depth steps, inner lines from normal creases - the two line masks Orbitals reads from its buffers.
    float lineMask(vec2 uv, vec2 px) {
      float d0 = linearDepth(uv);
      float dx = abs(linearDepth(uv + vec2(px.x, 0.0)) - d0) + abs(linearDepth(uv - vec2(px.x, 0.0)) - d0);
      float dy = abs(linearDepth(uv + vec2(0.0, px.y)) - d0) + abs(linearDepth(uv - vec2(0.0, px.y)) - d0);
      float outer = smoothstep(0.004, 0.014, (dx + dy) / max(d0, 0.02) * 0.5);
      // Only the cel objects are in the buffer; the painted background (sea, sky) is empty there and gets no inner lines.
      if (d0 > 0.999) return outer;
      vec3 n0 = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
      float nd = 0.0;
      nd += 1.0 - dot(n0, texture2D(tNormal, uv + vec2(px.x, 0.0)).xyz * 2.0 - 1.0);
      nd += 1.0 - dot(n0, texture2D(tNormal, uv - vec2(px.x, 0.0)).xyz * 2.0 - 1.0);
      nd += 1.0 - dot(n0, texture2D(tNormal, uv + vec2(0.0, px.y)).xyz * 2.0 - 1.0);
      nd += 1.0 - dot(n0, texture2D(tNormal, uv - vec2(0.0, px.y)).xyz * 2.0 - 1.0);
      float inner = smoothstep(0.9, 1.7, nd);
      // Far away the normals get noisy: let the inner lines fade with distance.
      return max(outer, inner * (1.0 - smoothstep(0.2, 0.5, d0)));
    }
    // A sobel on the picture itself, for the looks without a buffer.
    float edges(vec2 uv, vec2 px) {
      float tl = luma(texture2D(tDiffuse, uv + px * vec2(-1.0,  1.0)).rgb);
      float t  = luma(texture2D(tDiffuse, uv + px * vec2( 0.0,  1.0)).rgb);
      float tr = luma(texture2D(tDiffuse, uv + px * vec2( 1.0,  1.0)).rgb);
      float l  = luma(texture2D(tDiffuse, uv + px * vec2(-1.0,  0.0)).rgb);
      float r  = luma(texture2D(tDiffuse, uv + px * vec2( 1.0,  0.0)).rgb);
      float bl = luma(texture2D(tDiffuse, uv + px * vec2(-1.0, -1.0)).rgb);
      float b  = luma(texture2D(tDiffuse, uv + px * vec2( 0.0, -1.0)).rgb);
      float br = luma(texture2D(tDiffuse, uv + px * vec2( 1.0, -1.0)).rgb);
      float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
      float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
      return smoothstep(0.18, 0.5, length(vec2(gx, gy)));
    }
    // The lines of the buffer looks, eroded by noise for uneven thickness and broken by noise-subtracted gaps.
    float ink(vec2 uv, vec2 px, float seed, float width) {
      float grain = vnoise(uv * 90.0 + seed);
      float line = lineMask(uv, px * width);
      line = smoothstep(0.3 + grain * 0.25, 0.6 + grain * 0.25, line);
      return line * step(0.12, vnoise(uv * 26.0 + seed * 0.5));
    }
    // A soft bloom: what's brighter than the threshold, gathered from a ring of taps.
    vec3 glow(vec2 uv, vec2 px, float threshold, float radius) {
      vec3 g = vec3(0.0);
      for (int k = 0; k < 6; k++) {
        float a = float(k) * 1.047;
        g += max(texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * px * radius).rgb - threshold, 0.0);
      }
      return g / 6.0;
    }

    void main() {
      vec2 uv = vUv;
      vec2 px = 1.0 / uRes;
      vec2 pix = uv * uRes;
      vec3 col;
      if (uMode == 1) {
        // Cel: flat posterised colour, a touch more saturated and warmer, ink on the edges, paper grain.
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float l = luma(c);
        c = mix(vec3(l), c, 1.0 + uP.z * 0.7);
        c = posterize(c, 3.0 + floor(uP.x * 9.0)) * vec3(1.05, 1.0, 0.93);
        c += (hash(floor(uv * uRes * 0.5) + floor(uTime * 12.0)) - 0.5) * 0.1 * uP.w;
        c = mix(c, vec3(0.05, 0.04, 0.09), edges(uv, px * 1.5) * uP.y);
        col = c * vignette(uv, 0.25);
      } else if (uMode == 2) {
        // VHS: the tape wobbles line by line, a tracking band rolls through, chroma bleeds sideways, blacks lift,
        // scanlines, grain, dropouts and the noise strip at the bottom of the picture.
        float line = floor(uv.y * uRes.y);
        float frame = floor(uTime * 24.0);
        float wobble = (sin(uv.y * 30.0 + uTime * 2.5) * 0.0012 + (hash(vec2(line, frame)) - 0.5) * 0.0025) * uP.x * 2.0;
        float bandPos = fract(uTime * 0.045);
        float band = (1.0 - smoothstep(0.0, 0.035, abs(uv.y - bandPos))) * uP.w;
        wobble += band * (hash(vec2(line, frame * 0.5)) - 0.5) * 0.03;
        uv.x += wobble;
        float bleed = 0.009 * uP.y;
        vec3 c;
        c.r = texture2D(tDiffuse, uv + vec2(bleed, 0.0)).r;
        c.g = texture2D(tDiffuse, uv).g;
        c.b = texture2D(tDiffuse, uv - vec2(bleed, 0.0)).b;
        c = (c + texture2D(tDiffuse, uv + vec2(px.x * 2.0, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(px.x * 2.0, 0.0)).rgb) / 3.0;
        float l = luma(c);
        c = mix(vec3(l), c, 0.8) * 0.88 + 0.07;
        c = posterize(c, 12.0);
        c *= 0.88 + 0.12 * sin(uv.y * uRes.y * 3.14159);
        c += (hash(uv * uRes + uTime * 100.0) - 0.5) * 0.18 * uP.z;
        float dropout = step(0.996, hash(vec2(line, frame))) * step(0.6, hash(vec2(floor(uv.x * 40.0), line)));
        c += dropout * 0.45 * uP.z;
        c = mix(c, c * 0.6 + 0.25, band * 0.6);
        if (uv.y < 0.045) c = mix(c, vec3(hash(vec2(floor(uv.x * uRes.x * 0.35), floor(uTime * 40.0)))), 0.7 * uP.z);
        col = c * vignette(uv, 0.35);
      } else if (uMode == 3) {
        // CRT: barrel curvature, a slight colour split, heavy scanlines and the phosphor mask, brighter to compensate.
        vec2 cc = uv * 2.0 - 1.0;
        float r2 = dot(cc, cc);
        cc *= 1.0 + 0.14 * uP.x * r2;
        uv = cc * 0.5 + 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
        vec3 c;
        c.r = texture2D(tDiffuse, uv + vec2(0.0018, 0.0)).r;
        c.g = texture2D(tDiffuse, uv).g;
        c.b = texture2D(tDiffuse, uv - vec2(0.0018, 0.0)).b;
        c *= 1.0 - uP.y * 0.4 * (0.5 - 0.5 * sin(uv.y * uRes.y * 3.14159 * 0.5));
        float m = mod(floor(uv.x * uRes.x), 3.0);
        vec3 mask = vec3(m == 0.0 ? 1.0 : 0.0, m == 1.0 ? 1.0 : 0.0, m == 2.0 ? 1.0 : 0.0);
        c *= mix(vec3(1.0), mask * 1.3 + 0.7, uP.z);
        c *= 1.0 + uP.w * 0.6;
        float edge = smoothstep(0.0, 0.06, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
        col = c * vignette(uv, 0.4) * edge;
      } else if (uMode == 4) {
        // Cel V2, after Orbitals: the picture as a hand-painted cel photographed on film.
        vec2 seed = vec2(uSeed * 13.7, uSeed * 7.1);
        vec2 wob = (vec2(vnoise(uv * 7.0 + seed), vnoise(uv * 7.0 + seed + 31.0)) - 0.5) * 0.005 * uP.y;
        vec2 suv = uv + wob;
        float line = ink(suv, px, uSeed, 1.2);
        vec3 c = texture2D(tDiffuse, suv).rgb;
        c = (c * 2.0 + texture2D(tDiffuse, suv + vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, suv - vec2(0.0, px.y)).rgb) * 0.25;
        float l = luma(c);
        float jit = (vnoise(suv * 9.0 + seed + 50.0) - 0.5) * 0.08;
        float t1 = 0.22 + jit, t2 = 0.5 + jit;
        float band = l < t1 ? 0.0 : (l < t2 ? 1.0 : 2.0);
        float target = band == 0.0 ? 0.22 : (band == 1.0 ? 0.46 : 0.82);
        vec3 cel = c * (target / max(l, 0.02));
        cel = mix(cel, cel * vec3(0.78, 0.84, 1.18), band == 0.0 ? uP.w : 0.0);
        float rim = smoothstep(t2, t2 + 0.03, l) * (1.0 - smoothstep(t2 + 0.03, t2 + 0.07, l));
        cel += rim * 0.14;
        float sat = length(c - vec3(l));
        float bluish = smoothstep(0.08, 0.3, (c.b - max(c.r, c.g)) / max(l, 0.05));
        float paint = max(bluish, 1.0 - smoothstep(0.08, 0.22, sat));
        vec3 painted = c * (0.75 + 0.25 * target / max(l, 0.02)) + rim * 0.06;
        cel = mix(cel, painted, paint * 0.85);
        float brush = vnoise(vec2(suv.x * 160.0, suv.y * 22.0) + seed * 0.3);
        cel *= 0.97 + brush * 0.06;
        cel += glow(suv, px, 0.72, 7.0) * vec3(1.0, 0.6, 0.35) * 1.5 * uP.z;
        vec2 ca = (uv - 0.5) * 0.004;
        cel.r = mix(cel.r, texture2D(tDiffuse, suv + ca).r * (target / max(l, 0.02)), 0.35);
        cel.b = mix(cel.b, texture2D(tDiffuse, suv - ca).b * (target / max(l, 0.02)), 0.35);
        cel += (hash(uv * uRes + fract(uTime) * 7.0) - 0.5) * 0.05;
        cel = mix(cel, vec3(0.07, 0.05, 0.1), line * uP.x);
        col = cel * vignette(uv, 0.22);
      } else if (uMode == 5) {
        // Game Boy: 120-520 cells across, four greens, ordered dither, the LCD grid.
        float across = 120.0 + uP.x * 400.0;
        vec2 cells = vec2(across, across * uRes.y / uRes.x);
        vec2 cell = floor(uv * cells);
        float l = luma(texture2D(tDiffuse, (cell + 0.5) / cells).rgb);
        l = (l - 0.5) * (1.0 + uP.y) + 0.56;
        float shade = floor(clamp(l, 0.0, 0.999) * 4.0 + (bayer4(cell) - 0.5) * uP.w + 0.5);
        shade = clamp(shade, 0.0, 3.0);
        vec3 pal0 = vec3(0.06, 0.22, 0.06), pal1 = vec3(0.19, 0.38, 0.19), pal2 = vec3(0.55, 0.67, 0.06), pal3 = vec3(0.61, 0.74, 0.06);
        vec3 c = shade < 1.0 ? pal0 : (shade < 2.0 ? pal1 : (shade < 3.0 ? pal2 : pal3));
        vec2 f = fract(uv * cells);
        float grid = step(0.1, f.x) * step(0.1, f.y);
        col = mix(c, c * mix(1.0, 0.78, uP.z), 1.0 - grid) * 0.96;
      } else if (uMode == 6) {
        // 16-bit: 160-640 cells across, 3-6 bits per channel with ordered dither, a faint line between the rows.
        float across = 160.0 + uP.x * 480.0;
        vec2 cells = vec2(across, across * uRes.y / uRes.x);
        vec2 cell = floor(uv * cells);
        vec3 c = texture2D(tDiffuse, (cell + 0.5) / cells).rgb;
        float l = luma(c);
        c = mix(vec3(l), c, 1.2);
        float levels = pow(2.0, 3.0 + floor(uP.y * 3.0)) - 1.0;
        float b = (bayer4(cell) - 0.5) * uP.z * 1.2;
        c = floor(c * levels + 0.5 + b) / levels;
        c *= 1.0 - uP.w * 0.2 * step(0.5, fract(uv.y * cells.y));
        col = c;
      } else if (uMode == 7) {
        // Super 8: gate weave, flicker, faded warm colour, heavy grain, a hair and dust, the burnt frame.
        float frame = floor(uTime * 18.0);
        vec2 weave = (vec2(hash(vec2(frame, 1.0)), hash(vec2(frame, 2.0))) - 0.5) * vec2(0.008, 0.012) * uP.y;
        vec2 suv = uv + weave;
        vec3 c = (texture2D(tDiffuse, suv).rgb * 2.0 + texture2D(tDiffuse, suv + vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, suv + vec2(0.0, px.y)).rgb) * 0.25;
        float l = luma(c);
        vec3 sepia = vec3(1.0, 0.84, 0.62) * l;
        c = mix(sepia, c * vec3(1.05, 0.95, 0.8), 0.45);
        c = c * 0.9 + 0.05;
        c *= 1.0 - uP.w * 0.28 * hash(vec2(frame, 7.0));
        c += (hash(uv * uRes + frame * 3.1) - 0.5) * 0.32 * uP.x;
        float hairX = hash(vec2(floor(frame / 3.0), 9.0));
        float hair = step(0.985, 1.0 - abs(suv.x - hairX + (vnoise(vec2(suv.y * 6.0, frame)) - 0.5) * 0.01) * 300.0) * step(0.55, hash(vec2(floor(frame / 3.0), 11.0)));
        c += hair * 0.5;
        float dust = step(0.9992, hash(floor(uv * uRes * 0.12) + frame * 0.37));
        c = mix(c, vec3(0.05, 0.03, 0.02), dust);
        float v = vignette(uv, 0.4 + uP.z * 0.8);
        c = mix(c * vec3(1.1, 0.5, 0.2), c, smoothstep(-0.2, 0.3, v));
        col = c * clamp(v, 0.0, 1.0);
      } else if (uMode == 8) {
        // Riso: two inks on paper - navy as a 45-degree halftone for the darks, pink as a 15-degree screen for the
        // mid-tones, the pink misregistered, the lines from the buffer in navy, paper grain.
        vec3 paper = vec3(0.95, 0.93, 0.86);
        vec3 navy = vec3(0.11, 0.16, 0.31);
        vec3 pink = vec3(1.0, 0.63, 0.75);
        float cellPx = max(3.0, uRes.x / 440.0) * (0.5 + uP.x * 1.5);
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float l = luma(c);
        float dark = pow(smoothstep(0.4, 0.97, 1.0 - l), 1.6);
        float navyInk = halftone(pix, 0.785, cellPx, dark * 0.85);
        vec2 off = vec2(2.5, -1.5) * (cellPx / 6.0) * uP.z * 2.0;
        float lp = luma(texture2D(tDiffuse, uv + off / uRes).rgb);
        float mid = smoothstep(0.15, 0.6, 1.0 - lp) * (1.0 - smoothstep(0.8, 0.97, 1.0 - lp));
        float pinkInk = halftone(pix + off, 0.26, cellPx, mid) * uP.y;
        float line = ink(uv, px, 3.0, 1.3) * uP.w;
        vec3 out3 = paper * (0.97 + (hash(floor(pix * 0.5)) - 0.5) * 0.05);
        out3 = mix(out3, pink, pinkInk * 0.85);
        out3 = mix(out3, navy, max(navyInk, line) * 0.92);
        col = out3;
      } else if (uMode == 9) {
        // Manga: black ink and screentone on white paper - dots for the mid-tones, solid black for the darks, the
        // lines from the buffer, a few hatching strokes in the deep shadow.
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float l = luma(c);
        l = clamp((l - 0.45) * (1.0 + uP.y * 1.6) + 0.5, 0.0, 1.0);
        float cellPx = max(3.0, uRes.x / 440.0) * (0.5 + uP.x * 1.5);
        float tone = halftone(pix, 0.785, cellPx, smoothstep(0.05, 0.85, 1.0 - l) * uP.z);
        float black = 1.0 - smoothstep(0.08, 0.14, l);
        float hatch = step(0.8, fract((pix.x + pix.y) / (cellPx * 1.4))) * (1.0 - smoothstep(0.14, 0.3, l));
        float line = ink(uv, px, 5.0, 1.4) * uP.w;
        float k = max(max(tone * 0.9, black), max(hatch, line));
        vec3 paper = vec3(0.97, 0.96, 0.93) * (0.98 + (hash(floor(pix * 0.5)) - 0.5) * 0.04);
        col = mix(paper, vec3(0.08, 0.07, 0.1), k);
      } else if (uMode == 10) {
        // Comic: saturated colour in a few steps, Ben-Day dots in the shadows, a thick outline from the buffer that
        // sits a touch off the colour (the print's misregistration), yellowed paper.
        vec2 off = vec2(1.5, -1.0) * px * 1.5;
        vec3 c = texture2D(tDiffuse, uv + off).rgb;
        float l = luma(c);
        c = mix(vec3(l), c, 1.0 + uP.y * 1.2);
        c = posterize(c, 5.0);
        float cellPx = max(3.0, uRes.x / 400.0) * (0.5 + uP.x * 1.5);
        float shadow = smoothstep(0.3, 0.85, 1.0 - l);
        float dots = halftone(pix, 0.26, cellPx, shadow * 0.8);
        c = mix(c, c * 0.45, dots);
        c = mix(c, c * vec3(1.0, 0.96, 0.84), uP.w);
        float line = ink(uv, px, 7.0, 1.0 + uP.z * 2.0);
        col = mix(c, vec3(0.06, 0.05, 0.08), line * (0.6 + uP.z * 0.4));
      } else if (uMode == 11) {
        // Pastel anime: lifted shadows, a lavender-pink cast, three soft steps, a white-pink glow, sparkles on the
        // highlights, light grain.
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float l = luma(c);
        c = c * 0.78 + 0.16;
        c = mix(c, c * vec3(1.08, 0.94, 1.1) + vec3(0.03, 0.0, 0.05), uP.y);
        float ls = luma(c);
        float stepped = (smoothstep(0.3, 0.36, ls) + smoothstep(0.55, 0.61, ls) + smoothstep(0.78, 0.84, ls)) / 3.0 * 0.6 + 0.3;
        c = mix(c, c * (stepped / max(ls, 0.02)), uP.z);
        c += glow(uv, px, 0.6, 9.0) * vec3(1.0, 0.85, 0.95) * 1.6 * uP.x;
        float spark = step(0.9993 - uP.w * 0.0006, hash(floor(pix * 0.5) + floor(uTime * 3.0))) * smoothstep(0.6, 0.85, l);
        c += spark * vec3(1.0, 0.9, 1.0) * 0.8;
        c += (hash(uv * uRes + fract(uTime) * 5.0) - 0.5) * 0.03;
        col = c * (1.0 - 0.15 * pow(length((uv - 0.5) * 1.3), 2.0));
      } else if (uMode == 12) {
        // Watercolour: the picture bleeds a little, pigment pools dark along the edges, granulation in the washes,
        // everything lighter and softer on textured paper.
        float bleedAmt = 0.004 + uP.y * 0.008;
        vec2 suv = uv + (vec2(vnoise(uv * 12.0), vnoise(uv * 12.0 + 40.0)) - 0.5) * bleedAmt;
        vec3 c = vec3(0.0);
        for (int k = 0; k < 6; k++) {
          float a = float(k) * 1.047;
          c += texture2D(tDiffuse, suv + vec2(cos(a), sin(a)) * px * 2.5).rgb;
        }
        c = (c / 6.0 + texture2D(tDiffuse, suv).rgb) * 0.5;
        float l = luma(c);
        c = mix(vec3(l), c, 0.85) * 0.8 + 0.14;
        float gran = vnoise(pix * 0.09) * 0.6 + vnoise(pix * 0.31) * 0.4;
        c *= 1.0 - (gran - 0.5) * 0.5 * uP.w;
        float edge = lineMask(suv, px * 1.6);
        edge = smoothstep(0.2, 0.7, edge);
        c *= 1.0 - edge * 0.5 * uP.z;
        float paperTex = vnoise(pix * 0.7) * 0.5 + vnoise(pix * 2.3) * 0.5;
        vec3 paper = vec3(0.97, 0.95, 0.9) * (1.0 - (paperTex - 0.5) * 0.12 * uP.x);
        col = c * paper;
      } else {
        // Manga 2: the manga page in colour - flat, lightly posterised colour on paper, the screentone darkening the
        // local colour in the mid-tones, solid black and hatching in the darks, the lines off the buffer in ink.
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float l = luma(c);
        vec3 flat3 = mix(vec3(l), c, 0.5 + uP.y * 1.0);
        flat3 = posterize(flat3 * 0.85 + 0.12, 8.0);
        float cellPx = max(3.0, uRes.x / 440.0) * (0.5 + uP.x * 1.5);
        float tone = halftone(pix, 0.785, cellPx, smoothstep(0.08, 0.8, 1.0 - l) * uP.z);
        float black = 1.0 - smoothstep(0.06, 0.11, l);
        float hatch = step(0.8, fract((pix.x + pix.y) / (cellPx * 1.4))) * (1.0 - smoothstep(0.12, 0.26, l));
        float line = ink(uv, px, 5.0, 1.4) * uP.w;
        vec3 paper = vec3(0.97, 0.96, 0.93) * (0.98 + (hash(floor(pix * 0.5)) - 0.5) * 0.04);
        vec3 out3 = flat3 * paper;
        out3 = mix(out3, out3 * 0.45, tone * 0.9);
        col = mix(out3, vec3(0.08, 0.07, 0.1), max(max(black, hatch * 0.8), line));
      }
      gl_FragColor = vec4(col, 1.0);
    }
  `},_=(e,t)=>void(e.shadowMap.autoUpdate=t);e.s(["Osd",0,function({t:e}){let r=String(Math.floor(e/60)).padStart(2,"0"),a=String(Math.floor(e%60)).padStart(2,"0");return(0,t.jsxs)("div",{className:"pointer-events-none absolute inset-0 text-[0.95rem] font-bold tracking-[0.1em] text-[#e9ecf5] [text-shadow:0_0_6px_rgba(255,255,255,0.6),2px_0_0_rgba(255,0,80,0.35),-2px_0_0_rgba(0,200,255,0.35)]","aria-hidden":"true",children:[(0,t.jsx)("p",{className:"absolute top-4 left-5 animate-pulse",children:"▶ PLAY"}),(0,t.jsxs)("p",{className:"absolute top-4 right-5",children:["SP 0:",r,":",a]}),(0,t.jsx)("p",{className:"absolute bottom-5 left-5",children:"AUG. 4 1999  PM 9:12"})]})},"RETRO_MODES",0,y,"RETRO_RATES",0,[12,25,0],"RetroPost",0,function({controls:e}){let{gl:t,scene:o,camera:n,size:l}=(0,i.useThree)(),{composer:u,pass:c}=(0,r.useMemo)(()=>{let e=new v(t);e.addPass(new g(o,n)),e.addPass(new b);let r=new h(P);return e.addPass(r),{composer:e,pass:r}},[t,o,n]),f=(0,r.useMemo)(()=>({target:new s.WebGLRenderTarget(1,1,{depthTexture:new s.DepthTexture(1,1),minFilter:s.LinearFilter,magFilter:s.LinearFilter}),normals:new s.MeshNormalMaterial}),[]);(0,r.useEffect)(()=>{var e,r;let a;return e=l.width,r=l.height,a=t.getPixelRatio(),void(u.setPixelRatio(a),u.setSize(e,r),c.uniforms.uRes.value.set(e*a,r*a),f.target.setSize(Math.floor(e*a/2),Math.floor(r*a/2)),c.uniforms.tNormal.value=f.target.texture,c.uniforms.tDepth.value=f.target.depthTexture)},[u,c,t,l,f]),(0,r.useEffect)(()=>(_(t,!1),()=>{_(t,!0),u.dispose(),f.target.dispose(),f.normals.dispose()}),[t,u,f]);let d=(0,r.useRef)({t:-1});return(0,a.useFrame)(({clock:r})=>(function(e,t,r,a,i,s,o,n,l){if(a.fps&&0!==a.mode&&3!==a.mode&&r-i.t<1/a.fps)return;i.t=r,t.enabled=0!==a.mode,t.uniforms.uTime.value=r,t.uniforms.uMode.value=a.mode;let u=a.params&&4===a.params.length?a.params:S(a.mode);if(t.uniforms.uP.value.set(u[0]??.5,u[1]??.5,u[2]??.5,u[3]??.5),w.has(a.mode)){s.shadowMap.needsUpdate=!0;let e=[];o.traverse(t=>{if(!t.visible)return;let r=t.material;(t.userData.paint||t.isPoints||t.isLine||t.isLine2||t.isLineSegments2||r&&r.transparent)&&(t.visible=!1,e.push(t))});let a=o.overrideMaterial;for(let t of(o.overrideMaterial=l.normals,s.setRenderTarget(l.target),s.clear(),s.render(o,n),s.setRenderTarget(null),o.overrideMaterial=a,e))t.visible=!0;t.uniforms.uNear.value=n.near,t.uniforms.uFar.value=n.far,t.uniforms.uSeed.value=Math.floor(8*r)}e.render()})(u,c,r.elapsedTime,e.current??{mode:0,fps:0},d.current,t,o,n,f),1),null},"RetroSliders",0,function({controls:e,onChange:r,className:a=""}){let i=M[e.mode]??[];if(!i.length)return null;let s=e.params&&e.params.length===i.length?e.params:i.map(e=>e.value);return(0,t.jsxs)("div",{className:a,children:[(0,t.jsx)("div",{className:"grid grid-cols-2 gap-x-4 gap-y-1.5",children:i.map((a,i)=>(0,t.jsxs)("label",{className:"flex items-center gap-2 text-[0.65rem] text-white/60",children:[(0,t.jsx)("span",{className:"w-[5.5rem] shrink-0 truncate",children:a.label}),(0,t.jsx)("span",{className:"w-7 shrink-0 text-[0.6rem] text-[#c9d4f5] tabular-nums",children:s[i].toFixed(2)}),(0,t.jsx)("input",{type:"range",min:0,max:1,step:.01,value:s[i],onChange:t=>{let a=s.slice();a[i]=Number(t.target.value),r({...e,params:a})},className:"w-full accent-[#fea0c0]"})]},a.label))}),(0,t.jsxs)("p",{className:"mt-1.5 text-[0.6rem] text-white/40 select-all",children:[y[e.mode]," · params: [",s.map(e=>e.toFixed(2)).join(", "),"]"]})]})},"retroDefaults",0,S],59788)}]);