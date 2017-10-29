'use strict';

const React = require('react');
import ShauGL from '../shaugl';
import ShauParticleGL from '../shauparticlegl';
import VertexShader from '../shaders/vertex_shader';
import VignetteFragmentShader from '../shaders/vignette_fragment_shader';
import ParticleVertexShader from '../shaders/particle_vertex_shader';
import ParticleFragmentShader from '../shaders/particle_fragment_shader';
import ParticleComputeVertexShader from '../shaders/particle_compute_vertex_shader';
import ParticleComputeFragmentShader from '../shaders/particle_compute_fragment_shader';
import ParticleInitFragmentShader from '../shaders/particle_init_fragment_shader';

var animId = undefined;

export default class InitialAttempt extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        
        var gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }

        const bufferExt = ShauGL.checkExtensions(gl);
        if (!bufferExt) return;

        //vignette program
        const vvsSource = VertexShader.vertexSource();
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

        var buffers = ShauParticleGL.initBuffers(gl);
        
        //2 identical framebuffers for compute operations
        //this is because read and write buffers cannot be the same buffer object
        //first time round buffer gets rendered into then next frame it is read
        var computeBuffers = [
            ShauParticleGL.initComputeBuffer(gl, bufferExt),
            ShauParticleGL.initComputeBuffer(gl, bufferExt)
        ];

        var vignetteBuffer = ShauGL.setupRenderFramebuffer(gl);

        //initialise particles
        ShauParticleGL.drawInit(gl, initInfo, buffers, computeBuffers[0]);
        
        //start drawing
        var last = 0.0;
        function drawFrame(time) {
            
            var elapsedSeconds = time * 0.001;
            var delta = last != 0.0 ? elapsedSeconds - last : 0.0;
            last = elapsedSeconds;
            
            //compute particle positions into a framebuffer
            ShauParticleGL.drawCompute(gl, computeInfo, buffers, computeBuffers[0], 
                                       computeBuffers[1], elapsedSeconds, delta);

            //swap framebuffers for next render
            var tempBuffer = computeBuffers[0];
            computeBuffers[0] = computeBuffers[1];
            computeBuffers[1] = tempBuffer;

            var projectionMatrix = ShauParticleGL.updateCamera(gl, elapsedSeconds);

            //render scene to frame buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, vignetteBuffer.framebuffer);            
            ShauParticleGL.drawScene(gl, programInfo, buffers, computeBuffers[0], projectionMatrix);

            //draw to screen
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            ShauParticleGL.drawVignette(gl, vignetteInfo, buffers, vignetteBuffer.texture);
            

            animId = requestAnimationFrame(drawFrame);
        }
        animId = requestAnimationFrame(drawFrame);
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