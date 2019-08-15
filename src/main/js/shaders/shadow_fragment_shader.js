'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

    precision mediump float;

    //varying
    in float v_discard;
    in vec3 v_w_position;
    
    out vec4 outputColour;

    vec4 encodeFloat (float depth) {

        const vec4 bitShift = vec4(256 * 256 * 256,
                                   256 * 256,
                                   256,
                                   1.0);
        
        const vec4 bitMask = vec4(0,
                                  1.0 / 256.0,
                                  1.0 / 256.0,
                                  1.0 / 256.0);

        vec4 comp = fract(depth * bitShift);
        comp -= comp.xxyz * bitMask;
        return comp;
    }

    void main(void) {
        if (v_discard > 0.0) {
            //not a great way to do this
            //I need to get an understanding of oblique frustum culling
            if (v_w_position.y > -0.05) discard;
        }
        vec4 shadowDepth = encodeFloat(gl_FragCoord.z);
        outputColour = shadowDepth;          
    }
    
    `;
    
    return fsSource;
};
