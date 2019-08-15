'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

        //#ifdef GL_ES
            precision highp float;
        //#endif
    
        uniform vec2 u_resolution;
        uniform sampler2D u_texture0;
        uniform sampler2D u_texture1;
        uniform sampler2D u_texture2;

        //varying 
        in vec4 v_colour;

        out vec4 outputColour;

        void main() {

            vec4 pc = v_colour;

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            if (uv.y < 0.0) {
                pc = vec4(1.0);
            }

            outputColour = pc;
        }
    `;
    
    return fsSource;
};
