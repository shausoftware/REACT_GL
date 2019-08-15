'use strict';

export function vertexSource() {

    const vsSource = `#version 300 es

        //#ifdef GL_ES
            precision highp float;
        //#endif

        in vec3 a_position;

        void main() {
            gl_Position = vec4(a_position, 1.0);
        }
    `;

    return vsSource;
};