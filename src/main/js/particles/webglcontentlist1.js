'use strict';

const React = require('react');

const firstAttemptSrc = require('../static/images/firstattempt.png');

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
                        <img src="/images/cat2.JPG" alt="TestShader" />
                        <div className="caption">
                            <h3>Test Shader</h3>
                            <p>
                                Test Shader.
                            </p>
                            <p>
                                <a href="#" name="TestShader" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                            </p>
                        </div>
                    </div>
                </div>
                */}
                
                <div className="col-sm-6 col-md-4">
                    <div className="thumbnail">
                        <img src="/images/firstattempt.png" alt="Initial Attempt" />
                        <div className="caption">
                            <h3>Initial Attempt</h3>
                            <p>
                               My first attempt at building a particle system. 
                               This one is based on work by Nop Jiarathanakul and Curl noise from Edan Kwan. 
                               Six rotating balls provide a simple gravity system to the scene.
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
