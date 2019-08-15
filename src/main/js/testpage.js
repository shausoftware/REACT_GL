'use strict';

const React = require('react');
const ShauGL = require('./shaugl3D');

const acs = require('augmented-compile-shader');

//change content to the script we want to test
const testScript = require('./content/scripts/particlecontent');

var animId = undefined;

export default class TestPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {script: testScript, 
                      title: testScript.getTitle(),
                      description: testScript.getDescription(),
                      supported: true};
        this.gracefullFallback = this.gracefullFallback.bind(this);
    }

    componentDidMount() {
        
        const gl = this.refs.glCanvas.getContext('webgl2');
        
        if (!gl) {
            this.setState({supported: false});
            alert('Please update to a web browser that supports WebGL.');
            this.gracefullFallback();  
            return;
        }

        var glScript = this.state.script;

        const loadScreenProgramInfo = ShauGL.initLoadScreenProgram(gl); //loading screen

        var glContent = glScript.initGLContent(gl);
        var contentLoaded = false;
  
        function renderFrame(now) {

            now *= 0.001; // convert to seconds

            if (!contentLoaded) {
                //loading screen
                ShauGL.renderLoadScreen(gl, loadScreenProgramInfo, glContent.buffers, now);
            } else {
                //render content
                glScript.renderGLContent(gl, glContent, now);
            }

            animId = requestAnimationFrame(renderFrame);            
        };
        
        glScript.loadGLContent(gl, glContent).then(loadedContent => {
            glContent = loadedContent;
            contentLoaded = true;
        });
        animId = requestAnimationFrame(renderFrame);
    }

    componentWillUnmount() {
        //stop animation thread
        window.cancelAnimationFrame(animId);        
    }
        
    gracefullFallback() {
        var ctx = this.refs.glCanvas.getContext('2d');
        var img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };
        var r = Math.random();
        if (r < 0.25) {
            img.src = cat1;
        } else if (r < 0.5) {
            img.src = cat2;
        } else if (r < 0.75) {
            img.src = cat3;
        }
        img.src = cat4;
    }

    render() {

        var titleH = undefined;
        if (this.state.title != undefined) {
            titleH = <div className='text-center'><h4>{this.state.title}</h4></div>;
        }

        return (
            <div>
                {titleH}
                <div className='text-center'>
                    {this.state.description}
                </div>    
                <p className='text-center'>
                    <canvas ref='glCanvas' width='640' height='480'></canvas>
                </p>
            </div>
        );
    }
}