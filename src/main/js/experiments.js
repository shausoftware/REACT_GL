'use strict';

const React = require('react');
const ApiUtils = require('./apiutils');

import Pagination from './pagination'; 
import WebGLContentList from './webglcontentlist';
import WebGLContentItem from './webglcontentitem';

/* WebGL experiments */

export default class Exports extends React.Component {

    constructor(props) {
        super(props);
        this.state = {currentPage: 'LIST', 
                      contentItems: [], 
                      contentItem: undefined,
                      links: {},
                      pageSize: 3};
        this.onNavigate = this.onNavigate.bind(this);
        this.comeBack = this.comeBack.bind(this);
        this.openContentItem = this.openContentItem.bind(this);
    }

    componentDidMount() {
        this.loadContentItemsFromServer();
    }

    loadContentItemsFromServer() {
        var entity = ApiUtils.loadContentItemsFromServer(3);
        this.setState({contentItems: entity._embedded.contentItems, links: entity._links});
    }

    onNavigate(navUri) {
        var entity = ApiUtils.onContentItemsNavigate(navUri);
        this.setState({contentItems: entity._embedded.contentItems, links: entity._links});
    }

    comeBack() {
        this.setState({currentPage: 'LIST'});
    }

    openContentItem(contentTitle) {
        for (var i = 0; i < this.state.contentItems.length; i++) {
            var ci = this.state.contentItems[i];
            if (ci.getTitle() === contentTitle) {
                this.setState({contentItem: ci, currentPage: 'ITEM'});
            }
        }
    }

    render() {

        var pagination = undefined;
        var displayItem = undefined;
        if ('LIST' === this.state.currentPage) {
            displayItem = <WebGLContentList contentItems={this.state.contentItems} openContentItem={this.openContentItem}/>;
            pagination = <div className='text-center'>
                             <Pagination links={this.state.links} onNavigate={this.onNavigate} />
                         </div>;
        } else if ('ITEM' === this.state.currentPage) {
            displayItem = <WebGLContentItem script={this.state.contentItem} displayBackButton={true} goBack={this.comeBack}/>;
        }

        return(
            <div className='panel'>
                <div className='panel-heading'><h4>WebGL Experiments</h4></div>
                <div className='panel-body'>
                    {pagination}
                    {displayItem}        
                </div>
            </div>
        );
    }
}