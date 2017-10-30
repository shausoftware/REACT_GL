'use strict';

const React = require('react');
const unityForm = require('./static/Form3D_Release_1_2.unity3d');

export default class ShauForm extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        
        var config = {
            width : 900,
            height : 600,
            params : {
                enableDebugging : "0"
            }
        };

        var u = new UnityObject2(config);
        u.observeProgress(function(progress) {
            var $missingScreen = jQuery(progress.targetEl).find(".missing");
            switch (progress.pluginStatus) {
            case "unsupported":
                break;
            case "broken":
                break;
            case "missing":
                $missingScreen.find("a").click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    u.installPlugin();
                    return false;
                });
                $missingScreen.show();
                break;
            case "installed":
                $missingScreen.remove();
                break;
            case "first":
                break;
            }
        });

        u.initPlugin(jQuery("#unityPlayer")[0], unityForm);
    }

    render() {
        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Form 3D</div>
                <div className='panel-body'>
                    <p className='text-center'>
                        Form was an old DOS genetic, generative art application created by Andrew Rowbottom 
                        that I found fascinating. I always wanted to create something that mimicked 
                        the behaviour of his application so I had a go with Unity. For help on interaction 
                        and configuration press the 'h' key. This was my first 
                        and so far only experiment with Unity and it was most enjoyable though
                        I pretty much done everything the manual said not to do and the code smells
                        a bit of Java (forgot about C# syntax when doing this).  
                    </p>
                    <div className='shauwebplayer'>

                        <div id='unityPlayer'>
                            <div className='missing'>
                                <a href='http://unity3d.com/webplayer/' title='Unity Web Player. Install now!'>
                                     <img alt='Unity Web Player. Install now!' src='http://webplayer.unity3d.com/installation/getunity.png' width='193' height='63' />
                                </a>
                            </div>
                        </div>

                    </div>    
                </div>
            </div>
        );
    }
}