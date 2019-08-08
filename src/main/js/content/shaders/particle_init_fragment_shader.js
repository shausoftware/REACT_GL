'use strict';

export function fragmentSource() {
    
    const fsSource = `

        #extension GL_EXT_draw_buffers : require
    
        #ifdef GL_ES
            precision highp float;
        #endif

        uniform vec2 u_resolution;
  
        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}

        void main() {

            vec2 uv = gl_FragCoord.xy / u_resolution.xy;

            float r1 = rand(uv) - 0.5;
            float r2 = rand(uv.yx * 0.5) - 0.5;

            vec3 pos = vec3(r1, r2, 0.0);
            pos.yz *= rot(r1 * 3.14);

            vec3 vel = vec3(r2 * 3.0, r1 * 2.0, r1 * r2 * 5.0);
            vec4 col = vec4(1.0, 0.3, 0.1, 0.5);

            gl_FragData[0] = vec4(pos, 1.0);
            gl_FragData[1] = vec4(vel, 1.0);
            gl_FragData[2] = col;
        }
    `;
    
    return fsSource;
};