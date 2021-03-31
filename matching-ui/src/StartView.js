import React from 'react';
import {Link} from "react-router-dom";
import ScriptTag from 'react-script-tag';

/**
 * Webpage, where you can start a matching.
 * Linked to {@link ObjectChoiceView}.
 */
class StartView extends React.Component{
    /**
     * Contains a button, which leads to {@link ObjectChoiceView}.
     */
    render() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const buttonStyle = {
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            height: screenHeight*0.05,
            width: screenWidth*0.1,
            fontSize: 20,
            color: "black",
        }

        return(
            <div>
                <Link to={'/ObjectChoiceView'}><button style={buttonStyle}>Start Matching</button></Link>
                <ScriptTag type="text/javascript" src="/Credits.js"/>
            </div>
        );
    }
}

export default StartView;