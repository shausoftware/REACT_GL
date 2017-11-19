'use strict';

function vertexSource() {

    const vsSource = `

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform mat4 u_normals_matrix;
    
    uniform float u_far;

    varying float v_depth;

    void main(void) {
        v_depth = (u_model_view_matrix * vec4(a_position, 1.0)).z / u_far;
        gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_position, 1.0);
    }

    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};