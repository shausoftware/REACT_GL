'use strict';

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

const greencycleImgSrc = require('../../static/images/greencycle.png');

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as GreenCycleFragmentShader from '../../content/shaders/green_cycle_fragment_shader';

export function getTitle() {
    return "Green Cycle";
}

export function getDescription() {
    var description = "My first Shader of the Week on Shadertoy inspired by Beeple. This time emulating his PurpCycle VJ clip.";
    return description;
}

export function getSnapshotImage() {
    return greencycleImgSrc;
}

export function initGLContent(gl, mBuffExt) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = GreenCycleFragmentShader.fragmentSource();
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
    var programInfos = {renderProgramInfo: programInfo};

    const buffers = ShauRMGL.initBuffers(gl);

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: []};
}

export function loadGLContent(gl, mBuffExt, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

export function renderGLContent(gl, content, dt) {
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         undefined,
                         undefined,
                         undefined,
                         undefined,
                         dt);
}