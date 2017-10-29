'use strict';

const React = require('react');

export default class Pagination extends React.Component {
	
	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
	}
	
	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}
	
	render() {
		
		var navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<li key="first"><a onClick={this.handleNavFirst} href="#">&lt;&lt;</a></li>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<li key="prev"><a onClick={this.handleNavPrev} href="#">&lt;</a></li>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<li key="next"><a onClick={this.handleNavNext} href="#">&gt;</a></li>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<li key="last"><a onClick={this.handleNavLast} href="#">&gt;&gt;</a></li>);
		}
		
		return (
		    <nav aria-label="Page navigation">
		        <ul className="pagination">
		            {navLinks}
		        </ul>
		    </nav>
		)
	}
}
