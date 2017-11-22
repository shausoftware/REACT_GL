'use strict';

const React = require('react');

import WebGLContentList1 from './webglcontentlist1';
import WebGLContentList2 from './webglcontentlist2';
import WebGLContentItem from './webglcontentitem';
import Pagination from '../pagination';

export default class Experiments extends React.Component {

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
        var pagination = {
            first: {href: 'CONTENT_LIST_1'},
            next: {href: 'CONTENT_LIST_2'},
            last:  {href: 'CONTENT_LIST_2'}                 
        };

        if (this.state.currentView === 'CONTENT_LIST_2') {
            viewItem = <WebGLContentList2 handleViewContentItem={this.handleViewContentItem} />;
            pagination = {
                first: {href: 'CONTENT_LIST_1'},
                prev: {href: 'CONTENT_LIST_1'},
                last:  {href: 'CONTENT_LIST_2'}                 
            };
        } else if (this.state.currentView === 'CONTENT_ITEM') {
            viewItem = <WebGLContentItem contentItemName={this.state.contentItemName} onNavigate={this.onNavigate} />;
            pagination = {};
        }

        return (
            <div className='panel panel-default'>
            <div className='panel-heading'>Experiments</div>
                <div className='panel-body'>
                    <p className='text-center'>
                        General WebGL experiments.  
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