'use strict';

const $ = require('jquery');
var glm = require('gl-matrix');

function initBuffers(gl, model) {

    const inset = [
        -0.98, -0.98,
        -0.98,  0.98,
         0.98,  0.98,
         0.98,  0.98,
         0.98, -0.98,
        -0.98, -0.98
    ];

    const insetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, insetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inset), gl.STATIC_DRAW);

    var floorVertices = [
        -300.0, -1.0, 300.0,
        300.0,  -1.0, 300.0,
        300.0,  -1.0, -300.0,
        -300.0, -1.0, -300.0
    ];
    const floorVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertices), gl.STATIC_DRAW);

    var floorNormals = [
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0
    ];
    const floorNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorNormals), gl.STATIC_DRAW);

    var floorIndices = [
        0, 1, 2, 0, 2, 3
    ];
    const floorIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIndices), gl.STATIC_DRAW);

    const modelVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);

    console.log('vertices:' + model.vertices.length);

    const modelNormalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);

    console.log('normals:' + model.normals.length);

    const modelIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

    return {
        floorVerticesBuffer: floorVerticesBuffer,
        floorNormalsBuffer: floorNormalsBuffer,
        floorIndicesBuffer: floorIndicesBuffer,
        floorIndexCount: floorIndices.length,
        modelVerticesBuffer: modelVerticesBuffer,
        modelNormalsBuffer: modelNormalsBuffer,
        modelIndicesBuffer: modelIndicesBuffer,
        modelIndexCount: model.indices.length,
        screenInsetBuffer: insetBuffer
    }
}

function initSmFramebuffer(gl, width, height) {

    var shadowDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    var renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowDepthTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return {
        framebuffer: fb,
        texture: shadowDepthTexture
    };
}

function loadObj(objdata, useMaterials) {

    //TODO: make useMaterials the only behaviour

    var lines = objdata.split('\n');
    var vertices = [];
    var normals = [];
    var indices = [];
    var objectGroups = [];
    var currentGroup = undefined;

    for (var i = 0; i < lines.length; i++) {
        //console.log(lines[i]);
        var split1 = lines[i].trim().split(' ');  
        if (split1.length > 0) {
            switch(split1[0]) {
                case 'v': {
                    vertices.push(parseFloat(split1[1]));
                    vertices.push(parseFloat(split1[2]));
                    vertices.push(parseFloat(split1[3]));
                    break;
                }
                case 'vn': {
                    normals.push(parseFloat(split1[1]));
                    normals.push(parseFloat(split1[2]));
                    normals.push(parseFloat(split1[3]));
                    break;
                }
                case 'f': {
                    var f1 = split1[1].split('/');
                    var f2 = split1[2].split('/');
                    var f3 = split1[3].split('/');
                    indices.push(parseInt(f1[0]) - 1);
                    indices.push(parseInt(f2[0]) - 1);
                    indices.push(parseInt(f3[0]) - 1);
                    break;
                }
                case 'usemtl': {
                    if (useMaterials === true) {
                        if (currentGroup) {
                            //save vertices et al to slot in list
                            currentGroup.vertices = vertices;
                            currentGroup.normals = normals;
                            currentGroup.indices = indices;
                            objectGroups.push(currentGroup);
                        } 
                        var newGroupId = split1[1]; //new material name
                        currentGroup = {groupid: newGroupId, 
                                        vertices: [],
                                        normals: [],
                                        indices: []};
                        vertices = [];
                        normals = [];
                        indices = [];
                    }
                }
            }
        }
    }

    if (useMaterials === true) {
        console.log('USE MATERIALS');
        var refinedGroups = [];
        for (var i = 0; i < objectGroups.length; i++) {
            var groupid = objectGroups[i].groupid;
            //check if groupid exists in refined map
            var existingGroup = undefined;
            for (var j = 0; j < refinedGroups.length; j++) {
                if (groupid === refinedGroups[j].groupid) {
                    existingGroup = refinedGroups[j];
                    break;
                }
            }
            if (existingGroup) {
                //already have an entry for this group id
                refinedGroups[j].vertices.push(objectGroups[i].vertices);
                refinedGroups[j].normals.push(objectGroups[i].normals);
                refinedGroups[j].indices.push(objectGroups[i].indices);
            } else {
                //new group
                refinedGroups.push(objectGroups[i])
            }
        }
        objectGroups = refinedGroups;
        //debug
        for (var i = 0; i < objectGroups.length; i++) {
            console.log('id:' + objectGroups[i].groupid);
        }
        //*/
    }

    if (useMaterials) {
        return objectGroups;
    } else {
        return {
            vertices: vertices,
            normals: normals,
            indices: indices
        };
    }
}

function loadMesh(uri, useMaterials) {
    return new Promise(resolve => {
        $.ajax({
            url: uri,
            dataType: 'text'
        }).done(function(data) {
            resolve(loadObj(data, useMaterials));
        }).fail(function() {
            alert('Faild to retrieve [' + uri + "]");
        });     
    });
}

function setupCamera(cameraPosition, target, projectionMatrix) {

    var up = [0.0, 1.0, 0.0];

    var modelViewMatrix = glm.mat4.create();
    glm.mat4.lookAt(modelViewMatrix, cameraPosition, target, up);

    const normalMatrix = glm.mat4.create();
    glm.mat4.invert(normalMatrix, modelViewMatrix);
    glm.mat4.transpose(normalMatrix, normalMatrix);

    return {
        modelViewMatrix: modelViewMatrix,
        projectionMatrix: projectionMatrix,
        normalMatrix: normalMatrix
    };
}

function drawSSAO(gl, programInfo, buffers, viewCameraMatrices, camera) {

    gl.useProgram(programInfo.program);

    // Set the viewport to our shadow texture's size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        viewCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        viewCameraMatrices.modelViewMatrix);

    //far
    gl.uniform1f(programInfo.uniformLocations.farUniformLocation, camera.far);                    

    //teapot                    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelVerticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);    
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.modelIndicesBuffer);                                            
    gl.drawElements(gl.TRIANGLES, buffers.modelIndexCount, gl.UNSIGNED_SHORT, 0);

    //floor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorVerticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.floorIndicesBuffer);                                            
    gl.drawElements(gl.TRIANGLES, buffers.floorIndexCount, gl.UNSIGNED_SHORT, 0);
}

function drawShadowMap(gl, programInfo, buffers, shadowMapCameraMatrices, depthRez) {

    gl.useProgram(programInfo.program);

    // Set the viewport to our shadow texture's size
    gl.viewport(0, 0, depthRez, depthRez);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.modelViewMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelVerticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.modelIndicesBuffer);    
                                        
    gl.drawElements(gl.TRIANGLES, buffers.modelIndexCount, gl.UNSIGNED_SHORT, 0);
}

function drawScene(gl, programInfo, buffers, viewCameraMatrices, shadowMapCameraMatrices, shadowMapTexture, 
                       ssaoTexture, lightPosition) {
    
    gl.useProgram(programInfo.program);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //camera matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        viewCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        viewCameraMatrices.modelViewMatrix);
    //shadow map matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.smProjectionMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.smModelViewMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.modelViewMatrix);
    //normals matrix
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalsMatrixUniformLocation,
                        false,
                        viewCameraMatrices.normalMatrix);
                        
    //shadow map texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowMapTexture);
    gl.uniform1i(programInfo.uniformLocations.depthColourTextureUniformLocation, 0);

    //ssao texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ssaoTexture);
    gl.uniform1i(programInfo.uniformLocations.ssaoTextureUniformLocation, 1);

    //light position
    gl.uniform3fv(programInfo.uniformLocations.lightPositionUniformLocation, lightPosition);

    //draw teapot                    
    //colour
    gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, [0.0, 0.0, 1.0]);
    //vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelVerticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    //normals
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelNormalsBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);
    //indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.modelIndicesBuffer);    
    gl.drawElements(gl.TRIANGLES, buffers.modelIndexCount, gl.UNSIGNED_SHORT, 0);
    //*/

    //draw floor
    //colour
    gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, [0.8, 0.8, 1.0]);
    //vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorVerticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                           3, 
                           gl.FLOAT, 
                           false, 
                           0, 
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    //normals
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorNormalsBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);
    //indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.floorIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, buffers.floorIndexCount, gl.UNSIGNED_SHORT, 0);
    //*/
}

function vignette(gl, programInfo, buffers, imageTexture) {

    gl.useProgram(programInfo.program);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInsetBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    //image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(programInfo.uniformLocations.vignetteTextureUniformLocation, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

module.exports = {
    initBuffers: initBuffers,
    initSmFramebuffer: initSmFramebuffer,
    loadMesh: loadMesh,
    setupCamera: setupCamera,
    drawSSAO: drawSSAO,
    drawShadowMap: drawShadowMap,
    drawScene: drawScene,
    vignette: vignette
};