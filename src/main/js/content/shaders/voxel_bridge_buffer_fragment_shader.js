'use strict';

export function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;

        uniform sampler2D u_texture1;        
        
        #define EPS 0.005
        #define FAR 100.0 
        #define PI 3.14159265359
        #define T u_time

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        vec4 sphere = vec4(0.0, 0.0, 0.0, 0.25);

        //slightly modified version of IQs sphere functions
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

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            vec3 lookAt = vec3(0.0, 0.0, T * 12.0);
            sphere.xyz = vec3(sin(T * 1.0) * 1.2, sin(T * 0.7) * 1.0, T * 12.0 + sin(T * 0.6) * 6.0);
            ro = vec3(0.0, 0.2, T * 12.0 - 20.0);
            
            float FOV = PI / 4.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0); 

            vec3 ro, rd;
            setupCamera(ro, rd);

            vec3 nN, nF;
            vec2 st = sphIntersect(ro, rd, sphere, nN, nF);
            if (st.x > 0.0) {

                float sd = sphDensity(ro, rd, sphere, FAR);
                if (sd > 0.0) {
                    pc = mix(pc, vec3(0.0, 1.0, 0.0), sd);
                    pc = mix(pc, vec3(0.0, 1.0, 0.0), sd * sd * sd);
                    pc = mix(pc, vec3(0.4, 1.0, 0.0), sd * sd * sd * sd * sd);
                }
            }

            vec3 aa = texture2D(u_texture1, gl_FragCoord.xy / u_resolution).xyz;
            aa -= 0.01;
            pc += aa;

            gl_FragColor = vec4(pc, 1.0);
        }
    `;

    return fsSource;
};