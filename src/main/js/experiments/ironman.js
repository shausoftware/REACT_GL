'use strict';

const React = require('react');
var glm = require('gl-matrix');

const ironManJsonSrc = require('../static/IronMan.obj');

import ShauGL from '../shaugl3D';
import IronManGL from './ironmangl';

import ModelVertexShader from '../shaders/model_vertex_shader';
import IronManFragmentShader from '../shaders/iron_man_fragment_shader';

var animId = undefined;

export default class IronMan extends React.Component {

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
        var lightPosition = [-3.0, 15.0, 2.0];
        
        //bugatti program
        const modelVsSource = ModelVertexShader.vertexSource();
        const ironManFsSource = IronManFragmentShader.fragmentSource();
        const ironManShaderProgram = ShauGL.initShaderProgram(gl, modelVsSource, ironManFsSource);
        const ironManProgramInfo = {
            program: ironManShaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(ironManShaderProgram, 'a_position'),
                normalAttributeLocation: gl.getAttribLocation(ironManShaderProgram, 'a_normal')
            },
            uniformLocations: {
                modelViewMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_model_view_matrix'),
                projectionMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_projection_matrix'),
                smModelViewMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_sm_model_view_matrix'),
                smProjectionMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_sm_projection_matrix'),
                normalsMatrixUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_normals_matrix'),
                depthColourTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_depth_colour_texture'),
                colourUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_colour'),
                specularUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_specular'),
                transparencyUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_transparency'),
                reflectUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_reflect'),
                shadowUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_shadow'),
                fresnelUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_fresnel'),
                texUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_tex'),
                lightPositionUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_light_position'),
                lightStrengthUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_light_strength'),
                eyePositionUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_eye_position'),
                ssaoTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_ssao_texture'),
                glowMapTextureUniformLocation: gl.getUniformLocation(ironManShaderProgram, 'u_glow_map_texture')
            }
        }

        const loadScreenProgramInfo = ShauGL.initLoadScreenProgram(gl);
        const shadowMapProgramInfo = ShauGL.initShadowProgram(gl);
        const glowProgramInfo = ShauGL.initGlowProgram(gl);
        const blurProgramInfo = ShauGL.initBlurProgram(gl);
        const ssaoProgramInfo = ShauGL.initSSAOProgram(gl);
        const postProcessProgramInfo = ShauGL.initPostProcessProgram(gl);

        var buffers = IronManGL.initBuffers(gl);
        var shadowMapFramebuffer = ShauGL.initDepthFramebuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);
        var ssaoFramebuffer = ShauGL.initDepthFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var glowMapFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var blurHFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var blurVFramebuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);
        var imageFrameBuffer = ShauGL.initFramebuffer(gl, gl.canvas.width, gl.canvas.height);

        var blurAmount = 8; //0 - 10
        var blurScale = 0.9;
        var blurStrength = 0.6; //0.0 - 1.0

        var modelLoaded = false;
        function renderFrame(now) {

            now *= 0.001; // convert to seconds

            if (!modelLoaded) {
                ShauGL.renderLoadScreen(gl, loadScreenProgramInfo, buffers, now);
            } else {

                var cameraPosition = glm.vec3.fromValues(5.0, 10.0, 6.0);
                var target = glm.vec3.fromValues(0.0, 6.0, 0.5);
                glm.vec3.rotateY(cameraPosition, cameraPosition, target, now * 0.2);
    
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
                                -20.0,
                                 20.0,
                                -20.0,
                                 20.0,
                                -20.0, 
                                 40.0);
                var cameraProjectionMatrix = glm.mat4.create();
                glm.mat4.perspective(cameraProjectionMatrix,
                                        camera.fov,
                                        camera.aspectRatio,
                                        camera.near,
                                        camera.far);
                var viewCameraMatrices = ShauGL.setupCamera(camera.position, camera.target, cameraProjectionMatrix);
                var shadowMapCameraMatrices = ShauGL.setupCamera(lightPosition, camera.target, lightProjectionMatrix);
                var lightStrength = Math.sin(now * 0.2);

                // Draw to our off screen drawing buffer for shadow map
                gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFramebuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.drawShadowMap(gl, 
                                        shadowMapProgramInfo, 
                                        buffers, 
                                        shadowMapCameraMatrices,  
                                        shadowDepthTextureSize);
                //*/
                                
                //ssao depth to off screen buffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, ssaoFramebuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.drawSSAODepthMap(gl, 
                                           ssaoProgramInfo, 
                                           buffers,
                                           viewCameraMatrices, 
                                           camera.far);
                //*/
    
                //glow map to offscreen buffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, glowMapFramebuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.drawGlowMap(gl,
                                        glowProgramInfo,
                                        buffers,
                                        viewCameraMatrices);
                //then box blur glow map to offscreen buffer
                //horizontal pass
                gl.bindFramebuffer(gl.FRAMEBUFFER, blurHFramebuffer.framebuffer);
                IronManGL.blur(gl, 
                               blurProgramInfo, 
                               buffers, 
                               glowMapFramebuffer.texture,
                               blurAmount, 
                               blurScale, 
                               blurStrength, 
                               0);
                //vertical pass               
                gl.bindFramebuffer(gl.FRAMEBUFFER, blurVFramebuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.blur(gl, 
                                blurProgramInfo, 
                                buffers, 
                                blurHFramebuffer.texture,
                                blurAmount, 
                                blurScale, 
                                blurStrength, 
                                1);
                //*/
               
                //draw scene
                gl.bindFramebuffer(gl.FRAMEBUFFER, imageFrameBuffer.framebuffer);
                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.drawScene(gl, 
                                    ironManProgramInfo, 
                                    buffers, 
                                    viewCameraMatrices,
                                    shadowMapCameraMatrices,
                                    shadowMapFramebuffer.texture,
                                    ssaoFramebuffer.texture,
                                    blurVFramebuffer.texture,
                                    lightPosition,
                                    lightStrength,
                                    camera);
                //*/
    
                
                //post processing
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                IronManGL.postProcess(gl,
                                    postProcessProgramInfo,
                                    buffers,
                                    imageFrameBuffer.texture,
                                    ssaoFramebuffer.texture,
                                    0.3);
                //*/                   
            }

            animId = requestAnimationFrame(renderFrame);
        }
        //*/

        ShauGL.loadJsonMesh(ironManJsonSrc).then(mesh => {
            var model = JSON.parse(mesh);
            IronManGL.initModelBuffers(buffers, gl, model);
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