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

        vec2 path (float z) {return vec2(0.2 * sin(z * 0.15), 0.35 * cos(z * 0.25));}
        vec2 path2(float z) {return vec2(6.3 * sin(z * 0.25 * 1.5), 8.8 * cos(z * 0.15 * 1.3));}        
        
        vec3 lp = vec3(0.0); //light position
        vec4 sphere = vec4(0.0, 0.0, 0.0, 0.3);

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        
        // Slightly modified version of IQs sphere functions
        // Gathers distance and normal values from front and back face of intersection
        // http://www.iquilezles.org/www/articles/spherefunctions/spherefunctions.htm
        vec2 sphIntersect(vec3 ro, vec3 rd, vec4 sph, out vec3 nN, out vec3 nF) {
            vec3 oc = ro - sph.xyz;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - sph.w * sph.w;
            float h = b * b - c;
            if (h < 0.0) return vec2(0.0);
            h = sqrt(h);
            float tN = -b - h;
            float tF = -b + h;
            nN = normalize((ro + rd * tN) - sph.xyz);
            nF = -normalize((ro + rd * tF) - sph.xyz);
            return vec2(tN, tF);
        }

        float sphDensity(vec3 ro, vec3 rd, vec4 sph, float dbuffer) {
            float ndbuffer = dbuffer / sph.w;
            vec3  rc = (ro - sph.xyz) / sph.w;
            
            float b = dot(rd, rc);
            float c = dot(rc, rc) - 1.0;
            float h = b * b - c;
            if (h < 0.0) return 0.0;
            h = sqrt(h);
            float t1 = -b - h;
            float t2 = -b + h;
        
            if (t2 < 0.0 || t1 > ndbuffer) return 0.0;
            t1 = max(t1, 0.0);
            t2 = min(t2, ndbuffer);
        
            float i1 = -(c * t1 + b * t1 * t1 + t1 * t1 * t1 / 3.0);
            float i2 = -(c * t2 + b * t2 * t2 + t2 * t2 * t2 / 3.0);
            return (i2 - i1) * (3.0 / 4.0);
        }

        //apollonian gasket
        float gasket(vec3 rp) {
            
            float scale = 1.0;

            for (int i = 0; i < 6; i++) {
                rp = mod(rp - 1.0, 2.0) - 1.0;
                rp -= sign(rp) * (0.05 + sin(T * 0.14) * 0.05);
                float k = (1.1 + sin(T * 0.1) * -0.2) / dot(rp, rp);
                rp *= k;
                scale *= k;
            }

            return 0.25 * length(rp) / scale;
        }

        //distance function returns distance to nearest surface in scene
        float map(vec3 rp) {
            return gasket(rp);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy), d2 = map(rp - e.xyy);
            float d3 = map(rp + e.yxy), d4 = map(rp - e.yxy);
            float d5 = map(rp + e.yyx), d6 = map(rp - e.yyx);
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        //raymarch scene
        float march(vec3 ro, vec3 rd) {

            float t = 0.0; //total distance marched

            for (int i = 0; i < 120; i++) {
                vec3 rp = ro + rd * t; //current step position
                float ns = map(rp); //nearest surface
                //break if surface is closer than EPS threshold ...
                // or total distance is further than FAR threshold
                if (ns < EPS || t > FAR) break;                 
                t += ns; //add distance to total distance marched
            }

            return t;
        }

        // Based on original by IQ.
        // http://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
        float AO(vec3 rp, vec3 n) {
        
            float r = 0.0;
            float w = 1.0;
            float d = 0.0;
            
            for (float i = 1.0; i < 5.0; i += 1.0){
                d = i / 5.0;
                r += w * (d - map(rp + n * d));
                w *= 0.5;
            }
            
            return 1.0 - clamp(r, 0.0, 1.0);
        }
        
        float shadow(vec3 ro, vec3 rd, float end, float k) {
            
            float shade = 1.0;
            const int maxIt = 10; 
        
            float dist = 0.0;
            float stepDist = end / float(maxIt);
        
            for (int i = 0; i < maxIt; i++){
                float h = map(ro + rd * dist);
                shade = min(shade, smoothstep(0.0, 1.0, k * h / dist));
                
                dist += clamp(h, .2, stepDist);
                if (abs(h)<0.001 || dist > end) break; 
            }
        
            return min(max(shade, 0.0) + 0.1, 1.0); 
        }    

        vec3 colourScene(vec3 ro, vec3 rd, float t) {

            vec3 pc = vec3(0.0);

            vec3 rp = ro + rd * t; //ray surface intersection position
            vec3 n = normal(rp); //surface normal
            
            //camera light
            vec3 cld = normalize(lp - rp); //light direction
            float clt = length(lp - rp); //light distance
            float cdiff = max(dot(n, cld), 0.05); //diffuse lighting
            float cspec = pow(max(dot(reflect(-cld, n), -rd), 0.0), 32.0); //specular lighting
            float catten = 1.0 / (1.0 + clt * clt * 2.0); //light attenuation
            float cshad = shadow(rp, cld, clt, 16.0);

            //sphere light
            vec3 sld = normalize(sphere.xyz - rp);
            float slt = length(sphere.xyz - rp);
            float sdiff = max(dot(sld, n), 0.2);
            float sspec = pow(max(dot(reflect(-sld, n), -rd), 0.0), 16.0);
            float satten = 1.0 / (1.0 + slt * slt * 0.8); //light attenuation
            float sshad = shadow(rp, sld, slt, 16.0);
            
            float ao = AO(rp, n);
            
            //diffuse
            pc = 0.2 * vec3(0.3, 0.24, 0.3) * cdiff * catten + 
                 0.8 * vec3(0.0, 1.0, 0.0) * sdiff * satten;
            pc *= 0.5;

            //specular
            pc += (vec3(1.0) * cspec * catten * 4.0 + 
                  vec3(0.0, 1.0, 0.0) * sspec * satten * 0.4) * 0.5;

            //uplight
            pc += vec3(0.6, 0.0, 1.0) * clamp(n.y, 0.0, 1.0) * 0.03;

            //shadow      
            vec3 spc = pc * sshad;
            pc = mix(spc, pc, clamp(slt * 0.2, 0.0, 1.0));
            pc *= cshad;

            //strip lights
            float my1 = mod(rp.y + T * 0.4, 5.2);
            float my2 = mod(rp.y + T * 0.1, 3.4);
            float my3 = mod(rp.y + T * -0.3, 2.8);
            if (my1 > 5.19) pc += vec3(0.0, 1.0, 0.0) / (1.0 * t * t);
            if (my2 > 3.39) pc += vec3(0.0, 1.0, 0.0) / (1.0 * t * t);
            if (my3 > 2.79) pc += vec3(0.0, 1.0, 0.0) / (1.0 * t * t);

            pc *= ao;

            return pc;
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - v_resolution.xy * 0.5) / v_resolution.y;

            float ct = T * 0.3;

            sphere.xyz = vec3(1.0, 1.0, ct + cos(T * 0.2) * 8.0);
            ro = vec3(1.0, 1.0, ct - 5.0);
            lp = ro + vec3(0.2, 0.3, 0.2);
            
            sphere.xy += path2(sphere.z);
            ro.xy += path(ro.z);
            lp.xy += path(lp.z);            

            float FOV = PI / 3.0;
            vec3 forward = normalize(sphere.xyz - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
            float mint = FAR;

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            float t = march(ro, rd); //raymarch scene
            if (t > 0.0 && t < FAR) {
                //hit surface
                mint = t;
                pc = colourScene(ro, rd, t);
            }

            vec3 nN, nF;
            vec2 ball = sphIntersect(ro, rd, sphere, nN, nF);
            if (ball.x > 0.0) {
                float sd = sphDensity(ro, rd, sphere, mint);
                if (sd > 0.0) {
                    pc = mix(pc, vec3(0.0, 1.0, 0.0), sd);
                    pc = mix(pc, vec3(0.4, 1.0, 0.4), sd * sd * sd);
                }
            }

            float fogAmount = 1.0 - exp(-mint * 0.6);
            mix (pc, vec3(0.1, 0.1, 0.0), fogAmount);

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};