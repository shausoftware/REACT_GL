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

        #define NBALLS 100
        #define NLIGHTS 10
        #define BW 4.0

        uniform vec2 u_resolution;
        uniform float u_time; 
        uniform int u_frame;

        uniform sampler2D u_texture1;  

        out vec4 outputColour;

        //Dave Hoskins - hash without sin
        vec3 hash33(vec3 p) {
            uvec3 q = uvec3(ivec3(p)) * UI3;
            q = (q.x ^ q.y ^ q.z)*UI3;
            return vec3(q) * UIF;
        }

        //compact rotation - Fabrice
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        //Physics from dr2 and iapafoto
        //https://www.shadertoy.com/view/Xsy3WR
        void animate(int idx, //current ball index  
                    inout vec4 bp,  //current ball position
                    inout vec4 bv) { //current ball velocity

            vec3 rn, vn, dr, f;
            float fOvlap, fDamp, rSep, dt, rtot;
            fOvlap = 1000.;
            fDamp = .1;
            f = vec3(0.);

            float grav = .1;
            
            for (int n=0; n<NBALLS; n++) {
                vec4 oBP = texture(u_texture1, vec2(float(n)+0.5, 100.5)/u_resolution.xy);
                dr = bp.xyz - oBP.xyz;
                rSep = length(dr);
                rtot = bp.w + oBP.w;
                if (n!=idx && rSep < rtot) f += fOvlap * (rtot / rSep - 1.) * dr;
            }

            dr = vec3(0., BW - bp.w - abs(bp.yz));
            
            f -= step(dr, vec3(1.)) * fOvlap * sign(bp.xyz) * (1. / abs(dr) - 1.) * dr +
            //           grav + fDamp * bv.xyz;
                            + fDamp * bv.xyz;
            
            dt = .001;
            bv.xyz += dt * f;
            bv.x+=grav; //accelerate
            bp.xyz += dt * bv.xyz;    
        }

        void main() {

            int idx = int(gl_FragCoord.xy.x-.5); //ball index
            float fidx = float(idx), //float version of ball index
                  type = gl_FragCoord.y; //data type
            vec3 hash = (hash33(vec3(gl_FragCoord.xy, float(u_frame)))-.5)*2.; //hash -1 to 1
        
            vec4 bp = texture(u_texture1, vec2(fidx+0.5, 100.5) / u_resolution.xy), //this ball position
                 bv = texture(u_texture1, vec2(fidx+0.5, 200.5) / u_resolution.xy), //this ball velocity
                 li = texture(u_texture1, vec2(fidx+0.5, 300.5) / u_resolution.xy); //light

            if (u_frame<2 || bp.x>20.) {
    
                //initialise/re-generate
                //position
                vec2 yz = hash.yz * .125; 
                if (u_frame<2) bp.xyz =  vec3(-20. + (hash.x+1.) * 20., yz);
                else bp.xyz =  vec3(-20. - (hash.x+1.) * 20., yz);
                //box size
                bp.w = clamp(hash.x+hash.z ,1., 2.);
                //velocity
                bv.xyz = hash * .08;
                
            } else {
                
                //do something
                if (type==100.5 || type==200.5) {
                    animate(idx, bp, bv);
                }
            }  
            
            //lights
            if (li==vec4(0) || li.x>20.) {
                vec2 yz = (4.*sign(hash.yz)) + hash.yz * 2.; 
                li = vec4(-40. - (hash.x+1.) * 20., yz, max(.4, (1.2 + hash.x) * .4));    
            }
            
            vec3 r = vec3(0., li.y, li.z);
            r.yz *= rot(.05*li.w);
            li.yz = r.yz;
            li.x += li.w * .3;

            //save
            if (type==100.5) {
                outputColour = bp; //ball position    
            } else if (type==200.5) {
                outputColour = bv; //ball velocity
            } else if (type==300.5) {
                outputColour = li; //light
            }
        }
    `;

    return fsSource;
};