'use strict';

const React = require('react');
var glm = require('gl-matrix');

const peugeotOnyxJsonSrc = require('../static/PeugeotOnyx.obj');

import ShauGL from '../shaugl3D';
import PeugeotOnyxGL from './peugeotonyxgl';

import ModelVertexShader from '../shaders/model_vertex_shader';
import PeugeotOnyxFragmentShader from '../shaders/peugeot_onyx_fragment_shader';

var animId = undefined;

export default class PeugeotOnyx extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        const gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }

        ShauGL.checkExtensions(gl);
        
        var shadowDepthTextureSize = 4096;
        var lightPosition = [-3.0, 8.0, 2.0];
        
        //bugatti program
        const modelVsSource = ModelVertexShader.vertexSource();
        const peugeotOnyxFsSource = PeugeotOnyxFragmentShader.fragmentSource();
        const peugeotOnyxShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, peugeotOnyxFsSource);
        const peugeotOnyxProgramInfo = {
            program: peugeotOnyxShaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(peugeotOnyxShaderProgram, 'a_position'),
                normalAttributeLocation: gl.getAttribLocation(peugeotOnyxShaderProgram, 'a_normal')
            },
            uniformLocations: {
                modelViewMatrixUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_model_view_matrix'),
                projectionMatrixUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_projection_matrix'),
                smModelViewMatrixUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_sm_model_view_matrix'),
                smProjectionMatrixUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_sm_projection_matrix'),
                normalsMatrixUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_normals_matrix'),
                depthColourTextureUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_depth_colour_texture'),
                colourUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_colour'),
                specularUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_specular'),
                transparencyUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_transparency'),
                reflectUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_reflect'),
                shadowUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_shadow'),
                fresnelUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_fresnel'),
                texUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_tex'),
                lightPositionUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_light_position'),
                eyePositionUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_eye_position'),
                ssaoTextureUniformLocation: gl.getUniformLocation(peugeotOnyxShaderProgram, 'u_ssao_texture')
            }
        }

        const shadowMapProgramInfo = ShauGL.initShadowProgram(gl);
        const ssaoProgramInfo = ShauGL.initSSAOProgram(gl);
        const postProcessProgramInfo = ShauGL.initPostProcessProgram(gl);

        var buffers = undefined;
        var shadowMapFramebuffer = ShauGL.initDepthFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
        var ssaoFramebuffer = ShauGL.initDepthFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var imageFrameBuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);

        var then = 0;
        function renderFrame(now) {

            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;

            var cameraPosition = glm.vec3.fromValues(4.0, 2.0, 6.0);
            var target = glm.vec3.fromValues(0.0, 0.0, 0.5);
            glm.vec3.rotateY(cameraPosition, cameraPosition, target, now * 0.02);

            var camera = {
                position: cameraPosition,
                target: target,
                near: 0.01,
                far: 400.0,
                fov: 45.0,
                aspectRatio: gl.canvas.width / gl.canvas.height
            };    
            var lightProjectionMatrix = glm.mat4.create();
            glm.mat4.ortho(lightProjectionMatrix,                   
                            -10.0,
                            10.0,
                            -10.0,
                            10.0,
                            -10.0, 
                            20.0);
            var cameraProjectionMatrix = glm.mat4.create();
            glm.mat4.perspective(cameraProjectionMatrix,
                                    camera.fov,
                                    camera.aspectRatio,
                                    camera.near,
                                    camera.far);
            var viewCameraMatrices = ShauGL.setupCamera(camera.position, camera.target, cameraProjectionMatrix);
            var shadowMapCameraMatrices = ShauGL.setupCamera(lightPosition, camera.target, lightProjectionMatrix);
    
            // Draw to our off screen drawing buffer for shadow map
            gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer.framebuffer);
            //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            PeugeotOnyxGL.drawShadowMap(gl, 
                                    shadowMapProgramInfo, 
                                    buffers, 
                                    shadowMapCameraMatrices,  
                                    shadowDepthTextureSize);
            //*/
            
        
            //ssao depth to off screen buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, ssaoFramebuffer.framebuffer);
            //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            PeugeotOnyxGL.drawSSAODepthMap(gl, 
                                    ssaoProgramInfo, 
                                    buffers,
                                    viewCameraMatrices, 
                                    camera.far);
            //*/

            //draw scene
            //gl.bindFramebuffer(gl.FRAMEBUFFER, imageFrameBuffer.framebuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            PeugeotOnyxGL.drawScene(gl, 
                                peugeotOnyxProgramInfo, 
                                buffers, 
                                viewCameraMatrices,
                                shadowMapCameraMatrices,
                                shadowMapFramebuffer.texture,
                                ssaoFramebuffer.texture,
                                lightPosition,
                                camera);
            //*/

            /*
            //post processing
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            PeugeotOnyxGL.postProcess(gl,
                                postProcessProgramInfo,
                                buffers,
                                imageFrameBuffer.texture,
                                ssaoFramebuffer.texture);
            //*/                   

            animId = requestAnimationFrame(renderFrame);
        }
        //*/

        ShauGL.loadJsonMesh(peugeotOnyxJsonSrc).then(mesh => {
            var model = JSON.parse(mesh);
            buffers = PeugeotOnyxGL.initBuffers(gl, model);
            animId = requestAnimationFrame(renderFrame);
        });
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(animId);        
    }

    render() {
        return (
            <div>
                <p className='text-center'>
                    <canvas ref='glCanvas' width='640' height='480'></canvas>
                </p>    
            </div>
        );
    }
}