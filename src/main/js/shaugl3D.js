'use strict';

import ShadowVertexShader from './shaders/shadow_vertex_shader';
import ShadowFragmentShader from './shaders/shadow_fragment_shader';
import SSAOVertexShader from './shaders/ssao_vertex_shader';
import SSAOFragmentShader from './shaders/ssao_fragment_shader';
import PostProcessVertexShader from './shaders/post_process_vertex_shader';
import PostProcessFragmentShader from './shaders/post_process_fragment_shader';

const glm = require('gl-matrix');

function initWebGL(glCanvas) {

    const gl = glCanvas.getContext('webgl');

    if (!gl) {
        alert('Please update to a web browser that supports WebGL.');
        return;
    }
};

function initShaderProgram(gl, vsSource, fsSource) {

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

function loadShader(gl, type, source) {

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

function checkExtensions(gl) {
    
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

function initShadowProgram(gl) {
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
            projectionMatrixUniformLocation: gl.getUniformLocation(shadowMapShaderProgram, 'u_projection_matrix')
        }
    };
    return shadowMapProgramInfo;
}

function initSSAOProgram(gl) {
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
            farUniformLocation: gl.getUniformLocation(ssaoShaderProgram, 'u_far')                
        }
    };  
    return ssaoProgramInfo;  
}

function initPostProcessProgram(gl) {
    const ppVsSource = PostProcessVertexShader.vertexSource();
    const ppFsSource = PostProcessFragmentShader.fragmentSource();
    const ppShaderProgram = initShaderProgram(gl, ppVsSource, ppFsSource);
    const ppProgramInfo = {
        program: ppShaderProgram,
        attribLocations: {
            positionAttributeLocation: gl.getAttribLocation(ppShaderProgram, 'a_position')
        },
        uniformLocations: {
            imageTextureUniformLocation: gl.getUniformLocation(ppShaderProgram, 'u_image_texture'),
            ssaoTextureUniformLocation: gl.getUniformLocation(ppShaderProgram, 'u_ssao_texture')            
        }
    };
    return ppProgramInfo;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function initTexture(gl, width, height) {
    
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

function loadImageAndInitTextureInfo(gl, url) {
    
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
                  new Uint8Array([0, 0, 255, 255]));
  
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
    image.src = cubeTextureSrc;
  
    return {
        texture: texture,
        width: image.width,
        height: image.height
    };
}

function initFramebuffer(gl, width, height) {
    
    var texture = this.initTexture(gl, width, height);
    
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    fbo.width = gl.canvas.width;
    fbo.height = gl.canvas.height;

    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

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

function initDepthFramebuffer(gl, width, height) {
    
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

function loadObj(objdata) {
    
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

function loadMesh(uri, useMaterials) {
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

//specific to model
function initBuffers(gl, model) {

    var modelBuffers = [];
    var glassBuffers = [];

    const screenQuad = [
        -1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
         1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ];
    const screenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad), gl.STATIC_DRAW);

    for (var i = 0; i < model.length; i++) {

        var colour = [0.0, 0.0, 0.0];
        var specular = 0.0;
        var transparency = 0.0;
        var reflect = 0.0;
        var shadow = 0.0;
        var fresnel = 0.0;
        var tex = 0.0;

        switch(model[i].colour) {
            //front inlet and logo
            case 'silver_door_strip.004':
                colour = [0.2, 0.5, 1.0];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //all grills    
            case 'GRILL.004':
                colour = [0.0, 0.0, 0.0];
                specular = 0.2;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //headlight core    
            case 'headlight_square.004':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //headlight surround
            case 'headlight_glass.004':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //wheel nut    
            case 'Nut.004':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //brake disk
            case 'brake_disk.004':
                colour = [0.2, 0.2, 0.2];
                specular = 0.1;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //tyre
            case 'tyre.004':
                colour = [0.2, 0.2, 0.2];
                specular = 0.1;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //wheel rim    
            case 'rim_silver.004':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.2;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //wheel rim detail    
            case 'rim_blue.004':
                colour = [0.2, 0.5, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.2;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //brake callipers
            case 'cALLIPERS.004':
                colour = [1.0, 0.0, 0.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            case 'wheel_joint.004':
                colour = [0.0, 0.0, 0.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 1.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            case 'breaks_':
                colour = [0.2, 0.5, 1.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //rear trim    
            case 'silver_trim colour':
                colour = [0.2, 0.5, 1.0];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //rear light
            case 'red_glass':
                colour = [1.0, 0.0, 0.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.2;
                shadow = 0.0;
                fresnel = 0.6;
                tex = 0.0;
                break;
            //rear light
            case 'red.002':
                colour = [1.0, 0.4, 0.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.2;
                shadow = 0.0;
                fresnel = 0.6;
                tex = 0.0;
                break;
            //engine block    
            case 'ENGINE':
                colour = [1.0, 1.0, 1.0];
                specular = 0.5;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //engine letters
            case 'WHITE.002':
                colour = [0.0, 0.0, 0.0];
                specular = 0.5;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //engine mount
            case 'None':
                colour = [0.0, 0.0, 0.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //rear light trim
            case 'silver_trim':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.4;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //BODY
            //roof
            case 'NAVY':
                colour = [0.02, 0.02, 0.02];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.4;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //bonnet
            case 'BLUE.002':
                colour = [0.02, 0.02, 0.02];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.4;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //front windows
            case 'front_window.004':
                colour = [0.0, 0.0, 0.0];
                specular = 1.0;
                transparency = 1.0;
                reflect = 0.8;
                shadow = 0.0;
                fresnel = 0.8;
                tex = 0.0;
                break;   
            //front light glass
            case 'glass_front.004':
                colour = [0.0, 0.0, 0.0];
                specular = 1.0;
                transparency = 1.0;
                reflect = 0.8;
                shadow = 0.0;
                fresnel = 0.8;
                tex = 0.0;
                break;   
            //wheel arch inside             
            case 'WHEEL_CURB.004':
                colour = [0.0, 0.0, 0.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //window strip    
            case 'black_strip.004':
                colour = [0.0, 0.0, 0.0];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //rear window
            case 'black_fuel_tank.004':
                colour = [0.0, 0.0, 0.0];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //air intake
            case 'black_side_vent':
                colour = [0.0, 0.0, 0.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            //front window vent 
            case 'black_vent.004':
                colour = [0.2, 0.5, 1.0];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;  
            //wing mirrors 
            case 'Mirrors':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;  
            //exhaust pipes
            case 'exhaust':
                colour = [1.0, 1.0, 1.0];
                specular = 1.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;  
            //boot
            case 'black':
                colour = [0.02, 0.02, 0.02];
                specular = 0.8;
                transparency = 0.0;
                reflect = 0.4;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
                break;
            default:
                colour = [1.0, 1.0, 1.0];
                specular = 0.0;
                transparency = 0.0;
                reflect = 0.0;
                shadow = 0.0;
                fresnel = 0.0;
                tex = 0.0;
        }

        //console.log('model:' + model[i].groupid + ' colour:' + colour);

        const groupInterleavedBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, groupInterleavedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model[i].interleaved), gl.STATIC_DRAW);
        var modelBuffer = {groupId: model[i].groupid,
                           interleavedBuffer: groupInterleavedBuffer,
                           indexCount: model[i].interleaved.length / 6,
                           colour: colour,
                           specular: specular,
                           transparency: transparency,
                           reflect: reflect,
                           shadow: shadow,
                           fresnel: fresnel,
                           tex: tex};

        if (transparency > 0.0) {
            glassBuffers.push(modelBuffer);
        } else {
            modelBuffers.push(modelBuffer);
        }                  
    }

    var floorData = [-100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                      100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                      100.0, -0.1, -100.0,   0.0, 1.0, 0.0,
                     -100.0, -0.1,  100.0,   0.0, 1.0, 0.0,
                      100.0, -0.1, -100.0,   0.0, 1.0, 0.0,
                     -100.0, -0.1, -100.0,   0.0, 1.0, 0.0];
    const floorInterleavedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorInterleavedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorData), gl.STATIC_DRAW);
    var floorBuffer =  {groupId: 'floor',
                        interleavedBuffer: floorInterleavedBuffer,
                        indexCount: 6,
                        colour: [0.02, 0.0, 0.3],
                        specular: 0.0,
                        transparency: 0.0,
                        reflect: 0.0,
                        shadow: 1.0,
                        fresnel: 0.0,
                        tex: 0.0};    

    return {modelBuffers: modelBuffers,
            glassBuffers: glassBuffers,
            floorBuffer: floorBuffer,
            screenQuadBuffer: screenQuadBuffer};
}

function setupCamera(cameraPosition, target, projectionMatrix) {

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

function drawShadowMap(gl, programInfo, buffers, cameraMatrices, depthRez) {

    gl.useProgram(programInfo.program);
    
    // Set the viewport to our shadow texture's size
    gl.viewport(0, 0, depthRez, depthRez);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        cameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        cameraMatrices.modelViewMatrix);

    //draw glass                  
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexCount);                       
    }    

    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE, 
                               Float32Array.BYTES_PER_ELEMENT * 6, 
                               0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexCount);                       
    }
}

function drawSSAODepthMap(gl, programInfo, buffers, viewCameraMatrices, far) {
    
    gl.useProgram(programInfo.program);
    
    // Set the viewport to our shadow texture's size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        viewCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        viewCameraMatrices.modelViewMatrix);

    //far
    gl.uniform1f(programInfo.uniformLocations.farUniformLocation, far);

    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE, 
                               Float32Array.BYTES_PER_ELEMENT * 6, 
                               0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexCount);                       
    }            

    //draw floor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorBuffer.interleavedBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                           3, 
                           gl.FLOAT, 
                           gl.FALSE, 
                           Float32Array.BYTES_PER_ELEMENT * 6, 
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.drawArrays(gl.TRIANGLES, 0, buffers.floorBuffer.indexCount);                       

    //draw glass
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                                3, 
                                gl.FLOAT, 
                                gl.FALSE, 
                                Float32Array.BYTES_PER_ELEMENT * 6, 
                                0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexCount);                       
    }    
}
 
function drawScene(gl, 
                   programInfo, 
                   buffers,
                   viewCameraMatrices,
                   shadowMapCameraMatrices,
                   shadowMapTexture,
                   ssaoTexture,
                   lightPosition,
                   camera) {

    gl.useProgram(programInfo.program);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //camera matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrixUniformLocation,
                        false,
                        viewCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrixUniformLocation,
                        false,
                        viewCameraMatrices.modelViewMatrix);
    //shadow map matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.smProjectionMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.smModelViewMatrixUniformLocation,
                        false,
                        shadowMapCameraMatrices.modelViewMatrix);
    //normals matrix
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalsMatrixUniformLocation,
                        false,
                        viewCameraMatrices.normalMatrix);
            
    //shadow map texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowMapTexture);
    gl.uniform1i(programInfo.uniformLocations.depthColourTextureUniformLocation, 0);

    //ssao texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ssaoTexture);
    gl.uniform1i(programInfo.uniformLocations.ssaoTextureUniformLocation, 1);

    //light position
    gl.uniform3fv(programInfo.uniformLocations.lightPositionUniformLocation, lightPosition);
    //eye position
    gl.uniform3fv(programInfo.uniformLocations.eyePositionUniformLocation, camera.position);
    
    //draw model                    
    for (var i = 0; i < buffers.modelBuffers.length; i++) {
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE, 
                               Float32Array.BYTES_PER_ELEMENT * 6, 
                               0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        //normals
        gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE,
                               Float32Array.BYTES_PER_ELEMENT * 6,
                               Float32Array.BYTES_PER_ELEMENT * 3);   
        gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);

        //colour
        gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.modelBuffers[i].colour);        
        //specular
        gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.modelBuffers[i].specular);        
        //transparency
        gl.disable(gl.BLEND);
        gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.modelBuffers[i].transparency);        
        //reflectivity
        gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.modelBuffers[i].reflect);        
        //shadow
        gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.modelBuffers[i].shadow);        
        //fresnel
        gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.modelBuffers[i].fresnel);
        //texture id
        gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.modelBuffers[i].tex);
        
        gl.drawArrays(gl.TRIANGLES, 0, buffers.modelBuffers[i].indexCount);                       
    }  
    //*/

    //draw glass
    for (var i = 0; i < buffers.glassBuffers.length; i++) {
        //vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glassBuffers[i].interleavedBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE, 
                               Float32Array.BYTES_PER_ELEMENT * 6, 
                               0);
        gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
        //normals
        gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                               3, 
                               gl.FLOAT, 
                               gl.FALSE,
                               Float32Array.BYTES_PER_ELEMENT * 6,
                               Float32Array.BYTES_PER_ELEMENT * 3);   
        gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);

        //colour
        gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.glassBuffers[i].colour);        
        //specular
        gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.glassBuffers[i].specular);        
        //transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.glassBuffers[i].transparency);        
        //reflectivity
        gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.glassBuffers[i].reflect);        
        //shadow
        gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.glassBuffers[i].shadow);        
        //fresnel
        gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.glassBuffers[i].fresnel);
        //texture id
        gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.glassBuffers[i].tex);
        
        gl.drawArrays(gl.TRIANGLES, 0, buffers.glassBuffers[i].indexCount);                               
    }
    //*/

    //draw floor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.floorBuffer.interleavedBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 
                           3, 
                           gl.FLOAT, 
                           gl.FALSE, 
                           Float32Array.BYTES_PER_ELEMENT * 6, 
                           0);
    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    //normals
    gl.vertexAttribPointer(programInfo.attribLocations.normalAttributeLocation, 
                           3, 
                           gl.FLOAT, 
                           gl.FALSE,
                           Float32Array.BYTES_PER_ELEMENT * 6,
                           Float32Array.BYTES_PER_ELEMENT * 3);   
    gl.enableVertexAttribArray(programInfo.attribLocations.normalAttributeLocation);
    
    //colour
    gl.uniform3fv(programInfo.uniformLocations.colourUniformLocation, buffers.floorBuffer.colour);        
    //specular
    gl.uniform1f(programInfo.uniformLocations.specularUniformLocation, buffers.floorBuffer.specular);        
    //transparency
    gl.disable(gl.BLEND);
    gl.uniform1f(programInfo.uniformLocations.transparencyUniformLocation, buffers.floorBuffer.transparency);        
    //reflectivity
    gl.uniform1f(programInfo.uniformLocations.reflectUniformLocation, buffers.floorBuffer.reflect);        
    //shadow
    gl.uniform1f(programInfo.uniformLocations.shadowUniformLocation, buffers.floorBuffer.shadow);        
    //fresnel
    gl.uniform1f(programInfo.uniformLocations.fresnelUniformLocation, buffers.floorBuffer.fresnel);
    //texture id
    gl.uniform1f(programInfo.uniformLocations.texUniformLocation, buffers.floorBuffer.tex);
        
    gl.drawArrays(gl.TRIANGLES, 0, buffers.floorBuffer.indexCount); 

}

function postProcess(gl, 
                     programInfo, 
                     buffers,
                     imageTexture,
                     ssaoTexture) {

    gl.useProgram(programInfo.program);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LESS); // Near things obscure far things            
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(programInfo.attribLocations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.screenQuadBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    //image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(programInfo.uniformLocations.imageTextureUniformLocation, 0);

    //ssao texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ssaoTexture);
    gl.uniform1i(programInfo.uniformLocations.ssaoTextureUniformLocation, 1);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

module.exports = {
    initWebGL: initWebGL,
    initShaderProgram: initShaderProgram,
    loadShader: loadShader,
    checkExtensions: checkExtensions,
    initShadowProgram: initShadowProgram,
    initSSAOProgram: initSSAOProgram,
    initPostProcessProgram: initPostProcessProgram,
    initTexture: initTexture,
    loadImageAndInitTextureInfo: loadImageAndInitTextureInfo,
    initFramebuffer: initFramebuffer,
    initDepthFramebuffer: initDepthFramebuffer,
    loadMesh: loadMesh,
    initBuffers: initBuffers,
    setupCamera: setupCamera,
    drawShadowMap: drawShadowMap,
    drawSSAODepthMap: drawSSAODepthMap,
    drawScene: drawScene,
    postProcess: postProcess
};