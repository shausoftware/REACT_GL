'use strict';

import TestData from './testdata';

const PAGES = 3;
var currentPage = 1;

/* Psuedo mock of back end */

function loadLinksFromServer(pageSize) {

    currentPage = 1;

    var pageLinks = {first: {href: 'first'},
                 next: {href: 'next'},
                 last: {href: 'last'}};

    var results = {_embedded: {shauLinks: TestData.loadPg1LinksFromServer()}, _links: pageLinks};

    return new Promise(resolve => {
        process.nextTick(resolve(results));
    });
};

function onLinksNavigate(navUri) {

    //first
    var shauLinks = TestData.loadPg1LinksFromServer();
    var pageLinks = {first: {href: 'first'},
                     next: {href: 'next'},
                     last: {href: 'last'}};
    
    if ('first' === navUri) {
        currentPage = 1;
    }

    if ('next' === navUri) {
        if (currentPage < PAGES) {
            currentPage++;
        }
        if (currentPage === PAGES) {
            shauLinks = TestData.loadPg3LinksFromServer();
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         last: {href: 'last'}};
        } else {
            shauLinks = TestData.loadPg2LinksFromServer();
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }
    
    if ('prev' === navUri) {
        if (currentPage > 1) {
            currentPage--;
        }
        if (currentPage === 1) {
            //do nothing already setup
        } else {
            shauLinks = TestData.loadPg2LinksFromServer();
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }

    if ('last' === navUri) {
        currentPage = PAGES;        
        shauLinks = TestData.loadPg3LinksFromServer();
        pageLinks = {first: {href: 'first'},
                 prev: {href: 'prev'},
                 last: {href: 'last'}};
    }

    var results = {_embedded: {shauLinks: shauLinks}, _links: pageLinks};

    return new Promise(resolve => {
        process.nextTick(resolve(results));
    });
};

module.exports = {
    loadLinksFromServer: loadLinksFromServer,
    onLinksNavigate: onLinksNavigate
};