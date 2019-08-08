'use strict';

export function fragmentSource() {
    
    const fsSource = `

    precision mediump float;
    
    uniform sampler2D u_ssao_texture; 
    uniform sampler2D u_image_texture;
    uniform float u_dof;
    
    const float GA = 2.399; 
    const mat2 rot = mat2(cos(GA), sin(GA), -sin(GA), cos(GA));

    float decodeFloat(vec4 colour) {
        const vec4 bitShift = vec4(1.0 / (256.0 * 256.0 * 256.0),
                                   1.0 / (256.0 * 256.0),
                                   1.0 / 256.0,
                                   1.0);
        return dot(colour, bitShift);
    } 

    // simplyfied version of Dave Hoskins blur
    vec3 dof(sampler2D tex, vec2 uv, float rad, vec2 res) {
        vec3 acc = vec3(0);
        vec2 pixel = vec2(0.002 * res.y / res.x, 0.002);
        vec2 angle = vec2(0, rad);
        rad = 1.0;
        for (int j = 0; j < 80; j++) {  
            rad += 1.0 / rad;
            angle *= rot;
            vec4 col = texture2D(tex, uv + pixel * (rad - 1.0) * angle);
            acc += col.xyz;
        }
        return acc / 80.0;
    }
    
    void main(void) {

        vec2 iResolution = vec2(640.0, 480.0);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        float depth = decodeFloat(texture2D(u_ssao_texture, uv));
        vec3 pc = dof(u_image_texture, uv, depth * u_dof, iResolution);

        gl_FragColor = vec4(pc, 1.0);
        //gl_FragColor = vec4(vec3(depth), 1.0);
        //gl_FragColor = texture2D(u_image_texture, uv);
    }
    
    `;
    
    return fsSource;
};