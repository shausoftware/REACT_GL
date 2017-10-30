'use strict';

const React = require('react');

import Gasket from './gasket';
import LittleCubes from './littlecubes';
import VoxelBridge from './voxelbridge';
import NeonTruchet from './neontruchet';
import DiscoWall from './discowall';
import LightTunnel from './lighttunnel';

export default class WebGLContentItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {contentItemName: this.props.contentItemName};
        this.onNavigate = this.onNavigate.bind(this);
    }

    onNavigate(e) {
        e.preventDefault();
        this.props.onNavigate(e.target.name);
    }
        
    render() {

        var listPage = 'CONTENT_LIST_1';
        var contentItem = <LittleCubes />;
        
        if (this.state.contentItemName === 'LightTunnel') {
            contentItem = <LightTunnel />;
        } else if (this.state.contentItemName === 'DiscoWall') {
            contentItem = <DiscoWall />;
        } else if (this.state.contentItemName === 'VoxelBridge') {
            contentItem = <VoxelBridge />;
            var listPage = 'CONTENT_LIST_2';
        } else if (this.state.contentItemName === 'NeonTruchet') {
            contentItem = <NeonTruchet />;
            var listPage = 'CONTENT_LIST_2';
        } else if (this.state.contentItemName === 'Gasket') {
            contentItem = <Gasket />;
            var listPage = 'CONTENT_LIST_2';
        }

        return (
            <div>
                <p className="text-right">
                    <a href="#" name={listPage} onClick={this.onNavigate} className="btn btn-primary" role="button">Back to List</a>
                </p>    

                {contentItem}
                
            </div>
        );
    }
}