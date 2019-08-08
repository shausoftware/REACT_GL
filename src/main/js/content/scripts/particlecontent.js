'use strict';

const particlesImgSrc = require('../../static/images/firstattempt.png');

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

const PDIM = 256;
var last = 0.0;

import * as SimpleVertexShader from '../../shaders/simple_vertex_shader';
import * as VignetteFragmentShader from '../../shaders/vignette_fragment_shader';
import * as ParticleVertexShader from '../../content/shaders/particle_vertex_shader';
import * as ParticleFragmentShader from '../../content/shaders/particle_fragment_shader';
import * as ParticleComputeVertexShader from '../../content/shaders/particle_compute_vertex_shader';
import * as ParticleComputeFragmentShader from '../../content/shaders/particle_compute_fragment_shader';
import * as ParticleInitFragmentShader from '../../content/shaders/particle_init_fragment_shader';

var glm = require('gl-matrix');

export function getTitle() {
    return "Curl Particles";
}

export function getDescription() {
    var description = "My first attempt at a particle/compute shader. The particle positions and velocities " +
                      "are computated in fragment buffers before rendering. Curl noise is used " +
                      "for the FBM type motion. The work of Nop Jiarathanakul and Edan Kwan inspired this.";
    return description;
}

export function getSnapshotImage() {
    return particlesImgSrc;
}

export function initGLContent(gl, mBuffExt) {

    //vignette program
    const vvsSource = SimpleVertexShader.vertexSource();
    const vfsSource = VignetteFragmentShader.fragmentSource();
    const vignetteProgram = ShauGL.initShaderProgram(gl, vvsSource, vfsSource);
    const vignetteInfo = {
        program: vignetteProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(vignetteProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(vignetteProgram, 'u_resolution'),                
            vignetteTextureUniformLocation: gl.getUniformLocation(vignetteProgram, 'u_vignette_texture')                
        }
    };

    //standard draw program
    const vsSource = ParticleVertexShader.vertexSource();
    const fsSource = ParticleFragmentShader.fragmentSource();
    const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);    
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_position'),
            uvAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_uv'),
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),                
            projectionMatrixUniformLocation: gl.getUniformLocation(shaderProgram, 'u_projection_matrix'),
            texture0UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture0'),
            texture1UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture1'),
            texture2UniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture2')
        }
    };
    
    //particle compute program
    const cvsSource = ParticleComputeVertexShader.vertexSource();
    const cfsSource = ParticleComputeFragmentShader.fragmentSource();
    const computeShaderProgram = ShauGL.initShaderProgram(gl, cvsSource, cfsSource);
    const computeInfo = {
        program: computeShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(computeShaderProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_resolution'),                
            timeUniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_time'),                
            deltaUniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_delta'),                
            inputPositionUniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_input_position'),                
            forceUniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_force'),                
            texture0UniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_texture0'),                
            texture1UniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_texture1'),                
            texture2UniformLocation: gl.getUniformLocation(computeShaderProgram, 'u_texture2')                
        }
    };

    //particle init program
    const ifsSource = ParticleInitFragmentShader.fragmentSource();
    const initShaderProgram = ShauGL.initShaderProgram(gl, cvsSource, ifsSource);    
    const initInfo = {
        program: initShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(initShaderProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(initShaderProgram, 'u_resolution')                
        }            
    };
    
    var programInfos = {vignetteProgramInfo: vignetteInfo,
                        shaderProgramInfo: programInfo,
                        computeProgramInfo: computeInfo};

    var uva = [];
    for (var x = 0; x < PDIM; ++x) {
        for (var y = 0; y < PDIM; ++y) {
            uva.push(x / PDIM);
            uva.push(y / PDIM);
        }
    } 
    var uv = new Float32Array(uva);      
    var quad = new Float32Array([
           -1.0, -1.0,  0.0,
            1.0,  1.0,  0.0,
           -1.0,  1.0,  0.0,
           -1.0, -1.0,  0.0,
            1.0, -1.0,  0.0,
            1.0,  1.0,  0.0]);                    
    const inset = [
           -0.98, -0.98,
           -0.98,  0.98,
            0.98,  0.98,
            0.98,  0.98,
            0.98, -0.98,
           -0.98, -0.98];
                    
    const particleUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
                        
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
                    
    const insetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, insetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inset), gl.STATIC_DRAW);

    //2 identical framebuffers for compute operations
    //this is because read and write buffers cannot be the same buffer object
    //first time round buffer gets rendered into then next frame it is read
    var computeBuffers = [
        initComputeBuffer(gl, mBuffExt),
        initComputeBuffer(gl, mBuffExt)
    ];

    var buffers = {particleUV: particleUVBuffer,
                   screenQuad: screenQuadBuffer,
                   inset: insetBuffer,
                   computeBuffers: computeBuffers};

    var vignetteFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height, 1.0);
    var framebuffers = {vignetteFramebuffer: vignetteFramebuffer};

    //initialise particles
    drawInit(gl, initInfo, buffers, buffers.computeBuffers[0]);

    return {programInfos: programInfos,
            textureInfos: [],
            buffers: buffers,
            framebuffers: framebuffers};       
}

export function loadGLContent(gl, mBuffExt, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

export function renderGLContent(gl, content, dt) {

    var elapsedSeconds = dt;
    var delta = last != 0.0 ? elapsedSeconds - last : 0.0;
    last = elapsedSeconds;

    //compute particle positions into a framebuffer
    drawCompute(gl,
                content.programInfos.computeProgramInfo, 
                content.buffers, 
                content.buffers.computeBuffers[0], 
                content.buffers.computeBuffers[1], 
                elapsedSeconds, 
                delta);

    //swap framebuffers for next render
    var tempBuffer = content.buffers.computeBuffers[0];
    content.buffers.computeBuffers[0] = content.buffers.computeBuffers[1];
    content.buffers.computeBuffers[1] = tempBuffer;

    var projectionMatrix = updateCamera(gl, elapsedSeconds);

    //render scene to frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, content.framebuffers.vignetteFramebuffer.framebuffer);            
    drawScene(gl, 
              content.programInfos.shaderProgramInfo, 
              content.buffers, 
              content.buffers.computeBuffers[0], 
              projectionMatrix);

    //draw to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    drawVignette(gl, 
                 content.programInfos.vignetteProgramInfo, 
                 content.buffers, 
                 content.framebuffers.vignetteFramebuffer.texture);
}

function updateCamera(gl, elapsedSeconds) {
    
    var fov = 0.25 * 3.14159265359;
    var near = 0.1;
    var far = 1000.0;
    var aspect = gl.canvas.width / gl.canvas.height;

    var origin = [0.0, 0.0, 10.0];
    var target = [0.0, 0.0, 0.0];
    var up = [0.0, 1.0, 0.0];
    var right = [1.0, 0.0, 0.0];

    var viewMatrix = glm.mat4.create();
    var projectionMatrix = glm.mat4.create();
    var viewProjectionMatrix = glm.mat4.create();

    glm.mat4.lookAt(viewMatrix, origin, target, up);

    glm.mat4.rotate(viewMatrix, viewMatrix, elapsedSeconds, [0, 1, 0]);
    
    glm.mat4.perspective(projectionMatrix, fov * 2.0, aspect, near, far);
    glm.mat4.mul(viewProjectionMatrix, projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
}

//TODO: this comes for free with WebGL 2
function initComputeBuffer(gl, ext) {
    
    var texs = [];
    for (var i = 0; i < 3; i++) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PDIM, PDIM, 0, gl.RGBA, gl.FLOAT, null);
        texs.push(texture);

        gl.bindTexture(gl.TEXTURE_2D, null); //clean up
    }

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texs[0], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, texs[1], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, texs[2], 0);

    ext.drawBuffersWEBGL([
        ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
        ext.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
    ]);

    if (!gl.isFramebuffer(fb)) {
        console.error("Failed to create framebuffer");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //clean up
    
    return {framebuffer: fb, textures: texs};
}

function drawInit(gl, programInfo, buffers, computeBuffer) {
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, computeBuffer.framebuffer);
    
    gl.viewport(0, 0, PDIM, PDIM);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ZERO);  // so alpha output color draws correctly

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuad);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //clean up
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
    
function drawCompute(gl, programInfo, buffers, fromBuffer, 
                            toBuffer, time, delta) {

    gl.bindFramebuffer(gl.FRAMEBUFFER, toBuffer.framebuffer);
    
    gl.viewport(0, 0, PDIM, PDIM);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ZERO);  // so alpha output color draws correctly

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuad);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[0]);
    gl.uniform1i(programInfo.uniformLocations.texture0UniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[1]);
    gl.uniform1i(programInfo.uniformLocations.texture1UniformLocation, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, fromBuffer.textures[2]);
    gl.uniform1i(programInfo.uniformLocations.texture2UniformLocation, 2);
    
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, time);
    gl.uniform1f(programInfo.uniformLocations.deltaUniformLocation, delta);
    
    //TODO: mouse
    gl.uniform3f(programInfo.uniformLocations.inputPositionUniformLocation, 0.0, 0.0, 0.0);
    gl.uniform1f(programInfo.uniformLocations.forceUniformLocation, 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //clean up
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);    
}

function drawScene(gl, programInfo, buffers, computeBuffer, projectionMatrix) {
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation, false, projectionMatrix);
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, PDIM, PDIM);
    
    gl.enableVertexAttribArray(programInfo.attribLocations.uvAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.particleUV);
    gl.vertexAttribPointer(programInfo.attribLocations.uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[0]);
    gl.uniform1i(programInfo.uniformLocations.texture0UniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[1]);
    gl.uniform1i(programInfo.uniformLocations.texture1UniformLocation, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, computeBuffer.textures[2]);
    gl.uniform1i(programInfo.uniformLocations.texture2UniformLocation, 2);

    gl.drawArrays(gl.POINTS, 0, PDIM * PDIM);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.uvAttributeLocation);
    gl.useProgram(null);
}
    
function drawVignette(gl, programInfo, buffers, texture) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 1.0, 0.0, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.inset);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.textureUniformLocation, 0);
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
}