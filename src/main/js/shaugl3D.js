'use strict';

import * as SimpleVertexShader from './shaders/simple_vertex_shader';
import * as LoadScreenFragmentShader from './shaders/load_screen_fragment_shader';
import * as ShadowVertexShader from './shaders/shadow_vertex_shader';
import * as ShadowFragmentShader from './shaders/shadow_fragment_shader';
import * as SSAOVertexShader from './shaders/ssao_vertex_shader';
import * as SSAOFragmentShader from './shaders/ssao_fragment_shader';
import * as PostProcessVertexShader from './shaders/post_process_vertex_shader';
import * as PostProcessFragmentShader from './shaders/post_process_fragment_shader';
import * as GlowVertexShader from './shaders/glow_vertex_shader';
import * as GlowFragmentShader from './shaders/glow_fragment_shader';
import * as BlurVertexShader from './shaders/blur_vertex_shader';
import * as BlurFragmentShader from './shaders/blur_fragment_shader';
import * as SkyVertexShader from './shaders/sky_vertex_shader';
import * as SkyFragmentSHader from './shaders/sky_fragment_shader';

/* 3D Helper */

const glm = require('gl-matrix');

export function initShaderProgram(gl, vsSource, fsSource) {

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialise the shader program:' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
};

export function loadShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shader:' + gl.getProgramInfoLog(shaderProgram));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

export function checkExtensions(gl) {
    
    var ext1 = undefined;
    var ext2 = undefined;
    var ext3 = undefined;

    try {ext1 = gl.getExtension('OES_texture_float');} catch(e) {}
    if (!ext1) {
        console.error("OES_texture_float extension not supported");
        return undefined;
    }

    try {ext2 = gl.getExtension('WEBGL_draw_buffers');} catch(e) {}
    if (!ext2) {
        console.error("WEBGL_draw_buffers extension not supported");
        return undefined;
    }

    try {ext3 = gl.getExtension('OES_standard_derivatives');} catch(e) {}
    if (!ext3) {
        console.error("OES_standard_derivatives extension not supported");
        return undefined;
    }

    return ext2;
}

export function initSkyProgram(gl) {
    const skyVsSource = SkyVertexShader.vertexSource();
    const skyFsSource = SkyFragmentSHader.fragmentSource();
    const skyShaderProgram = initShaderProgram(gl, skyVsSource, skyFsSource);
    const skyProgramInfo = {
        program: skyShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(skyShaderProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_resolution'),
            lightPositionUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_light_position'),
            cameraPositionUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_camera_position'),
            targetUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_target'),
            fovUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_fov'),
            farUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_far'),
            yScaleUniformLocation: gl.getUniformLocation(skyShaderProgram, 'u_y_scale')            
        }
    };
    return skyProgramInfo;
}

export function initShadowProgram(gl) {
    const shadowMapVsSource = ShadowVertexShader.vertexSource();
    const shadowMapFsSource = ShadowFragmentShader.fragmentSource();
    const shadowMapShaderProgram = initShaderProgram(gl, shadowMapVsSource, shadowMapFsSource);
    const shadowMapProgramInfo = {
        program: shadowMapShaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(shadowMapShaderProgram, 'a_position')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(shadowMapShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(shadowMapShaderProgram, 'u_projection_matrix'),
            yScaleUniformLocation: gl.getUniformLocation(shadowMapShaderProgram, 'u_y_scale')            
        }
    };
    return shadowMapProgramInfo;
}

export function initGlowProgram(gl) {
    const glowVsSource = GlowVertexShader.vertexSource();
    const glowFsSource = GlowFragmentShader.fragmentSource();
    const glowShaderProgram = initShaderProgram(gl, glowVsSource, glowFsSource);
    const glowProgramInfo = {
        program: glowShaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(glowShaderProgram, 'a_position')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(glowShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(glowShaderProgram, 'u_projection_matrix'),
            colourUniformLocation: gl.getUniformLocation(glowShaderProgram, 'u_colour')
        }
    };
    return glowProgramInfo;
}

export function initBlurProgram(gl) {
    const blurVsSource = BlurVertexShader.vertexSource();
    const blurFsSource = BlurFragmentShader.fragmentSource();
    const blurShaderProgram = initShaderProgram(gl, blurVsSource, blurFsSource);
    const blurProgramInfo = {
        program: blurShaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(blurShaderProgram, 'a_position')
        },
        uniformLocations: {
            imageTextureUniformLocation: gl.getUniformLocation(blurShaderProgram, 'u_image_texture'),
            orientationUniformLocation: gl.getUniformLocation(blurShaderProgram, 'u_orientation'),
            blurAmountUniformLocation: gl.getUniformLocation(blurShaderProgram, 'u_blur_amount'),
            blurScaleUniformLocation: gl.getUniformLocation(blurShaderProgram, 'u_blur_scale'),
            blurStrengthUniformLocation: gl.getUniformLocation(blurShaderProgram, 'u_blur_strength')
        }
    };
    return blurProgramInfo;
};

export function initSSAOProgram(gl) {
    const ssaoVsSource = SSAOVertexShader.vertexSource();
    const ssaoFsSource = SSAOFragmentShader.fragmentSource();
    const ssaoShaderProgram = initShaderProgram(gl, ssaoVsSource, ssaoFsSource);
    const ssaoProgramInfo = {
        program: ssaoShaderProgram,
        attribLocations: {
            positionAttributePosition: gl.getAttribLocation(ssaoShaderProgram, 'a_position'),
            normalAttributeLocation: gl.getAttribLocation(ssaoShaderProgram, 'a_normal')
        },
        uniformLocations: {
            modelViewMatrixUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_model_view_matrix'),
            projectionMatrixUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_projection_matrix'),
            normalsMatrixUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_normals_matrix'),
            farUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_far'),
            yScaleUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_y_scale')            
        }
    };  
    return ssaoProgramInfo;  
}

export function initPostProcessProgram(gl) {
    const ppVsSource = PostProcessVertexShader.vertexSource();
    const ppFsSource = PostProcessFragmentShader.fragmentSource();
    const ppShaderProgram = initShaderProgram(gl, ppVsSource, ppFsSource);
    const ppProgramInfo = {
        program: ppShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(ppShaderProgram, 'a_position')
        },
        uniformLocations: {
            dofUniformLocation: gl.getUniformLocation(ppShaderProgram, 'u_dof'),
            imageTextureUniformLocation: gl.getUniformLocation(ppShaderProgram, 'u_image_texture'),
            ssaoTextureUniformLocation: gl.getUniformLocation(ppShaderProgram, 'u_ssao_texture'),            
        }
    };
    return ppProgramInfo;
}

export function initLoadScreenProgram(gl) {
    const lsVsSource = SimpleVertexShader.vertexSource();
    const lsFsSource = LoadScreenFragmentShader.fragmentSource();
    const lsShaderProgram = initShaderProgram(gl, lsVsSource, lsFsSource);
    const lsProgramInfo = {
        program: lsShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(lsShaderProgram, 'a_position')
        },
        uniformLocations: {
            resolutionUniformLocation: gl.getUniformLocation(lsShaderProgram, 'u_resolution'),
            timeUniformLocation: gl.getUniformLocation(lsShaderProgram, 'u_time')
        }
    };
    return lsProgramInfo;
}

export function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

export function initTexture(gl, width, height) {
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindTexture(gl.TEXTURE_2D, null); //clean up

    return texture;
}

export function loadImageAndInitTextureInfo(gl, url) {
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    gl.texImage2D(gl.TEXTURE_2D, 
                  0, 
                  gl.RGBA,
                  1, 
                  1, 
                  0, 
                  gl.RGBA, 
                  gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 0, 255]));
  
    const image = new Image();
    image.onload = function() {
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 
                      0, 
                      gl.RGBA,
                      gl.RGBA, 
                      gl.UNSIGNED_BYTE, 
                      image);
  
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
  
    return {
        texture: texture,
        width: image.width,
        height: image.height
    };
}

export function initFramebuffer(gl, width, height, scale) {
    
    var texture = this.initTexture(gl, width * scale, height * scale);
    
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    fbo.width = gl.canvas.width;
    fbo.height = gl.canvas.height;

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        framebuffer: fbo,
        texture: texture
    };
}

export function initDepthFramebuffer(gl, width, height) {
    
    var shadowDepthTexture = this.initTexture(gl, width, height);

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    var renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowDepthTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return {
        framebuffer: fbo,
        texture: shadowDepthTexture
    };
}

//process OBJ file
export function loadObj(objdata) {
    
    var lines = objdata.split('\n');
    var objectGroups = [];
    var currentGroup = {groupid: 'default_model_group', 
                        interleaved: [],
                        colour: undefined};

    var vertices = [];
    var normals = [];
    var indices = [];
                    
    //we are going to split individual model objects into seperate buffers
    //however OBJ vertices and normals are single continuous arrays
    //so we need to fiddle with the indices
    //also OBJ files are 1 based arrays
    var indexOffset = 1;

    for (var i = 0; i < lines.length; i++) {
        //console.log(lines[i]);
        var split1 = lines[i].trim().split(' ');  
        if (split1.length > 0) {
            switch(split1[0]) {
                //ORDER IS IMPORTANT
                case 'o': {
                    //start a new object
                    if (currentGroup.interleaved.length > 0) {
                        //add current group to collection
                        objectGroups.push(currentGroup);
                        //increase offset so that each buffer of model vertices
                        //will start from 0
                        //indexOffset += indices.length;
                    }
                    //reset
                    currentGroup = {groupid: split1[1], 
                                    interleaved: [],
                                    colour: undefined};
                    //vertices = [];
                    //normals = [];
                    //indices: [];
                    break;
                }
                case 'v': {
                    vertices.push(parseFloat(split1[1]));
                    vertices.push(parseFloat(split1[2]));
                    vertices.push(parseFloat(split1[3]));
                    break;
                }
                case 'vn': {
                    normals.push(parseFloat(split1[1]));
                    normals.push(parseFloat(split1[2]));
                    normals.push(parseFloat(split1[3]));
                    break;
                }
                case 'usemtl': {
                    currentGroup.colour = split1[1];
                    break;
                }
                case 'f': {
                    var f1 = split1[1].split('/');
                    var f2 = split1[2].split('/');
                    var f3 = split1[3].split('/');
                     //OBJ files are 1 based arrays
                    indices.push(parseInt(f1[0]) - indexOffset);
                    indices.push(parseInt(f2[0]) - indexOffset);
                    indices.push(parseInt(f3[0]) - indexOffset);

                    Array.prototype.push.apply (
                        currentGroup.interleaved, [vertices[(parseInt(f1[0]) - indexOffset) * 3],
                                                   vertices[(parseInt(f1[0]) - indexOffset) * 3 + 1],
                                                   vertices[(parseInt(f1[0]) - indexOffset) * 3 + 2]]
                    );
                    Array.prototype.push.apply (
                        currentGroup.interleaved, [normals[(parseInt(f1[2]) - indexOffset) * 3],
                                                   normals[(parseInt(f1[2]) - indexOffset) * 3 + 1],
                                                   normals[(parseInt(f1[2]) - indexOffset) * 3 + 2]]
                    );
                    Array.prototype.push.apply (
                        currentGroup.interleaved, [vertices[(parseInt(f2[0]) - indexOffset) * 3],
                                                   vertices[(parseInt(f2[0]) - indexOffset) * 3 + 1],
                                                   vertices[(parseInt(f2[0]) - indexOffset) * 3 + 2]]
                    );
                    Array.prototype.push.apply (
                        currentGroup.interleaved, [normals[(parseInt(f2[2]) - indexOffset) * 3],
                                                   normals[(parseInt(f2[2]) - indexOffset) * 3 + 1],
                                                   normals[(parseInt(f2[2]) - indexOffset) * 3 + 2]]
                    );
                    Array.prototype.push.apply (
                        currentGroup.interleaved, [vertices[(parseInt(f3[0]) - indexOffset) * 3],
                                                   vertices[(parseInt(f3[0]) - indexOffset) * 3 + 1],
                                                   vertices[(parseInt(f3[0]) - indexOffset) * 3 + 2]]
                    );
                    Array.prototype.push.apply (
                        currentGroup.interleaved, [normals[(parseInt(f3[2]) - indexOffset) * 3],
                                                   normals[(parseInt(f3[2]) - indexOffset) * 3 + 1],
                                                   normals[(parseInt(f3[2]) - indexOffset) * 3 + 2]]
                    );

                    break;
                }
            }
        }
    }

    if (currentGroup.interleaved.length > 0) {
        //add current group to collection
        objectGroups.push(currentGroup);
    }

    /*
    //debug
    for (var i = 0; i < objectGroups.length; i++) {
        var groupid = objectGroups[i].groupid;
        console.log('groupid:' + objectGroups[i].groupid);
        console.log(objectGroups[i].vertices.length);
        console.log(objectGroups[i].normals.length);
        console.log(objectGroups[i].indices.length);        
    }
    //*/

    return objectGroups;
}

export function loadMesh(uri, useMaterials) {
    return new Promise(resolve => {
        $.ajax({
            url: uri,
            dataType: 'text'
        }).done(function(data) {
            resolve(loadObj(data, useMaterials));
        }).fail(function() {
            alert('Faild to retrieve [' + uri + "]");
        });     
    });
}

export function loadJsonMesh(uri) {
    return new Promise(resolve => {
        $.ajax({
            url: uri,
            dataType: 'text'
        }).done(function(data) {
            resolve(data);
        }).fail(function() {
            alert('Faild to retrieve [' + uri + "]");
        });     
    });
}

export function setupCamera(cameraPosition, target, projectionMatrix) {

    var up = [0.0, 1.0, 0.0];

    var modelViewMatrix = glm.mat4.create();
    glm.mat4.lookAt(modelViewMatrix, cameraPosition, target, up);

    const normalMatrix = glm.mat4.create();
    glm.mat4.invert(normalMatrix, modelViewMatrix);
    glm.mat4.transpose(normalMatrix, normalMatrix);

    return {
        modelViewMatrix: modelViewMatrix,
        projectionMatrix: projectionMatrix,
        normalMatrix: normalMatrix
    };
}

export function renderLoadScreen(gl, programInfo, buffers, runningTime) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); //clear to white fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuadBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.timeUniformLocation, runningTime);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
}

export function renderSky(gl, 
                   programInfo, 
                   buffers, 
                   lightPosition, 
                   camera,
                   yScale) {

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuadBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    //resolution
    gl.uniform2f(programInfo.uniformLocations.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);    
    //light position
    gl.uniform3fv(programInfo.uniformLocations.lightPositionUniformLocation, lightPosition);
    //camera position
    gl.uniform3fv(programInfo.uniformLocations.cameraPositionUniformLocation, camera.position);
    //target
    gl.uniform3fv(programInfo.uniformLocations.targetUniformLocation, camera.target);
    //fov
    gl.uniform1f(programInfo.uniformLocations.fovUniformLocation, camera.fov);
    //far
    gl.uniform1f(programInfo.uniformLocations.farUniformLocation, camera.far);
    //y scale
    gl.uniform1f(programInfo.uniformLocations.yScaleUniformLocation, yScale);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.useProgram(null);
}