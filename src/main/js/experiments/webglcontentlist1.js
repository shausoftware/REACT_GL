'use strict';

const React = require('react');

const teapotSrc = require('../static/images/teapot.png');
const bugattiSrc = require('../static/images/bugatti2.png');
const ironManSrc = require('../static/images/ironman.png');
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
                
                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={ironManSrc} alt="Iron Man" />
                        <div className="caption">
                            <h3>Iron Man</h3>
                            <p>
                                This rendering is all to do with generating a 
                                glow effect. The Iron Man model is by Deadcode3. 
                                I'm now pre-processing OBJ models to JSON which saves a little 
                                on client side complexity. 
                            </p>
                            <p>
                                <a href="#" name="IronMan" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src={bugattiSrc} alt="Bugatti Chiron" />
                        <div className="caption">
                            <h3>Bugatti Chiron</h3>
                            <p>
                                Loading and rendering an OBJ model by Kimzauto. The model 
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

            </div>
        );
    }
}
