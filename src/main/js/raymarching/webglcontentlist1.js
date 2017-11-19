'use strict';

const React = require('react');

const lightTunnelSrc = require('../static/images/lighttunnel.png');
const littleCubesSrc = require('../static/images/littlecubes.png');
const discoWallSrc = require('../static/images/discowall.png');

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
                            <img src={littleCubesSrc} alt="Little Cubes" />
                            <div className="caption">
                                <h3>Little Cubes</h3>
                                <p>A scene I created using raytracing rendering techniques. Run, little cube run. 
                                </p>
                                <p>
                                    <a href="#" name="LittleCubes" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={lightTunnelSrc} alt="Light Tunnel" />
                            <div className="caption">
                                <h3>Light Tunnel</h3>
                                <p>WIP. The classic tunnel inspired by Beeple. 
                                </p>
                                <p>
                                    <a href="#" name="LightTunnel" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={discoWallSrc} alt="Disco Wall" />
                            <div className="caption">
                                <h3>Disco Wall</h3>
                                <p>WIP. This scene is rendered using a combination of raytracing and raymarched volumetric lighting. 
                                </p>
                                <p>
                                    <a href="#" name="DiscoWall" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        );
    }
}
