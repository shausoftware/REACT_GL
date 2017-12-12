'use strict';

const mobiusSphereImgSrc = require('../../static/images/mobiussphere.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import SimpleVertexShader from '../../shaders/simple_vertex_shader';
import MobiusSphereFragmentShader from '../../content/shaders/mobius_sphere_fragment_shader';

function getTitle() {
    return "Mobius Sphere";
}

function getDescription() {
    var description = "This is a rework of one of my first fragment shaders on Shadertoy. A simple demonstration of a Mobius projection from a sphere.";
    return description;
}

function getSnapshotImage() {
    return mobiusSphereImgSrc;
}

function initGLContent(gl, mBuffExt) {
    
    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = MobiusSphereFragmentShader.fragmentSource();
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
    
    //render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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