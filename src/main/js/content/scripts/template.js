'use strict';

const ShauGL = require('../../shaugl3D'); //general 3D utils
const ShauRMGL = require('../../shaurmgl'); //raymarching utils

var glm = require('gl-matrix');

export function getTitle() {
    return undefined;
}

export function getDescription() {
    var description = "Description.";
    return description;
}

export function getSnapshotImage() {

}

export function initGLContent(gl) {

}

export function loadGLContent(gl, content) {
    //do nothing
    return new Promise(resolve => {
        resolve(content);
    });
}

export function renderGLContent(gl, content, dt) {

}