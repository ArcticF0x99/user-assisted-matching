import React from 'react';
import Grid from "@material-ui/core/Grid";
import {Modal, Radio} from "antd";

/**
 * Creates PopUp (Modal) for an outputProperty, to show matching suggestions for it.
 * If matching suggestions available, PopUp shows three suggestions, which input property can be matched with the output property.
 * Else PopUp shows that tell that no matching suggestions are available.
 * Also sort the suggestion property to the outputProperty.
 */
export default class PopUp extends React.Component{
    /**
     * {Integer} outputRowIndex row index of the selected outputProperty
     * {String} outputPropertyName name of the selected outputProperty
     * {String} radioValue contains the value of the selected radio button
     * {Object[]} matchingSuggestions contains for every output property the 3 best suggestions of input properties to match
     * {Object[]} assignedGridData contains the properties that are shown in the middle Table/Grid in {@link AssignmentTables}
     * {Object} popUpSuggestions contains the three matching suggestion for the selected outputProperty (name and value)
     * {Object} popUpSuggestionsNotifications when an matching suggestion is already assigned, it contains a note with the index where it is assigned
     * {boolean} showPopUp is true if suggestion PopUp should be shown and false if its should be hidden
     * {boolean} showNote is true if Note PopUp is shown and false if not
     */
    constructor(props) {
        super(props);
        this.state = {
            outputRowIndex: -1,
            outputPropertyName: "", radioValue: "",
            matchingSuggestions: [],
            assignedGridData: [],
            popUpSuggestions: {suggestionOne: {name: "", value: 0.0}, suggestionTwo: {name: "", value: 0.0}, suggestionThree: {name: "", value: 0.0}},
            popUpSuggestionsNotifications: {suggestionOne: "", suggestionTwo: "", suggestionThree: ""},
            showPopUp: false, showNote: false,
        }

        this.closePopUp = this.closePopUp.bind(this);
        this.closeNote = this.closeNote.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleRadioButtonChoice = this.handleRadioButtonChoice.bind(this);
    }

    /**
     * Sets {@link outputRowIndex}, {@link outputPropertyName}, {@link matchingSuggestions} and {@link assignedGridData}.
     * If for selected outputProperty is no matching suggestion available, show Note PopUp, else show suggestion PopUp.
     */
    async updatePopUp(){
        let suggestionsAvailable = false;

        await this.setState({outputRowIndex: this.props.popUpInformation.outputRowIndex, outputPropertyName: this.props.popUpInformation.outputPropertyName,
            matchingSuggestions: this.props.popUpInformation.matchingSuggestions, assignedGridData: this.props.popUpInformation.assignedGridData});

        Object.keys(this.state.matchingSuggestions).map((listIndex) =>{
            let outputPropertySuggestions = this.state.matchingSuggestions[listIndex][this.state.outputPropertyName];

            if(outputPropertySuggestions !== "noSimilarity"){
                suggestionsAvailable = true;
            }
        })

        if(suggestionsAvailable){
            this.setState({showPopUp: true});
        }
        else {
            this.setState({showNote: true})
        }
    }

    /**
     * If suggestion PopUp shown and props changed, calls {@link updatePopUp}.
     *
     * @param prevProps like the definition
     * @param prevState like the definition
     * @param snapshot like the definition
     */
    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if(this.props.showPopUp && prevProps !== this.props){
            this.updatePopUp();
        }
    }

    /**
     * Event handler.
     * Select with radio button selection, the list in {@link matchingSuggestions}, where the suggestion for selected outputProperty comes from.
     * Calculates names and values of the suggestions and saves them (one to three suggestions possible).
     * If suggestions already assigned, {@link popUpSuggestionsNotifications} saves a note with the index.
     *
     * @param args contains information about the selected radio button
     */
    handleRadioButtonChoice(args){
        console.log(args);
        this.setState({radioValue: args.target.value});
        let propertySuggestionsArray = this.state.matchingSuggestions[args.target.value][this.state.outputPropertyName];
        let propertySuggestionsObject = {suggestionOne: {name: "", value: 0.0}, suggestionTwo: {name: "", value: 0.0}, suggestionThree: {name: "", value: 0.0}};
        let popUpSuggestionsNotifications = {suggestionOne: "", suggestionTwo: "", suggestionThree: ""};
        let popUpNamesArray = ["suggestionOne", "suggestionTwo", "suggestionThree"];

        if(typeof propertySuggestionsArray === "string"){
            let splitSuggestion = propertySuggestionsArray.split("|");

            propertySuggestionsObject["suggestionOne"] = {name: splitSuggestion[0], value: splitSuggestion[1]};
        }
        else {
            for (let i = 0; i < propertySuggestionsArray.length; i++) {
                let splitSuggestion = propertySuggestionsArray[i].split("|");

                propertySuggestionsObject[popUpNamesArray[i]] = {name: splitSuggestion[0], value: splitSuggestion[1]};
            }
        }

        this.state.assignedGridData.map((item, index) => {
            if(item.name !== ""){
                if(item.name === propertySuggestionsObject.suggestionOne.name){
                    popUpSuggestionsNotifications.suggestionOne = "Hinweis: schon in Zeile " + index + " zugeordnet";
                }

                if(item.name === propertySuggestionsObject.suggestionTwo.name){
                    popUpSuggestionsNotifications.suggestionTwo = "Hinweis: schon in Zeile " + index + " zugeordnet";
                }

                if(item.name === propertySuggestionsObject.suggestionThree.name){
                    popUpSuggestionsNotifications.suggestionThree = "Hinweis: schon in Zeile " + index + " zugeordnet";
                }
            }
        });

        this.setState({popUpSuggestions: propertySuggestionsObject,
            popUpSuggestionsNotifications: popUpSuggestionsNotifications});
    }

    /**
     * Resets {@link popUpSuggestions} and {@link popUpSuggestionsNotifications}.
     */
    resetPopUp(){
        let popUpSuggestions = {suggestionOne: {name: "", value: 0.0}, suggestionTwo: {name: "", value: 0.0}, suggestionThree: {name: "", value: 0.0}};
        let popUpSuggestionsNotifications = {suggestionOne: "", suggestionTwo: "", suggestionThree: ""};

        this.setState({popUpSuggestions: popUpSuggestions, popUpSuggestionsNotifications: popUpSuggestionsNotifications});
    }

    /**
     * Event handler.
     * If suggestion is clicked, hides suggestion PopUp and calls {@link MatchingView.handleSuggestionClick}.
     * Calls {@link resetPopUp} and unselect radio buttons.
     *
     * @param args contains the information about the clicked button
     */
    handleButtonClick(args){
        if(args.nativeEvent.target.name !== "") {
            this.setState({showPopUp: false});
            this.props.handleSuggestionClick(args.nativeEvent.target.name);
        }
        this.resetPopUp();
        this.setState({radioValue: ""});
    }

    /**
     * Hides the suggestion PopUp and unselect radio buttons.
     */
    closePopUp(){
        this.resetPopUp();
        this.setState({showPopUp: false});
        this.setState({radioValue: ""});
    }

    /**
     * Hides the Note PopUp and unselect radio buttons.
     */
    closeNote(){
        this.resetPopUp();
        this.setState({showNote: false});
        this.setState({radioValue: ""});
    }

    /**
     * Contains two PopUp components.
     * If matching suggestions are available, the suggestion PopUp shows.
     * The suggestion PopUp contains three Button components, which display matching suggestions (output properties) for input component.
     * The suggestion PopUp contains three Input components (readOnly), which shows how similar output and input properties are to each other.
     * The suggestion PopUp contains three Input components (readOnly), which shows when a suggestion is already assigned (shows also on which index).
     * If {@link showPopUp} is true, updates suggestions and notifications of suggestion PopUp and shows it.
     * If no matching suggestions are available, the note PopUp shows.
     * The note PopUp contains the information, that no suggestion are available.
     */
    render() {
        const screenHeight = window.innerHeight, screenWidth = window.innerWidth;
        let suggestionOne = this.state.popUpSuggestions.suggestionOne.name;
        let suggestionTwo = this.state.popUpSuggestions.suggestionTwo.name;
        let suggestionThree = this.state.popUpSuggestions.suggestionThree.name;

        const popUpStyle = {
            minHeight: screenHeight * 0.4,
            maxHeight: screenHeight * 0.4,
            minWidth: screenWidth * 0.65,
            maxWidth: screenWidth * 0.65,
            display: "flex",
            alignItems: "center",
        }
        const popUpButtonStyle = {
            minHeight: screenHeight * 0.05,
            maxHeight: screenHeight * 0.05,
            minWidth: screenWidth * 0.2,
            maxWidth: screenWidth * 0.2
        }
        const popUpTextStyle = {
            minHeight: screenHeight * 0.05,
            maxHeight: screenHeight * 0.05,
            minWidth: screenWidth * 0.2,
            maxWidth: screenWidth * 0.2,
            border: "none",
            textAlign: "center",
        }
        const popUpNotificationTextStyle = {
            minHeight: screenHeight * 0.05,
            maxHeight: screenHeight * 0.05,
            minWidth: screenWidth * 0.2,
            maxWidth: screenWidth * 0.2,
            border: "none",
            textAlign: "center",
            color: "red"
        }
        const noteStyle = {
            minHeight: screenHeight * 0.1,
            maxHeight: screenHeight * 0.1,
            minWidth: screenWidth * 0.15,
            maxWidth: screenWidth * 0.15,
        }
        const noteText = {
            height: screenHeight*0.05,
            width: screenWidth*0.13,
            border: "none",
            textAlign: "center",
        }
        const radioStyle = {
            alignContent:"center",
            display:"flex",
            justifyContent:"center",
        }
        const radioTextStyle = {
            minHeight: screenHeight * 0.05,
            maxHeight: screenHeight * 0.05,
            minWidth: screenWidth * 0.2,
            maxWidth: screenWidth * 0.2,
            border: "none",
            textAlign: "center",
            fontSize: "20px",
            textDecoration: "underline",
        }

        return(
            <div>
                <div>
                    <Modal style={popUpStyle} className={"suggestion PopUp"} title={"Matching-Suggestions"} visible={this.state.showPopUp} onCancel={this.closePopUp} maskClosable={true} footer={null}>
                        <div>
                            <Grid container spacing={1} style={radioStyle}>
                                <Grid item>
                                    <input style={radioTextStyle} value={"Choice of similarity methods"} readOnly={true}/>
                                </Grid>
                            </Grid>
                            <Grid container spacing={1} style={radioStyle}>
                                <Grid item>
                                    <Radio.Group onChange={this.handleRadioButtonChoice} size={"middle"} value={this.state.radioValue}>
                                        <Radio.Button value={"jaroWinkler"}>Jaro Winkler</Radio.Button>
                                        <Radio.Button value={"jaccard"}>Jaccard</Radio.Button>
                                        <Radio.Button value={"normLevenshtein"}>norm. Levenshtein</Radio.Button>
                                        <Radio.Button value={"average"}>Average</Radio.Button>
                                        <Radio.Button value={"min"}>Minimum</Radio.Button>
                                        <Radio.Button value={"max"}>Maximum</Radio.Button>
                                        <Radio.Button disabled={true} value={"user"}>User-Matching</Radio.Button>
                                    </Radio.Group>
                                </Grid>
                            </Grid>
                            <br/>
                            <Grid container spacing={1} alignItems={"center"}>
                                <Grid item>
                                    <button name={suggestionOne} onClick={this.handleButtonClick} style={popUpButtonStyle}>{suggestionOne}</button>
                                </Grid>
                                <Grid item>
                                    <button name={suggestionTwo} onClick={this.handleButtonClick} style={popUpButtonStyle}>{suggestionTwo}</button>
                                </Grid>
                                <Grid item>
                                    <button name={suggestionThree} onClick={this.handleButtonClick} style={popUpButtonStyle}>{suggestionThree}</button>
                                </Grid>
                            </Grid>
                            <Grid container spacing={1} alignItems={"center"}>
                                <Grid item>
                                    <input style={popUpTextStyle} value={"Übereinstimmung: " + this.state.popUpSuggestions.suggestionOne.value*100 + "%"} readOnly={true}/>
                                </Grid>
                                <Grid item>
                                    <input style={popUpTextStyle} value={"Übereinstimmung: " + this.state.popUpSuggestions.suggestionTwo.value*100 + "%"} readOnly={true}/>
                                </Grid>
                                <Grid item>
                                    <input style={popUpTextStyle} value={"Übereinstimmung: " + this.state.popUpSuggestions.suggestionThree.value*100 + "%"} readOnly={true}/>
                                </Grid>
                            </Grid>
                            <Grid container spacing={1} alignItems={"center"}>
                                <Grid item>
                                    <input style={popUpNotificationTextStyle} value={this.state.popUpSuggestionsNotifications.suggestionOne} readOnly={true}/>
                                </Grid>
                                <Grid item>
                                    <input style={popUpNotificationTextStyle} value={this.state.popUpSuggestionsNotifications.suggestionTwo} readOnly={true}/>
                                </Grid>
                                <Grid item>
                                    <input style={popUpNotificationTextStyle} value={this.state.popUpSuggestionsNotifications.suggestionThree} readOnly={true}/>
                                </Grid>
                            </Grid>
                        </div>
                    </Modal>
                </div>
                <div>
                    <Modal className={"note PopUp"} style={noteStyle} visible={this.state.showNote} onCancel={this.closeNote} maskClosable={true} closable={false} footer={[<button onClick={this.closeNote}>OK</button>]}>
                        <input style={noteText} value={"No matching suggestions available."} readOnly={true}/>
                    </Modal>
                </div>
            </div>
        );
    }
}
