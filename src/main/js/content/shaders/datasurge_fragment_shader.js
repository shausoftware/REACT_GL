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
        
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

        // simplified version of Dave Hoskins blur from Virgill
        vec3 dof(sampler2D tex, vec2 uv, float rad) {
            const float GA =2.399; 
	        vec3 acc = vec3(0);
            vec2 pixel = vec2(.002*u_resolution.y/u_resolution.x, .002), angle = vec2(0, rad);;
            rad = 1.;
	        for (int j = 0; j < 80; j++) {  
                rad += 1. / rad;
	            angle *= rot(GA);
                vec4 col=texture(tex,uv+pixel*(rad-1.)*angle);
		        acc+=col.xyz;
	        }
	        return acc/80.;
        }

        float noise(vec2 uv, float s1, float s2, float t1, float t2, float c1) {
            return clamp(hash33(vec3(uv.xy * s1, t1)).x +
                         hash33(vec3(uv.xy * s2, t2)).y, c1, 1.);
        }

        void main() {

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;

            vec3 pc = vec4(dof(u_texture1, uv, texture(u_texture1, uv).w), 1.).xyz;
            float n = noise(uv, 64., 32., float(u_frame), float(u_frame), .96);
            pc *= n;
            pc *= sin((uv.y + u_time * 0.05) * 800.0) * 0.2 + 0.9; 

            outputColour = vec4(pc, 1.);
        }
    `;

    return fsSource;
};