'use strict';

const React = require('react');

const mozillaCubesSrc = require('../static/images/mozillacubes.png');
const teapotSrc = require('../static/images/teapot.png');
const firstAttemptSrc = require('../static/images/firstattempt.png');
const bugattiSrc = require('../static/images/bugatti2.png');
const cat2Src = require('../static/images/cat2.jpg');

export default class WebGLContentList1 extends React.Component {

    constructor(props) {
        super(props);
        this.handleViewContentItem = this.handleViewContentItem.bind(this);
    }

    handleViewContentItem(e) {
        e.preventDefault();
        this.props.handleViewContentItem(e.target.name);
    }

    render() {
        
        return(
            <div className="row">
                
                {/*
                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={mozillaCubesSrc} alt="Mozilla Cube" />
                        <div className="caption">
                            <h3>Mozilla Cube</h3>
                            <p>
                                The Mozilla Cube is a great place to start and the example code seems well 
                                organised to me. Next step is to get some shadows and improve rendering. 
                            </p>
                            <p>
                                <a href="#" name="MozillaCube" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>
                */}

                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={bugattiSrc} alt="Bugatti" />
                        <div className="caption">
                            <h3>Bugatti Chiron</h3>
                            <p>
                                WIP. Loading and rendering an OBJ model by Kimzauto. The model 
                                was pre-processed a bit to split objects by their assigned materials. Rendering implements SSAO,
                                reflections, transparency, depth of field and shadow mapping. Unfortunately the model is quite big 
                                (nearly a million faces) so it takes 20-30 seconds to load at the moment.
                                Thus one of the next steps is to optimize the model and download time and create a 
                                nice loading screen. I also want to look at some post processing. 
                            </p>
                            <p>
                                <a href="#" name="Bugatti" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={teapotSrc} alt="Teapot" />
                        <div className="caption">
                            <h3>Teapot</h3>
                            <p>
                                Initial attempt at shadow mapping, screen space ambient occlusion 
                                and loading of OBJ model files. Next step is to try and get a semi-decent 
                                rendering of a more complex model.
                            </p>
                            <p>
                                <a href="#" name="Teapot" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={firstAttemptSrc} alt="Initial Attempt" />
                        <div className="caption">
                            <h3>Curl Particles</h3>
                            <p>
                               My first attempt at building a particle system. 
                               This one is based on work by Nop Jiarathanakul and Curl noise from Edan Kwan. 
                               Six rotating balls provide a simple gravity system to the scene.
                               Next step is to give the particles some volume and render with shadows.
                            </p>
                            <p>
                                <a href="#" name="InitialAttempt" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}
