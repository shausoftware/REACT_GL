'use strict';

const React = require('react');

import ShauRMGL from '../shaurmgl';
import CubeGL from '../cubegl';
import CubeVertexShader from '../shaders/cube_vertex_shader';
import CubeFragmentShader from '../shaders/cube_fragment_shader';

var animId = undefined;

export default class WebGL extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        const gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }

        const vsSource = CubeVertexShader.vertexSource();
        const fsSource = CubeFragmentShader.fragmentSource();

        const shaderProgram = ShauRMGL.initShaderProgram(gl, vsSource, fsSource);

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_position'),
                normalAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_normal'),
                textureCoordAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_texture_coord')
            },
            uniformLocations: {
                projectionMatrixUniformLocation: gl.getUniformLocation(shaderProgram, 'u_projection_matrix'),
                modelViewMatrixUniformLocation: gl.getUniformLocation(shaderProgram, 'u_model_view_matrix'),
                normalMatrixUniformLocation: gl.getUniformLocation(shaderProgram, 'u_normal_matrix'),
                textureUniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture')
            }
        };

        const buffers = CubeGL.initBuffers(gl);
        const texture = CubeGL.loadTexture(gl);
        
        var clearColour = {red: 0.0, green: 0.0, blue: 0.4};
        var cubeRotation = 0.0;
        var then = 0;
        function renderFrame(now) {

            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;

            CubeGL.drawScene(gl, programInfo, buffers, texture, cubeRotation, clearColour);
            cubeRotation += deltaTime;

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