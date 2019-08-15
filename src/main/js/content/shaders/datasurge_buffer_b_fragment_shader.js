'use strict';

export function fragmentSource() {

    const fsSource = `#version 300 es

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        #define PI 3.141592
        #define EPS .005
        #define FAR 30.

        #define UI0 1597334673U
        #define UI1 3812015801U
        #define UI2 uvec2(UI0, UI1)
        #define UI3 uvec3(UI0, UI1, 2798796415U)
        #define UIF (1.0 / float(0xffffffffU))

        uniform vec2 u_resolution;
        uniform float u_time; 
        uniform int u_frame;

        uniform sampler2D u_texture1; 

        out vec4 outputColour;

        struct Surface{
            float t; //nearest
            float b; //bands
            float bl; //band lights
            float c; //core
            float cl; //core lights
        };
        const Surface MISS = Surface(-1., 0., 0., 0., 0.);

        //Dave Hoskins - hash without sin
        vec3 hash33(vec3 p) {
            uvec3 q = uvec3(ivec3(p)) * UI3;
            q = (q.x ^ q.y ^ q.z)*UI3;
            return vec3(q) * UIF;
        }

        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        vec2 path(float p, float T) {
            return vec2(sin(p * .2 + u_time * .2), cos(p * .3 + u_time * .1));
        }  

        //noise IQ - Shane
        float n3D(vec3 p) {    
	        const vec3 s = vec3(7, 157, 113);
	        vec3 ip = floor(p); 
            p -= ip; 
            vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
            p = p * p * (3. - 2. * p);
            h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);
            h.xy = mix(h.xz, h.yw, p.y);
            return mix(h.x, h.y, p.z);
        }
        
        vec3 kali(vec3 rd) {
            vec3 pc = vec3(0);
            float k = 0.;
            for (float i = 0.; i < 6.; i++) {
                rd = abs(rd) / dot(rd, rd) - .63;
                k += length(rd) * length(hash33(rd + u_time*.2));
                pc += mix(vec3(1.,.5,0.), vec3(0.,1.,0.), i/6.) * k*k*k * .0003;
            }
            return pc;
        }

        //IQ
        float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
            vec3 pa = p - a, ba = b - a;
            float h = clamp( dot(pa, ba) / dot(ba, ba), 0., 1.);
            return length(pa - ba * h) - r;
        }

        //IQ
        float sdBox(vec2 p, vec2 b){
            vec2 d = abs(p)-b;
            return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
        }

        //Dr 2
        float sdSquareHelix(vec3 p, float r1, float r2, vec2 b, float m, float o) {
            float halfm = m * .5,
            a = 0.5 * sign(p.z) - atan(p.z,p.y) / (2.*PI);
            p.x = mod(-p.x + m * a + o, m) - halfm;
            return max(sdBox(vec2(length(p.yz) - r1, p.x), vec2(b + r2)), 
                      -sdBox(vec2(length(p.yz) - r1, p.x), vec2(b - r2))); 
        }

        //Eiffie
        float sdHelix(vec3 p, float r1, float r2, float m, float o) {
            float halfm = m*.5,
            b = mod(p.x + o, PI*m) - PI*halfm,
            a = abs(atan(p.y, p.z) * halfm - b);
            if (a > PI*halfm) a = PI*m - a;
            return length(vec2(length(p.zy) - r1, a)) - r2;
        }

        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.);
            return mix(b, a, h) - k * h * (1. - h);
        }
        
        float sdBall(vec3 p, float i, float r) {
            vec4 cp = texture(u_texture1, vec2(i+0.5, 100.5)/u_resolution.xy);
            return length(cp.xyz - p) - (1. / (1. + dot(cp.yz, cp.yz) * r));
        }

        vec2 dfCore(vec3 p) {
    
            vec3 q = p;
            q.yz += path(q.x, u_time);
            float qt = length(q.yz);
            vec3 h = hash33(q * qt * qt * 1.1);
            float nz = n3D(q * 1. + (vec3(u_time*8., u_time*.3, u_time*.3) + h)) -.5;
            float core = sdCapsule(q, vec3(100., 0., 0.), vec3(-100., 0., 0.), 1.4 + nz * qt * 1.3); 
        
            p.x = mod(p.x - 16., 40.) - 20.;    
            float ts = FAR, tsl = FAR;
            
            for (float i = 10.; i < 24.; i+=1.0) {
                float bt = sdBall(p, i, .6);
                tsl = (bt < tsl) ? bt : tsl;
            }

            for (float i = 30.; i < 40.; i+=1.0) {
                float bt = sdBall(p, i, .2 + nz * .6);
                ts = (bt < ts) ? bt : ts;
            }
                        
            return vec2(smin(ts, core, .9), tsl);
        }
        
        Surface map(vec3 p) {

            p.yz *= rot(u_time * .3);
        
            vec2 core = dfCore(p);
            
            float bands = sdSquareHelix(p, 3., .01, vec2(.01,.7), 4. * PI, 0.);
            float bandLights = min(sdHelix(p, 3.06, .06, 4., -PI-.35),
                               sdHelix(p, 3.06, .06, 4., -PI+.35));
            bands = min(bands, sdSquareHelix(p, 2.4, .01, vec2(.01,.9), 4.6 * PI, -1.4));
            bandLights = min(bandLights, min(sdHelix(p, 2.46, .06, 4.6, .9-PI-.4),
                                     sdHelix(p, 2.46, .06, 4.6, .9-PI+.4)));
            bands = min(bands, sdSquareHelix(p, 3.6, .01, vec2(.01,.2), 3. * PI, -3.4));
            bandLights = min(bandLights, sdHelix(p, 3.68, .04, 3., 4.6-PI-.4));
        
            return Surface(min(core.x, min(bands, min(bandLights, core.y))), 
                           bands, 
                           bandLights, 
                           core.x, 
                           core.y);
        }

        vec3 normal(vec3 p) {  
            vec2 e = vec2(-1., 1.) * EPS;   
            return normalize(e.yxx * map(p + e.yxx).t + e.xxy * map(p + e.xxy).t + 
                             e.xyx * map(p + e.xyx).t + e.yyy * map(p + e.yyy).t);   
        }
        
        float AO(vec3 p, vec3 n) {
        
            float r = 0.0,
                  w = 1.0,
                  d = 0.0;
        
            for (float i = 1.0; i < 5.0; i += 1.0){
                d = i / 5.0;
                r += w * (d - map(p + n * d).t);
                w *= 0.5;
            }
        
            return 1.0 - clamp(r, 0.0, 1.0);
        }

        Surface march(vec3 ro, vec3 rd, inout float t, inout vec3 gc) {
    
            for (int i = 0; i < 96; i++) {
                 
                 Surface s = map(ro + rd * t);
                 
                 if (s.t < EPS) return s;
                 if (t > FAR) break;
                 
                 //core lights
                 float ltsg = 1. / (1. + s.cl * s.cl * 12.);
                 gc += vec3(0., 1., 0.) * ltsg * .1;
                
                 //band glow
                 float ltbg = 1. / (1. + s.bl * s.bl * 400.);
                 gc += vec3(0., 1., 0.) * ltbg * .1;
                 
                 t += s.t * .5;
             }
             t = -1.;
             return MISS;
        }

        vec3 camera(vec2 U, vec2 R, vec3 ro, vec3 la, float fl) {
            vec2 uv = (U - R*.5) / R.y;
            vec3 fwd = normalize(la-ro),
                 rgt = normalize(vec3(fwd.z, 0., -fwd.x));
            return normalize(fwd + fl*uv.x*rgt + fl*uv.y*cross(fwd, rgt));
        }

        void main() {

            vec3 ro = vec3(1., 3. + (sin(u_time * .2) + 1.) * 1.2, -4.5 + (sin(u_time * .1) + 1.) * .2), 
                 gc = vec3(0.),
                 lp = vec3(5., 6., -5.);
       
            ro.xz *= rot(sin(u_time * .2) * .1);
            vec3 rd = camera(gl_FragCoord.xy, u_resolution, ro, vec3(0.), 2.4);
   
            vec3 pc = kali(-rd * 1.4) * .5;
   
            float t = 0., dof = 0.;
            Surface s = march(ro, rd, t, gc);
            if (t > 0.) {
                vec3 p = ro + rd * t;
                dof = length(p) * .05;
                vec3 n = normal(p);
                float ao = AO(p, n);
                vec3 ld = normalize(lp - p);
                float df = max(.05, dot(ld, n));
                float sp = pow(max(dot(reflect(-ld, n), -rd), 0.), 32.);
                float fres = pow(clamp(dot(n, rd) + 1., 0., 1.), 8.);
                if (s.t == s.b) {
                    //band
                    pc = vec3(.1) * df * ao;    
                    pc += vec3(1.) * sp;
                    pc += vec3(1.) * fres;
                    
                } else if (s.t == s.c) {
                    //core    
                    pc = vec3(.2) * df * ao;
                    
                    //dof = .9;
                    
                } else if (s.t == s.cl || s.t == s.bl) {
                    //lights    
                    pc = vec3(0., 1.8, 0.) * ao;
                }
            }
            pc += gc;

            outputColour = vec4(pc, dof);
        }
    `;

    return fsSource;
};