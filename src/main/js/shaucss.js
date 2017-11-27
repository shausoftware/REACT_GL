'use strict';

const logo = require('./static/images/wabbit.png');

function pageCss(rgb) {

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
    css += '.navbar-default {color:white!important; background-color:black!important; border-color:black!important; height: 74px;}';
    css += '.navbar-default .navbar-nav > li > a {color:#777;}';
    css += '.navbar-default .navbar-nav > li > a.shau-home:hover,.navbar-default .navbar-nav > li > a.shau-home:focus {color:#FF0000;}';
    css += '.navbar-default .navbar-nav > li > a.shau-experiments:hover,.navbar-default .navbar-nav > li > a.shau-experiments:focus {color:#00FF00;}';
    css += '.navbar-default .navbar-nav > li > a.shau-links:hover,.navbar-default .navbar-nav > li > a.shau-links:focus {color:#0000FF;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-home {background: black; color: #FF0000;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-home:hover {background: black; color: #FF0000;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-experiments {background: black; color: #00FF00;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-experiments:hover {background: black; color: #00FF00;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-links {background: black; color: #0000FF;}';
    css += '.navbar-default .navbar-nav > li.active > a.shau-links:hover {background: black; color: #0000FF;}';
    css += '.navbar-default {padding: 0;}';
    css += '.navbar-default .navbar-nav > li > a,';
    css += '.navbar-brand {padding-top: 0; padding-bottom: 0; line-height: 74px;}';
    css += '.navbar-form {margin-top: 24px;}';
    css += '.panel {border-color:' + colour + '!important;}';
    css += '.panel-heading {background-color:' + darkColour + '!important; color:' + textColour + '!important; border-color:' + colour + '!important;}';
    css += '.panel-body {background-color:black!important; color:' + textColour + '!important;}';
    css += '.pagination > li > a {background:black; color:' + textColour + '; border-color:' + colour + ';}';
    css += '.pagination > li > a:focus {background:black; color:' + textColour + '; border-color:' + colour + ';}';
    css += '.pagination > li > a:hover {background:white; color:' + darkColour + '; border-color:' + colour + ';}';
    css += '.shauwebplayer {background-color:black; width:904px; height:603px; font-size:16px; text-align:center; border:2px solid ' + colour + '; margin-left:auto; margin-right:auto;}';
    css += '.thumbnail {background-color: black; border-color:' + colour + ';}';
    css += '.thumbnail .caption {color: ' + textColour + ';}';
    css += '.btn.btn-primary {background-color: black; border-color:' + colour + '; color: ' + colour + ';}';
    
    var sheet = document.createElement('style');
    sheet.innerHTML = css;
    document.body.appendChild(sheet);
};

function setLogoColour(ctx, rgb) {

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

module.exports = {
    pageCss: pageCss,
    setLogoColour: setLogoColour
};