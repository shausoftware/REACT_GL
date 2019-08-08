'use strict';

const React = require('react');
import * as ShauCss from './shaucss';

export default class ShauNavBar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {currentPage: this.props.currentPage, rgb: this.props.rgb};
        this.handleChangePage = this.handleChangePage.bind(this);
    }

    componentDidMount() {
        var ctx = this.refs.shauLogo.getContext('2d');
        ShauCss.setLogoColour(ctx, this.state.rgb);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({currentPage: nextProps.currentPage, rgb: nextProps.rgb});
        var ctx = this.refs.shauLogo.getContext('2d');
        ShauCss.setLogoColour(ctx, this.state.rgb);
    }

    handleChangePage(e) {
        e.preventDefault();
        this.props.handleChangePage(e.target.name);
    }

    render() {

        return(
            <div className='navbar navbar-expand-lg shnavbar'>
                <a className='navbar-brand' href='#'>
                    <canvas ref='shauLogo' width='271' height='70' title='Logo generated from one of my old pen and ink drawings'></canvas>
                </a>                     

                <div className='collapse navbar-collapse' id='bs-example-navbar-collapse-1'>
                    <ul className='navbar-nav'>
                        <li className='nav-item'>
                            <a className='nav-link' href='#' name='PAGE_HOME' onClick={this.handleChangePage}>Home</a>
                        </li>
                        <li className='nav-item'>
                            <a className='nav-link' href='#' name='PAGE_EXPERIMENTS' onClick={this.handleChangePage}>WebGL Experiments</a>
                        </li>
                        <li className='nav-item'>
                            <a className='nav-link' href='#' name='PAGE_LINKS' onClick={this.handleChangePage}>Links</a>
                        </li>
                    </ul>
                </div>                  
            </div>
        );
    }
}
