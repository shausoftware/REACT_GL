'use strict';

import SiteData from './sitedata';

/* Psuedo mock of back end */

function loadContentItemsFromServer(pageSize) {
    return SiteData.loadContentItemsForPage('first');
}

function onContentItemsNavigate(navUri) {
    return SiteData.loadContentItemsForPage(navUri);
}

function loadLinksFromServer(pageSize) {
    return SiteData.loadLinkItemsForPage('first');
};

function onLinksNavigate(navUri) {
    return SiteData.loadLinkItemsForPage(navUri);
};

module.exports = {
    loadContentItemsFromServer: loadContentItemsFromServer,
    onContentItemsNavigate: onContentItemsNavigate,
    loadLinksFromServer: loadLinksFromServer,
    onLinksNavigate: onLinksNavigate
};