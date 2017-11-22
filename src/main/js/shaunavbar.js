'use strict';

const React = require('react');
import ShauCss from './shaucss';

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
            <div className='navbar navbar-default'>
                <div className='container-fluid'>
                    <div className='navbar-header'>
                        <button type='button' className='navbar-toggle collapsed' 
                                              data-toggle='collapse' 
                                              data-target='#bs-example-navbar-collapse-1' 
                                              aria-expanded='false'>

                            <span className='sr-only'>Toggle navigation</span>
                            <span className='icon-bar'></span>
                            <span className='icon-bar'></span>
                            <span className='icon-bar'></span>                        
                        </button> 
                        <a className='navbar-brand' href='#'>
                            <canvas ref='shauLogo' width='271' height='70'></canvas>
                        </a>                     
                    </div>

                    <div className='collapse navbar-collapse' id='bs-example-navbar-collapse-1'>
                        <ul className='nav navbar-nav'>
                            <li className={'PAGE_HOME' === this.state.currentPage ? 'active' : undefined}>
                                <a className='shau-home' href='#' name='PAGE_HOME' onClick={this.handleChangePage}>Home</a>
                            </li>
                            <li className={'PAGE_EXPERIMENTS' === this.state.currentPage ? 'active' : undefined}>
                                <a className='shau-experiments' href='#' name='PAGE_EXPERIMENTS' onClick={this.handleChangePage}>Experiments</a>
                            </li>
                            <li className={'PAGE_RAYMARCHING' === this.state.currentPage ? 'active' : undefined}>
                                <a className='shau-raymarching' href='#' name='PAGE_RAYMARCHING' onClick={this.handleChangePage} >Raymarching and Raytracers</a>
                            </li>
                            <li className={'PAGE_SHAUFORM' === this.state.currentPage ? 'active' : undefined}>
                                <a className='shau-form' href='#' name='PAGE_SHAUFORM' onClick={this.handleChangePage}>Form 3D</a>
                            </li>
                            <li className={'PAGE_LINKS' === this.state.currentPage ? 'active' : undefined}>
                                <a className='shau-links' href='#' name='PAGE_LINKS' onClick={this.handleChangePage}>Links</a>
                            </li>
                        </ul>
                    </div>                  
                </div>
            </div>
        );
    }
}
