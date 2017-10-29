'use strict';

function fragmentSource() {
    
    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform sampler2D u_vignette_texture;
    
        void main() {

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec4 pc = texture2D(u_vignette_texture, uv);

            gl_FragColor = vec4(pc.xyz, 1.0);
        }
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};