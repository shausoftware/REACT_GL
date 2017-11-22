'use strict';

const React = require('react');

import Particles from './particles';
import Teapot from './teapot';
import Bugatti from './bugatti';
import IronMan from './ironman';
import PeugeotOnyx from './peugeotonyx';

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

        var contentItem = <Particles />;
        var listPage = 'CONTENT_LIST_2';
        if ('Teapot' === this.state.contentItemName) {
            contentItem = <Teapot />;
            listPage = 'CONTENT_LIST_1';
        }
        if ('Bugatti' === this.state.contentItemName) {
            contentItem = <Bugatti />;
            listPage = 'CONTENT_LIST_1';
        }
        if ('PeugeotOnyx' === this.state.contentItemName) {
            contentItem = <PeugeotOnyx />;
            listPage = 'CONTENT_LIST_1';
        }
        if ('IronMan' === this.state.contentItemName) {
            contentItem = <IronMan />;
            listPage = 'CONTENT_LIST_1';
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