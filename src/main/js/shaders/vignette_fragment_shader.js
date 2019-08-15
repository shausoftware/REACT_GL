'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform sampler2D u_vignette_texture;

        out vec4 outputColour;
    
        void main() {

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec4 pc = texture(u_vignette_texture, uv);

            outputColour = vec4(pc.xyz, 1.0);
        }
    `;
    
    return fsSource;
};
