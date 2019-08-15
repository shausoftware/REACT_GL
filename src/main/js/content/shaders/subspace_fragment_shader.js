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
        
        #define FAR 100.

        uniform vec2 u_resolution;
        uniform float u_time; 
        uniform int u_frame;

        uniform sampler2D u_texture1; 
        uniform sampler2D u_texture2; 

        out vec4 outputColour;

        //Dave Hoskins - hash without sin
        vec3 hash33(vec3 p) {
            uvec3 q = uvec3(ivec3(p)) * UI3;
            q = (q.x ^ q.y ^ q.z)*UI3;
            return vec3(q) * UIF;
        }

        float noise(vec2 uv, float s1, float s2, float t1, float t2, float c1) {
            return clamp(hash33(vec3(uv.xy * s1, t1)).x +
                         hash33(vec3(uv.xy * s2, t2)).y, c1, 1.);
        }

        void main() {

            vec3 pc = vec3(0);
            vec2 uv = gl_FragCoord.xy/u_resolution.xy;
            
            float cy = 1. - abs(uv.y - .5) * 2.;
            pc = vec3(0,1,0) * pow(cy,3.) + vec3(1.) * pow(cy,18.);
            float n = noise(uv, 64., 16., float(u_frame), float(u_frame), .96);
            pc *= n;
            pc *= sin((uv.y + u_time * 0.05) * 1200.0) * 0.1 + 0.9;
        
            float uvx = abs(uv.x-.5) * 2.;
            uvx*=uvx;
            float scale = max(0., uvx-.6)*2.;
            float uvy = clamp(.5 + (uv.y-.5) * (1. + scale*scale*4.), 0.0, 1.0);
            vec4 scene = texture(u_texture1, vec2(uv.x, uvy));

            if (scene.w!=FAR && scene.xyz!=vec3(0,1,0)) {
                pc = scene.xyz;    
            }
            
            pc += texture(u_texture2, uv).xyz;
            
            outputColour = vec4(pc, 1.);
        }
    `;

    return fsSource;
};