'use strict';

function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;
        
        #define T u_time

        void main() {

            vec3 pc = vec3(0.0);

            vec2 uv = gl_FragCoord.xy / u_resolution;
            
            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};