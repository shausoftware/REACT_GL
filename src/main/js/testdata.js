'use strict';

const link1 = {
    title: 'Link 1',
    description: 'This is the description for link 1',
    href: 'http://www.shadertoy.com'
};

const link2 = {
    title: 'Link 2',
    description: 'This is the description for link 2',
    href: 'http://www.shaustuff.com'
};

const link3 = {
    title: 'Link 3',
    description: 'This is the description for link 3',
    href: 'http://www.google.com'
};

function loadPg1LinksFromServer() {
    return [link1, link2];
};

function loadPg2LinksFromServer() {
    return [link3];
};

module.exports = {
    loadPg1LinksFromServer: loadPg1LinksFromServer,
    loadPg2LinksFromServer: loadPg2LinksFromServer
};