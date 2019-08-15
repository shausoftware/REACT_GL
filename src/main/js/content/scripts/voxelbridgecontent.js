'use strict';

const voxelBridgeImgSrc = require('../../static/images/voxelbridge.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as VoxelBridgeFragmentShader from '../../content/shaders/voxel_bridge_fragment_shader';
import * as VoxelBridgeBufferFragmentShader from '../../content/shaders/voxel_bridge_buffer_fragment_shader';

var glm = require('gl-matrix');

export function getTitle() {
    return "Voxel Bridge 3";
}

export function getDescription() {
    var description = "Yet another Shadertoy raymarcher, this time demonstrating voxel space traversal/partitioning " +
                      "(A bit like Minecraft). This is my first attempt at using offscreen render buffers, in this " +
                      "instance for the particle glow effect.";
    return description;
}

export function getSnapshotImage() {
    return voxelBridgeImgSrc;
}

export function initGLContent(gl) {

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
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(shaderProgram, 'u_frame')
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
            timeUniformLocation: gl.getUniformLocation(bufferProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(bufferProgram, 'u_frame')
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

export function loadGLContent(gl, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

export function renderGLContent(gl, content, dt) {

    //render glow trail
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer1.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer2.texture,
                         undefined,
                         undefined,
                         undefined, 
                         dt,
                         0);

    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer1.texture, 
                         undefined,
                         undefined,
                         undefined,
                         dt,
                         0);    

    //swap buffers for feedback in trail
    var tempBuffer = content.framebuffers.renderBuffer1;
    content.framebuffers.renderBuffer1 = content.framebuffers.renderBuffer2;
    content.framebuffers.renderBuffer2 = tempBuffer; 
}