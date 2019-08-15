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
        uniform sampler2D u_texture2; 
        uniform sampler2D u_texture3; 

        #define FAR 100.
        #define NLIGHTS 10

        out vec4 outputColour;

        //https://iquilezles.org/www/index.htm
        float sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
            vec3 oc = ro - sph.xyz;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - sph.w*sph.w;
            float h = b*b - c;
            if (h<0.) return -1.0;
            return -b - sqrt(h);
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

        vec4 trace(vec3 ro, vec3 rd) {
    
            vec4 s = vec4(0.);
            
            float mint = FAR;
            for (int i=0; i<NLIGHTS; i++) {
                vec4 bp = texture(u_texture2, vec2(float(i)+0.5, 300.5) / u_resolution.xy);   
                float si = sphIntersect(ro, rd, vec4(bp.xyz,.5));
                if (si>0. && si<mint) {
                    mint = si;
                    s = vec4(si, bp.xyz);
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

            vec2 uv = gl_FragCoord.xy/u_resolution.xy;
            float uvx = abs(uv.x-.5) * 2.;
            uvx*=uvx;
            float scale = max(0., uvx-.6)*2.;
            float uvy = .5 + (uv.y-.5) * (1. + scale*scale*4.);
            vec4 scene = texture(u_texture3, vec2(uv.x, uvy));
             
            vec3 ppc = texture(u_texture1, gl_FragCoord.xy/u_resolution.xy).xyz;

            vec4 s = trace(ro, rd);

            if (s.x>0. && s.x<scene.w) {
                float w = sphDensity(ro, rd, vec4(s.yzw,.5), FAR); 
                if (w>0.) {
                    pc = vec3(0.,1.,0.) * w*w*w*1.;    
                    pc += vec3(1.) * pow(w, 8.);    
                }
                
            }

            outputColour = vec4(pc+ppc*.844, 1.);
        }
    `;

    return fsSource;
};