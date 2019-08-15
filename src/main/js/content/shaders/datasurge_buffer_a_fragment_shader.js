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

        vec2 path(float p, float T) {
            return vec2(sin(p * .2 + u_time * .2), cos(p * .3 + u_time * .1));
        } 

        void main() {
            
            outputColour = vec4(0);
            vec4 oldBuffer = texture(u_texture1, gl_FragCoord.xy / u_resolution.xy);
            outputColour = oldBuffer;

            if (oldBuffer == vec4(0) || outputColour.x < -20.) {
                //initialise particle
                vec3 r = 5. * (hash33(vec3(gl_FragCoord.xy + 4. + u_time, float(u_frame))) - vec3(.5));
                outputColour = vec4(20. + r.x * 4., r.y, r.z, clamp(r.y * .5, .1, .4));
            }

            //move particle
            outputColour.x -= clamp(outputColour.w * .4, .3, .5); 
            outputColour.yz += path(outputColour.x + outputColour.w * 100., u_time) * clamp(outputColour.w * .1, .01, .05);        
        }
    `;

    return fsSource;
};