import React from 'react';
import Grid from "@material-ui/core/Grid";
import LeftTreeView from "./LeftTreeView";
import RightTreeView from "./RightTreeView";
import FilterComponent from "./FilterComponent";
import {AgGridReact} from "ag-grid-react";
import ScriptTag from "react-script-tag";

/**
 * Webpage, where you can select objects from APIs, which you want to match with each other.
 * Linked to {@link MatchingView}.
 */
class ObjectChoiceView extends React.Component{
    /**
     * {Object} leftTreeViewData contains processed API data in right format for showing in TreeView
     * {title: String, id: String} leftTreeInput contains the id and title of selected object in left TreeView
     * {title: String, id: String} rightTreeInput contains the id and title of selected object in right TreeView
     */
    constructor() {
        super();
        this.state = {
            leftTreeViewData: [], leftTreeViewFilterList: [],
            leftTreeInput: {title:"", id: ""}, rightTreeInput: {title:"", id: ""}
        };
        this.handleSelectedNodeRightTree = this.handleSelectedNodeRightTree.bind(this);
        this.handleSelectedNodeLeftTree = this.handleSelectedNodeLeftTree.bind(this);
        this.handleStartMatching = this.handleStartMatching.bind(this);
        this.handleFilterListChanged = this.handleFilterListChanged.bind(this);
    }

    /**
     * Event handler.
     * Sets {@link leftTreeInput} to selected item in left TreeView component in {@link LeftTreeView}.
     * Only does that for elements with no children.
     *
     * @param args information about selected node in left TreeView (including id and title of node)
     */
    handleSelectedNodeLeftTree(args){
        if(args.selectedNodes.length > 0 && args.selectedNodes[0].children.length === 0) {
            let selectedNode = args.selectedNodes[0];
            this.setState({leftTreeInput: {title: selectedNode.title, id: selectedNode.key}});
        }
        else {
            this.setState({leftTreeInput: {title: "", id: ""}});
        }
    }


    /**
     * Event handler.
     * Sets {@link rightTreeInput} to selected item in right TreeView component in {@link RightTreeView}.
     * Only does that for elements with type "equipment".
     *
     * @param args information about selected node in right TreeView (like id and title of node)
     */
    handleSelectedNodeRightTree(args){
        if(args.selectedNodes.length !== 0) {
            let selectedNode = args.selectedNodes[0];
            let type = undefined, title;
            const objectType = "equipment";
            const typeSeparator = ":";

            if (selectedNode.title.includes(typeSeparator)) {
                let splitTitle = selectedNode.title.replace(" ", "").split(typeSeparator);
                type = splitTitle[0];
                title = splitTitle[1].replace(typeSeparator, "");
            }

            if (type === objectType) {
                this.setState({rightTreeInput: {title: title, id: selectedNode.key}});
                return;
            }
        }
        this.setState({rightTreeInput: {title: "", id: ""}});
    }

    /**
     * Event handler.
     * Calls  {@link LeftTreeView.updateTreeViewContent}
     *
     * @param filterList containing the current filter from {@link FilterComponent}
     */
    handleFilterListChanged(filterList){
        this.leftTreeView.updateTreeViewContent(filterList).then();
    }

    /**
     * Event handler.
     * Links to {@link MatchingView} with current selection {@link leftTreeInput} and {@link rightTreeInput}.
     */
    handleStartMatching(){
        const matchingViewLink = '/MatchingView/' + this.state.leftTreeInput.id + '/' + this.state.rightTreeInput.id;

        this.props.history.push(matchingViewLink);
    }

    /**
     * While {@link leftTreeInput} and {@link rightTreeInput} are empty, button to next page is disabled.
     * Contains {@link FilterComponent}.
     * Contains {@link LeftTreeView}.
     * Contains Input for left TreeView, Input for right TreeView and Button to start matching.
     * Contains {@link RightTreeView}.
     */
    render() {
        const root = {
            flexGrow: 1,
            padding: 10,
            fontSize: "16px",
        }

        let leftOrRightTreeInputEmpty = this.state.leftTreeInput.title === "" || this.state.rightTreeInput.title === "";

        return(
            <div style={root}>
                <FilterComponent filterListChange={this.handleFilterListChanged}/>
                <br/>
                <Grid container spacing={1} alignItems={"center"}>
                    <Grid item xs={4}>
                        <LeftTreeView ref={ref => this.leftTreeView = ref} onSelection={this.handleSelectedNodeLeftTree}/>
                    </Grid>
                    <Grid item xs={"auto"}>
                        <input placeholder={"Pick object..."} readOnly={true} value={this.state.leftTreeInput.title}/>
                    </Grid>
                    <Grid item xs={"auto"}>
                        <button disabled={leftOrRightTreeInputEmpty} onClick={this.handleStartMatching}>Perform matching</button>
                    </Grid>
                    <Grid item xs={2}>
                        <input placeholder={"Pick object..."} readOnly={true} value={this.state.rightTreeInput.title}/>
                    </Grid>
                    <Grid item>
                        <RightTreeView onSelection={this.handleSelectedNodeRightTree}/>
                    </Grid>
                </Grid>
                <ScriptTag type="text/javascript" src="/Credits.js"/>
            </div>
        );
    }
}
export default ObjectChoiceView;
