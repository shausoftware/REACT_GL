'use strict';

const littleCubesImgSrc = require('../../static/images/littlecubes.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as LittleCubesFragmentShader from '../../content/shaders/little_cubes_fragment_shader';

export function getTitle() {
    return "Little Cubes";
}

export function getDescription() {
    var description = "One of my favourite shaders that I've created so far. It's rendered " +
                      " using simple raytracing techniques. I think it's quite cute.";
    return description;
}

export function getSnapshotImage() {
    return littleCubesImgSrc;
}

export function initGLContent(gl, mBuffExt) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = LittleCubesFragmentShader.fragmentSource();
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