import React from 'react';
import {Modal} from "antd";

/**
 * Creates a button and notification PopUp to save an finished matching inside the
 * output API and matched pairs in Matching API.
 */
export default class SaveMatchingButton extends React.Component{
    /**
     * {boolean} showNote is true if Note PopUp is shown and false if not
     * {Object[]} matchedData contains outputProperty names with values
     */
    constructor() {
        super();
        this.state = {
            showNote: false,
            matchedData: [],
        }

        this.handleClick = this.handleClick.bind(this);
        this.saveMatching = this.saveMatching.bind(this);
        this.closeNote = this.closeNote.bind(this);
    }

    /**
     * Saves new value inside outputProperty.
     *
     * @param {String} outputPropertyName contains the name of the output property
     * @param {Object} outputProperty contains data of the output property
     * @param matchedDataPropertyValue contains the new value for the "outputProperty"
     */
    async processOutputProperty(outputPropertyName, outputProperty, matchedDataPropertyValue){
        if(outputProperty.defaultValueBean === undefined){
            outputProperty.value = matchedDataPropertyValue;
        }
        else if(outputProperty.modeValuesBean.length === 0){
            outputProperty.defaultValueBean.value = matchedDataPropertyValue;
        }
    }

    /**
     * Goes through every category assignment of the outputObject and extract the properties.
     * If in "matchedData" is a propertyName that is the same as a property name of outputObject,
     * calls {@link processOutputProperty} with the new value for the property inside "matchedData".
     * Than PUT request is provided, to save properties with new values in the object in the output API.
     *
     * @param {Object[]} matchedData matchedData contains outputProperty names with values
     */
    async processOutputObjectProperties(matchedData) {
        let outputObjectCatAssignments = [];
        const parameters = "Parameters";
        const visualisation = "Visualisation";
        const typeObject = "object";

        await Promise.all(this.props.outputObjectFromAPI.categoryAssignments.map(async (item) => {
            let name = item.name;
            const categoryAssignmentURL = "http://localhost:8000/rest/model/v0.0.1/repository/KatSatCEF/ca/" + item.uuid

            if (name.includes(parameters) || name.includes(visualisation)) {
                let response = await fetch(categoryAssignmentURL);

                outputObjectCatAssignments.push(await response.json());
            }
        }))

        outputObjectCatAssignments.map(async (arrItem) => {
            if (arrItem !== undefined) {
                Object.keys(arrItem).map((entryItemName) => {
                    let matchedDataPropertyValue = "";

                    matchedData.filter(entry => {
                        if(typeof entry.name !== "undefined" && entry.name === entryItemName){
                            matchedDataPropertyValue = entry.value;
                        }
                    });

                    if (typeof arrItem[entryItemName] === typeObject && matchedDataPropertyValue !== "") {
                        this.processOutputProperty(entryItemName, arrItem[entryItemName], matchedDataPropertyValue);
                    }
                })
            }

            const responseMatching = await fetch("http://localhost:8000/rest/model/v0.0.1/repository/KatSatCEF/ca/",{
                method:"PUT",
                headers:{
                    "Accept":"application/json",
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(arrItem)
            });
        })
    }

    /**
     * Event handler.
     * Calls {@link handleButtonClicked}.
     * Shows Note PopUp.
     */
    handleClick(){
        this.props.buttonClicked();

        this.setState({showNote: true});
    }

    /**
     * Event handler.
     * Hides the Note PopUp.
     */
    closeNote(){
        this.setState({showNote: false});
    }

    //aktuell werden falsche Matches einfach nur nicht übernommen
    /**
     * Converts the value of assignedProperty to outputProperty, based on their units.
     * Only converts, if both have units and the units are the same measure.
     *
     * @param {Object} assignedProperty assigned property of inputObject to a property of outputObject
     * @param {Object} outputProperty the property of the outputObject that is matched with assignedProperty
     * @returns {string|*} returns the converted value or empty String
     */
    convertValueWithUnit(assignedProperty, outputProperty){
        let convert = require("convert-units");
        let assignedUnit = "", assignedUnitMeasure = "", outputUnit = "", outputUnitMeasure = "";

        if(convert().lookup(assignedProperty.unit)){
            let assignedUnitLookup = convert().lookup(assignedProperty.unit);
            assignedUnit = assignedUnitLookup.abbr;
            assignedUnitMeasure = assignedUnitLookup.measure;

        }
        if(convert().lookup(outputProperty.unit)){
            let outputUnitLookUp = convert().lookup(assignedProperty.unit);
            outputUnit = outputUnitLookUp.abbr;
            outputUnitMeasure = outputUnitLookUp.measure;
        }

        if(assignedUnitMeasure !== "" && outputUnitMeasure !== "" && assignedUnitMeasure === outputUnitMeasure){
            return convert(assignedProperty.value).from(assignedUnit).to(outputUnit);
        }
        else {
            return "";
        }
    }

    /**
     * Matches two assigned to each other properties of assignedGird and outputGrid.
     * Converts property value of assignedGrid to the right format of the property in same row in outputGrid.
     * Saves in matchedData name of outputProperties with the new value.
     * Saves matched property names in matchedPairs.
     *
     * @param {Object[]} assignedGridData contains assigned properties of inputObject to properties of outputObject
     * @param {Object[]} outputGridData contains the properties of the outputObject
     * @returns {[][]} matchedData and matchedPairs
     */
    matchData(assignedGridData, outputGridData){
        let matchedData = [], matchedPairs = [];

        for (let i = 0; i < assignedGridData.length; i++) {
            let assignedProperty = assignedGridData[i], outputProperty = outputGridData[i];

            if(assignedProperty.name !== ""){
                let convertedAssignedPropertyValue = this.convertValueWithUnit(assignedProperty, outputProperty);

                if(convertedAssignedPropertyValue !== "") {
                    matchedData.push({name: outputProperty.name, value: convertedAssignedPropertyValue});
                    matchedPairs.push({outPropertyName: outputProperty.name, inPropertyName: assignedProperty.name})
                }
                else {
                    matchedData.push({});
                }
            }
            else {
                matchedData.push({});
            }
        }
        return [matchedData, matchedPairs];
    }

    /**
     * Event handler.
     * Calculates new values for outputProperties and the pairs that are matched with {@link matchData}.
     * Does PUT request with matchedPairs to Matching API.
     *
     * @returns {Promise<void>}
     */
    async saveMatching(){
        let assignedGridData = this.props.assignedGridData, outputGridData = this.props.outputGridData;

        let [matchedData, matchedPairs] = this.matchData(assignedGridData, outputGridData);

        let outputApiMatchedPairs = {virtualSatellite: matchedPairs};

        await this.processOutputObjectProperties(matchedData);

        const responseMatching = await fetch("http://localhost:8080/matchingWords",{
            method:"PUT",
            headers:{
                "Accept":"application/json",
                "Content-Type":"application/json"
            },
            body:JSON.stringify(outputApiMatchedPairs)
        });

        this.setState({matchedData: matchedData});

        this.setState({showNote: false});
    }

    /**
     * Contains button component and PopUp (Modal).
     * The button opens the PopUp and in the PopUp you can accept or decline a matching request.
     *
     * @returns {JSX.Element}
     */
    render() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const buttonStyle={
            marginTop: 10,
            marginLeft: -55,
            height: screenHeight*0.04,
            width: screenWidth*0.08,
            fontSize: 16,
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

        return(
            <div>
                <button style={buttonStyle} onClick={this.handleClick}>Save matching</button>
                <Modal style={noteStyle} visible={this.state.showNote} maskClosable={true} closable={false} onCancel={this.closeNote}
                       footer={[<button onClick={this.closeNote}>Cancel</button>, <button onClick={this.saveMatching}>Ok</button>]}>
                    <input style={noteText} value={"Do you really want to save this matching?"} readOnly={true}/>
                </Modal>
            </div>
        );
    }
}