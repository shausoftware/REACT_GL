'use strict';

const glm = require('gl-matrix');

//const PDIM = 1024;
const PDIM = 256;

function initBuffers(gl) {

    var uva = [];
    for (var x = 0; x < PDIM; ++x) {
        for (var y = 0; y < PDIM; ++y) {
            uva.push(x / PDIM);
            uva.push(y / PDIM);
        }
    } 
    var uv = new Float32Array(uva);

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

    const particleUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const insetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, insetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inset), gl.STATIC_DRAW);

    return {
        particleUV: particleUVBuffer,
        screenQuad: screenQuadBuffer,
        inset: insetBuffer
    };
}

function initComputeBuffer(gl, ext) {

    var texs = [];
    for (var i = 0; i < 3; i++) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PDIM, PDIM, 0, gl.RGBA, gl.FLOAT, null);
        texs.push(texture);

        gl.bindTexture(gl.TEXTURE_2D, null); //clean up
    }

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texs[0], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, texs[1], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, texs[2], 0);

    ext.drawBuffersWEBGL([
        ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
        ext.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
    ]);

    if (!gl.isFramebuffer(fb)) {
        console.error("Failed to create framebuffer");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //clean up
    
    return {framebuffer: fb, textures: texs};
}

function drawInit(gl, programInfo, buffers, computeBuffer) {

    gl.bindFramebuffer(gl.FRAMEBUFFER, computeBuffer.framebuffer);
    
    gl.viewport(0, 0, PDIM, PDIM);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ZERO);  // so alpha output color draws correctly

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuad);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //clean up
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function drawCompute(gl, programInfo, buffers, fromBuffer, 
                         toBuffer, time, delta) {

    gl.bindFramebuffer(gl.FRAMEBUFFER, toBuffer.framebuffer);
    
    gl.viewport(0, 0, PDIM, PDIM);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ZERO);  // so alpha output color draws correctly

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuad);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[0]);
    gl.uniform1i(programInfo.uniformLocations.texture0UniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[1]);
    gl.uniform1i(programInfo.uniformLocations.texture1UniformLocation, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[2]);
    gl.uniform1i(programInfo.uniformLocations.texture2UniformLocation, 2);
    
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, time);
    gl.uniform1f(programInfo.uniformLocations.deltaUniformLocation, delta);
    
    //TODO: mouse
    gl.uniform3f(programInfo.uniformLocations.inputPositionUniformLocation, 0.0, 0.0, 0.0);
    gl.uniform1f(programInfo.uniformLocations.forceUniformLocation, 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //clean up
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);    
}

function updateCamera(gl, elapsedSeconds) {
    
    var fov = 0.25 * 3.14159265359;
    var near = 0.1;
    var far = 1000.0;
    var aspect = gl.canvas.width / gl.canvas.height;

    var origin = [0.0, 0.0, 10.0];
    var target = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var right = [1.0, 0.0, 0.0];

    var viewMatrix = glm.mat4.create();
    var projectionMatrix = glm.mat4.create();
    var viewProjectionMatrix = glm.mat4.create();

    glm.mat4.lookAt(viewMatrix, origin, target, up);

    glm.mat4.rotate(viewMatrix, viewMatrix, elapsedSeconds, [0, 1, 0]);
    
    glm.mat4.perspective(projectionMatrix, fov * 2.0, aspect, near, far);
    glm.mat4.mul(viewProjectionMatrix, projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}
        
function drawScene(gl, programInfo, buffers, computeBuffer, projectionMatrix) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation, false, projectionMatrix);
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    
    gl.enableVertexAttribArray(programInfo.attribLocations.uvAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.particleUV);
    gl.vertexAttribPointer(programInfo.attribLocations.uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[0]);
    gl.uniform1i(programInfo.uniformLocations.texture0UniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[1]);
    gl.uniform1i(programInfo.uniformLocations.texture1UniformLocation, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[2]);
    gl.uniform1i(programInfo.uniformLocations.texture2UniformLocation, 2);

    gl.drawArrays(gl.POINTS, 0, PDIM * PDIM);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.uvAttributeLocation);
    gl.useProgram(null);
}

function drawVignette(gl, programInfo, buffers, texture) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 1.0, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.inset);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0);
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
}

module.exports = {
    initBuffers: initBuffers,
    initComputeBuffer: initComputeBuffer,
    drawInit: drawInit,
    drawCompute: drawCompute,
    updateCamera: updateCamera,
    drawScene: drawScene,
    drawVignette: drawVignette
};