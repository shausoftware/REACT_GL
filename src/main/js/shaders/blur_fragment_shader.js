'use strict';

function fragmentSource() {
    
    const fsSource = `

    #ifdef GL_ES
	    precision highp float;
    #endif

    uniform sampler2D u_image_texture;
    uniform int u_orientation;
    uniform int u_blur_amount;
    uniform float u_blur_scale;
    uniform float u_blur_strength;

    #define PI 3.141592

    //box blur
    //http://devmaster.net/p/3100/shader-effects-glow-and-bloom#

    float gaussian (float x, float deviation) {
        return (1.0 / sqrt(2.0 * PI * deviation)) * exp(-((x * x) / (2.0 * deviation)));	
    }

    void main(void) {

        vec2 iResolution = vec2(640.0, 480.0);
        vec2 uv = gl_FragCoord.xy / iResolution;

        float halfBlur = float(u_blur_amount) * 0.5;
        vec4 colour = vec4(0.0);
        vec4 texColour = vec4(0.0);

        // Gaussian deviation
        float deviation = halfBlur * 0.35;
        deviation *= deviation;
        float strength = 1.0 - u_blur_strength;

        if (u_orientation == 0) {
            // Horizontal blur
            for (int i = 0; i < 10; ++i) {
                if (i >= u_blur_amount) break;
                float offset = float(i) - halfBlur;
                texColour = texture2D(u_image_texture, uv + vec2(offset * 1.0 / iResolution.x * u_blur_scale, 0.0)) * gaussian(offset * strength, deviation);
                colour += texColour;
            }
        } else {
            // Vertical blur
            for (int i = 0; i < 10; ++i) {
                if (i >= u_blur_amount) break;
                float offset = float(i) - halfBlur;
                texColour = texture2D(u_image_texture, uv + vec2(0.0, offset * 1.0 / iResolution.y * u_blur_scale)) * gaussian(offset * strength, deviation);
                colour += texColour;
            }
        }

        gl_FragColor = clamp(colour, 0.0, 1.0);
        gl_FragColor.w = 1.0;
    }
    
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};