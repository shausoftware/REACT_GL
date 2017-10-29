'use strict';

const React = require('react');
import ShauGL from '../shaugl';
import ShauBufferGL from '../shaubuffergl';
import VertexShader from '../shaders/vertex_shader';
import VoxelBridgeFragmentShader from '../shaders/voxel_bridge_fragment_shader';
import VoxelBridgeBufferFragmentShader from '../shaders/voxel_bridge_buffer_fragment_shader';

var animId = undefined;

export default class VoxelBridge extends React.Component {

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
        const fsSource = VoxelBridgeFragmentShader.fragmentSource();
        const fsBufferSource = VoxelBridgeBufferFragmentShader.fragmentSource();

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
                textureUniformLocation: gl.getUniformLocation(bufferProgram, 'u_texture'),
                resolutionUniformLocation: gl.getUniformLocation(bufferProgram, 'u_resolution'),
                timeUniformLocation: gl.getUniformLocation(bufferProgram, 'u_time')
            }
        };
        
        const buffers = ShauGL.initBuffers(gl);
        var renderBuffer = ShauGL.setupRenderFramebuffer(gl);
        var bufferTexture2 = ShauGL.setupTexture(gl);

        var clearColour = {red: 0.0, green: 1.0, blue: 0.0};
        function renderFrame(now) {

            now *= 0.001;

            //TODO: make buffer handling more efficient
            //render to frame buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderBuffer.framebuffer);
            ShauBufferGL.drawSceneWithBufferTexture(gl, bufferProgramInfo, buffers, bufferTexture2, now, clearColour);
            
            //copy data into texture for feedback
            gl.bindTexture(gl.TEXTURE_2D, bufferTexture2);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
                          gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, gl.canvas.width, gl.canvas.height, 0);

            //render to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            ShauBufferGL.drawSceneWithBufferTexture(gl, programInfo, buffers, renderBuffer.texture, now, clearColour);

            animId = requestAnimationFrame(renderFrame);
        }

        animId = requestAnimationFrame(renderFrame);        
    }
    
    componentWillUnmount() {
        window.cancelAnimationFrame(animId)
    }

    render () {
        return (
            <div>
                <p className='text-center'>
                    <canvas ref='glCanvas' width='640' height='480'></canvas>
                </p>    
            </div>
        );
    }
} 