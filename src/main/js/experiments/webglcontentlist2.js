'use strict';

const React = require('react');

const particlesSrc = require('../static/images/firstattempt.png');
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
                        <img src={particlesSrc} alt="Curl Particles" />
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
