'use strict';

const React = require('react');
var glm = require('gl-matrix');

const noiseSrc = require('../static/images/colournoise.png');
const teapotObjSrc = require('../static/teapot.obj');

import ShauGL from '../shaugl';
import ShauImageGL from '../shauimagegl';

import TeapotGL from '../teapotgl';
import TeapotShadowVertexShader from '../shaders/teapot_shadow_vertex_shader';
import TeapotShadowFragmentShader from '../shaders/teapot_shadow_fragment_shader';
import TeapotVertexShader from '../shaders/teapot_vertex_shader';
import TeapotFragmentShader from '../shaders/teapot_fragment_shader';
import TeapotSSAOVertexShader from '../shaders/teapot_ssao_vertex_shader';
import TeapotSSAOFragmentShader from '../shaders/teapot_ssao_fragment_shader';

var animId = undefined;

export default class Teapot extends React.Component {

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
        
        var shadowDepthTextureSize = 2048;
        var lightPosition = [-2.0, 10.0, 1.0];
        var camera = {
            position: [0.0, 5.0, 10.0],
            target: [0.0, 0.0, 0.0],
            near: 0.01,
            far: 400.0,
            fov: 45.0,
            aspectRatio: gl.canvas.width / gl.canvas.height
        };

        var lightProjectionMatrix = glm.mat4.create();
        glm.mat4.ortho(lightProjectionMatrix,                   
                        -40.0,
                        40.0,
                        -40.0,
                        40.0,
                        -40.0, 
                        80.0);
        
        var cameraProjectionMatrix = glm.mat4.create();
        glm.mat4.perspective(cameraProjectionMatrix,
                                camera.fov,
                                camera.aspectRatio,
                                camera.near,
                                camera.far);
        
        //teapot program
        const teapotVsSource = TeapotVertexShader.vertexSource();
        const teapotFsSource = TeapotFragmentShader.fragmentSource();
        const teapotShaderProgram = ShauGL.initShaderProgram(gl, teapotVsSource, teapotFsSource);
        const teapotProgramInfo = {
            program: teapotShaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(teapotShaderProgram, 'a_position'),
                normalAttributeLocation: gl.getAttribLocation(teapotShaderProgram, 'a_normal')
            },
            uniformLocations: {
                modelViewMatrixUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_model_view_matrix'),
                projectionMatrixUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_projection_matrix'),
                smModelViewMatrixUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_sm_model_view_matrix'),
                smProjectionMatrixUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_sm_projection_matrix'),
                normalsMatrixUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_normals_matrix'),
                depthColourTextureUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_depth_colour_texture'),
                colourUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_colour'),
                lightPositionUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_light_position'),
                ssaoTextureUniformLocation: gl.getUniformLocation(teapotShaderProgram, 'u_ssao_texture')
            }
        }

        //shadow program
        const shadowMapVsSource = TeapotShadowVertexShader.vertexSource();
        const shadowMapFsSource = TeapotShadowFragmentShader.fragmentSource();
        const shadowMapShaderProgram = ShauGL.initShaderProgram(gl, shadowMapVsSource, shadowMapFsSource);
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

        //ssao program
        const ssaoVsSource = TeapotSSAOVertexShader.vertexSource();
        const ssaoFsSource = TeapotSSAOFragmentShader.fragmentSource();
        const ssaoShaderProgram = ShauGL.initShaderProgram(gl, ssaoVsSource, ssaoFsSource);
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

        var buffers = undefined;
        var shadowMapFramebuffer = TeapotGL.initSmFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
        var ssaoFramebuffer = TeapotGL.initSmFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var viewCameraMatrices = TeapotGL.setupCamera(camera.position, camera.target, cameraProjectionMatrix);
        var shadowMapCameraMatrices = TeapotGL.setupCamera(lightPosition, camera.target, lightProjectionMatrix);
    
        var then = 0;
        function renderFrame(now) {

            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;
            
            // Draw to our off screen drawing buffer for shadow map
            gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer.framebuffer);
            TeapotGL.drawShadowMap(gl, 
                                    shadowMapProgramInfo, 
                                    buffers, 
                                    shadowMapCameraMatrices,  
                                    shadowDepthTextureSize);
            //*/
            
            //ssao depth to off screen buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, ssaoFramebuffer.framebuffer);
            TeapotGL.drawSSAO(gl, ssaoProgramInfo, buffers, viewCameraMatrices, camera);
            //*/

            //draw scene
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            TeapotGL.drawScene(gl, 
                                teapotProgramInfo, 
                                buffers, 
                                viewCameraMatrices,
                                shadowMapCameraMatrices,
                                shadowMapFramebuffer.texture,
                                ssaoFramebuffer.texture,
                                lightPosition);
            //*/

            animId = requestAnimationFrame(renderFrame);
        }

        var useMaterials = false;
        TeapotGL.loadMesh(teapotObjSrc, useMaterials).then(mesh => {
            console.log('MESH LOADED');
            buffers = TeapotGL.initBuffers(gl, mesh);
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