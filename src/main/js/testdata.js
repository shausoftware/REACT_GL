'use strict';

const link1 = {
    title: 'Source Code',
    description: "The source code to this site and a few other projects I'm working on can be found in my Github repository.",
    href: 'https://github.com/shausoftware'
};

const link2 = {
    title: 'Noisy Stuff',
    description: 'I also have a Soundcloud page with some of my sonic experiments.',
    href: 'https://soundcloud.com/countzerointerupt'
};

const link3 = {
    title: 'Inigo Quilez',
    description: 'A treasure trove of articles on graphics programming for all skill levels.',
    href: 'http://www.iquilezles.org/index.html'
};

const link4 = {
    title: 'Paul Bourke',
    description: 'All sorts of interesting stuff to be found here. Not just graphics.',
    href: 'http://www.paulbourke.net'
};

const link5 = {
    title: 'Shadertoy',
    description: 'The awesome Fragment shader community setup by Inigo Quilez.',
    href: 'http://www.shadertoy.com'
};

const link6 = {
    title: 'Beeple',
    description: 'Just come across this guy. The art is amazing.',
    href: 'http://www.beeple-crap.com'
};

const link7 = {
    title: 'Pouet',
    description: 'Demoscene is also new to me though I do remember the old Cracktros.',
    href: 'http://www.pouet.net'
};

function loadPg1LinksFromServer() {
    return [link1, link2, link3];
};

function loadPg2LinksFromServer() {
    return [link4, link5, link6];
};

function loadPg3LinksFromServer() {
    return [link7];
};


module.exports = {
    loadPg1LinksFromServer: loadPg1LinksFromServer,
    loadPg2LinksFromServer: loadPg2LinksFromServer,
    loadPg3LinksFromServer: loadPg3LinksFromServer
};