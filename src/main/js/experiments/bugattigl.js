'use strict';

function initBuffers(gl) {

    const screenQuad = [
        -1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
         1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ];
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad), gl.STATIC_DRAW);

    return {modelBuffers: undefined,
            glassBuffers: undefined,
            floorBuffer: undefined,
            screenQuadBuffer: screenQuadBuffer
    };
}
    
function initModelBuffers(buffers, gl, model) {
    
    var modelBuffers = [];
    var glassBuffers = [];

    for (var i = 0; i < model.modelParts.length; i++) {

        var modelPart = model.modelParts[i];

        //console.log('model:' + modelPart.partid + ' colour:' + modelPart.basecolour);

        const groupInterleavedBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, groupInterleavedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelPart.interleaved), gl.STATIC_DRAW);
        var modelBuffer = {partid: modelPart.partid,
                           interleavedBuffer: groupInterleavedBuffer,
                           indexcount: modelPart.interleaved.length / 6,
                           basecolour: modelPart.basecolour,
                           metalcolour: modelPart.metalcolour,
                           emission: modelPart.emission,
                           specular: modelPart.specular,
                           transparency: modelPart.transparency,
                           reflect: modelPart.reflect,
                           shadow: modelPart.shadow,
                           fresnel: modelPart.fresnel,
                           textureid: modelPart.textureid};

        if (modelPart.transparency > 0.0) {
            glassBuffers.push(modelBuffer);
        } else {
            modelBuffers.push(modelBuffer);
        }                  
    }

    var floorData = [-100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                        100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                        100.0, -0.1, -100.0,   0.0, 1.0, 0.0,
                        -100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                        100.0, -0.1, -100.0,   0.0, 1.0, 0.0,
                        -100.0, -0.1, -100.0,   0.0, 1.0, 0.0];
    const floorInterleavedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorInterleavedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorData), gl.STATIC_DRAW);
    var floorBuffer =  {partid: 'floor',
                        interleavedBuffer: floorInterleavedBuffer,
                        indexcount: 6,
                        basecolour: [0.05, 0.0, 0.3],
                        metalcolour: [0.0, 0.0, 0.0],
                        emission: 0.0,
                        specular: 0.0,
                        transparency: 0.0,
                        reflect: 0.0,
                        shadow: 1.0,
                        fresnel: 0.0,
                        textureid: 0.0};    

    buffers.modelBuffers = modelBuffers;
    buffers.glassBuffers = glassBuffers
    buffers.floorBuffer = floorBuffer;
}

function drawShadowMap(gl, programInfo, buffers, cameraMatrices, depthRez) {
    
    gl.useProgram(programInfo.program);
    
    // Set the viewport to our shadow texture's size
    gl.viewport(0, 0, depthRez, depthRez);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        cameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        cameraMatrices.modelViewMatrix);

    //draw glass                  
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexcount);                       
    }    

    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexcount);                       
    }
}
    
function drawSSAODepthMap(gl, programInfo, buffers, viewCameraMatrices, far) {
    
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
    gl.uniform1f(programInfo.uniformLocations.farUniformLocation, far);

    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexcount);                       
    }            

    //draw floor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorBuffer.interleavedBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                            3, 
                            gl.FLOAT, 
                            gl.FALSE, 
                            Float32Array.BYTES_PER_ELEMENT * 6, 
                            0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.drawArrays(gl.TRIANGLES, 0, buffers.floorBuffer.indexcount);                       

    //draw glass
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexcount);                       
    }    
}
     
function drawScene(gl, 
                    programInfo, 
                    buffers,
                    viewCameraMatrices,
                    shadowMapCameraMatrices,
                    shadowMapTexture,
                    ssaoTexture,
                    lightPosition,
                    camera) {

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
    //eye position
    gl.uniform3fv(programInfo.uniformLocations.eyePositionUniformLocation, camera.position);
    
    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        //normals
        gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE,
                                Float32Array.BYTES_PER_ELEMENT * 6,
                                Float32Array.BYTES_PER_ELEMENT * 3);   
        gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);

        //colour
        gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.modelBuffers[i].basecolour);        
        //specular
        gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.modelBuffers[i].specular);        
        //transparency
        gl.disable(gl.BLEND);
        gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.modelBuffers[i].transparency);        
        //reflectivity
        gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.modelBuffers[i].reflect);        
        //shadow
        gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.modelBuffers[i].shadow);        
        //fresnel
        gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.modelBuffers[i].fresnel);
        //texture id
        gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.modelBuffers[i].textureid);
        
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexcount);                       
    }  
    //*/

    //draw glass
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        //normals
        gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE,
                                Float32Array.BYTES_PER_ELEMENT * 6,
                                Float32Array.BYTES_PER_ELEMENT * 3);   
        gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);

        //colour
        gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.glassBuffers[i].basecolour);        
        //specular
        gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.glassBuffers[i].specular);        
        //transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.glassBuffers[i].transparency);        
        //reflectivity
        gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.glassBuffers[i].reflect);        
        //shadow
        gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.glassBuffers[i].shadow);        
        //fresnel
        gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.glassBuffers[i].fresnel);
        //texture id
        gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.glassBuffers[i].textureid);
        
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexcount);                               
    }
    //*/

    //draw floor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorBuffer.interleavedBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                            3, 
                            gl.FLOAT, 
                            gl.FALSE, 
                            Float32Array.BYTES_PER_ELEMENT * 6, 
                            0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    //normals
    gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                            3, 
                            gl.FLOAT, 
                            gl.FALSE,
                            Float32Array.BYTES_PER_ELEMENT * 6,
                            Float32Array.BYTES_PER_ELEMENT * 3);   
    gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);
    
    //colour
    gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.floorBuffer.basecolour);        
    //specular
    gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.floorBuffer.specular);        
    //transparency
    gl.disable(gl.BLEND);
    gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.floorBuffer.transparency);        
    //reflectivity
    gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.floorBuffer.reflect);        
    //shadow
    gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.floorBuffer.shadow);        
    //fresnel
    gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.floorBuffer.fresnel);
    //texture id
    gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.floorBuffer.textureid);
        
    gl.drawArrays(gl.TRIANGLES, 0, buffers.floorBuffer.indexcount); 

}
    
function postProcess(gl, 
                        programInfo, 
                        buffers,
                        imageTexture,
                        ssaoTexture,
                        dof) {

    gl.useProgram(programInfo.program);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuadBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    //dof
    gl.uniform1f(programInfo.uniformLocations.dofUniformLocation, dof);
        
    //image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(programInfo.uniformLocations.imageTextureUniformLocation, 0);

    //ssao texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ssaoTexture);
    gl.uniform1i(programInfo.uniformLocations.ssaoTextureUniformLocation, 1);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

module.exports = {
    initBuffers: initBuffers,
    initModelBuffers: initModelBuffers,
    drawShadowMap: drawShadowMap,
    drawSSAODepthMap: drawSSAODepthMap,
    drawScene: drawScene,
    postProcess: postProcess
};