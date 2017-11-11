'use strict';

function vertexSource() {

    const vsSource = `

    attribute vec3 a_position;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    
    void main(void) {
        gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_position, 1.0);
    }

    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};