'use strict';

export function fragmentSource() {

    const fsSource = `#version 300 es

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        #define UI0 1597334673U
        #define UI1 3812015801U
        #define UI2 uvec2(UI0, UI1)
        #define UI3 uvec3(UI0, UI1, 2798796415U)
        #define UIF (1.0 / float(0xffffffffU))

        #define LP1 vec3(5., 3., -6.)
        #define FAR 100.
        #define NBALLS 100
        
        uniform vec2 u_resolution;
        uniform float u_time; 
        uniform int u_frame;

        uniform sampler2D u_texture1; 

        out vec4 outputColour;

        struct Cube {
            float tN; //near face distance
            float tF; //far face distance
            vec3 nN; //near face normal
            vec3 nF; //far face normal
            float tx; //texture
        };

        //Dave Hoskins - Hash without sin
        vec2 hash22(vec2 p) {
            uvec2 q = uvec2(ivec2(p))*UI2;
            q = (q.x ^ q.y) * UI2;
            return vec2(q) * UIF;
        }

        //compact rotation - Fabrice
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        //wireframe edges
        float tex(vec3 p) {
            float tx = clamp(step(.9, abs(p.x)) + step(.9, abs(p.y)), 0., 1.);
            //tx *= step(.3, abs(p.x)) * step(.3, abs(p.y));
            return tx;
        } 

        // Cube mapping routine from Fizzer
        float cmap(vec3 p) {
            vec3 f = abs(p);
            f = step(f.zxy, f) * step(f.yzx, f); 
            f.xy = f.x>.5 ? p.yz/p.x : f.y>.5 ? p.xz/p.y : p.xy/p.z; 
            return tex(f);
        }

        //https://iquilezles.org/www/index.htm
        //IQ - Intesectors, sphere and box functions
        Cube boxIntersect(vec3 ro, vec3 rd, vec3 bs, float r1, float r2) {
            
            ro.xz *= rot(r1);
            rd.xz *= rot(r1);
            ro.xy *= rot(r2);
            rd.xy *= rot(r2);
            
            vec3 m = 1./rd,
                n = m*ro,
                k = abs(m)*bs,
                t1 = -n - k,
                t2 = -n + k;
            float tN = max(max(t1.x, t1.y), t1.z),
                tF = min(min(t2.x, t2.y), t2.z);
            if (tN>tF || tF<0.) return Cube(-.1, 0., vec3(0), vec3(0), 0.);
            vec3 nN = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz),
                nF = -sign(rd) * step(t2.xyz, t2.yzx) * step(t2.xyz, t2.zxy); 
            
            float tx = cmap(ro + rd*tN);
            
            nN.xy *= rot(-r2);
            nF.xy *= rot(-r2);
            nN.xz *= rot(-r1);
            nF.xz *= rot(-r1);
            
            return Cube(tN, tF, nN, nF, tx);
        } 

        struct Scene{
            float t;
            vec3 n;
            float tx;
        };
            
        Scene trace(vec3 ro, vec3 rd) {
            
            Scene s = Scene(-.1, vec3(0), 0.);
            
            float mint = FAR;
            for (int i=0; i<NBALLS; i++) {
                vec4 bp = texture(u_texture1, vec2(float(i)+0.5, 100.5) / u_resolution.xy);        
                vec2 hash = hash22(vec2(float(i), bp.w)) * 2.;
                float bx = sqrt(bp.w*bp.w*.5);
                Cube cube = boxIntersect(ro-bp.xyz, rd, vec3(bx), hash.x*u_time, hash.y*u_time);
                if (cube.tN>0. && cube.tN<mint) {
                    s = Scene(cube.tN, cube.nN, cube.tx);
                    mint = cube.tN;
                }
            }  
            
            return s;
        }   

        vec3 camera(vec2 U, vec2 R, vec3 ro, vec3 la, float fl) {
            vec2 uv = (U - R*.5) / R.y;
            vec3 fwd = normalize(la-ro),
                 rgt = normalize(vec3(fwd.z, 0., -fwd.x));
            return normalize(fwd + fl*uv.x*rgt + fl*uv.y*cross(fwd, rgt));
        }

        void main() {

            vec3 pc = vec3(0),
                 la = vec3(-20., 0., 0.), //look at
                 ro = vec3(-20., 0., -20.), //ray origin
                 rd = camera(gl_FragCoord.xy, u_resolution.xy, ro, la, 1.3); //camera
       
            float mint = FAR;
   
            //trace scene
            Scene s = trace(ro, rd);
            if (s.t>0. && s.t<FAR) {
                
                mint = s.t;
                
                vec3 p = ro + rd*s.t;
                vec3 ld = normalize(LP1-p);
                float spec = pow(max(dot(reflect(-ld, s.n), -rd), 0.0), 64.0);
                float fres = pow(clamp(dot(s.n, rd) + 1.0, 0.0, 1.0), 16.0);
        
                pc = vec3(0,1,0) * s.tx; 
                pc *= max(.05, dot(ld, s.n));
                pc += vec3(.8,.8,1.2) * (spec+fres);
            }

            outputColour = vec4(pc*3., mint);
        }
    `;

    return fsSource;
};