import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import StartView from './StartView';
import ObjectChoiceView from "./ObjectChoice/ObjectChoiceView";
import MatchingView from "./Matching/MatchingView";
import 'antd/dist/antd.compact.css';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './index.css';

/**
 * Main component, which routes to different webpages.
 */
class App extends React.Component{
    /**
     * Routes to {@link StartView}, {@link ObjectChoiceView} and {@link MatchingView}.
     */
    render(){
        return(
            <div>
                <BrowserRouter>
                    <Switch>
                        <Route exact path={'/'} component={StartView}/>
                        <Route exact path={'/ObjectChoiceView'} component={ObjectChoiceView}/>
                        <Route exact path={'/MatchingView/:left/:right'} component={MatchingView}/>
                    </Switch>
                </BrowserRouter>
            </div>
        );
    }
}

ReactDOM.render(
    <App/>
    , document.getElementById('root'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
