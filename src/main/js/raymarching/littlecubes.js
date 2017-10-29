'use strict';

const React = require('react');
import ShauGL from '../shaugl';
import VertexShader from '../shaders/vertex_shader';
import LittleCubesFragmentShader from '../shaders/little_cubes_fragment_shader';

var animId = undefined;

export default class LittleCubes extends React.Component {

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
        const fsSource = LittleCubesFragmentShader.fragmentSource();

        const shaderProgram = ShauGL.initShaderProgram(gl, vsSource, fsSource);

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

        const buffers = ShauGL.initBuffers(gl);

        var clearColour = {red: 0.0, green: 1.0, blue: 0.0};
        function renderFrame(now) {
            now *= 0.001;
            ShauGL.drawScene(gl, programInfo, buffers, now, clearColour);
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