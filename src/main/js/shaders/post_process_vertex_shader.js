'use strict';

export function vertexSource() {

    const vsSource = `#version 300 es

        in vec4 a_position;

        void main() {
            gl_Position = a_position;
        }
    `;

    return vsSource;
}
