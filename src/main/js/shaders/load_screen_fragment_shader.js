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

        out vec4 outputColour;

        void main() {

            vec3 pc = vec3(0.0);

            vec2 uv = (-1.0 + 2.0 * gl_FragCoord.xy / u_resolution.xy)
                      * vec2(u_resolution.x / u_resolution.y, 1.0);
            float r = length(uv) * 2.0;
            //compact loader icon from IQ
            float a = atan(uv.y, uv.x) + 1.0 * u_time;      
            pc = mix(pc, vec3(1.0, 1.0, 1.0), 
                     (1.0 - smoothstep(0.10, 0.14, abs(r - 0.5)))  * smoothstep(0.4, 0.6, sin(17.0 * a)));

                     
            outputColour = vec4(pc, 1.0);
        }
    `;
    
    return fsSource;
};