'use strict';

const dataSurgeImgSrc = require('../../static/images/datasurge.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as DataSurgeFragmentShader from '../../content/shaders/datasurge_fragment_shader';
import * as DataSurgeBufferAFragmentShader from '../../content/shaders/datasurge_buffer_a_fragment_shader';
import * as DataSurgeBufferBFragmentShader from '../../content/shaders/datasurge_buffer_b_fragment_shader';

var glm = require('gl-matrix');

var frameCount = 0;

export function getTitle() {
    return "Data Surge";
}

export function getDescription() {
    var description = "Another Beeple inspired shader (Can you see a pattern emerging here?). This one utilises multiple buffers " +
                      "in the rendering chain and a simple particle system for the lights that whiz along the core. " +
                      "I quite like the way it turned out and happily for me it was also a 'Shader of the Week' on Shadertoy.";
    return description;
}

export function getSnapshotImage() {
    return dataSurgeImgSrc;
}

export function initGLContent(gl) {

    frameCount = 0;

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource  = DataSurgeFragmentShader.fragmentSource();
    const fsBufferASource = DataSurgeBufferAFragmentShader.fragmentSource();
    const fsBufferBSource = DataSurgeBufferBFragmentShader.fragmentSource();
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
    const bufferAProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferASource);
    const bufferBProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferBSource);

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

    const bufferAProgramInfo = {
        program: bufferAProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(bufferAProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(bufferAProgram, 'u_texture1'),
            resolutionUniformLocation: gl.getUniformLocation(bufferAProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(bufferAProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(bufferAProgram, 'u_frame')
        }
    };

    const bufferBProgramInfo = {
        program: bufferBProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(bufferBProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(bufferBProgram, 'u_texture1'),
            resolutionUniformLocation: gl.getUniformLocation(bufferBProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(bufferBProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(bufferBProgram, 'u_frame')
        }
    };

    var programInfos = {renderProgramInfo: programInfo,
                        bufferAProgramInfo: bufferAProgramInfo,
                        bufferBProgramInfo: bufferBProgramInfo};
                        
    const buffers = ShauRMGL.initBuffers(gl);

    var renderBuffer1 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer2 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer3 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {renderBuffer1: renderBuffer1,
                        renderBuffer2: renderBuffer2,
                        renderBuffer3: renderBuffer3};

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

    //particles
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer1.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferAProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer2.texture,
                         undefined,
                         undefined,
                         undefined, 
                         dt,
                         frameCount);

    //render buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer3.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferBProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer1.texture, 
                         undefined,
                         undefined,
                         undefined,
                         dt,
                         frameCount);    

    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer3.texture, 
                         undefined,
                         undefined,
                         undefined,
                         dt,
                         frameCount);    
     
    frameCount++;

    //swap buffers
    var tempBuffer = content.framebuffers.renderBuffer1;
    content.framebuffers.renderBuffer1 = content.framebuffers.renderBuffer2;
    content.framebuffers.renderBuffer2 = tempBuffer; 
}