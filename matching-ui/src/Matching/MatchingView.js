import React from 'react';
import PopUp from "./PopUp";
import AssignmentTables from "./AssignmentTables";
import Grid from "@material-ui/core/Grid";
import SaveMatchingButton from "./SaveMatchingButton";
import ScriptTag from "react-script-tag";

/**
 * Webpage, where you can decide which properties from both selected objects should be matched with each other.
 */
class MatchingView extends React.Component{
    /**
     * {Object} inputObjectFromAPI fetched data of selected input object from input API
     * {Object} outputObjectFromAPI fetched data of selected output object from output API
     * {Object} popUpInformation contains the row index and name of the to be matched outputProperty and {@link matchingSuggestions}
     * {boolean} showPopUp is true if PopUp should be shown and false if its should be hidden
     * saveButtonClicked is true if button for saving the matching is clicked
     * {String} selectedSuggestionName the name of selected matching suggestion (input property) in PopUp
     * {Object[]} matchingSuggestions lists of matching suggestions for every outputProperty (every list, another similarity matching method)
     * {Object[]} unassignedGridData contains the properties that are shown in the left Table/Grid in {@link AssignmentTables}
     * {Object[]} assignedGridData contains the properties that are shown in the middle Table/Grid in {@link AssignmentTables}
     */
    constructor() {
        super();
        this.state = {
            inputObjectFromAPI: {name: ""}, outputObjectFromAPI: {name: ""},
            popUpInformation: {},
            showPopUp: false, saveButtonClicked: false,
            selectedSuggestionName: "",
            matchingSuggestions: [],
            assignedGridData: [], outputGridData: [],
        };

        this.suggestionClick = this.suggestionClick.bind(this);
        this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
        this.resetSuggestions = this.resetSuggestions.bind(this);
        this.handleMatchingSuggestions = this.handleMatchingSuggestions.bind(this);
        this.setDataToBeMatched = this.setDataToBeMatched.bind(this);
        this.handleButtonClicked = this.handleButtonClicked.bind(this);
    }

    /**
     * Fetches data of selected input and output object from APIs.
     * Extract Jsons from the data.
     */
    async componentDidMount(){
        const getPartDatObjectURL = "http://localhost:9000/api/parts/" + this.props.match.params.left;
        const getVirtSatObjectURL = "http://localhost:8000/rest/model/v0.0.1/repository/KatSatCEF/sei/" + this.props.match.params.right;

        const responseInputObjectFromAPI = await fetch(getPartDatObjectURL);
        let inputObjectFromAPI = await responseInputObjectFromAPI.json();

        const responseOutputObjectFromAPI = await fetch(getVirtSatObjectURL);
        let outputObjectFromAPI = await responseOutputObjectFromAPI.json();

        this.setState({inputObjectFromAPI: inputObjectFromAPI, outputObjectFromAPI: outputObjectFromAPI});
    }

    /**
     * Sets {@link matchingSuggestions}.
     *
     * @param matchingSuggestions lists of matching suggestions for every outputProperty (every list, another similarity matching method)
     */
    handleMatchingSuggestions(matchingSuggestions){
        this.setState({matchingSuggestions: matchingSuggestions});
    }

    /**
     * Calls, when in {@link AssignmentTables} suggestion Button (Button with "?") in any output object row is clicked.
     * Saves the row index and name of the to be matched outputProperty, {@link matchingSuggestions} and the assignedGridData
     * Than shows PopUp (sets showPopUp to true).
     *
     * @param {Object} args contains information about the row where the button was pressed.
     * @param {Object[]} assignedGridData contains all input properties which are assigned to output properties (in middle table)
     */
    async suggestionClick(args, assignedGridData){
        let outputRowIndex = args.rowIndex;
        let outputPropertyName = args.node.data.name;

        await this.setState({popUpInformation: {outputRowIndex: outputRowIndex, outputPropertyName: outputPropertyName,
                matchingSuggestions: this.state.matchingSuggestions, assignedGridData: assignedGridData}, showPopUp: true})
    }

    /**
     * Calls, when in {@link PopUp} a matching suggestion is clicked.
     * Than hides the PopUp and sets suggestion name to the selected name (so it can be used in {@link AssignmentTables.handleSuggestionClick}).
     *
     * @param {String} targetName name of input property that should be assigned to output property
     */
    handleSuggestionClick(targetName){
        this.setState({showPopUp: false, selectedSuggestionName: targetName});
    }

    /**
     * When {@link AssignmentTables.handleSuggestionClick} is finished, it calls this function.
     * Resets selected suggestion and the selectable matching suggestions in PopUp.
     */
    resetSuggestions(){
        this.setState({selectedSuggestionName: ""})
    }

    /**
     * Saves in {@link assignedGridData} inputProperties that are assigned to outputProperties.
     * Saves in {@link outputGridData} all outputProperties.
     *
     * @param assignedGridData
     * @param outputGridData
     */
    setDataToBeMatched(assignedGridData, outputGridData){
        this.setState({assignedGridData: assignedGridData, outputGridData: outputGridData})
    }

    /**
     * Sets {saveButtonClicked} to true if the button in {@link SaveMatchingButton} is pressed
     */
    handleButtonClicked(){
        this.setState({saveButtonClicked: true});
    }

    /**
     * Contains two input components with the names of the for the matching selected input and output object.
     * Contains {@link AssignmentTables} component, for matching between input and output object.
     * Contains {@link PopUp} component, for faster assign similar input properties to output properties.
     * Contains {@link SaveMatchingButton} a button for saving the matching and a confirmation PopUp
     *
     * @returns {JSX.Element}
     */
    render() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const websiteDesign = {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "98vh",
            width: "100vw",
        }

        const inputStyle={
            height: screenHeight*0.03,
            width: screenWidth*0.3,
            fontSize: 16
        }
        console.log(this.state.matchingSuggestions)

        return(
            <div style={websiteDesign}>
                <br/>
                <Grid container spacing={1} style={websiteDesign}>
                    <Grid item xs={8}>
                        <input  readOnly={true} style={inputStyle} value={this.state.inputObjectFromAPI.name}/>
                    </Grid>
                    <Grid item>
                        <input readOnly={true} style={inputStyle} value={this.state.outputObjectFromAPI.name}/>
                    </Grid>
                    <Grid item>
                        <AssignmentTables inputObjectFromAPI={this.state.inputObjectFromAPI} outputObjectFromAPI={this.state.outputObjectFromAPI}
                                          matchingSuggestions={this.handleMatchingSuggestions} suggestionClick={this.suggestionClick}
                                          selectedSuggestionName={this.state.selectedSuggestionName} outputRowIndex={this.state.popUpInformation.outputRowIndex}
                                          resetSuggestions={this.resetSuggestions} saveButtonClicked={this.state.saveButtonClicked} dataToBeMatched={this.setDataToBeMatched}/>
                    </Grid>
                    <Grid item xs={11}>
                        <PopUp showPopUp={this.state.showPopUp} popUpInformation={this.state.popUpInformation}
                               handleSuggestionClick={this.handleSuggestionClick}/>
                    </Grid>
                    <Grid>
                        <SaveMatchingButton buttonClicked={this.handleButtonClicked} assignedGridData={this.state.assignedGridData}
                        outputGridData={this.state.outputGridData} outputObjectFromAPI={this.state.outputObjectFromAPI}/>
                    </Grid>
                </Grid>
                <ScriptTag type="text/javascript" src="/Credits.js"/>
            </div>
        );
    }
}

export default MatchingView;