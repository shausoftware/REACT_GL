'use strict';

function vertexSource() {

    const vsSource = `

    attribute vec3 a_position;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform float u_y_scale;
    
    varying float v_discard;
    varying vec3 v_w_position;

    void main(void) {

        vec4 pos = vec4(a_position, 1.0);
        v_discard = u_y_scale > 0.0 ? 0.0 : 1.0;
        pos.y *= u_y_scale;
        v_w_position = pos.xyz;

        gl_Position = u_projection_matrix * u_model_view_matrix * pos;
    }

    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};