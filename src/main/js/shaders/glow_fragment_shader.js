'use strict';

function fragmentSource() {
    
    const fsSource = `

    precision mediump float;

    uniform vec3 u_colour;
    
    void main(void) {
        gl_FragColor = vec4(u_colour, 1.0);
    }
    
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};