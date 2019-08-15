'use strict';

export function vertexSource() {

    const vsSource = `#version 300 es

    in vec3 a_position;
    in vec3 a_normal;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix; 
    uniform float u_far;
    uniform float u_y_scale;

    //varying
    out float v_depth;
    out float v_discard;
    out vec3 v_w_position;

    void main(void) {
        
        vec4 pos = vec4(a_position, 1.0);
        v_discard = u_y_scale > 0.0 ? 0.0 : 1.0;
        pos.y *= u_y_scale;
        v_w_position = pos.xyz;
        
        v_depth = (u_model_view_matrix * pos).z / u_far;
        gl_Position = u_projection_matrix * u_model_view_matrix * pos;
    }

    `;

    return vsSource;
}
