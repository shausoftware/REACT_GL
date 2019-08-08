'use strict';

const discoWallImgSrc = require('../../static/images/discowall.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as DiscoWallFragmentShader from '../../content/shaders/disco_wall_fragment_shader';

var glm = require('gl-matrix');

export function getTitle() {
    return "Disco Wall";
}

export function getDescription() {
    var description = "This is a shader I created a while back on Shadertoy. It utilises " +
                      " raytracing and volumetric raymarching for the glow/light effect.";
    return description;
}

export function getSnapshotImage() {
    return discoWallImgSrc;
}

export function initGLContent(gl, mBuffExt) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = DiscoWallFragmentShader.fragmentSource();
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