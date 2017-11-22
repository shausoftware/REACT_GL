'use strict'

const React = require('react');
var glm = require('gl-matrix');

const bugattiJsonSrc = require('../static/bugatti.obj');

import ShauGL from '../shaugl3D';
import BugattiGL from './bugattigl';

import ModelVertexShader from '../shaders/model_vertex_shader';
import BugattiFragmentShader from '../shaders/bugatti_fragment_shader';

var animId = undefined;

export default class Bugatti extends React.Component {

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
        const bugattiFsSource = BugattiFragmentShader.fragmentSource();
        const bugattiShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, bugattiFsSource);
        const bugattiProgramInfo = {
            program: bugattiShaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(bugattiShaderProgram, 'a_position'),
                normalAttributeLocation: gl.getAttribLocation(bugattiShaderProgram, 'a_normal')
            },
            uniformLocations: {
                modelViewMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_model_view_matrix'),
                projectionMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_projection_matrix'),
                smModelViewMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_sm_model_view_matrix'),
                smProjectionMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_sm_projection_matrix'),
                normalsMatrixUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_normals_matrix'),
                depthColourTextureUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_depth_colour_texture'),
                colourUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_colour'),
                specularUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_specular'),
                transparencyUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_transparency'),
                reflectUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_reflect'),
                shadowUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_shadow'),
                fresnelUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_fresnel'),
                texUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_tex'),
                lightPositionUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_light_position'),
                dofUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_dof'),
                eyePositionUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_eye_position'),
                ssaoTextureUniformLocation: gl.getUniformLocation(bugattiShaderProgram, 'u_ssao_texture')
            }
        }

        const loadScreenProgramInfo = ShauGL.initLoadScreenProgram(gl);
        const shadowMapProgramInfo = ShauGL.initShadowProgram(gl);
        const ssaoProgramInfo = ShauGL.initSSAOProgram(gl);
        const postProcessProgramInfo = ShauGL.initPostProcessProgram(gl);

        var buffers = BugattiGL.initBuffers(gl);
        var shadowMapFramebuffer = ShauGL.initDepthFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
        var ssaoFramebuffer = ShauGL.initDepthFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var imageFrameBuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);

        var modelLoaded = false;
        function renderFrame(now) {

            now *= 0.001; // convert to seconds
            
            if (!modelLoaded) {
                //loading screen
                ShauGL.renderLoadScreen(gl, loadScreenProgramInfo, buffers, now);
            } else {

                var cameraPosition = glm.vec3.fromValues(7.0, 3.0, 9.0);
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
                BugattiGL.drawShadowMap(gl, 
                                        shadowMapProgramInfo, 
                                        buffers, 
                                        shadowMapCameraMatrices,  
                                        shadowDepthTextureSize);
                //*/
                
                //ssao depth to off screen buffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, ssaoFramebuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                BugattiGL.drawSSAODepthMap(gl, 
                                        ssaoProgramInfo, 
                                        buffers,
                                        viewCameraMatrices, 
                                        camera.far);
                //*/
    
                //draw scene
                gl.bindFramebuffer(gl.FRAMEBUFFER, imageFrameBuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                BugattiGL.drawScene(gl, 
                                    bugattiProgramInfo, 
                                    buffers, 
                                    viewCameraMatrices,
                                    shadowMapCameraMatrices,
                                    shadowMapFramebuffer.texture,
                                    ssaoFramebuffer.texture,
                                    lightPosition,
                                    camera);
                //*/
                                            
                //post processing
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                BugattiGL.postProcess(gl,
                                    postProcessProgramInfo,
                                    buffers,
                                    imageFrameBuffer.texture,
                                    ssaoFramebuffer.texture,
                                    0.1);
                //*/                   
            }

            animId = requestAnimationFrame(renderFrame);
        }
        //*/

        ShauGL.loadJsonMesh(bugattiJsonSrc).then(mesh => {
            var model = JSON.parse(mesh);
            BugattiGL.initModelBuffers(buffers, gl, model);
            modelLoaded = true;
        });
        animId = requestAnimationFrame(renderFrame);
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