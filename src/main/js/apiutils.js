'use strict';

import TestData from './testdata';

function loadLinksFromServer(pageSize) {

    var pageLinks = {first: {href: 'first'},
                 next: {href: 'next'},
                 last: {href: 'last'}};

    var results = {_embedded: {shauUsers: TestData.loadPg1LinksFromServer()}, _links: pageLinks};

    return new Promise(resolve => {
        process.nextTick(resolve(results));
    });
};

function onLinksNavigate(navUri) {

    //first and previous
    var shauLinks = TestData.loadPg1LinksFromServer();
    var pagelinks = {first: {href: 'first'},
                 next: {href: 'next'},
                 last: {href: 'last'}};

    //last and next
    if (navUri === 'last' || navUri === 'next') {
        shauLinks = TestData.loadPg2LinksFromServer();
        pageLinks = {first: {href: 'first'},
                 next: {href: 'previous'},
                 last: {href: 'last'}};
    }

    var results = {_embedded: {shauLinks}, _links: pagelinks};

    return new Promise(resolve => {
        process.nextTick(resolve(results));
    });
};

module.exports = {
    loadLinksFromServer: loadLinksFromServer,
    onLinksNavigate: onLinksNavigate
};