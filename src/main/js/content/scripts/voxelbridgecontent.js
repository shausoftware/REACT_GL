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
    var description = "Voxel marching.";
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
    
    var renderBuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {renderBuffer: renderBuffer};

    var bufferTexture = ShauGL.initTexture(gl, gl.canvas.width, gl.canvas.height);
    var textureInfos = {bufferTexture: bufferTexture};

    return {programInfos: programInfos,
            textureInfos: textureInfos,
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

    //TODO: make buffer handling more efficient
    //render to frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferProgramInfo, 
                         content.buffers, 
                         content.textureInfos.bufferTexture,
                         undefined,
                         undefined,
                         undefined, 
                         dt);

    //copy data into texture for feedback
    gl.bindTexture(gl.TEXTURE_2D, content.textureInfos.bufferTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
                    gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, gl.canvas.width, gl.canvas.height, 0);

    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer.texture, 
                         undefined,
                         undefined,
                         undefined,
                         dt);    
}

module.exports = {
    getTitle: getTitle,
    getDescription: getDescription,
    getSnapshotImage: getSnapshotImage,
    initGLContent: initGLContent,
    loadGLContent: loadGLContent,
    renderGLContent: renderGLContent
};