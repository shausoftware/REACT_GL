'use strict';

export function fragmentSource() {

    const fsSource = `#version 300 es

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform int u_frame;

        uniform sampler2D u_texture1;        
        
        #define EPS 0.005
        #define FAR 100.0 
        #define PI 3.14159265359
        #define T u_time

        out vec4 outputColour;

        vec3 lp = vec3(4.0, 5.0, -2.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        //IQs noise
        float noise(vec3 rp) {
            vec3 ip = floor(rp);
            rp -= ip; 
            vec3 s = vec3(7, 157, 113);
            vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
            rp = rp * rp * (3.0 - 2.0 * rp); 
            h = mix(fract(sin(h) * 43758.5), fract(sin(h + s.x) * 43758.5), rp.x);
            h.xy = mix(h.xz, h.yw, rp.y);
            return mix(h.x, h.y, rp.z); 
        }

        float sdHelix(vec3 rp) {
            float a = atan(rp.y, rp.x) * 0.1;
            float b = mod(rp.z, PI * 0.2) - PI * 0.1;
            a = abs(a - b);
            if (a > PI * 0.1) a = PI * 0.2 - a;
            return length(vec2(length(rp.xy) - 6.0, a)) - 2.6;
        }

        //distance function returns distance to nearest surface in scene
        float map(vec3 rp) {
            float ns = sdHelix(rp);
            ns -= noise(rp) * 1.2;
            return ns < EPS ? 1.0 : 0.0;
        }

        // Voxel traversal logic learnt from IQ and Shane
        // http://www.iquilezles.org/www/articles/voxellines/voxellines.htm
        vec2 castRay(vec3 ro, vec3 rd, out vec3 oVos, out vec3 oDir) {
            
            vec3 pos = floor(ro);
            vec3 ri = 1.0 / rd;
            vec3 rs = sign(rd);
            vec3 dis = (pos - ro + 0.5 + rs * 0.5) * ri;
            float lit = 0.0;

            float res = -1.0;
            vec3 mm = vec3(0.0);
            for( int i = 0; i < 128; i++) {
                if (map(pos) > 0.0) {
                    res = 1.0;
                    float mz = mod(pos.z, 8.0);
                    if (pos.y > -1.6 && pos.y < 1.6 && mz > 5.0) lit = 1.0;
                    break;
                }
                mm = step(dis.xyz, dis.yxy) * step(dis.xyz, dis.zzx);
                dis += mm * rs * ri;
                pos += mm * rs;
            }
        
            vec3 nor = -mm * rs;
            vec3 vos = pos;
            
            // intersect the cube	
            vec3 mini = (pos - ro + 0.5 - 0.5 * vec3(rs)) * ri;
            float t = max (mini.x, max(mini.y, mini.z));
            
            oDir = mm;
            oVos = vos;
        
            return vec2(t * res, lit);
        }

        // Standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            vec3 lookAt = vec3(0.0, 0.0, T * 12.0);
            lp = vec3(sin(T * 1.0) * 1.2, sin(T * 0.7) * 1.0, T * 12.0 + sin(T * 0.6) * 6.0);
            ro = vec3(0.0, 0.2, T * 12.0 - 20.0);
            
            //ro.yz *= rot(T);

            float FOV = PI / 4.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        vec3 cubeColour(vec3 ro, vec3 rd, vec3 n, vec3 vos, vec2 t) {

            vec3 pc = vec3(0.0);

            vec3 rp = ro + rd * t.x;                
            vec3 ld = normalize(lp - rp);
            float lt = length(lp - rp);
            float diff = max(dot(ld, n), 0.05);
            float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 8.0); //specular
            float atten = 0.2 / (0.2 + lt * lt * 0.1); //light attenuation

            if (t.y == 1.0) {
                //light cube
                float k = length(rp - (vos + vec3(0.5)));
                float ldiff = max(dot(ld, n), 0.8);
                pc = vec3(1.0) * exp(k * -k * k) * ldiff * 0.8;
                pc += vec3(0.0, 1.0, 0.0) * exp(k * -k * k * k) * ldiff * 0.6;
            } else {
                //wall cube
                pc = vec3(0.01) * diff;
                pc += vec3(0.0, 1.0, 0.0) * diff * 0.6;
                pc += vec3(0.0, 1.0, 0.0) / (1.0 * lt * lt * 0.5);
                pc += vec3(0.0, 1.0, 0.2) * spec * 0.5;
                pc *= atten;
            }

            return pc;
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            vec3 vos, dir;
            vec2 t = castRay(ro, rd, vos, dir);
            if (t.x > 0.0) {
                
                vec3 rp = ro + rd * t.x; 
                vec3 brp = ro + rd * (t.x - 0.05);               
                vec3 n = -dir * sign(rd);
                
                pc = cubeColour(ro, rd, n, vos, t);

                //lights don't have reflections or shadows
                if (t.y == 0.0) {
                    //wall cube
                    //reflections
                    vec3 rrd = reflect(rd, n);
                    vec3 rvos, rdir;
                    vec2 rt = castRay(brp, rrd, rvos, rdir);
                    if (rt.x > 0.0) {
                        float ramt = rt.y == 1.0 ? 0.8 : 0.1;
                        vec3 rrp = rp + rrd * rt.x;
                        vec3 rn = -rdir * sign(rrd);
                        vec3 rpc = cubeColour(rp, rrd, rn, rvos, rt) * ramt;
                        pc += rpc * 0.1 / (1.0 + rt.x * rt.x * 0.1);
                    }

                    //shadows
                    vec3 ld = normalize(lp - rp);
                    float lt = length(lp - rp);
                    vec3 svos, sdir;
                    vec2 st = castRay(brp, ld, svos, sdir);
                    if (st.x > 0.0 && st.x < lt) {
                        pc *= clamp(st.x / lt, 0.4, 1.0);
                    }    
                }
            }

            //glow light
            pc += texture(u_texture1, gl_FragCoord.xy / u_resolution).xyz;
            
            outputColour = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};