'use strict';

var glm = require('gl-matrix');

const cubeTextureSrc = require('./static/images/cubetexture.png');

function initBuffers(gl) {

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
    
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
    
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
    
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
    
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
    
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    const vertexNormals = [
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        // Back
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        // Top
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        // Bottom
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        // Right
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    // Now set up the texture coordinates for the faces.
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                  gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        textureCoordBuffer: textureCoordBuffer,
        indexBuffer: indexBuffer
    };
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl) {

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    gl.texImage2D(gl.TEXTURE_2D, 
                  0, 
                  gl.RGBA,
                  1, 
                  1, 
                  0, 
                  gl.RGBA, 
                  gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));
  
    const image = new Image();
    image.onload = function() {
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 
                      0, 
                      gl.RGBA,
                      gl.RGBA, 
                      gl.UNSIGNED_BYTE, 
                      image);
  
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = cubeTextureSrc;
  
    return texture;
}

function drawScene(gl, programInfo, buffers, texture, cubeRotation, clearColour) {

    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(clearColour.red, clearColour.green, clearColour.blue, 1.0); 
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = glm.mat4.create();
  
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    glm.mat4.perspective(projectionMatrix,
                        fieldOfView,
                        aspect,
                        zNear,
                        zFar);
  
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = glm.mat4.create();

    glm.mat4.translate(modelViewMatrix, // destination matrix
                       modelViewMatrix, // matrix to translate
                       [-0.0, 0.0, -6.0]); // amount to translate
    glm.mat4.rotate(modelViewMatrix, // destination matrix
                    modelViewMatrix, // matrix to rotate
                    cubeRotation, // amount to rotate in radians
                    [0, 0, 1]); // axis to rotate around (Z)
    glm.mat4.rotate(modelViewMatrix, // destination matrix
                    modelViewMatrix, // matrix to rotate
                    cubeRotation * 0.7, // amount to rotate in radians
                    [0, 1, 0]); // axis to rotate around (X)

    const normalMatrix = glm.mat4.create();
    glm.mat4.invert(normalMatrix, modelViewMatrix);
    glm.mat4.transpose(normalMatrix, normalMatrix);

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation,
                           3,
                           gl.FLOAT,
                           false,
                           0,
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    
    // Tell WebGL how to pull out the normals from
    // the normal buffer into the vertexNormal attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation,
                           3,
                           gl.FLOAT,
                           false,
                           0,
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);
    
    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoordBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoordAttributeLocation,
                           2,
                           gl.FLOAT,
                           false,
                           0,
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoordAttributeLocation);

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
  
    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        modelViewMatrix);
    gl.uniformMatrix3fv(programInfo.uniformLocations.normalMatrixUniformLocation,
                        false,
                        normalMatrix);

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0);                    

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

module.exports = {
    initBuffers: initBuffers,
    loadTexture: loadTexture,
    drawScene: drawScene
};