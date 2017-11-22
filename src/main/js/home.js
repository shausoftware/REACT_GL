'use strict';

const cat1 = require('./static/images/cat1.jpg');
const cat2 = require('./static/images/cat2.jpg');
const cat3 = require('./static/images/cat3.jpg');
const cat4 = require('./static/images/cat4.jpg');

const React = require('react');
import ShauRMGL from './shaurmgl';
import ShauImageGL from './homegl';
import HomeVertexShader from './shaders/home_vertex_shader';
import HomeFragmentShader from './shaders/home_fragment_shader';

var animId = undefined;

export default class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        const gl = this.refs.glCanvas.getContext('webgl');

        if (!gl) {
            alert('Please update to a web browser that supports WebGL.');
            return;
        }
        
        const vsSource = HomeVertexShader.vertexSource();
        const fsSource = HomeFragmentShader.fragmentSource();

        const shaderProgram = ShauRMGL.initShaderProgram(gl, vsSource, fsSource);

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                positionAttributeLocation: gl.getAttribLocation(shaderProgram, 'a_position')
            },
            uniformLocations: {
                textureUniformLocation: gl.getUniformLocation(shaderProgram, 'u_texture'),
                vignetteUniformLocation: gl.getUniformLocation(shaderProgram, 'u_vignette'),
                resolutionUniformLocation: gl.getUniformLocation(shaderProgram, 'u_resolution'),
                timeUniformLocation: gl.getUniformLocation(shaderProgram, 'u_time')
            }
        };

        var buffers = ShauRMGL.initBuffers(gl);

        var textureInfos = [
            ShauImageGL.loadImageAndCreateTextureInfo(gl, cat1),
            ShauImageGL.loadImageAndCreateTextureInfo(gl, cat2),
            ShauImageGL.loadImageAndCreateTextureInfo(gl, cat3),
            ShauImageGL.loadImageAndCreateTextureInfo(gl, cat4),
        ];

        function renderFrame(time) {
            
            var dt = time * 0.001; //time in seconds
            // 4 images
            var vignette = 1.0;
            var cat = textureInfos[0];
            var ct = dt % 40.0; //time to cycle through 4 images
            var ctf = dt % 10.0; //time to cycle 1 image

            if (ctf < 1.0) {
                vignette = ctf;
            } else if (ctf > 9.0) {
                vignette = 10.0 - ctf;
            } else {
                vignette = 1.0;
            }

            if (ct > 10.0 && ct <= 20.0) {
                cat = textureInfos[1];
            } else if (ct > 20.0 && ct <= 30.0) {
                cat = textureInfos[2];
            } else if (ct > 30.0) {
                cat = textureInfos[3];
            }

            ShauImageGL.drawImage(gl, programInfo, buffers, cat, dt, vignette);
            animId = requestAnimationFrame(renderFrame);
        }
        
        animId = requestAnimationFrame(renderFrame);
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(animId);
    }

    render() {
        return(
            <div className='panel panel-default'>
                <div className='panel-heading'>Home Page</div>
                <div className='panel-body'>
                    <p className='text-center'>
                        Hi there. This is the third 
                        incarnation of my website SHAUSTUFF. This site is built using all the 
                        latest web development goodies including React and Bootstrap 
                        but it's mainly me building a framework to experiment with WebGL and graphics.                        
                        All of the code to this site is available from my github repository 
                        should you be interested in such things (see links). Now on to business... 
                        some pictures of cats (this time rendered using WebGL).    
                    </p>    
                    <p className='text-center'>
                        <canvas ref='glCanvas' width='640' height='480'></canvas>
                    </p>
                </div>
            </div>
        );
    }
}