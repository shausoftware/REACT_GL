'use strict';

function drawSceneWithBufferTexture(gl, programInfo, buffers, texture, runningTime, clearColour) {
    
    gl.viewport(0, 0, 640, 480);
    gl.clearColor(clearColour.red, clearColour.green, clearColour.blue, 1.0); //clear to white fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInset);
    
    //tell the attribute how to get data out of the positioBuffer ARRAY_BUFFER
    var size = 2; //2 components per iteration
    var type = gl.FLOAT; //32 bit floats
    var normalize = false; //don't normalize the data
    var stride = 0; //0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; //start at the beginning of the buffer
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, size, type, normalize, stride, offset);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0);

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
};

module.exports = {
    drawSceneWithBufferTexture: drawSceneWithBufferTexture
};