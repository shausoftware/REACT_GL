'use strict';

const voxelBridgeImgSrc = require('../../static/images/voxelbridge.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import SimpleVertexShader from '../../shaders/simple_vertex_shader';
import VoxelBridgeFragmentShader from '../../content/shaders/voxel_bridge_fragment_shader';
import VoxelBridgeBufferFragmentShader from '../../content/shaders/voxel_bridge_buffer_fragment_shader';

var glm = require('gl-matrix');

function getTitle() {
    return "Voxel Bridge";
}

function getDescription() {
    var description = "Another raymarching shader. This time utilising voxel traversal. " +
                      "It was also my first attempt at using framebuffers for off-screen rendering.";
    return description;
}

function getSnapshotImage() {
    return voxelBridgeImgSrc;
}

function initGLContent(gl, mBuffExt) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = VoxelBridgeFragmentShader.fragmentSource();
    const fsBufferSource = VoxelBridgeBufferFragmentShader.fragmentSource();
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
    const bufferProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture1'),
            resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time')
        }
    };

    const bufferProgramInfo = {
        program: bufferProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(bufferProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(bufferProgram, 'u_texture1'),
            resolutionUniformLocation: gl.getUniformLocation(bufferProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(bufferProgram, 'u_time')
        }
    };

    var programInfos = {renderProgramInfo: programInfo,
                        bufferProgramInfo: bufferProgramInfo};
                        
    const buffers = ShauRMGL.initBuffers(gl);
    
    var renderBuffer1 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer2 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {renderBuffer1: renderBuffer1,
                        renderBuffer2: renderBuffer2};

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: framebuffers};
}

function loadGLContent(gl, mBuffExt, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

function renderGLContent(gl, content, dt) {

    //render glow trail
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer1.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer2.texture,
                         undefined,
                         undefined,
                         undefined, 
                         dt);

    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer1.texture, 
                         undefined,
                         undefined,
                         undefined,
                         dt);    

    //swap buffers for feedback in trail
    var tempBuffer = content.framebuffers.renderBuffer1;
    content.framebuffers.renderBuffer1 = content.framebuffers.renderBuffer2;
    content.framebuffers.renderBuffer2 = tempBuffer; 
}

module.exports = {
    getTitle: getTitle,
    getDescription: getDescription,
    getSnapshotImage: getSnapshotImage,
    initGLContent: initGLContent,
    loadGLContent: loadGLContent,
    renderGLContent: renderGLContent
};