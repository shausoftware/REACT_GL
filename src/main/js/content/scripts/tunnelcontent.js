'use strict';

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

const lightTunnelSrc = require('../../static/images/lighttunnel.png');

import SimpleVertexShader from '../../shaders/simple_vertex_shader';
import LightTunnelFragmentShader from '../../content/shaders/light_tunnel_fragment_shader';
import LightTunnelBufferShader from '../../content/shaders/light_tunnel_buffer_shader';
import LightTunnelBuffer2Shader from '../../content/shaders/light_tunnel_buffer2_shader';

function getTitle() {
    return "Tunnel";
}

function getDescription() {
    var description = "Classic tunnel inspired by Beeple.";
    return description;
}

function getSnapshotImage() {
    return lightTunnelSrc;
}

function initGLContent(gl, mBuffExt) {

    const vsSource = SimpleVertexShader.vertexSource();
    const fsSource = LightTunnelFragmentShader.fragmentSource();
    const fsBufferSource = LightTunnelBufferShader.fragmentSource();
    const fsBuffer2Source = LightTunnelBuffer2Shader.fragmentSource();
    
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
    const bufferProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferSource);
    const buffer2Program = ShauGL.initShaderProgram(gl, vsSource, fsBuffer2Source);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
        },
        uniformLocations: {
            texture1UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture1'),
            texture2UniformLocation2: gl.getUniformLocation(shaderProgram, 'u_texture2'),
            resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time')
        }
    };

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

    const buffer2ProgramInfo = {
        program: buffer2Program,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(buffer2Program, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(buffer2Program, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(buffer2Program, 'u_time')
        }
    };

    var programInfos = {renderProgramInfo: programInfo,
                        bufferProgramInfo: bufferProgramInfo,
                        buffer2ProgramInfo: buffer2ProgramInfo};

    var buffers = ShauRMGL.initBuffers(gl);
    var framebuffers = {renderBuffer: ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0),        
                        renderBuffer2: ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0)};  

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

    //render to frame buffer 1
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.bufferProgramInfo, 
                         content.buffers, 
                         undefined,
                         undefined,
                         undefined,
                         undefined,
                         dt);

    //render to frame buffer 2
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.renderBuffer2.framebuffer);
    ShauRMGL.drawRMScene(gl, 
                         content.programInfos.buffer2ProgramInfo, 
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
                         content.framebuffers.renderBuffer2.texture, 
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