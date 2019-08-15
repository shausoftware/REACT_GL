'use strict';

const bitsweepImgSrc = require('../../static/images/bitsweep.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as BitsweepFragmentShader from '../../content/shaders/bitsweep_fragment_shader';
import * as BitsweepBufferFragmentShader from '../../content/shaders/bitsweep_buffer_fragment_shader';

export function getTitle() {
    return "Bitsweep";
};

export function getDescription() {
    var description = "Another raytraced scene, using offscreen buffers for glow and glow reflections. This was also inspired by another " +
                      "Beeple VJ clip of the same name. Kind of.";
    return description;
};

export function getSnapshotImage() {
    return bitsweepImgSrc;
};

export function initGLContent(gl) {
    
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
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(shaderProgram, 'u_frame')
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
            timeUniformLocation: gl.getUniformLocation(bufferProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(bufferProgram, 'u_frame')

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
};

export function loadGLContent(gl, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
};

export function renderGLContent(gl, content, dt) {
    
    //render light
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                            content.programInfos.bufferProgramInfo, 
                            content.buffers, 
                            undefined,
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
                            content.framebuffers.renderBuffer.texture, 
                            undefined,
                            undefined,
                            undefined,
                            dt,
                            0);  
};