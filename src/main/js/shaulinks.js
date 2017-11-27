'use strict';

const React = require('react');
import ApiUtils from './apiutils';
import ShauLink from './shaulink';
import Pagination from './pagination';

export default class ShauLinks extends React.Component {

    constructor(props) {
        super(props);
        this.state = {shauLinks: [], pageSize: 3, links: []};
        this.onNavigate = this.onNavigate.bind(this);
    }

    componentDidMount() {
        this.loadShauLinksFromServer(this.state.pageSize);
    }

    loadShauLinksFromServer(pageSize) {
        /*
        ApiUtils.loadLinksFromServer(pageSize).then(entity => {
            this.setState({shauLinks: entity._embedded.shauLinks,
                           pageSize: this.state.pageSize,
                           links: entity._links});
        });
        */
        var entity = ApiUtils.loadLinksFromServer(3);
        this.setState({shauLinks: entity._embedded.shauLinks,
                       pageSize: this.state.pageSize,
                       links: entity._links});
    }

    onNavigate(navUri) {
        /*
        ApiUtils.onLinksNavigate(navUri).then(entity => {
            this.setState({shauLinks: entity._embedded.shauLinks,
                           pageSize: this.state.pageSize,
                           links: entity._links}); 
        });
        */
        var entity = ApiUtils.onLinksNavigate(navUri);
        this.setState({shauLinks: entity._embedded.shauLinks,
                       pageSize: this.state.pageSize,
                       links: entity._links}); 
    }

    render() {

        var linkItems = [];
        for (var i = 0; i < this.state.shauLinks.length; i++) {
            var shauLink = this.state.shauLinks[i];
            linkItems.push(<ShauLink key={shauLink.title} 
                                     title={shauLink.title} 
                                     description={shauLink.description}
                                     href={shauLink.href}/>);            
        }

        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Links Page</div>
                <div className='panel-body'>
                    <p className='text-center'>
                        and finally some links to stuff that I find interesting and useful.
                    </p>
                    <table className='table'>
                        <tbody>
                            {linkItems}
                        </tbody>
                    </table>
                    <Pagination links={this.state.links} onNavigate={this.onNavigate} />
                </div>
            </div>
        );
    }
}