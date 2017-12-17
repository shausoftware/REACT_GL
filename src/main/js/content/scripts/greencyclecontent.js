'use strict';

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

const greencycleImgSrc = require('../../static/images/greencycle.png');

import SimpleVertexShader from '../../shaders/simple_vertex_shader';
import GreenCycleFragmentShader from '../../content/shaders/green_cycle_fragment_shader';

function getTitle() {
    return "Green Cycle";
}

function getDescription() {
    var description = "Another piece inspired by Beeple. This time emulating his PurpCycle VJ clip.";
    return description;
}

function getSnapshotImage() {
    return greencycleImgSrc;
}

function initGLContent(gl, mBuffExt) {

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

function loadGLContent(gl, mBuffExt, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

function renderGLContent(gl, content, dt) {
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         undefined,
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