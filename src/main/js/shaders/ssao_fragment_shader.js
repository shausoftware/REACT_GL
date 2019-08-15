'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

    precision mediump float;
    
    //varying
    in float v_depth;
    in float v_discard;
    in vec3 v_w_position;
      
    out vec4 outputColour;

    //from http://spidergl.org/example.php?id=6
	vec4 packDepth(const in float depth) {
		const vec4 bit_shift = vec4(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
        const vec4 bit_mask  = vec4(0.0, 
                                    1.0 / 256.0, 
                                    1.0 / 256.0, 
                                    1.0 / 256.0);
		vec4 res = fract(depth * bit_shift);
		res -= res.xxyz * bit_mask;
		return res;    		
    }
    
    void main(void) {

        if (v_discard > 0.0) {
            //not a great way to do this
            //I need to get an understanding of oblique frustum culling
            if (v_w_position.y > -0.05) discard;
        }

        outputColour = packDepth(v_depth);
    }
    
    `;
    
    return fsSource;
};
