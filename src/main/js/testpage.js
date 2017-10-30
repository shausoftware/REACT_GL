'use strict';

const React = require('react');
import ShauGL from './shaugl';

import VertexShader from './shaders/vertex_shader';
import LightTunnelFragmentShader from './shaders/light_tunnel_fragment_shader';
import LightTunnelBufferShader from './shaders/light_tunnel_buffer_shader';

var animId = undefined;

export default class TestPage extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        const gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }
        
        const vsSource = VertexShader.vertexSource();
        const fsSource = LightTunnelFragmentShader.fragmentSource();
        const fsBufferSource = LightTunnelBufferShader.fragmentSource();
        
        const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);
        const bufferProgram = ShauGL.initShaderProgram(gl, vsSource, fsBufferSource);
        
        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
            },
            uniformLocations: {
                textureUniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture'),
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

        const buffers = ShauGL.initBuffers(gl);
        var renderBuffer = ShauGL.setupRenderFramebuffer(gl);        

        var clearColour = {red: 1.0, green: 0.0, blue: 0.0};
        function renderFrame(now) {
            
            now *= 0.001;
            
            //render to frame buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderBuffer.framebuffer);
            ShauGL.drawScene(gl, bufferProgramInfo, buffers, now, clearColour);
            
            //render to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            ShauGL.drawSceneWithBufferTexture(gl, programInfo, buffers, renderBuffer.texture, now, clearColour);
            
            animId = requestAnimationFrame(renderFrame);
        }

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