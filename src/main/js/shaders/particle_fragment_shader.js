'use strict';

function fragmentSource() {
    
    const fsSource = `

        #ifdef GL_ES
            precision highp float;
        #endif
    
        uniform vec2 u_resolution;
        uniform sampler2D u_texture0;
        uniform sampler2D u_texture1;
        uniform sampler2D u_texture2;

        varying vec4 v_colour;

        void main() {

            vec4 pc = v_colour;

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            if (uv.y < 0.0) {
                pc = vec4(1.0);
            }

            gl_FragColor = pc;
        }
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};