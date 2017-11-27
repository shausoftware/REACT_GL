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

        #define EPS 0.005
        #define FAR 40.0 
        #define PI 3.14159265359
        #define T u_time

        vec3 lp = vec3(0.0, 0.0, 4.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 path(float t) {
              float a = sin(t * 3.14159265/ 16.0 + 1.5707963 * 1.0);
              float b = cos(t * 3.14159265 / 16.0);
              return vec3(a * 2.0, b * a, t);    
        }

        vec3 map(vec3 rp) {

            rp.xy -= path(rp.z).xy;
            rp.xy *= rot(-T);            
            float tun = 1.5 - length(rp.xy);
            
            //polar coordinates
            float a = atan(rp.y, rp.x) / 6.2831853;
            
            float zid = floor(rp.z + 0.5);

            return vec3(tun, zid, a);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy).x, d2 = map(rp - e.xyy).x;
            float d3 = map(rp + e.yxy).x, d4 = map(rp - e.yxy).x;
            float d5 = map(rp + e.yyx).x, d6 = map(rp - e.yyx).x;
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        vec3 march(vec3 ro, vec3 rd) {

            float t = 0.0;
            float zid = 0.0;
            float pid = 0.0;

            for (int i = 0; i < 80; i++) {
                vec3 rp = ro + rd * t;
                vec3 ns = map(rp);
                if (ns.x < EPS || t > FAR) {
                    zid = ns.y;
                    pid = ns.z;
                    break;
                }
                
                t += ns.x;
            }

            return vec3(t, zid, pid);
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

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

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
            float mint = FAR;

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            vec3 t = march(ro, rd);
            if (t.x > 0.0 && t.x < FAR) {

                vec3 rp = ro + rd * t.x;
                vec3 n = normal(rp);
                vec3 ld = normalize(lp - rp);
                float diff = max(dot(ld, n), 0.05);

                vec2 tileid = vec2(t.y, floor((t.z + 0.5) * 18.0));
                
                vec2 mx1 = mod(tileid, 4.0) - 2.0;
                if (mx1.x * mx1.y >= 0.0) {
                    if (rand(tileid) > 0.5) {
                        if (mod(t.z + 0.5, 0.01) > 0.009) {
                            pc = vec3(0.4, 0.0, 0.0) * diff;
                            float fogAmount = 1.0 - exp(-t.x * 0.2);
                            pc = mix(pc, vec3(0.0), fogAmount);
                            mint = t.x;
                        }
                    }
                }
            }

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), mint / FAR);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};