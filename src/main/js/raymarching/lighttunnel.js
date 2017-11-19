'use strict';

const React = require('react');
import ShauRMGL from '../shaurmgl';
import VertexShader from '../shaders/vertex_shader';
import LightTunnelFragmentShader from '../shaders/light_tunnel_fragment_shader';
import LightTunnelBufferShader from '../shaders/light_tunnel_buffer_shader';
import LightTunnelBuffer2Shader from '../shaders/light_tunnel_buffer2_shader';

var animId = undefined;

export default class LightTunnel extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        var gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }

        const vsSource = VertexShader.vertexSource();
        const fsSource = LightTunnelFragmentShader.fragmentSource();
        const fsBufferSource = LightTunnelBufferShader.fragmentSource();
        const fsBuffer2Source = LightTunnelBuffer2Shader.fragmentSource();
        
        const shaderProgram = ShauRMGL.initShaderProgram(gl, vsSource, fsSource);
        const bufferProgram = ShauRMGL.initShaderProgram(gl, vsSource, fsBufferSource);
        const buffer2Program = ShauRMGL.initShaderProgram(gl, vsSource, fsBuffer2Source);
        
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

        const buffers = ShauRMGL.initBuffers(gl);
        var renderBuffer = ShauRMGL.setupRenderFramebuffer(gl);        
        var renderBuffer2 = ShauRMGL.setupRenderFramebuffer(gl);        
        
        var clearColour = {red: 0.0, green: 1.0, blue: 0.0};
        function renderFrame(now) {
            
            now *= 0.001;
            
            //render to frame buffer 1
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderBuffer.framebuffer);
            ShauRMGL.drawRMScene(gl, bufferProgramInfo, buffers, now, clearColour);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            //render to frame buffer 2
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderBuffer2.framebuffer);
            ShauRMGL.drawRMScene(gl, buffer2ProgramInfo, buffers, now, clearColour);
            
            //render to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            ShauRMGL.drawRMSceneWithTextures(gl, 
                                             programInfo, 
                                             buffers, 
                                             renderBuffer.texture, 
                                             renderBuffer2.texture, 
                                             undefined,
                                             undefined,
                                             now, 
                                             clearColour);
            
            animId = requestAnimationFrame(renderFrame);
        }

        animId = requestAnimationFrame(renderFrame);       
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(animId)
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