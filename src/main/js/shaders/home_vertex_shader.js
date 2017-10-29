'use strict';

function vertexSource() {

    const vsSource = `

        attribute vec4 a_position;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_vignette;

        varying vec2 v_resolution;
        varying float v_time;
        varying float v_vignette;
        
        void main() {
            v_resolution = u_resolution;
            v_time = u_time;
            v_vignette = u_vignette;
            gl_Position = a_position;
        }
    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};