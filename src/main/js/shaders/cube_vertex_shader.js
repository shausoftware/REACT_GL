'use strict';

function vertexSource() {

    const vsSource = `

        attribute vec4 a_position;
        attribute vec3 a_normal;
        attribute vec2 a_texture_coord;

        uniform mat4 u_normal_matrix;
        uniform mat4 u_model_view_matrix;
        uniform mat4 u_projection_matrix;

        varying lowp vec2 v_texture_coord;
        varying lowp vec3 v_lighting;

        void main() {
            gl_Position = u_projection_matrix * u_model_view_matrix * a_position;
            v_texture_coord = a_texture_coord;
            // Apply lighting effect
            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
            highp vec4 transformedNormal = u_normal_matrix * vec4(a_normal, 1.0);
            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            v_lighting = ambientLight + (directionalLightColor * directional);
        }
    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};