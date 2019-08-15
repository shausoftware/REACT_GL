'use strict';

const voxelBridge3ImgSrc = require('../../static/images/voxelbridge3.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as VoxelBridge3FragmentShader from '../../content/shaders/voxel_bridge_3_fragment_shader';

var glm = require('gl-matrix');

export function getTitle() {
    return "Voxel Bridge 3";
}

export function getDescription() {
    var description = "Another one of my Shadertoy raymarchers, this time demonstrating voxel space partitioning/" +
                      "traversal (similar to Minecraft). This optimisation allows performant traversal of space and " +
                      "in this case drawing literally hundreds of cubes quickly";
    return description;
}

export function getSnapshotImage() {
    return voxelBridge3ImgSrc;
}

export function initGLContent(gl) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = VoxelBridge3FragmentShader.fragmentSource();
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