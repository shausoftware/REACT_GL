'use strict';

const React = require('react');

export default class WebGLContentList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {contentItems: this.props.contentItems};
        this.openContentItem = this.openContentItem.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({contentItems: nextProps.contentItems});
    }

    openContentItem(e) {
        e.preventDefault();
        this.props.openContentItem(e.target.name);
    }

    render() {
        
        var cis = [];
        for (var i = 0; i < this.state.contentItems.length; i++) {
            var ci = this.state.contentItems[i];
            cis.push(<div key={ci.getTitle()} className="col-sm-6 col-md-4">
                         <div>
                             <img className="img-thumbnail" src={ci.getSnapshotImage()} alt={ci.getTitle()} />
                             <div className="caption">
                                 <h3>{ci.getTitle()}</h3>
                                 <p>{ci.getDescription()}</p>
                                 <p>
                                     <a href="#" 
                                        name={ci.getTitle()} onClick={this.openContentItem} className="btn btn-primary" role="button">View</a> 
                                 </p> 
                             </div>
                         </div>
                     </div>);
        }
        
        return(
            <div className='panel-body'>
                <div className="row">
                    {cis}
                </div>
            </div>
        );
    }
}