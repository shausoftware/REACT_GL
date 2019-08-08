'use strict';

var glm = require('gl-matrix');

/* Raymarching Helper */

export function initBuffers(gl) {

    var quad = new Float32Array([
        -1.0, -1.0,  0.0,
        1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0,
        1.0,  1.0,  0.0,
    ]);

    const inset = [
        -0.98, -0.98,
        -0.98,  0.98,
        0.98,  0.98,
        0.98,  0.98,
        0.98, -0.98,
        -0.98, -0.98
    ];

    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const insetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, insetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inset), gl.STATIC_DRAW);

    return {
        screenQuadBuffer: screenQuadBuffer,
        screenInsetBuffer: insetBuffer
    };
}

export function drawRMScene(gl, 
                     programInfo, 
                     buffers, 
                     texture1,
                     texture2,
                     texture3,
                     texture4,
                     runningTime) {
    
    gl.viewport(0, 0, 640, 480);
    gl.clearColor(0.0, 1.0, 0.0, 1.0); //green
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInsetBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    if (texture1 != undefined) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.uniform1i(programInfo.uniformLocations.texture1UniformLocation, 0); 
    }
    if (texture2 != undefined) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.uniform1i(programInfo.uniformLocations.texture2UniformLocation, 1); 
    }
    if (texture3 != undefined) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture3);
        gl.uniform1i(programInfo.uniformLocations.texture3UniformLocation, 2); 
    }
    if (texture4 != undefined) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, texture4);
        gl.uniform1i(programInfo.uniformLocations.texture4UniformLocation, 3); 
    }

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
}