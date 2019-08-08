'use strict';

import * as LittleCubesContent from './content/scripts/littlecubescontent';
import * as IronManContent from './content/scripts/ironmancontent';
import * as BitsweepContent from './content/scripts/bitsweepcontent';
import * as BugattiContent from './content/scripts/bugatticontent';
import * as DiscoWallContent from './content/scripts/discowallcontent';
import * as ParticleContent from './content/scripts/particlecontent';
import * as VoxelBridgeContent from './content/scripts/voxelbridgecontent';
import * as MobiusSphereContent from './content/scripts/mobiusspherecontent';
import * as GreenCycleContent from './content/scripts/greencyclecontent';

const link1 = {title: 'Source Code',
               description: "The source code to this site, the OBJ model loading toolchain and a few other projects I'm working on can be found in my Github repository.",
               href: 'https://github.com/shausoftware'};
const link2 = {title: 'Noisy Stuff',
               description: 'I also have a Soundcloud page with some of my sonic experiments.',
               href: 'https://soundcloud.com/countzerointerupt'};
const link3 = {title: 'Inigo Quilez',
               description: 'A treasure trove of articles on graphics programming for all skill levels.',
               href: 'http://www.iquilezles.org/index.html'};
const link4 = {title: 'Paul Bourke',
               description: 'All sorts of interesting stuff to be found here, not just graphics.',
               href: 'http://www.paulbourke.net'};
const link5 = {title: 'Shadertoy',
               description: 'The awesome fragment shader community setup by Inigo Quilez.',
               href: 'http://www.shadertoy.com'};
const link6 = {title: 'Beeple',
               description: 'The art is amazing and he has an interesting work ethic.',
               href: 'http://www.beeple-crap.com'};
const link7 = {title: 'Pouet',
               description: 'Demoscene is quite new to me though I do remember the old Cracktros. Be warned it does get weird.',
               href: 'http://www.pouet.net'};

var contentItemsCurrentPage = 1;
var linkItemsCurrentPage = 1;
const CI_PAGES = 3;
const LI_PAGES = 3;               

/* Psuedo mock of back end - orignal implementation had web back end */

function loadContentItemsForPage(navUri) {

    var contentItems = [];
    var pageLinks = {first: {href: 'first'},
                     next: {href: 'next'},
                     last: {href: 'last'}};
    
    if ('first' === navUri) {
        //PAGE 1
        contentItemsCurrentPage = 1;
        contentItems.push(LittleCubesContent);
        contentItems.push(GreenCycleContent);
        contentItems.push(IronManContent);
    } 
    
    if ('prev' === navUri) {
        if (contentItemsCurrentPage > 1) {
            contentItemsCurrentPage--;
        }
        if (contentItemsCurrentPage === 1) {
            //page 1
            contentItems.push(LittleCubesContent);
            contentItems.push(GreenCycleContent);        
            contentItems.push(IronManContent);
        } else {

            //page 2 - only three pages at the moment
            contentItems.push(BitsweepContent);
            contentItems.push(MobiusSphereContent);
            contentItems.push(ParticleContent);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }

    if ('next' === navUri) {
        if (contentItemsCurrentPage < CI_PAGES) {
            contentItemsCurrentPage++;
        }
        if (contentItemsCurrentPage === CI_PAGES) {
            //page 3
            contentItems.push(BugattiContent);            
            contentItems.push(DiscoWallContent);
            contentItems.push(VoxelBridgeContent);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         last: {href: 'last'}};
        } else {
            //page 2 - only three pages at the moment
            contentItems.push(BitsweepContent);
            contentItems.push(MobiusSphereContent);
            contentItems.push(ParticleContent);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }

    if ('last' === navUri) {
        //page 3
        contentItemsCurrentPage = CI_PAGES;        
        contentItems.push(BugattiContent);            
        contentItems.push(DiscoWallContent);
        contentItems.push(VoxelBridgeContent);    
        pageLinks = {first: {href: 'first'},
                     prev: {href: 'prev'},
                     last: {href: 'last'}};
    }

    return {_embedded: {contentItems: contentItems}, _links: pageLinks};
}

function loadLinkItemsForPage(navUri) {
    
    var linkItems = [];
    var pageLinks = {first: {href: 'first'},
                        next: {href: 'next'},
                        last: {href: 'last'}};

    if ('first' === navUri) {
        linkItemsCurrentPage = 1;
        linkItems.push(link1);
        linkItems.push(link2);
        linkItems.push(link3);
    } 

    if ('prev' === navUri) {
        if (linkItemsCurrentPage > 1) {
            linkItemsCurrentPage--;
        }
        if (linkItemsCurrentPage === 1) {
            //page 1
            linkItems.push(link1);
            linkItems.push(link2);
            linkItems.push(link3);
        } else {
            //page 2 - only three pages at the moment
            linkItems.push(link4);
            linkItems.push(link5);
            linkItems.push(link6);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }

    if ('next' === navUri) {
        if (linkItemsCurrentPage < LI_PAGES) {
            linkItemsCurrentPage++;
        }
        if (linkItemsCurrentPage === LI_PAGES) {
            //page 3
            linkItems.push(link7);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         last: {href: 'last'}};
        } else {
            //page 2 - only three pages at the moment
            linkItems.push(link4);
            linkItems.push(link5);
            linkItems.push(link6);
            pageLinks = {first: {href: 'first'},
                         prev: {href: 'prev'},
                         next: {href: 'next'},
                         last: {href: 'last'}};
        }
    }    

    if ('last' === navUri) {
        linkItemsCurrentPage = LI_PAGES;        
        linkItems.push(link7);
        pageLinks = {first: {href: 'first'},
                     prev: {href: 'prev'},
                     last: {href: 'last'}};
    }  
    
    return {_embedded: {shauLinks: linkItems}, _links: pageLinks};
}

//public scope 

export function loadContentItemsFromServer(pageSize) {
    return loadContentItemsForPage('first');
}

export function onContentItemsNavigate(navUri) {
    return loadContentItemsForPage(navUri);
}

export function loadLinksFromServer(pageSize) {
    return loadLinkItemsForPage('first');
};

export function onLinksNavigate(navUri) {
    return loadLinkItemsForPage(navUri);
};