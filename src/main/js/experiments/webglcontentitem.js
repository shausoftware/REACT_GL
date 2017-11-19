'use strict';

const React = require('react');

import InitialAttempt from './initialattempt';
import MozillaCube from './mozillacube';
import Teapot from './teapot';
import Bugatti from './bugatti';

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

        var contentItem = <InitialAttempt />;
        var listPage = 'CONTENT_LIST_1';
        if ('MozillaCube' === this.state.contentItemName) {
            contentItem = <MozillaCube />;
        }
        if ('Teapot' === this.state.contentItemName) {
            contentItem = <Teapot />;
        }
        if ('Bugatti' === this.state.contentItemName) {
            contentItem = <Bugatti />;
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