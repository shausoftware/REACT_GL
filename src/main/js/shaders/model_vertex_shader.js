'use strict';

function vertexSource() {

    const vsSource = `

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform mat4 u_normals_matrix;
    uniform mat4 u_sm_model_view_matrix;
    uniform mat4 u_sm_projection_matrix;
    uniform float u_y_scale;

    varying vec4 v_shadow_position;
    varying vec3 v_position;
    varying vec3 v_normal;    
    varying vec3 v_w_position;
    varying vec3 v_w_normal;
    varying float v_discard;

    // Used to normalize our coordinates from clip space to (0 - 1)
    // so that we can access the corresponding point in our depth color texture
    const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
    
    void main(void) {
        vec4 pos = vec4(a_position, 1.0);
        v_discard = 0.0;
        v_w_normal = a_normal;
        if (u_y_scale < 0.0) {
            v_discard = 1.0;
            v_w_normal.y *= -1.0;
        }
        pos.y *= u_y_scale;
        v_w_position = pos.xyz;
        v_position = (u_model_view_matrix * pos).xyz;
        v_normal = (u_normals_matrix * vec4(a_normal, 1.0)).xyz;
        gl_Position = u_projection_matrix * u_model_view_matrix * pos;
        v_shadow_position = texUnitConverter * u_sm_projection_matrix * u_sm_model_view_matrix * vec4(a_position, 1.0);
    }

    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};