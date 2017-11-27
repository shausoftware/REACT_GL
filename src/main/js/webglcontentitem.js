'use strict';

const React = require('react');
const ShauGL = require('./shaugl3D');

var animId = undefined;

export default class WebGLContentItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {script: this.props.script, 
                      title: this.props.script.getTitle(),
                      description: this.props.script.getDescription(),
                      displayBackButton: this.props.displayBackButton,
                      supported: true};
        this.goBack = this.goBack.bind(this);
    }

    componentDidMount() {

        const gl = this.refs.glCanvas.getContext('webgl');
        
        if (!gl) {
            //TODO: fail gracefully
            this.setState({supported: false});
            alert('Please update to a web browser that supports WebGL.');
            return;
        }

        var glScript = this.state.script;

        var mBuffExt = ShauGL.checkExtensions(gl); //multiple buffer writes
        const loadScreenProgramInfo = ShauGL.initLoadScreenProgram(gl); //loading screen

        var glContent = glScript.initGLContent(gl, mBuffExt);
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
        
        glScript.loadGLContent(gl, mBuffExt, glContent).then(loadedContent => {
            glContent = loadedContent;
            contentLoaded = true;
        });
        animId = requestAnimationFrame(renderFrame);
    }

    goBack(e) {
        e.preventDefault();
        this.props.goBack();
    }

    componentWillUnmount() {
        //stop animation thread
        window.cancelAnimationFrame(animId);        
    }
        
    render() {

        var titleH = undefined;
        if (this.state.title != undefined) {
            titleH = <div className='text-center'><h4>{this.state.title}</h4></div>;
        }
        var backButton = undefined;
        if (this.state.displayBackButton === true) {
            backButton = <p className="text-right">
                             <a href="#" onClick={this.goBack} className="btn btn-primary" role="button">Back to List</a>
                         </p>;  
        }

        return (
            <div>
                {backButton}
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