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
        #define NTILES 12.0

        vec3 lp = vec3(0.0, 0.0, 4.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 path(float t) {
              float a = sin(t * 3.14159265/ 16.0 + 1.5707963 * 1.0);
              float b = cos(t * 3.14159265 / 16.0);
              return vec3(a * 2.0, b * a, t);    
        }

        // Repeat around the origin by a fixed angle.
        // For easier use, num of repetitions is use to specify the angle.
        float pModPolar(inout vec2 p, float repetitions) {
            float angle = 2.0 * PI / repetitions;
            float a = atan(p.y, p.x) + angle / 2.0;
            float r = length(p);
            float c = floor(a / angle);
            a = mod(a, angle) - angle / 2.0;
            p = vec2(cos(a), sin(a)) * r;
            // For an odd number of repetitions, fix cell index of the cell in -x direction
            // (cell index would be e.g. -5 and 5 in the two halves of the cell):
            if (abs(c) >= (repetitions / 2.0)) c = abs(c);
            return c;
        }

        float map(vec3 rp) {
            
            rp.xy -= path(rp.z).xy;      

            vec3 q1 = rp;
            float a = atan(q1.y, q1.x) / 6.2831853;
            float ia = floor(a * NTILES) / NTILES * 6.2831853;
            q1.xy *= rot(ia);
            q1.z = mod(q1.z, 1.0) - .5;
            q1 = abs(q1);

            vec2 cellid = vec2(floor(q1.z + 0.5), floor(a * NTILES));

            vec3 q2 = rp;
            pModPolar(q2.xy, 12.0);
            vec2 c = vec2(1.6, 0.0);
            float sl = length(q2.xy - c) - 0.005;
            q2.z = mod(q2.z, 140.0) - 39.0;
            q2.z = abs(q2.z);
            sl = max(sl, -(q2.z - 0.5));
            
            vec3 q3 = rp;
            q3.z = mod(q3.z, 100.0) - 39.0;
            q3.z = abs(q3.z);
            sl = max(sl, -(q3.z - 0.5));

            vec3 q4 = rp;
            q4.z = mod(q4.z, 80.0) - 24.0;
            q4.z = abs(q4.z);
            sl = max(sl, -(q4.z - 0.5));

            vec3 q5 = rp;
            q5.z = mod(q5.z, 60.0) - 59.0;
            q5.z = abs(q5.z);
            sl = max(sl, -(q5.z - 0.5));

            /*
            vec3 q6 = rp;
            q6.z = mod(q6.z, 140.0) - 39.0;
            q6.z = abs(q6.z);
            vec2 tor = vec2(length(q6.xy) - 1.6, q6.z);
            float rt = length(tor) - 0.01;
            */

            //sl = max(sl, -(q3.z - 0.5));
            //sl = max(sl, -(q3.z - 1.0));
            
    
            //if (cellid.y == 1.0 || cellid.y == 4.0 || cellid.y == -4.0) {
            //rt = max(rt, -(q1.y - 1.0));
            //}

            return sl;

            /*
            vec3 q = rp;
            q.x = abs(q.x);
            vec2 c = vec2(1.5, 0.0);
            float sl = length(q.xy - c) - 0.02;
            c *= rot(PI * 2.0 / NTILES);
            sl = min(sl, length(q.xy - c) - 0.02);
            c *= rot(PI * -4.0 / NTILES);
            sl = min(sl, length(q.xy - c) - 0.02);

            vec3 q2 = rp;
            q2.y = abs(q2.y);
            c = vec2(0.0, 1.5);
            float sl2 = length(q2.xy - c) - 0.02;
            c *= rot(PI * 2.0 / NTILES);
            sl2 = min(sl2, length(q2.xy - c) - 0.02);
            c *= rot(PI * -4.0 / NTILES);
            sl2 = min(sl2, length(q2.xy - c) - 0.02);

            vec3 q3 = rp;
            q3.z = mod(q3.z, 1.0) - 0.5;
            vec2 tor = vec2(length(q3.xy) - 1.5, q3.z);
            float rt = length(tor) - 0.02;
            
            return min(rt, min(sl, sl2));
            */
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy), d2 = map(rp - e.xyy);
            float d3 = map(rp + e.yxy), d4 = map(rp - e.yxy);
            float d5 = map(rp + e.yyx), d6 = map(rp - e.yyx);
            float d = map(rp) * 2.0;
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        float march(vec3 ro, vec3 rd) {
            
            float t = 0.0;

            for (int i = 0; i < 96; i++) {
                vec3 rp = ro + rd * t;
                float ns = map(rp);
                if (ns < EPS * (t * 0.25 + 1.0) || t > FAR) break;
                t += ns;
            }

            return t;
        }

        float relaxedMarch(vec3 ro, vec3 rd) {

            float omega = 1.3;
            float t = EPS;
            float candidate_error = FAR;
            float candidate_t = EPS;
            float previousRadius = 0.0;
            float stepLength = 0.0;
            float pixelRadius = EPS;
            float functionSign = map(ro) < 0.0 ? -1.0 : 1.0;

            for (int i = 0; i < 100; ++i) {
                float signedRadius = functionSign * map(ro + rd * t);
                float radius = abs(signedRadius);
                bool sorFail = omega > 1.0 && (radius + previousRadius) < stepLength;
                if (sorFail) {
                    stepLength -= omega * stepLength;
                    omega = 1.0;
                } else {
                    stepLength = signedRadius * omega;
                }
                previousRadius = radius;
                float error = radius / t;
                if (!sorFail && error < candidate_error) {
                    candidate_t = t;
                    candidate_error = error;
                }
                if (!sorFail && error < pixelRadius || t > FAR) break;
                t += stepLength;
            }

            if (t > FAR || candidate_error > pixelRadius) candidate_t = FAR;

            return candidate_t;
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

            //float t = march(ro, rd);
            
            float t = relaxedMarch(ro, rd);
            
            if (t > 0.0 && t < FAR) {
                //vec3 rp = ro + rd * t;
                //vec3 n = normal(rp);
                //vec3 ld = normalize(lp - rp);
                //float diff = max(dot(ld, n), 0.05);

                pc = vec3(0.0, 1.0, 0.0);
                mint = t;
            }

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), mint / FAR);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};