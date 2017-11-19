'use strict';

const React = require('react');
import ShauRMGL from '../shaurmgl';
import VertexShader from '../shaders/vertex_shader';
import NeonTruchetFragmentShader from '../shaders/neon_truchet_fragment_shader';

var animId = undefined;

export default class NeonTruchet extends React.Component {

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
        const fsSource = NeonTruchetFragmentShader.fragmentSource();

        const shaderProgram = ShauRMGL.initShaderProgram(gl, vsSource, fsSource);

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                positionAttributePosition: gl.getAttribLocation(shaderProgram, 'a_position')
            },
            uniformLocations: {
                resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),
                timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time')
            }
        };

        const buffers = ShauRMGL.initBuffers(gl);

        var clearColour = {red: 0.0, green: 1.0, blue: 0.0};
        function renderFrame(now) {
            now *= 0.001;
            ShauRMGL.drawRMScene(gl, programInfo, buffers, now, clearColour);
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