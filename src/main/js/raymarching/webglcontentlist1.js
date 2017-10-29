'use strict';

const React = require('react');

const cat2Src = require('../static/images/cat2.jpg');
const neonTruchetSrc = require('../static/images/neontruchet.png');

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
        
        var links = [];

        return(

            <div>

                <div className="row">

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={cat2Src} alt="Disco Wall" />
                            <div className="caption">
                                <h3>Disco Wall</h3>
                                <p>This scene is rendered using a combination of raytracing and raymarched volumetric lighting. 
                                </p>
                                <p>
                                    <a href="#" name="DiscoWall" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={cat2Src} alt="Light Tunnel" />
                            <div className="caption">
                                <h3>Light Tunnel</h3>
                                <p>The classic tunnel inspired by Beeple Crap. 
                                </p>
                                <p>
                                    <a href="#" name="LightTunnel" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={neonTruchetSrc} alt="Neon Truchet" />
                            <div className="caption">
                                <h3>Neon Truchet</h3>
                                <p>A 3D Truchet tiling with directional flow.
                                </p>
                                <p>
                                    <a href="#" name="NeonTruchet" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        );
    }
}
