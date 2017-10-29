'use strict';

function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        varying vec2 v_resolution;
        varying float v_time;

        uniform sampler2D u_texture;                

        #define EPS 0.005
        #define FAR 40.0 
        #define PI 3.14159265359
        #define T v_time

        struct Tunnel {
            float t;
            float id;
            float ringLight;
            float sideLight;
            float tl1;
            float tl2;
            float tl3;
            float tl4;
            float tl5;
            vec2 uv;
        };

        vec3 lp = vec3(0.0, 0.0, 4.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 path(float t) {
              float a = sin(t * 3.14159265/ 16.0 + 1.5707963 * 1.0);
              float b = cos(t * 3.14159265 / 16.0);
              return vec3(a * 2.0, b * a, t);    
        }
        
        vec3 tex(vec2 uv) {
            vec3 pc = vec3(0.0);
            uv *= 15.0;
            float a = mod(uv.y, 7.0);
            vec2 fa = floor(uv); 
            vec2 b = fract(uv);
            pc += smoothstep(0.3, 0.28, length(b - vec2(0.5)));
            pc *= clamp(step(a, 4.0), 0.03, 1.0); //break horizontally up into 4 dot characters
            pc *= step(3.0, abs(uv.x));
            pc *= step(abs(uv.x), 6.0);
            pc *= clamp(step(rand(fa), 0.5), 0.03, 1.0);
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
            
            vec3 q = rp; 
            vec3 q2 = rp;    
            vec3 rq = rrp; 
            vec3 rq2 = rrp;    
 
            //polar coordinates
            float a = atan(q.y, q.x) / 6.2831853;
            float ia2 = (floor(a * 18.0) + .5)/ 18.0 * 6.2831853;
            float ra = atan(rq.y, rq.x) / 6.2831853;
            float ria = (floor(ra * 6.0) + .5) / 6.0 * 6.2831853;
            
            //panels
            q = rp;
            q.xy *= rot(ia2);
            q.z = mod(q.z, .5) - .25;
            q = abs(q);
            float panelDetail = -min(q.y - 0.02, q.z - 0.02);
            tun = min(tun, max(panelDetail, tun - 0.1));  

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
            vec2 tq1 = vec2(length(q.xy) - 0.9, q.z);
            float tl1 = length(tq1) - 0.01;
            vec2 tq2 = vec2(length(q.xy) - 0.733, q.z);
            float tl2 = length(tq2) - 0.01;
            vec2 tq3 = vec2(length(q.xy) - 0.56, q.z);
            float tl3 = length(tq3) - 0.01;
            vec2 tq4 = vec2(length(q.xy) - 0.4, q.z);
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
            
            return Tunnel(ns.x, ns.y, slLights, rlLight, tl1, tl2, tl3, tl4, tl5, rp.yz);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp, inout float edge) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy).t, d2 = map(rp - e.xyy).t;
            float d3 = map(rp + e.yxy).t, d4 = map(rp - e.yxy).t;
            float d5 = map(rp + e.yyx).t, d6 = map(rp - e.yyx).t;
            float d = map(rp).t * 2.0;
            edge = abs(d1 + d2 - d) + abs(d3 + d4 - d) + abs(d5 + d6 - d);
            edge = smoothstep(0.0, 1.0, sqrt(edge / e.x * 2.0));
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

        Tunnel march(vec3 ro, vec3 rd) {

            float t = 0.0;
            float id = 0.0;
            float sli = 0.0;
            float rli = 0.0;
            float tl1 = 0.0;
            float tl2 = 0.0;
            float tl3 = 0.0;
            float tl4 = 0.0;
            float tl5 = 0.0;
            vec2 uv = vec2(0.0);

            for (int i = 0; i < 100; i++) {
                vec3 rp = ro + rd * t;
                Tunnel ns = map(rp);
                if (ns.t < EPS || t > FAR) {
                    id = ns.id;
                    uv = ns.uv;
                    break;
                }

                sli += 0.05 * exp(-ns.sideLight * 10.0);
                rli += 0.05 * exp(-ns.ringLight * 10.0);
                tl1 += 0.05 * exp(-ns.tl1 * 20.0);
                tl2 += 0.05 * exp(-ns.tl2 * 20.0);
                tl3 += 0.05 * exp(-ns.tl3 * 20.0);
                tl4 += 0.05 * exp(-ns.tl4 * 20.0);
                tl5 += 0.05 * exp(-ns.tl5 * 20.0);
                
                t += ns.t;
            }

            return Tunnel(t, id, sli, rli, tl1, tl2, tl3, tl4, tl5, uv);
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - v_resolution.xy * 0.5) / v_resolution.y;

            float ct = T * 6.0;

            vec3 lookAt = vec3(0.0, 0.0, ct);
            lp = lookAt + vec3(0.0, 0.0, -3.0);
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

        vec3 colourScene(vec3 ro, vec3 rd, Tunnel t) {

            vec3 pc = vec3(0.0);

            if (t.t > 0.0 && t.t < FAR) {
                                
                vec3 rp = ro + rd * t.t;
                float edge = 0.0;
                vec3 n = normal(rp, edge);
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 32.0);                
                float fre = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 16.0);        
                float atten = 1.0 / (1.0 + lt * lt * 1.0); //light attenuation
                float ao = AO(rp, n);
                float fogAmount = 1.0 - exp(-t.t * 0.1);
                
                if (t.id == 3.0 || t.id == 5.0 || t.id == 7.0 || t.id == 8.0 || 
                    t.id == 9.0 || t.id == 10.0 || t.id == 11.0) {
                    
                    //lights
                    float diff = max(dot(ld, n), 0.6);
                    pc = vec3(0.7, 1.0, 0.7) * diff * ao;
                
                } else if (t.id == 2.0) {

                    //side walls 
                    pc = mix(tex(t.uv), pc, fogAmount);
                    pc += vec3(0.0, 1.0, 0.0) * fre;

                } else {

                    float diff = max(dot(ld, n), 0.2);
                    pc = vec3(0.0, 0.2, 0.0) * diff * ao * 0.2;
                    pc += vec3(0.7, 1.0, 0.7) * spec;
                    pc *= atten;

                    /*
                    if (t.id == 6.0) {
                        pc += vec3(0.0, 1.0, 0.0) * edge;
                    }
                    */
                }
            }
                
            return pc;
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
            float mint = FAR;

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            Tunnel t = march(ro, rd);

            pc = colourScene(ro, rd, t);
            
            pc += vec3(0.0, 1.0, 0.0) * t.ringLight;
            pc += vec3(0.0, 1.0, 0.0) * t.sideLight;
            pc += vec3(0.0, 1.0, 0.0) * t.tl1;
            pc += vec3(0.0, 1.0, 0.0) * t.tl2;
            pc += vec3(0.0, 1.0, 0.0) * t.tl3;
            pc += vec3(0.0, 1.0, 0.0) * t.tl4;
            pc += vec3(0.0, 1.0, 0.0) * t.tl5;
            
            vec4 sleeve = texture2D(u_texture, gl_FragCoord.xy / v_resolution);
            if (sleeve.w * FAR < t.t) {
                pc += sleeve.xyz;
            }

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};