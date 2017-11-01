'use strict';

function drawTunnelSceneWithBufferTextures(gl, programInfo, buffers, texture1, texture2, runningTime, clearColour) {
    
    gl.viewport(0, 0, 640, 480);
    gl.clearColor(clearColour.red, clearColour.green, clearColour.blue, 1.0); //clear to white fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInset);
    
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0); 

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation2, 1); 

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

module.exports = {
    drawTunnelSceneWithBufferTextures: drawTunnelSceneWithBufferTextures
}
