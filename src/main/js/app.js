'use sctrict';

const React = require('react');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import ShauNavBar from './shaunavbar';

import WebGLContentItem from './webglcontentitem';
import HomeContent from './content/scripts/homecontent';

import * as ShauCss from './shaucss';

import Home from './home';
import Experiments from './experiments';
import ShauLinks from './shaulinks';

import TestPage from './testpage';

const TEST_MODE = false;

/* Main React Component */

export default class App extends React.Component {
	
	constructor(props) {
		super(props);
		this.state = {currentPage: 'PAGE_HOME'};
        this.handleChangePage = this.handleChangePage.bind(this);
	}

	handleChangePage(pageName) {
		this.setState({currentPage: pageName});
	}
	
	render() {

		var content = <Home />;
		var rgb = [255, 0, 0]; //red
		
		if (TEST_MODE) {
			content = <TestPage />
		} 
		if ('PAGE_EXPERIMENTS' === this.state.currentPage) {
			content = <Experiments />;
			rgb = [0, 255, 0]; //green
		}
		if ('PAGE_LINKS' === this.state.currentPage) {
			content = <ShauLinks />;
			rgb = [0, 0, 255]; //blue
		}
		ShauCss.pageCss(rgb);	

		return(
		    <div> 
                <ShauNavBar key={this.state.currentPage} currentPage={this.state.currentPage} handleChangePage={this.handleChangePage} rgb={rgb} />
				{content}
		    </div>
		);
	}
}