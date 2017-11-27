'use strict';

const React = require('react');

import WebGLContentItem from './webglcontentitem';
import HomeContent from './content/scripts/homecontent';

export default class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className='panel panel-default'>
                <div className='panel-heading'>Home Page</div>
                    <div className='panel-body'>
                        <WebGLContentItem script={HomeContent} displayBackButton={false} />
                </div>
            </div>
        );
    }
}