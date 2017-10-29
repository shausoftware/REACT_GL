'use strict';

const React = require('react');

const littleCubesSrc = require('../static/images/littlecubes.png');
const gasketSrc = require('../static/images/gasket.png');
const voxelBridgeSrc = require('../static/images/voxelbridge.png');

export default class WebGLContentList2 extends React.Component {

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
                            <img src={gasketSrc} alt="Apollonian Gasket" />
                            <div className="caption">
                                <h3>Apollonian Gasket</h3>
                                <p>A scene I created using by raymarching an Apollonian Gasket fractal. It's quite strenuous 
                                    on the GPU so it may be slow on some older machines. 
                                </p>
                                <p>
                                    <a href="#" name="Gasket" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4">
                        <div className="thumbnail">
                            <img src={voxelBridgeSrc} alt="Voxel Bridge" />
                            <div className="caption">
                                <h3>Voxel Bridge</h3>
                                <p>Another abstract scene this time using Voxel marching and multipass rendering. 
                                </p>
                                <p>
                                    <a href="#" name="VoxelBridge" onClick={this.handleViewContentItem} className="btn btn-primary" role="button">View</a> 
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        );
    }
}
