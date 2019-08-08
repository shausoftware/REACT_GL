'use strict';

const logo = require('./static/images/wabbit.png');

/* Dynamic CSS */

export function pageCss(rgb) {

    var red = rgb[0];
    var textRed = red > 0 ? 255 : 204;
    var darkRed = red > 0 ? 48 : 0;
    var green = rgb[1];
    var textGreen = green > 0 ? 255 : 204;
    var darkGreen = green > 0 ? 48 : 0;
    var blue = rgb[2];
    var textBlue = blue > 0 ? 255 : 204;
    var darkBlue = blue > 0 ? 48 : 0;

    var colour = 'rgb(' + red + ',' + green + ',' + blue +')';
    var textColour = 'rgb(' + textRed + ',' + textGreen + ',' + textBlue +')';
    var darkColour = 'rgb(' + darkRed + ',' + darkGreen + ',' + darkBlue +')';
    
    var css = 'body {background-color: black; color: ' + colour + ';}';
    css += '.table td {border-top: none !important;}';
    css += '.linktext {color: ' + textColour + ';}';
    css += '.shnavbar {background-color: black; height: 74px;}';
    css += '.shnavbar .navbar-nav > li > a {color: ' + textColour + ';}';
    css += '.shnavbar .navbar-nav > li > a:hover {color: ' + colour + ';}';
    css += '.shnavbar .navbar-nav > li.active {background-color: ' + darkColour + ';}';
    css += '.panel {border-color:' + colour + '!important;}';
    css += '.panel-heading {background-color:' + darkColour + '!important; color:' + textColour + '!important; border-color:' + colour + '!important;}';
    css += '.panel-body {background-color:black!important; color:' + textColour + '!important;}';
    
    css += '.pagination > li {padding: 0.5em;}';
    css += '.pagination > li > a {background:black; color:' + textColour + '; border-color:' + colour + ';}';
    css += '.pagination > li > a:focus {background:black; color:' + textColour + '; border-color:' + colour + ';}';
    css += '.pagination > li > a:hover {background:white; color:' + darkColour + '; border-color:' + colour + ';}';
    css += '.shauwebplayer {background-color:black; width:904px; height:603px; font-size:16px; text-align:center; border:2px solid ' + colour + '; margin-left:auto; margin-right:auto;}';
    css += '.img-thumbnail {background-color: ' + colour + '; border-color:' + colour + ';}';
    css += '.btn.btn-primary {background-color: black; border-color:' + colour + '; color: ' + colour + ';}';
    
    var sheet = document.createElement('style');
    sheet.innerHTML = css;
    document.body.appendChild(sheet);
};

export function setLogoColour(ctx, rgb) {

    var shauLogoImg = new Image();
    var newRed = rgb[0] > 0 ? 255 : 204;
    var newGreen = rgb[1] > 0 ? 255 : 204;
    var newBlue = rgb[2] > 0 ? 255 : 204;

    shauLogoImg.onload = function() {
        ctx.drawImage(shauLogoImg, 0, 0, 271, 70);
        var shauLogoImgData = ctx.getImageData(0, 0, 271, 70);
        var dataLength = shauLogoImgData.data.length;
        for (var i = 0; i < dataLength; i += 4) {
            if (shauLogoImgData.data[i] > 140 && shauLogoImgData.data[i + 1] > 140 && shauLogoImgData.data[i + 2] > 140) {
                shauLogoImgData.data[i] = newRed;
                shauLogoImgData.data[i + 1] = newGreen;
                shauLogoImgData.data[i + 2] = newBlue;
            }
        }
        ctx.putImageData(shauLogoImgData, 0, 0);
    };
    
    shauLogoImg.src = logo;
};
