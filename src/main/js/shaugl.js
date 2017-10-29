'use strict';

var glm = require('gl-matrix');

function initWebGL(glCanvas) {

    const gl = glCanvas.getContext('webgl');

    if (!gl) {
        alert('Please update to a web browser that supports WebGL.');
        return;
    }
};

function initShaderProgram(gl, vsSource, fsSource) {

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialise the shader program:' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
};

function loadShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shader:' + gl.getProgramInfoLog(shaderProgram));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

function checkExtensions(gl) {
    
    var ext1 = undefined;
    var ext2 = undefined;

    try {ext1 = gl.getExtension('OES_texture_float');} catch(e) {}
    if (!ext1) {
        console.error("OES_texture_float extension not supported");
        return undefined;
    }

    try {ext2 = gl.getExtension('WEBGL_draw_buffers');} catch(e) {}
    if (!ext2) {
        console.error("WEBGL_draw_buffers extension not supported");
        return undefined;
    }

    return ext2;
}

function initBuffers(gl) {

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
        screenQuad: screenQuadBuffer,
        screenInset: insetBuffer
    };
}

function setupTexture(gl) {
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindTexture(gl.TEXTURE_2D, null); //clean up

    return texture;
}

function setupRenderFramebuffer(gl) {
    
    var texture = this.setupTexture(gl);

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //clean up
    
    return {framebuffer: fbo, texture: texture};
}




function drawScene(gl, programInfo, buffers, runningTime, clearColour) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(clearColour.red, clearColour.green, clearColour.blue, 1.0); 
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

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
};

module.exports = {
    initShaderProgram: initShaderProgram,
    loadShader: loadShader,
    checkExtensions: checkExtensions,
    initBuffers: initBuffers,
    setupTexture: setupTexture,
    setupRenderFramebuffer: setupRenderFramebuffer,
    drawScene: drawScene
};