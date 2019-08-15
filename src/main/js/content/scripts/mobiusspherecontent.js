'use strict';

const mobiusSphereImgSrc = require('../../static/images/mobiussphere.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as MobiusSphereFragmentShader from '../../content/shaders/mobius_sphere_fragment_shader';

export function getTitle() {
    return "Mobius Sphere";
}

export function getDescription() {
    var description = "A raytraced rework of one of my first fragment shaders on Shadertoy. A simple demonstration of a Mobius projection from a sphere.";
    return description;
}

export function getSnapshotImage() {
    return mobiusSphereImgSrc;
}

export function initGLContent(gl) {
    
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
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time'),
            frameUniformLocation: gl.getUniformLocation(shaderProgram, 'u_frame')
        }
    };
    var programInfos = {renderProgramInfo: programInfo};

    const buffers = ShauRMGL.initBuffers(gl);

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: []};
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