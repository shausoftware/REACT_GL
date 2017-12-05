'use strict';

function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;

        uniform sampler2D u_texture1;                
        uniform sampler2D u_texture2;                
        
        #define EPS 0.005
        #define FAR 40.0 
        #define PI 3.14159265359
        #define T u_time
        #define NTILES 16.0

        struct Tunnel {
            float t;
            float id;
            float sideLight;
            float ringLight;
            float tl1;
            float tl2;
            float tl3;
            float tl4;
            float tl5;
            vec2 walluv;
            vec2 cellid;
            float edge;
            float edge2;
            float edge3;
        };

        struct Scene {
            float t;
            float id;
            float li;
            vec2 walluv;
            vec2 cellid;
            float edge;
            float edge2;
            float edge3;
        };

        vec3 lp = vec3(0.0, 0.0, 4.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 path(float t) {
              float a = sin(t * PI / 16.0 + 1.5707963 * 1.0);
              float b = cos(t * PI / 16.0);
              return vec3(a * 2.0, b * a, t);    
        }
        
        //glyph wall texture
        vec3 walltex(vec2 uv) {
            vec3 pc = vec3(0.0);
            uv *= 15.0;
            float ct = T * 4.0;
            float a = mod(uv.y + floor(ct), 7.0);
            vec2 fa = floor(uv); 
            float r = clamp(step(rand(floor(vec2(uv.x, uv.y + floor(ct)))), 0.5), 0.0, 1.0);
            vec2 b = fract(uv);
            pc += smoothstep(0.3, 0.28, length(b - vec2(0.5))) * 0.01; //grey dot
            pc += 2.0 * vec3(0.0, 1.0, 0.0) * smoothstep(0.3, 0.0, length(b - vec2(0.5))) * step(a, 4.0) * r * 1.1; //glyph
            pc *= step(3.0, abs(uv.x)); //horizontal bands
            pc *= step(abs(uv.x), 6.0); //horizontal bands
            return pc;
        }

        vec2 nearest(vec2 a, vec2 b){ 
            float s = step(a.x, b.x);
            return s * a + (1. - s) * b;
        }

        Tunnel map(vec3 rp) {

            rp.xy -= path(rp.z).xy;
            vec3 rrp = rp;
            rrp.xy *= rot(T);
            
            float tun = 1.7 - length(rp.xy);
            float edge = 0.0;
            float edge2 = 0.0;
            float edge3 = 0.0;

            vec3 q = rp; 
            vec3 q2 = rp;
            vec3 q3 = rp;    
            vec3 rq = rrp; 
            vec3 rq2 = rrp;    
 
            //polar coordinates
            float a = atan(q.y, q.x) / 6.2831853;
            float ia2 = (floor(a * NTILES) + .5) / NTILES * 6.2831853;
            float ia3 = (floor(a * 4.0) + .5) / 4.0 * 6.2831853;
            float ra = atan(rq.y, rq.x) / 6.2831853;
            float ria = (floor(ra * 6.0) + .5) / 6.0 * 6.2831853;

            vec2 cellid = vec2(floor(q.z + 0.5), a);
            
            //panels
            q = rp;
            q.xy *= rot(ia2);
            q.z = mod(q.z, .5) - .25;
            q = abs(q);
            //tun = min(tun, max(panelDetail, tun - 0.1));  
                        
            //edges
            q3.xy *= rot(ia3);
            q3.z = mod(q3.z, 20.0) - 10.0;
            q3 = abs(q3);
            edge = -min(q.y - 0.02, q.z - 0.02);
            edge2 = -min(q3.y - 0.3, q3.z - 0.3);
            edge3 = -min(q3.y - 0.26, q3.z - 0.26);
            
            //side walls
            q = rp;
            float walls = max(1.3 - abs(q.x), abs(q.y) - 0.5);
            q = abs(q);
            float cut = q.y - 0.14;

            //side lights
            q = rp;
            float slLights = length(q.xy - vec2(1.4, 0.0)) - 0.07;
            slLights = min(slLights, length(q.xy - vec2(-1.4, 0.0)) - 0.07);

            //ring lights
            rq = abs(rq);
            rq.z = abs(mod(rrp.z, 8.0) - 4.0);
            float rlFrame = rq.z - 0.2;
            rlFrame = max(rlFrame, tun - 0.5);
            float rlCutout = rq.z - 0.1;
            rlCutout = max(rlCutout, tun - 0.6);
            float rlLight = rq.z - 0.05;
            rlLight = max(rlLight, tun - 0.48);
            rq = rrp;
            rq.xy *= rot(ria);
            rq = abs(rq);
            rq2 = rrp;
            rq2.xy *= rot(ria);
            rq2 = abs(rq2);
            float frameCutoutDetail = min(rq.y - .1, max(rq2.y - .1, rrp.y));
            float lightCutoutDetail = min(rq.y - .15, max(rq2.y - .15, rrp.y));
            rlCutout = max(rlCutout, -frameCutoutDetail);
            rlLight = max(rlLight, -lightCutoutDetail);
            rlFrame = max(rlFrame, -rlCutout);

            //doors
            q = rp;
            q.z = abs(mod(rp.z, 32.0) - 16.0);
            float frame = q.z - 0.2;
            frame = max(frame, tun - 0.4);
            float doors = q.z - 0.1;
            doors = max(doors, tun - 0.6);
            doors = min(doors, max(length(q.xy) - 0.3, q.z - 0.1));
            doors = max(doors,  0.2 - length(q.xy));
            doors = min(doors, frame);
            float ct = T * 0.1;
            vec2 tq1 = vec2(length(q.xy) - 1.4 + mod(ct, 1.1), q.z);
            float tl1 = length(tq1) - 0.01;
            vec2 tq2 = vec2(length(q.xy) - 1.4 + mod(ct + 0.275, 1.1), q.z);
            float tl2 = length(tq2) - 0.01;
            vec2 tq3 = vec2(length(q.xy) - 1.4 + mod(ct + 0.55, 1.1), q.z);
            float tl3 = length(tq3) - 0.01;
            vec2 tq4 = vec2(length(q.xy) - 1.4 + mod(ct + 0.825, 1.1), q.z);
            float tl4 = length(tq4) - 0.01;
            vec2 tq5 = vec2(length(q.xy) - 0.2, q.z);
            float tl5 = length(tq5) - 0.01;
            
            //identify the objects
            vec2 ns = nearest(vec2(tun, 1.0), vec2(walls, 2.0));
            ns.x = max(ns.x, -cut);
            ns = nearest(ns, vec2(rlLight, 3.0));
            ns = nearest(ns, vec2(rlFrame, 4.0));
            ns = nearest(ns, vec2(slLights, 5.0));            
            ns = nearest(ns, vec2(doors, 6.0));
            ns = nearest(ns, vec2(tl1, 7.0));
            ns = nearest(ns, vec2(tl2, 8.0));
            ns = nearest(ns, vec2(tl3, 9.0));
            ns = nearest(ns, vec2(tl4, 10.0));
            ns = nearest(ns, vec2(tl5, 11.0));
            
            return Tunnel(ns.x, 
                          ns.y, 
                          slLights, 
                          rlLight, 
                          tl1, 
                          tl2, 
                          tl3, 
                          tl4, 
                          tl5, 
                          rp.yz, 
                          cellid,
                          edge,
                          edge2,
                          edge3);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy).t, d2 = map(rp - e.xyy).t;
            float d3 = map(rp + e.yxy).t, d4 = map(rp - e.yxy).t;
            float d5 = map(rp + e.yyx).t, d6 = map(rp - e.yyx).t;
            float d = map(rp).t * 2.0;
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        // Based on original by IQ.
        // http://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
        float AO(vec3 rp, vec3 n) {
        
            float r = 0.0;
            float w = 1.0;
            float d = 0.0;
            
            for (float i = 1.0; i < 5.0; i += 1.0){
                d = i / 5.0;
                r += w * (d - map(rp + n * d).t);
                w *= 0.5;
            }
            
            return 1.0 - clamp(r, 0.0, 1.0);
        }

        Scene march(vec3 ro, vec3 rd) {
            
                        float t = 0.0;
                        float id = 0.0;
                        float li = 0.0;
                        vec2 walluv = vec2(0.0);
                        vec2 cellid = vec2(0.0);
                        float edge = 0.0;
                        float edge2 = 0.0;
                        float edge3 = 0.0;
            
                        for (int i = 0; i < 100; i++) {
                            vec3 rp = ro + rd * t;
                            Tunnel ns = map(rp);
                            if (ns.t < EPS || t > FAR) {
                                id = ns.id;
                                walluv = ns.walluv;
                                cellid = ns.cellid;
                                edge = ns.edge;
                                edge2 = ns.edge2;
                                edge3 = ns.edge3;
                                break;
                            }
            
                            li += 0.05 * exp(-ns.sideLight * 20.0);
                            li += 0.05 * exp(-ns.ringLight * 30.0);
                            li += 0.05 * exp(-ns.tl1 * 30.0);
                            li += 0.05 * exp(-ns.tl2 * 30.0);
                            li += 0.05 * exp(-ns.tl3 * 30.0);
                            li += 0.05 * exp(-ns.tl4 * 30.0);
                            li += 0.05 * exp(-ns.tl5 * 20.0);
            
                            t += ns.t;
                        }
            
                        return Scene(t, id, li, walluv, cellid, edge, edge2, edge3);
                    }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            float ct = T * 6.0;

            vec3 lookAt = vec3(0.0, 0.0, ct);
            lp = lookAt + vec3(0.0, 0.0, 3.0);
            ro = lookAt + vec3(0.0, 0.0, -5.0);
            
            lookAt.xy += path(lookAt.z).xy;
            ro.xy += path(ro.z).xy;
            lp.xy += path(lp.z).xy;

            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        vec3 colourScene(vec3 ro, vec3 rd, Scene t) {

            vec3 pc = vec3(0.0);

            if (t.t > 0.0 && t.t < FAR) {
                                
                vec3 rp = ro + rd * t.t;
                vec3 n = normal(rp);
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                //float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);                
                //float fre = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 16.0);        
                //float atten = 1.0 / (1.0 + lt * lt * 1.0); //light attenuation
                float ao = AO(rp, n);
                float fogAmount = 1.0 - exp(-t.t * 0.1);
                
                if (t.id == 3.0 || t.id == 5.0 || t.id == 7.0 || t.id == 8.0 || 
                    t.id == 9.0 || t.id == 10.0 || t.id == 11.0) {
                    
                    //lights
                    float diff = max(dot(ld, n), 0.6);
                    pc = vec3(0.7, 1.0, 0.7) * diff * ao;
               
                } else if (t.id == 1.0) {
                    
                    //tunnel walls
                    vec2 tileid = vec2(t.cellid.x, floor((t.cellid.y + 0.5) * NTILES));
                    float diff = max(dot(ld, n), 0.2);
                    float atten = 1.0 / (1.0 + lt * lt * 0.1); //light attenuation
                    float r1 = rand(tileid);
                    float r2 = rand(tileid.yx + floor(T));
                    vec2 mx1 = mod(tileid, 4.0) - 2.0;
                    if (mx1.x * mx1.y >= 0.0) {
                        if (r1 > 0.5) {   
                            pc = vec3(1.0, 0.0, 0.0) * diff * atten * 0.4;
                        }
                    }    
                    pc += vec3(1.0) * t.edge * 4.0 * diff;
                    float dots = mod(rp.z + T, 6.0) > 5.8 ? 1.0 : 0.0;
                    pc += vec3(0.0, 1.0, 0.0) * t.edge * dots * 2.0;
                    if (tileid.y > min(r1 * NTILES, r2 * NTILES) && 
                        tileid.y < max(r1 * NTILES, r2 * NTILES)) {
                        pc = mix(pc, vec3(0.0, 0.2, 0.0), r2 * 0.2) * diff * 2.0;
                    }
                    pc = mix(pc * 2.0, vec3(1.0) * diff * atten * 1.0, step(0.1, t.edge2));
                    pc = mix(pc, vec3(0.0), step(0.1, t.edge3));
                    
                } else if (t.id == 2.0) {

                    //side walls 
                    float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);                
                    float fres = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 32.0);        
                    pc = mix(walltex(t.walluv), pc, fogAmount);
                    pc += vec3(1.0) * spec * 0.4;
                    pc += vec3(1.0) * fres * 0.6;
                    pc *= ao;

                } else if (t.id == 4.0) {
                    
                    //rings
                    float diff = max(dot(ld, n), 0.2);
                    float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);                
                    pc += vec3(0.01) * diff * ao;
                    pc += vec3(1.0) * spec * 0.4;
                    
                } else if (t.id == 6.0) {
                    
                    //doors
                    float diff = max(dot(ld, n), 0.2);
                    //pc = vec3(0.0, 0.2, 0.0) * diff * ao * 0.2;
                    float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);                
                    pc += vec3(1.0) * spec * 0.4;
                    
                } else {

                    //float diff = max(dot(ld, n), 0.2);
                    //pc = vec3(0.0, 0.2, 0.0) * diff * ao * 0.2;
                    //pc += vec3(0.7, 1.0, 0.7) * spec;
                    //pc *= atten;
                }
            }
                
            return pc;
        }

        vec3 target(vec3 ro, vec3 rd) {
            
            vec3 pc = vec3(0.0);

            float t = dot(vec3(0.0, 0.0, ro.z + 5.0 + sin(T * 0.4) * 1.4) - ro, vec3(0.0, 0.0, 1.0)) / dot(rd, vec3(0.0, 0.0, 1.0));

            if (t > 0.0 && t < FAR) {
                
                vec3 rp = ro + rd * t;
                vec3 rrp = rp;
                rp.xy -= path(rp.z).xy;
                float dx = rp.x - rrp.x;
                float dy = rp.y - rrp.y;
                float a = atan(rp.y, rp.x) / 6.2831853;
                rrp = rp;
                rrp.xy *= rot(dx * 0.4);
                float ra = atan(rrp.y, rrp.x) / 6.2831853;
                //rings
                vec3 r1 = vec3(1.0) * step(0.98, length(rp.xy)) * step(length(rp.xy), 1.0);
                vec3 r2 = vec3(0.0, 2.0, 0.0) * step(0.92, length(rp.xy)) * step(length(rp.xy), 0.95);
                r2 *= step(0.0 - dx * 0.1, a);
                //r2 *= mod(a, 0.05) > 0.01 ? 1.0 : 0.0;
                vec3 r3 = vec3(2.0, 0.0, 0.0) * step(0.86, length(rp.xy)) * step(length(rp.xy), 0.89);
                r3 *= step(a, 0.0 + dx * 0.1);
                //r3 *= mod(a, 0.05) > 0.01 ? 1.0 : 0.0;
                vec3 r7 = vec3(1.0) * step(0.59, length(rp.xy)) * step(length(rp.xy), 0.6);
                //cross hair
                vec3 c1 = vec3(0.0, 2.0, 0.0) * step(abs(rp.x), 0.1) * step(abs(rp.y), 0.4);
                c1 += vec3(0.0, 2.0, 0.0) * step(abs(rp.y), 0.1) * step(abs(rp.x), 0.4);
                c1 *= step(0.06, abs(rp.x)) * step(0.06, abs(rp.y));
                //glyph
                vec2 uv = rp.xy * 20.0;
                vec2 cid = floor(uv);
                vec2 cfa = fract(uv);
                float tcut = step(9.0, uv.x) * step(uv.x, 21.0);
                tcut *= step(9.0, uv.y) * step(uv.y, 14.0);
                vec3 t1 = vec3(8.0, 0.0, 0.0) * smoothstep(0.3, 0.28, length(cfa - vec2(0.5)));
                t1 *= step(rand(cid + floor(rp.z)), 0.5);
                t1 *= step(10.0, uv.x) * step(uv.x, 14.0) + 
                      step(16.0, uv.x) * step(uv.x, 20.0);
                t1 *= step(10.0, uv.y) * step(uv.y, 13.0);
                pc = (r1 + r2 + r3 + r7 + c1) * (1.0 - tcut) + t1;
                //pc *= sin(uv.y * 300. + T) * 0.8 + 1.;
                //pc *= sin(uv.x * 300. + T) * 0.8 + 1.;
            }

            float mt = mod(T, 4.0) > 2.0 ? 1.0 : 0.0;
            return pc * mt; 
        }

        vec3 hud(vec3 ro) {
            vec3 pc = vec3(0.0);
            //Coordinate system
            vec2 uv = 2.2 * (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
            float a = atan(uv.y, uv.x) / 6.2831853;
            vec3 dro = ro;
            dro.xy -= path(dro.z).xy;
            float dx = dro.x - ro.x;
            float dy = dro.y - ro.y;
            vec3 r1 = vec3(0.0, 1.0, 0.0) * step(0.99, length(uv.xy)) * step(length(uv.xy), 1.0);
            vec3 r2 = vec3(0.0, 1.0, 0.0) * step(0.95, length(uv.xy)) * step(length(uv.xy), 0.97) * clamp(step(a, 0.0), 0.4, 1.0);
            r2 *= step(0.0 - dx * 0.1, a);
            r2 *= mod(a, 0.05) > 0.01 ? 1.0 : 0.0;
            vec3 r3 = vec3(0.0, 1.0, 0.0) * step(0.92, length(uv.xy)) * step(length(uv.xy), 0.94) * clamp(step(0.0, a), 0.4, 1.0);
            r3 *= step(a, 0.0 + dx * 0.1);
            r3 *= mod(a, 0.05) > 0.01 ? 1.0 : 0.0;
            vec3 r4 = vec3(0.0, 1.0, 0.0) * step(0.89, length(uv.xy)) * step(length(uv.xy), 0.90);
            //glyph
            vec2 uvg = uv.xy * 20.0;
            vec2 cid = floor(uvg);
            vec2 cfa = fract(uvg);
            vec3 t1 = vec3(1.0, 1.0, 0.0) * smoothstep(0.3, 0.28, length(cfa - vec2(0.5)));
            t1 *= step(rand(cid + floor(ro.z)), 0.5);
            t1 *= step(rand(cid + floor(ro.z)), 0.5);            
            t1 *= step(18.0, uvg.x) * step(uvg.x, 22.0) + 
                    step(24.0, uvg.x) * step(uvg.x, 28.0);
            t1 *= step(16.0, uvg.y) * step(uvg.y, 19.0);
            vec3 s1 = vec3(1.0, 1.0, 0.0) * clamp(step(0.6, abs(uv.y)), 0.4, 1.0);
            s1 *= step(uv.x, -1.2) * step(-1.3, uv.x);
            s1 *= step(0.0, abs(uv.y)) * step(abs(uv.y), 0.8 + dy * 0.4);
            s1 *= mod(uv.y, 0.05) > 0.02 ? 1.0 : 0.0;
            pc = r1 + r2 + r3 + r4 + t1 + s1;
            pc *= sin(uv.y * 600. + T) * 0.8 + 1.;
            pc *= sin(uv.x * 600. + T) * 0.8 + 1.;
            return pc;
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
            float mint = FAR;

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            Scene scene = march(ro, rd);

            pc = colourScene(ro, rd, scene);
            
            pc += vec3(0.0, 1.0, 0.0) * scene.li;

            vec4 sleeve = texture2D(u_texture1, gl_FragCoord.xy / u_resolution);
            if (sleeve.w * FAR < scene.t) {
                pc = sleeve.xyz;
            }

            vec4 sleeve2 = texture2D(u_texture2, gl_FragCoord.xy / u_resolution);
            if (sleeve2.w * FAR < scene.t) {
                pc = sleeve2.xyz * 0.3;
            }

            pc = mix(clamp(pc, 0.0, 1.0), hud(ro), 0.2);
            pc = clamp(pc, 0.0, 1.0) + target(ro, rd) * 0.4;

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};