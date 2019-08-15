'use strict';

export function vertexSource() {

    const vsSource = `#version 300 es

        in vec3 a_position;
        in vec2 a_uv;
        
        uniform mat4 u_projection_matrix;
        uniform sampler2D u_texture0;
        uniform sampler2D u_texture1;
        uniform sampler2D u_texture2;

        //varying
        out vec4 v_colour;

        void main() {
            gl_PointSize = 2.0;
            v_colour = texture(u_texture2, a_uv);
            gl_Position = u_projection_matrix * texture(u_texture0, a_uv);
        }
    `;

    return vsSource;
}