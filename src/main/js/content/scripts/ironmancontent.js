'use strict';

const ironManImgSrc = require('../../static/images/ironman.png');
const ironManJsonSrc = require('../../static/IronMan.obj');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as ModelVertexShader from '../../shaders/model_vertex_shader';
import * as IronManFragmentShader from '../../content/shaders/iron_man_fragment_shader';
import * as IronManReflectionFragmentShader from '../../content/shaders/iron_man_reflection_fragment_shader';

var glm = require('gl-matrix');

var shadowDepthTextureSize = 4096;
var lightPosition = [-3.0, 15.0, 4.0];
var reflectionLightPosition = [-3.0, -15.0, 4.0];

var blurAmount = 8; //0 - 10
var blurScale = 0.9;
var blurStrength = 0.6; //0.0 - 1.0

export function getTitle() {
    return "Iron Man";
}

export function getDescription() {
    var description = "This great Iron-Man OBJ model by Kimzauto has been passed through my pre-processor (source on GIT)" + 
                      " to create a JSON representaion. This time I tried adding a glow effect some planar reflections in the floor. " +
                      "The models are quite large and take a little while to load.";
    return description;
}

export function getSnapshotImage() {
    return ironManImgSrc;
}

export function initGLContent(gl, mBuffExt) {

    //bugatti program
    const modelVsSource = ModelVertexShader.vertexSource();
    const ironManFsSource = IronManFragmentShader.fragmentSource();
    const ironManShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, ironManFsSource);
    const ironManProgramInfo = {
        program: ironManShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(ironManShaderProgram, 'a_position'),
            normalAttributeLocation: gl.getAttribLocation(ironManShaderProgram, 'a_normal')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_projection_matrix'),
            smModelViewMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_sm_model_view_matrix'),
            smProjectionMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_sm_projection_matrix'),
            normalsMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_normals_matrix'),
            depthColourTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_depth_colour_texture'),
            colourUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_colour'),
            specularUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_specular'),
            transparencyUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_transparency'),
            reflectUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_reflect'),
            shadowUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_shadow'),
            fresnelUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_fresnel'),
            texUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_tex'),
            lightPositionUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_light_position'),
            lightStrengthUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_light_strength'),
            eyePositionUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_eye_position'),
            ssaoTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_ssao_texture'),
            glowMapTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_glow_map_texture'),
            reflectionTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_reflection_texture'),
            yScaleUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_y_scale')
        }
    }

    //bugatti reflection program
    const ironManReflectionFsSource = IronManReflectionFragmentShader.fragmentSource();
    const ironManReflectionShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, ironManReflectionFsSource);
    const ironManReflectionProgramInfo = {
        program: ironManReflectionShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(ironManReflectionShaderProgram, 'a_position'),
            normalAttributeLocation: gl.getAttribLocation(ironManReflectionShaderProgram, 'a_normal')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_projection_matrix'),
            smModelViewMatrixUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_sm_model_view_matrix'),
            smProjectionMatrixUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_sm_projection_matrix'),
            normalsMatrixUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_normals_matrix'),
            colourUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_colour'),
            specularUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_specular'),
            transparencyUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_transparency'),
            reflectUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_reflect'),
            shadowUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_shadow'),
            fresnelUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_fresnel'),
            texUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_tex'),
            lightPositionUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_light_position'),
            lightStrengthUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_light_strength'),
            eyePositionUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_eye_position'),
            yScaleUniformLocation: gl.getUniformLocation(ironManReflectionShaderProgram, 'u_y_scale')
        }
    }

    const shadowMapProgramInfo = ShauGL.initShadowProgram(gl);
    const glowProgramInfo = ShauGL.initGlowProgram(gl);
    const blurProgramInfo = ShauGL.initBlurProgram(gl);
    const ssaoProgramInfo = ShauGL.initSSAOProgram(gl);
    const postProcessProgramInfo = ShauGL.initPostProcessProgram(gl);

    var programInfos = {renderProgramInfo: ironManProgramInfo,
                        reflectionProgramInfo: ironManReflectionProgramInfo,
                        shadowMapProgramInfo: shadowMapProgramInfo,
                        glowProgramInfo: glowProgramInfo,
                        blurProgramInfo: blurProgramInfo,
                        ssaoProgramInfo: ssaoProgramInfo,
                        postProcessProgramInfo: postProcessProgramInfo};

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

    var buffers = {modelBuffers: undefined,
                   glassBuffers: undefined,
                   floorBuffer: undefined,
                   screenQuadBuffer: screenQuadBuffer,
                   screenInsetBuffer: insetBuffer};

    var shadowMapFramebuffer = ShauGL.initDepthFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
    var ssaoFramebuffer = ShauGL.initDepthFramebuffer(gl, gl.canvas.width, gl.canvas.height, 0.5);
    var glowMapFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var blurHFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var blurVFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var reflectionFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var imageFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    
    var framebuffers = {shadowMapFramebuffer: shadowMapFramebuffer,
                        ssaoFramebuffer: ssaoFramebuffer,
                        glowMapFramebuffer: glowMapFramebuffer,
                        blurHFramebuffer: blurHFramebuffer,
                        blurVFramebuffer: blurVFramebuffer,
                        reflectionFramebuffer: reflectionFramebuffer,
                        imageFramebuffer: imageFramebuffer};

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: framebuffers};
}

export function loadGLContent(gl, mBuffExt, content) {

    return new Promise(resolve => {
        
        ShauGL.loadJsonMesh(ironManJsonSrc).then(mesh => {

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
        
            var floorData = [-200.0, -0.1,  200.0,   0.0, 1.0, 0.0,
                              200.0, -0.1,  200.0,   0.0, 1.0, 0.0,
                              200.0, -0.1, -200.0,   0.0, 1.0, 0.0,
                             -200.0, -0.1,  200.0,   0.0, 1.0, 0.0,
                              200.0, -0.1, -200.0,   0.0, 1.0, 0.0,
                             -200.0, -0.1, -200.0,   0.0, 1.0, 0.0];
            const floorInterleavedBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, floorInterleavedBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorData), gl.STATIC_DRAW);
            var floorBuffer =  {partid: 'floor',
                                interleavedBuffer: floorInterleavedBuffer,
                                indexcount: 6,
                                basecolour: [0.0, 0.3, 0.05],
                                metalcolour: [1.0, 1.0, 1.0],
                                emission: 0.0,
                                specular: 0.8,
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

export function renderGLContent(gl, content, dt) {

    var cameraPosition = glm.vec3.fromValues(4.0, 10.0 + Math.sin(dt * 0.2) * 2.0, 10.0 + Math.sin(dt * 0.2) * 2.0);
    var target = glm.vec3.fromValues(0.0, 5.0 + Math.cos(dt * 0.2) * .0, 0.5);
    glm.vec3.rotateY(cameraPosition, cameraPosition, target, dt * 0.2);

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
                    -20.0,
                     20.0,
                    -20.0,
                     20.0,
                    -20.0, 
                     40.0);
    var cameraProjectionMatrix = glm.mat4.create();
    glm.mat4.perspective(cameraProjectionMatrix,
                            camera.fov,
                            camera.aspectRatio,
                            camera.near,
                            camera.far);
    var viewCameraMatrices = ShauGL.setupCamera(camera.position, camera.target, cameraProjectionMatrix);
    var shadowMapCameraMatrices = ShauGL.setupCamera(lightPosition, camera.target, lightProjectionMatrix);
    var lightStrength = Math.sin(dt * 0.2);

    //shadow map
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.shadowMapFramebuffer.framebuffer);
    drawShadowMap(gl, 
                  content.programInfos.shadowMapProgramInfo, 
                  content.buffers, 
                  shadowMapCameraMatrices,  
                  shadowDepthTextureSize);
    //*/

    //ssao
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.ssaoFramebuffer.framebuffer);
    drawSSAODepthMap(gl, 
                     content.programInfos.ssaoProgramInfo, 
                     content.buffers,
                     viewCameraMatrices, 
                     camera.far);
    //*/

    //glow map
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.glowMapFramebuffer.framebuffer);
    drawGlowMap(gl,
                content.programInfos.glowProgramInfo,
                content.buffers,
                viewCameraMatrices);
    //*/
         
    //box blur glow map
    //horizontal pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.blurHFramebuffer.framebuffer);
    blur(gl, 
         content.programInfos.blurProgramInfo, 
         content.buffers, 
         content.framebuffers.glowMapFramebuffer.texture,
         blurAmount, 
         blurScale, 
         blurStrength, 
         0);
    //vertical pass               
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.blurVFramebuffer.framebuffer);
    blur(gl, 
         content.programInfos.blurProgramInfo, 
         content.buffers, 
         content.framebuffers.blurHFramebuffer.texture,
         blurAmount, 
         blurScale, 
         blurStrength, 
         1);
    //*/

    //reflection     
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.reflectionFramebuffer.framebuffer);
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    drawReflectedScene(gl, 
                        content.programInfos.reflectionProgramInfo, 
                        content.buffers, 
                        viewCameraMatrices,
                        shadowMapCameraMatrices,
                        reflectionLightPosition,
                        lightStrength,
                        camera);
    //*/

    //draw scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.imageFramebuffer.framebuffer);
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    drawScene(gl, 
              content.programInfos.renderProgramInfo, 
              content.buffers, 
              viewCameraMatrices,
              shadowMapCameraMatrices,
              content.framebuffers.shadowMapFramebuffer.texture,
              content.framebuffers.ssaoFramebuffer.texture,
              content.framebuffers.blurVFramebuffer.texture,
              content.framebuffers.reflectionFramebuffer.texture,
              lightPosition,
              lightStrength,
              camera);
    //*/

    //post processing
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    postProcess(gl,
                content.programInfos.postProcessProgramInfo,
                content.buffers,
                content.framebuffers.imageFramebuffer.texture,
                content.framebuffers.ssaoFramebuffer.texture,
                0.05);
    //*/            
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

export function drawGlowMap(gl, programInfo, buffers, viewCameraMatrices) {

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

        //colour
        gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.modelBuffers[i].basecolour);        
    
        if (buffers.modelBuffers[i].emission > 0.0) {
            //light it up
            gl.colorMask(true, true, true, true);
        } else {
            //only draw to depth buffer for none emissive objects
            gl.colorMask(false, false, false, false);
        }

        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexcount);                       
    }            
    gl.colorMask(true, true, true, true);    
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
}
     
function drawReflectedScene(gl, 
                            programInfo, 
                            buffers,
                            viewCameraMatrices,
                            shadowMapCameraMatrices,
                            lightPosition,
                            lightStrength,
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

    //light position
    gl.uniform3fv(programInfo.uniformLocations.lightPositionUniformLocation, lightPosition);
    //light strength
    gl.uniform1f(programInfo.uniformLocations.lightStrengthUniformLocation, lightStrength);
    //eye position
    gl.uniform3fv(programInfo.uniformLocations.eyePositionUniformLocation, camera.position);
    //y scale
    gl.uniform1f(programInfo.uniformLocations.yScaleUniformLocation, -1.0);

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
}

function drawScene(gl, 
                    programInfo, 
                    buffers,
                    viewCameraMatrices,
                    shadowMapCameraMatrices,
                    shadowMapTexture,
                    ssaoTexture,
                    glowMapTexture,
                    reflectionTexture,
                    lightPosition,
                    lightStrength,
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

    //glow map texture
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, glowMapTexture);
    gl.uniform1i(programInfo.uniformLocations.glowMapTextureUniformLocation, 2);

    //reflection texture
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, reflectionTexture);
    gl.uniform1i(programInfo.uniformLocations.reflectionTextureUniformLocation, 3);
    
    //light position
    gl.uniform3fv(programInfo.uniformLocations.lightPositionUniformLocation, lightPosition);
    //light strength
    gl.uniform1f(programInfo.uniformLocations.lightStrengthUniformLocation, lightStrength);
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

function blur(gl, 
              programInfo, 
              buffers, 
              imageTexture, 
              blurAmount, 
              blurScale, 
              blurStrength, 
              orientation) {
    
    gl.useProgram(programInfo.program);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuadBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    //image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(programInfo.uniformLocations.imageTextureUniformLocation, 0);

    //orientation
    gl.uniform1i(programInfo.uniformLocations.orientationUniformLocation, orientation);
    //blur amount
    gl.uniform1i(programInfo.uniformLocations.blurAmountUniformLocation, blurAmount);
    //blur scale
    gl.uniform1f(programInfo.uniformLocations.blurScaleUniformLocation, blurScale);
    //blur strength
    gl.uniform1f(programInfo.uniformLocations.blurStrengthUniformLocation, blurStrength);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}