'use strict';

export function vertexSource() {

    const vsSource = `#version 300 es

    in vec3 a_position;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;

    //varying
    out vec3 v_w_position;
    
    void main(void) {
        v_w_position = a_position;
        gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_position, 1.0);
    }

    `;

    return vsSource;
} 