'use strict';

const bugattiImgSrc = require('../../static/images/bugatti2.png');
const bugattiJsonSrc = require('../../static/bugatti.obj');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import ModelVertexShader from '../../shaders/model_vertex_shader';
import BugattiFragmentShader from '../../content/shaders/bugatti_fragment_shader';

var glm = require('gl-matrix');

var shadowDepthTextureSize = 4096;
var lightPosition = [-3.5, 8.0, 6.0];

function getTitle() {
    return "Bugatti";
}

function getDescription() {
    var description = "This is my first attempt at loading at loading and rendering " +
                      "a reasonably complex OBJ model file. I had to create a pre-processor that " +
                      "breaks up the geometry by material assignment before parsing to JSON. " +
                      "The excellent Bugatti model is by Kimzauto. The lighting uses screen space " +
                      "ambient occlusion, shadow maps and opacity.";
    return description;
}

function getSnapshotImage() {
    return bugattiImgSrc;
}

function initGLContent(gl, mBuffExt) {

    //bugatti program
    const modelVsSource = ModelVertexShader.vertexSource();
    const bugattiFsSource = BugattiFragmentShader.fragmentSource();
    const bugattiShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, bugattiFsSource);
    const bugattiProgramInfo = {
        program: bugattiShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(bugattiShaderProgram, 'a_position'),
            normalAttributeLocation: gl.getAttribLocation(bugattiShaderProgram, 'a_normal')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_projection_matrix'),
            smModelViewMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_sm_model_view_matrix'),
            smProjectionMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_sm_projection_matrix'),
            normalsMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_normals_matrix'),
            depthColourTextureUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_depth_colour_texture'),
            colourUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_colour'),
            specularUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_specular'),
            transparencyUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_transparency'),
            reflectUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_reflect'),
            shadowUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_shadow'),
            fresnelUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_fresnel'),
            texUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_tex'),
            lightPositionUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_light_position'),
            eyePositionUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_eye_position'),
            ssaoTextureUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_ssao_texture'),
            yScaleUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_y_scale')
        }
    }

    const shadowMapProgramInfo = ShauGL.initShadowProgram(gl);
    const ssaoProgramInfo = ShauGL.initSSAOProgram(gl);
    const postProcessProgramInfo = ShauGL.initPostProcessProgram(gl);

    var programInfos = {renderProgramInfo: bugattiProgramInfo,
                        shadowMapProgramInfo: shadowMapProgramInfo,
                        ssaoProgramInfo: ssaoProgramInfo,
                        postProcessProgramInfo: postProcessProgramInfo};

    const screenQuad = [
        -1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
         1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0];
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad), gl.STATIC_DRAW);

    const inset = [
        -0.98, -0.98,
        -0.98,  0.98,
         0.98,  0.98,
         0.98,  0.98,
         0.98, -0.98,
        -0.98, -0.98];
    const insetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, insetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inset), gl.STATIC_DRAW);        

    var buffers = {modelBuffers: undefined,
                   glassBuffers: undefined,
                   floorBuffer: undefined,
                   screenQuadBuffer: screenQuadBuffer,
                   screenInsetBuffer: insetBuffer};

    var shadowMapFramebuffer = ShauGL.initDepthFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
    var ssaoFramebuffer = ShauGL.initDepthFramebuffer(gl, gl.canvas.width, gl.canvas.height);
    var imageFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);

    var framebuffers = {shadowMapFramebuffer: shadowMapFramebuffer,
                        ssaoFramebuffer: ssaoFramebuffer,
                        imageFramebuffer: imageFramebuffer};

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: framebuffers};                        
}

function loadGLContent(gl, mBuffExt, content) {
    //do nothing
    return new Promise(resolve => {

        ShauGL.loadJsonMesh(bugattiJsonSrc).then(mesh => {

            var model = JSON.parse(mesh);
            
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

            var floorData = [-100.0, -0.15,  100.0,   0.0, 1.0, 0.0,
                              100.0, -0.15,  100.0,   0.0, 1.0, 0.0,
                              100.0, -0.15, -100.0,   0.0, 1.0, 0.0,
                             -100.0, -0.15,  100.0,   0.0, 1.0, 0.0,
                              100.0, -0.15, -100.0,   0.0, 1.0, 0.0,
                             -100.0, -0.15, -100.0,   0.0, 1.0, 0.0];
            const floorInterleavedBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, floorInterleavedBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorData), gl.STATIC_DRAW);
            var floorBuffer =  {partid: 'floor',
                                interleavedBuffer: floorInterleavedBuffer,
                                indexcount: 6,
                                basecolour: [0.00, 0.3, 0.05],
                                metalcolour: [0.0, 0.0, 0.0],
                                emission: 0.0,
                                specular: 0.6,
                                transparency: 0.0,
                                reflect: 0.0,
                                shadow: 1.0,
                                fresnel: 0.0,
                                textureid: 1.0};    

            content.buffers.modelBuffers = modelBuffers;
            content.buffers.glassBuffers = glassBuffers
            content.buffers.floorBuffer = floorBuffer;            

            resolve(content);
        });
    });
}

function renderGLContent(gl, content, dt) {

    var cameraPosition = glm.vec3.fromValues(7.0, 3.0, 9.0);
    var target = glm.vec3.fromValues(0.0, 0.0, 0.5);
    glm.vec3.rotateY(cameraPosition, cameraPosition, target, dt * 0.04);

    var camera = {
        position: cameraPosition,
        target: target,
        near: 0.01,
        far: 400.0,
        fov: 45.0,
        aspectRatio: gl.canvas.width / gl.canvas.height
    };    
    var lightProjectionMatrix = glm.mat4.create();
    glm.mat4.ortho(lightProjectionMatrix,                   
                    -10.0,
                     10.0,
                    -10.0,
                     10.0,
                    -10.0, 
                     20.0);
    var cameraProjectionMatrix = glm.mat4.create();
    glm.mat4.perspective(cameraProjectionMatrix,
                            camera.fov,
                            camera.aspectRatio,
                            camera.near,
                            camera.far);
    var viewCameraMatrices = ShauGL.setupCamera(camera.position, camera.target, cameraProjectionMatrix);
    var shadowMapCameraMatrices = ShauGL.setupCamera(lightPosition, camera.target, lightProjectionMatrix);

    // Draw to our off screen drawing buffer for shadow map
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.shadowMapFramebuffer.framebuffer);
    drawShadowMap(gl, 
                  content.programInfos.shadowMapProgramInfo, 
                  content.buffers, 
                  shadowMapCameraMatrices,  
                  shadowDepthTextureSize);
                  
    //ssao depth to off screen buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.ssaoFramebuffer.framebuffer);
    drawSSAODepthMap(gl, 
                     content.programInfos.ssaoProgramInfo, 
                     content.buffers,
                     viewCameraMatrices, 
                     camera.far);

    //draw scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.imageFramebuffer.framebuffer);
    drawScene(gl, 
              content.programInfos.renderProgramInfo, 
              content.buffers, 
              viewCameraMatrices,
              shadowMapCameraMatrices,
              content.framebuffers.shadowMapFramebuffer.texture,
              content.framebuffers.ssaoFramebuffer.texture,
              lightPosition,
              camera);  
              
    //post processing
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    postProcess(gl,
                content.programInfos.postProcessProgramInfo,
                content.buffers,
                content.framebuffers.imageFramebuffer.texture,
                content.framebuffers.ssaoFramebuffer.texture,
                0.05);
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

    //y scale
    gl.uniform1f(programInfo.uniformLocations.yScaleUniformLocation, 1.0);      

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
    //y scale
    gl.uniform1f(programInfo.uniformLocations.yScaleUniformLocation, 1.0);

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
    //y scale
    gl.uniform1f(programInfo.uniformLocations.yScaleUniformLocation, 1.0);

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
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenInsetBuffer);
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
    getTitle: getTitle,
    getDescription: getDescription,
    getSnapshotImage: getSnapshotImage,
    initGLContent: initGLContent,
    loadGLContent: loadGLContent,
    renderGLContent: renderGLContent
};