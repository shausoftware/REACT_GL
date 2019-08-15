'use strict';

const mistakeNotImgSrc = require('../../static/images/mistakenot.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as MistakeNotFragmentShader from '../../content/shaders/mistake_not_fragment_shader';

var glm = require('gl-matrix');

export function getTitle() {
    return "The Mistake Not";
}

export function getDescription() {
    var description = "Some of my own modelling this time. I'm a big fan of science fiction writing especially the works " +
                      "of Brian Aldiss, William Gibson & Iain M. Banks. This is my interpretation of my favourite " +
                      "space ship (Mind) the 'Mistake Not " +
                      "My Current State Of Joshing Gentle Peevishness For The Awesome And Terrible Majesty Of The " +
                      "Towering Seas Of Ire That Are Themselves The Mere Milquetoast Shallows Fringing My Vast Oceans Of Wrath'. "  +
                      "Phew what a name, this is from the Iain M. Banks book 'The Hydrogen Sonata'.";
    return description;
}

export function getSnapshotImage() {
    return mistakeNotImgSrc;
}

export function initGLContent(gl) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = MistakeNotFragmentShader.fragmentSource();
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
    var programInfos = {renderProgramInfo: programInfo};

    const buffers = ShauRMGL.initBuffers(gl);
    var framebuffers = {};

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

    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.renderProgramInfo, 
                         content.buffers, 
                         undefined, 
                         undefined, 
                         undefined,
                         undefined,
                         dt,
                         0);         
}