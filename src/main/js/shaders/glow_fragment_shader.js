'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

    precision mediump float;

    uniform vec3 u_colour;
    
    //varying
    in vec3 v_w_position;
    
    out vec4 outputColour;

    void main(void) {

        //TODO: this fix is specific to IronMan shader to reduce glow at rear
        float ga = clamp(step(0.0, v_w_position.z), 0.15, 1.0);

        outputColour = vec4(u_colour, 1.0) * ga;
    }
    
    `;
    
    return fsSource;
};