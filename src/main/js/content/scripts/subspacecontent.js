'use strict';

const subspaceImgSrc = require('../../static/images/subspace.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as SubspaceFragmentShader from '../../content/shaders/subspace_fragment_shader';
import * as SubspaceBufferAFragmentShader from '../../content/shaders/subspace_buffer_a_fragment_shader';
import * as SubspaceBufferBFragmentShader from '../../content/shaders/subspace_buffer_b_fragment_shader';
import * as SubspaceBufferCFragmentShader from '../../content/shaders/subspace_buffer_c_fragment_shader';

var glm = require('gl-matrix');

var frameCount = 0;

export function getTitle() {
    return "Subspace";
}

export function getDescription() {
    var description = "More Beeple! This one's raymarched and again utilises a multiple buffer pipeline for a simple particle system " +
                      "and the glow trails. One trick I worked out to emulate the VJ clip was the distortion of the screen space at the " +
                      "edges to squash the cubes. Always a good feeling to work things out from first principles :)" ;
    return description;
}

export function getSnapshotImage() {
    return subspaceImgSrc;
}

export function initGLContent(gl) {

    frameCount = 0;

    const vsSource = SimpleVertexShader.vertexSource();

    const fsSource = SubspaceFragmentShader.fragmentSource();
    const fsBufferASource = SubspaceBufferAFragmentShader.fragmentSource();
    const fsBufferBSource = SubspaceBufferBFragmentShader.fragmentSource();
    const fsBufferCSource = SubspaceBufferCFragmentShader.fragmentSource();
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
    const bufferAProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferASource);
    const bufferBProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferBSource);
    const bufferCProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferCSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture1'),
            texture2UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture2'),
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

    const bufferCProgramInfo = {
        program: bufferCProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(bufferCProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(bufferCProgram, 'u_texture1'),
            texture2UniformLocation: gl.getUniformLocation(bufferCProgram, 'u_texture2'),
            texture3UniformLocation: gl.getUniformLocation(bufferCProgram, 'u_texture3'),
            resolutionUniformLocation: gl.getUniformLocation(bufferCProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(bufferCProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(bufferCProgram, 'u_frame')
        }
    };

    var programInfos = {renderProgramInfo: programInfo,
                        bufferAProgramInfo: bufferAProgramInfo,
                        bufferBProgramInfo: bufferBProgramInfo,
                        bufferCProgramInfo: bufferCProgramInfo};

    const buffers = ShauRMGL.initBuffers(gl);

    var renderBuffer1 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer2 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer3 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer4 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var renderBuffer5 = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {renderBuffer1: renderBuffer1,
                        renderBuffer2: renderBuffer2,
                        renderBuffer3: renderBuffer3,
                        renderBuffer4: renderBuffer4,
                        renderBuffer5: renderBuffer5};

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

    //render buffer A particles
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

    //render buffer B
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

    //render buffer C
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer4.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferCProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer5.texture, 
                         content.framebuffers.renderBuffer1.texture, 
                         content.framebuffers.renderBuffer3.texture, 
                         undefined,
                         dt,
                         frameCount);    
    
    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         content.framebuffers.renderBuffer3.texture, 
                         content.framebuffers.renderBuffer4.texture, 
                         undefined,
                         undefined,
                         dt,
                         frameCount);    
     
    frameCount++;

    //swap buffers
    var tempBuffer = content.framebuffers.renderBuffer1;
    content.framebuffers.renderBuffer1 = content.framebuffers.renderBuffer2;
    content.framebuffers.renderBuffer2 = tempBuffer; 
    tempBuffer = content.framebuffers.renderBuffer4;
    content.framebuffers.renderBuffer4 = content.framebuffers.renderBuffer5;
    content.framebuffers.renderBuffer5 = tempBuffer; 
}