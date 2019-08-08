'use strict';

export function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_vignette;
        uniform sampler2D u_texture;
        
        #define T u_time

        void main() {

            vec3 pc = vec3(0.0);

            vec2 uv = gl_FragCoord.xy / u_resolution;
            
            pc = texture2D(u_texture, vec2(uv.x, 1.0 - uv.y)).xyz;

            pc *= sin(gl_FragCoord.y * 350.0 + T) * 0.04 + 1.0;
            pc *= sin(gl_FragCoord.x * 350.0 + T) * 0.04 + 1.0;

            //modified vignetting logic from Galvanize intro by Virgill
            //https://www.shadertoy.com/view/4tc3zf
            uv.x *= u_resolution.x / u_resolution.y;
            float vignette = u_vignette;
            float g2 = (vignette / 2.0) + 0.39;
            float g1 = ((1.0 - vignette) / 2.0);
            if (uv.y >= g2 + 0.11) pc *= 0.0;
            if (uv.y >= g2 + 0.09) pc *= 0.4;
            if (uv.y >= g2 + 0.07) {if (mod(uv.x - 0.06 * T, 0.18) <= 0.16) pc *= 0.5;}
            if (uv.y >= g2 + 0.05) {if (mod(uv.x - 0.04 * T, 0.12) <= 0.10) pc *= 0.6;}
            if (uv.y >= g2 + 0.03) {if (mod(uv.x - 0.02 * T, 0.08) <= 0.06) pc *= 0.7;}
            if (uv.y >= g2 + 0.01) {if (mod(uv.x - 0.01 * T, 0.04) <= 0.02) pc *= 0.8;}
            if (uv.y <= g1 + 0.10) {if (mod(uv.x + 0.01 * T, 0.04) <= 0.02) pc *= 0.8;}
            if (uv.y <= g1 + 0.08) {if (mod(uv.x + 0.02 * T, 0.08) <= 0.06) pc *= 0.7;}
            if (uv.y <= g1 + 0.06) {if (mod(uv.x + 0.04 * T, 0.12) <= 0.10) pc *= 0.6;}
            if (uv.y <= g1 + 0.04) {if (mod(uv.x + 0.06 * T, 0.18) <= 0.16) pc *= 0.5;}
            if (uv.y <= g1 + 0.02) pc *= 0.4;
            if (uv.y <= g1 + 0.00) pc *= 0.0;

            gl_FragColor = vec4(pc, 1.0);
        }
    `;

    return fsSource;
};