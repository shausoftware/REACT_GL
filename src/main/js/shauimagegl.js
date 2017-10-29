'use strict';

var glm = require('gl-matrix');
var m4 = require('./m4');

function loadImageAndCreateTextureInfo(gl, url) {

    var tex = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, tex);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    //non a power of 2 images
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo = {
        width: 1,
        height: 1,
        texture: tex,
    };

    var img = new Image();
    img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;
        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });
    img.src = url;

    return textureInfo;
}

function drawImage(gl, programInfo, buffers, textureInfo, runningTime, vignette) {
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInset);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0);
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    gl.uniform1f(programInfo.uniformLocations.vignetteUniformLocation, vignette);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
    
module.exports = {
    loadImageAndCreateTextureInfo: loadImageAndCreateTextureInfo,
    drawImage: drawImage
};