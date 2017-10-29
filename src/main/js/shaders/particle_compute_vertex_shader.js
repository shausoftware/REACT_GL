'use strict';

function vertexSource() {

    const vsSource = `

        #ifdef GL_ES
            precision highp float;
        #endif

        attribute vec3 a_position;

        void main() {
            gl_Position = vec4(a_position, 1.0);
        }
    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};