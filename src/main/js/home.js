'use strict';

const React = require('react');

import WebGLContentItem from './webglcontentitem';
import * as HomeContent from './content/scripts/homecontent';

export default class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className='panel'>
                <div className='panel-heading'><h4>Home Page</h4></div>
                <div className='panel-body'>
                        <WebGLContentItem script={HomeContent} displayBackButton={false} />
                </div>
            </div>
        );
    }
}