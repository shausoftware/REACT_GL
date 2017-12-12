'use strict';

const bitsweepImgSrc = require('../../static/images/bitsweep.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import SimpleVertexShader from '../../shaders/simple_vertex_shader';
import BitsweepFragmentShader from '../../content/shaders/bitsweep_fragment_shader';
import BitsweepBufferFragmentShader from '../../content/shaders/bitsweep_buffer_fragment_shader';

function getTitle() {
    return "Bitsweep";
}

function getDescription() {
    var description = "Again using raytracing to draw the scene. This time inspired by Bitsweep by Beeple. Kind of.";
    return description;
}

function getSnapshotImage() {
    return bitsweepImgSrc;
}

function initGLContent(gl, mBuffExt) {
    
    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = BitsweepFragmentShader.fragmentSource();
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time')
        }
    };

    const bfsSource = BitsweepBufferFragmentShader.fragmentSource();
    const bufferProgram = ShauGL.initShaderProgram(gl, vsSource, bfsSource);
    const bufferProgramInfo = {
        program: bufferProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(bufferProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(bufferProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(bufferProgram, 'u_time')
        }
    };

    var programInfos = {renderProgramInfo: programInfo,
                        bufferProgramInfo: bufferProgramInfo};

    const buffers = ShauRMGL.initBuffers(gl);

    var renderBuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {renderBuffer: renderBuffer};

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
    
    //render light
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                            content.programInfos.bufferProgramInfo, 
                            content.buffers, 
                            undefined,
                            undefined,
                            undefined,
                            undefined, 
                            dt);
                            
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