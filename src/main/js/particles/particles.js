'use strict';

const React = require('react');

import WebGLContentList1 from './webglcontentlist1';
import WebGLContentItem from './webglcontentitem';
import Pagination from '../pagination';

export default class Particles extends React.Component {

    constructor(props) {
        super(props);
        this.state = {currentView: 'CONTENT_LIST_1', contentItemName: undefined};
        this.handleViewContentItem = this.handleViewContentItem.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    onNavigate(navUri) {
        this.setState({currentView: navUri});
    }

    handleViewContentItem(contentItemName) {
        this.setState({currentView: 'CONTENT_ITEM', contentItemName: contentItemName});
    }
  
    render() {

        var viewItem = <WebGLContentList1 handleViewContentItem={this.handleViewContentItem} />;
        var pagination = [];
        
        if (this.state.currentView === 'CONTENT_ITEM') {
            viewItem = <WebGLContentItem contentItemName={this.state.contentItemName} onNavigate={this.onNavigate} />;
        }

        return (
            <div className='panel panel-default'>
            <div className='panel-heading'>Particle Systems</div>
                <div className='panel-body'>
                    <p className='text-center'>
                        I love some of the things you can do by modelling with particle systems and I've 
                        wanted to build one for a long time. 
                    </p>

                    <div className='text-center'>
                        <Pagination links={pagination} onNavigate={this.onNavigate} />
                    </div>

                    {viewItem}

                </div>
            </div>
        );
    }
}