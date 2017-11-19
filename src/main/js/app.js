'use sctrict';

const React = require('react');

require('bootstrap-loader');

import ShauNavBar from './shaunavbar';
import Home from './home';
import TestPage from './testpage';
import Raymarching from './raymarching/raymarching';
import Experiments from './experiments/experiments';
import ShauForm from './shauform';
import ShauLinks from './shaulinks';
import ShauCss from './shaucss';

const TEST_MODE = false;

export default class App extends React.Component {
	
	constructor(props) {
		super(props);
		this.state = {currentPage: 'PAGE_HOME'};
        this.handleChangePage = this.handleChangePage.bind(this);
	}
	
    componentDidMount() {
		var script = document.createElement('script');
        script.src = 'http://webplayer.unity3d.com/download_webplayer-3.x/3.0/uo/UnityObject2.js';
        document.body.appendChild(script);
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
		if ('PAGE_RAYMARCHING' === this.state.currentPage) {
			content = <Raymarching />;
			rgb = [0, 255, 0]; //yellow
		}
		if ('PAGE_EXPERIMENTS' === this.state.currentPage) {
			content = <Experiments />;
			rgb = [0, 0, 255]; //blue
		}
		if ('PAGE_SHAUFORM' === this.state.currentPage) {
			content = <ShauForm />
			rgb = [255, 0, 255]; //purple
		}
		if ('PAGE_LINKS' === this.state.currentPage) {
			content = <ShauLinks />;
			rgb = [255, 255, 255]; //white
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