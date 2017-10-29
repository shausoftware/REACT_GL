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

        #define EPS 0.005
        #define FAR 40.0 
        #define PI 3.14159265359
        #define T v_time
        #define HASHSCALE1 .1031
                
        vec2 path (float z) {return vec2(0.16 * sin(z * 0.4), 0.25 * cos(z * 0.3));}
        
        vec3 lp = vec3(4.0, 5.0, -2.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        float hash13(vec3 p3) {
            p3  = fract(p3 * HASHSCALE1);
            p3 += dot(p3, p3.yzx + 19.19);
            return fract((p3.x + p3.y) * p3.z);
        }

        float sdTorus(vec3 rp) {
            vec2 q = vec2(length(rp.xy) - 0.5, rp.z);
            return length(abs(abs(q) - 0.05)) - 0.005;
        }

        vec4 cell(vec3 rp, vec3 src, vec3 dst) {            
            rp -= 0.5 * (src + dst);
            vec3 u = rp * mat3(src, dst, cross(dst, src));
            return vec4(u, sdTorus(u));
        }

        float sdBall(vec3 rp) {
            float theta = PI * 0.5 * fract(0.2 * T);        
            vec2 sc = 0.5 * sin(vec2(theta, theta + 0.5 * PI));
            float d = length(rp + vec3(sc.x, sc.y, 0));
            d = min(d, length(rp + vec3(sc.y, -sc.x, 0)));
            d = min(d, length(rp + vec3(-sc.y, sc.x, 0)));
            return d - 0.05;
        }
        
        vec4 nearest(vec4 older, vec4 newer) {
            if (newer.w < older.w) return newer;
            return older;
        }
        
        //directional flow logic worked out by mattz
        vec3 truchet(vec3 rp) {

            //partition and center space
            rp -= 0.5;
            vec3 cc = floor(rp + 0.5);
            rp -= cc;

            //swap axis
            vec3 sn = sign(mod(cc, 2.0) - 0.5);
            if (sn.y * sn.z > 0.0) rp.yz = rp.zy;

            rp.x *= -sn.y;

            //randomise flow direction by cell id
            float id = hash13(cc) * 4.0;
            
            //flow destination
            mat3 dest = mat3(0, 0, -1, 
                            -1, 0, 0, 
                             0, 0, 1);
            
            if (id < 2.0) {
                if (id < 1.0) {
                    // no change to destination
                } else {
                    dest = mat3(dest[0], dest[2], dest[1]); 
                }
            } else {
                if (id < 3.0) {
                    dest = mat3(dest[2], dest[0], dest[1]); 
                } else {
                    dest = mat3(dest[2], dest[1], dest[0]); 
                }
            }
            
            vec4 tc = cell(rp, vec3(1, 0, 0), dest[0]);
            tc = nearest(tc, cell(rp, vec3(0, 1, 0), dest[1]));
            tc = nearest(tc, cell(rp, vec3(0, -1, 0), dest[2]));        

            float bt = sdBall(tc.xyz); 

            return vec3(min(tc.w, bt), step(bt, tc.w), bt);
        }
        
        //distance function returns distance to nearest surface in scene
        vec3 map(vec3 rp) {
            return truchet(rp);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy).x, d2 = map(rp - e.xyy).x;
            float d3 = map(rp + e.yxy).x, d4 = map(rp - e.yxy).x;
            float d5 = map(rp + e.yyx).x, d6 = map(rp - e.yyx).x;
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        //raymarch scene
        vec3 march(vec3 ro, vec3 rd) {

            float t = 0.0; //total distance marched
            float id = 0.0;
            float li = 0.0;

            for (int i = 0; i < 120; i++) {
                vec3 rp = ro + rd * t; //current step position
                vec3 ns = map(rp); //nearest surface
                //break if surface is closer than EPS threshold ...
                // or total distance is further than FAR threshold
                if (ns.x < EPS || t > FAR) {
                    id = ns.y;
                    break;
                }                 

                li += 0.04 * exp(ns.z * -ns.z * 500.0);

                t += ns.x; //add distance to total distance marched
            }

            return vec3(t, id, li);
        }

        // Based on original by IQ.
        // http://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
        float AO(vec3 rp, vec3 n){
        
            float r = 0.0;
            float w = 1.0;
            float d = 0.0;
            
            for (float i = 1.0; i < 5.0; i += 1.0){
                d = i / 5.0;
                r += w * (d - map(rp + n * d).x);
                w *= 0.5;
            }
            
            return 1.0 - clamp(r, 0.0, 1.0);
        }
        
        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - v_resolution.xy * 0.5) / v_resolution.y;

            float ct = T * 0.6;

            vec3 lookAt = vec3(0.0, 0.0, ct);
            ro = lookAt + vec3(0.0, 0.0, -5.0);
            lp = ro + vec3(0.2, 0.3, 0.2);

            lookAt.xy += path(lookAt.z);
            ro.xy += path(ro.z);
            lp.xy += path(lp.z);
            
            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
  
            vec3 ro, rd;
            setupCamera(ro, rd);

            vec3 t = march(ro, rd);
            if (t.x > 0.0 && t.x < FAR) {

                vec3 rp = ro + rd * t.x;
                vec3 n = normal(rp);
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 16.0); //specular
                float fre = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 16.0); 
                float atten = 0.2 / (0.2 + lt * lt * 0.1); //light attenuation
                float ao = AO(rp, n);

                if (t.y == 1.0) {
                    //ball 
                    float diff = max(dot(ld, n), 0.5);
                    pc = vec3(0.0, 1.0, 0.0) * diff;
                    pc += vec3(0.4, 1.0, 0.6) * spec;
                    pc += vec3(0.4, 1.0, 0.6) * fre;
                } else {
                    //rail
                    float diff = max(dot(ld, n), 0.05);
                    pc = vec3(0.0, 1.0, 0.0) * 0.01 * diff;
                    pc += vec3(0.6, 0.0, 0.8) * clamp(n.y, 0.0, 1.0) * 0.3;                     
                    pc += vec3(0.4, 1.0, 0.6) * spec * 2.0;
                    pc *= atten * ao;
                }
            }

            pc += vec3(0.0, 1.0, 0.0) * t.z * 2.0;
            float fa = 1.0 - exp(-t.x * 0.7);
            pc = mix(pc, vec3(0.0, 0.005, 0.0), fa);

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};