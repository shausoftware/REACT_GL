'use strict';

function fragmentSource() {
    
    const fsSource = `

        #ifdef GL_ES
            precision highp float;
        #endif
    
        varying highp vec2 v_texture_coord;
        varying highp vec3 v_lighting;
        
        uniform sampler2D u_texture;

        void main() {
            highp vec4 texelColor = texture2D(u_texture, v_texture_coord);
            gl_FragColor = vec4(texelColor.rgb * v_lighting, texelColor.a);
        }
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};