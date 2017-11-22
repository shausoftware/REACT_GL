'use strict';

function vertexSource() {

    const vsSource = `

        attribute vec4 a_position;

        void main() {
            gl_Position = a_position;
        }
    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};