'use strict';

function fragmentSource() {
    
    const fsSource = `

    precision mediump float;
    
    varying float v_depth;

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
        gl_FragColor = packDepth(v_depth);
        //gl_FragColor = vec4(1.0);          
    }
    
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};