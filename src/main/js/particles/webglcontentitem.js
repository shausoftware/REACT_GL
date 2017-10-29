'use strict';

const React = require('react');

import TestShader from './testshader';
import InitialAttempt from './initialattempt';

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
        
        if (this.state.contentItemName === 'TestShader') {
            contentItem = <TestShader />;
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