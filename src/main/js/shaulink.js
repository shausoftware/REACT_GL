'use strict';

const React = require('react');

export default class ShauLink extends React.Component {

    constructor(props) {
        super(props);
        this.state = {title: this.props.title, 
                      description: this.props.description, 
                      href: this.props.href};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({title: nextProps.title,
                       description: nextProps.description,
                       href: nextProps.href});
    }

    render() {

        return (
            <tr>
                <td> 
                    <p className='text-center'>
                        {this.state.title}
                    </p>
                    <p className='text-center'>
                        {this.state.description}
                    </p>
                    <p className='text-center'>
                        <a href={this.state.href}>{this.state.href}</a>                        
                    </p>                    
                </td>
            </tr>
        );
    }
}