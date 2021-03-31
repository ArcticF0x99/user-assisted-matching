import React, {createRef, useCallback} from 'react';
import Grid from "@material-ui/core/Grid";
import {CloseOutlined, QuestionOutlined} from "@ant-design/icons";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';

/**
 * Creates three Grid/Table components.
 * There you can assign input properties to output properties with drag and drop.
 */
export default class AssignmentTables extends React.Component{
    /**
     * {Object} processedInputObject contains data of selected input object from input API in format to display in Grid/Table
     * {Object[]} processedOutputProperties contains data of selected output object from output API in format to display in Grid/Table
     * {Object} matchingSuggestions contains for every output property the 3 best suggestions of input properties to match
     * {Object[]} virSatSystemModes contains the three system modes: Idle, Science and Communication with its uuid
     * {Object[]} unassignedGridData contains the properties that are shown in the left Table/Grid in {@link AssignmentTables}
     * {Object[]} assignedGridData contains the properties that are shown in the middle Table/Grid in {@link AssignmentTables}
     * {boolean} matchingSuggestionsNotReady is false if matching suggestion are calculated by Matching API
     */
    constructor(props) {
        super(props);
        this.state = {
            processedInputObject: [], processedOutputProperties: [], partDatProperties: [],
            matchingSuggestions: [],
            virSatSystemModes: [
                {
                    name: 'Idle',
                    uuid: 'edc117d5-3f51-49d0-88f2-4af154c2337a'
                },
                {
                    name: 'Science',
                    uuid: 'c5b9b806-6845-4c64-86d9-06115674c2f0'
                },
                {
                    name: 'Communication',
                    uuid: '571bb5c1-b56a-4813-8a95-4ad6280e216f'
                }
            ],
            unassignedGridData: [], assignedGridData: [],
            matchingSuggestionsNotReady: true,
        }

        this.returnClick = this.returnClick.bind(this);
        this.handleRowDropToAssignedGrid = this.handleRowDropToAssignedGrid.bind(this);
        this.handleRowDropToUnassignedGrid = this.handleRowDropToUnassignedGrid.bind(this);
        this.processRowDragAndDrop = this.processRowDragAndDrop.bind(this);
        this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
        this.handleScrollAssignedAndOutput = this.handleScrollAssignedAndOutput.bind(this);
    }

    /**
     * Searches for a inputProperty the right unit (if a property have a unit).
     *
     * @param propItemName contains the name of the property of the inputObject
     * @param partDatProperties contains all information about the properties of the Part Database
     * @returns {string|*} the unit of the property or empty string
     */
    calculatePropertyUnit(propItemName, partDatProperties){
        for (let property of partDatProperties)
        {
            if(propItemName === property.identifier){
                if(property.unit === undefined){
                    return "";
                }
                else {
                    return property.unit;
                }
            }
        }
    }

    /**
     * Goes through all properties recursive (if a properties contains Object[] as value).
     * Calculates for every property their unit with {@link calculatePropertyUnit}.
     * If property has no parent, usually adds name, value and the unit of a property into list.
     * Else add parents name + name of the property, value and the unit of the property into list.
     *
     * @param {Object[]} inputProperties contains all properties of input object
     * @param partDatProperties contains all information about the properties of the Part Database
     * @param {Object[]} processedInputProperties contains all properties of input object in format to display in Table
     * @param {String} parentName contains the names of one or more parents, separated by dot
     */
    processInputPropertyData(inputProperties, partDatProperties, processedInputProperties, parentName){
        const typeObject = "object";

        if(parentName === ""){
            for (let propItemName of Object.keys(inputProperties)) {
                let propertyUnit = this.calculatePropertyUnit(propItemName, partDatProperties);

                if(inputProperties[propItemName] === null){
                    processedInputProperties.push({name: propItemName, value: inputProperties[propItemName], unit: propertyUnit});
                }
                else if( typeof inputProperties[propItemName] === typeObject){
                    this.processInputPropertyData(inputProperties[propItemName], partDatProperties, processedInputProperties, propItemName);
                }
                else {
                    processedInputProperties.push({name: propItemName, value: inputProperties[propItemName], unit: propertyUnit});
                }
            }
        }
        else {
            for (let propItemName of Object.keys(inputProperties)) {
                let propertyUnit = this.calculatePropertyUnit(propItemName, partDatProperties);

                if(inputProperties[propItemName] === null){
                    processedInputProperties.push({name: parentName + "." + propItemName, value: inputProperties[propItemName], unit: propertyUnit});
                }
                else if( typeof inputProperties[propItemName] === typeObject){
                    this.processInputPropertyData(inputProperties[propItemName], partDatProperties, processedInputProperties, parentName + "." + propItemName);
                }
                else {
                    processedInputProperties.push({name: parentName + "." + propItemName, value: inputProperties[propItemName], unit: propertyUnit});
                }
            }
        }
    }

    /**
     * Goes through the mode values (they contain no names, only uuid).
     * Calculates with "this.state.virSatSystemModes" and uuid of a mode the name.
     * Add name (property + mode), value and unit to list.
     *
     * @param {String} outputPropertyName contains the name of the output property
     * @param {Object[]} modeValues
     * @param {Object[]} processedOutputProperties contains all properties of output object in format to display in Table
     */
    processOutputPropertyWithModes(outputPropertyName, modeValues, processedOutputProperties){
        for (let modeItem of modeValues) {
            let modeName = this.state.virSatSystemModes.filter(mode => mode.uuid === modeItem.value.mode)[0].name;

            processedOutputProperties.push({name: outputPropertyName + modeName, value: modeItem.value.valueBean.value, unit: modeItem.value.valueBean.unit});
        }
    }

    /**
     * Saves name, value and unit of property in list.
     * If defaultValueBean is undefined, just add the name, value and unit.
     * If modeValuesBean is empty, add name and value and unit.
     * Else modeValuesBean is not empty, so call {@link processOutputPropertyWithModes} with the mode values.
     *
     * @param {String} outputPropertyName contains the name of the output property
     * @param {Object} outputProperty contains data of the output property
     * @param {Object[]} processedOutputProperties contains all properties of output object in format to display in Table
     */
    processOutputProperty(outputPropertyName, outputProperty, processedOutputProperties){
        if(outputProperty.defaultValueBean === undefined){
            processedOutputProperties.push({name: outputPropertyName, value: outputProperty.value, unit: outputProperty.unit});
        }
        else if(outputProperty.modeValuesBean.length === 0){
            processedOutputProperties.push({name: outputPropertyName, value: outputProperty.defaultValueBean.value, unit: outputProperty.defaultValueBean.unit});
        }
        else {
            let modeValues = outputProperty.modeValuesBean;

            this.processOutputPropertyWithModes(outputPropertyName, modeValues, processedOutputProperties);
        }
    }

    /**
     * Goes through every category assignment of the outputObject and extract the properties.
     * Calls for every property of  {@link processOutputProperty}.
     *
     * @param {Object[]} processedOutputProperties contains all properties of output object in format to display in Table
     */
    async processOutputObjectProperties(processedOutputProperties) {
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

        outputObjectCatAssignments.map((arrItem) => {
            if (arrItem !== undefined) {
                Object.keys(arrItem).map((entryItemName) => {
                    if (typeof arrItem[entryItemName] === typeObject) {
                        this.processOutputProperty(entryItemName, arrItem[entryItemName], processedOutputProperties);
                    }
                })
            }
        })
    }

    /**
     * Processes data from input and output object to display it in Tables.
     * Also fetch all properties from "Part Database API".
     * Does matching request with input object, output object and part database properties (PUT request with input).
     */
    async processApiData() {
        let inputObjectFromAPI = this.props.inputObjectFromAPI;
        let processedInputProperties = [];
        const getPartDatPropertiesURL = "http://localhost:9000/api/properties/";

        const responsePartDatProperties = await fetch(getPartDatPropertiesURL);
        const partDatProperties = await responsePartDatProperties.json();
        this.setState({partDatProperties: partDatProperties})

        this.processInputPropertyData(inputObjectFromAPI.properties, partDatProperties, processedInputProperties, "");

        inputObjectFromAPI.properties = processedInputProperties;
        this.setState({processedInputObject: inputObjectFromAPI, unassignedGridData: processedInputProperties});

        let processedOutputProperties = [];

        await this.processOutputObjectProperties(processedOutputProperties);

        let assignedGridData = new Array(processedOutputProperties.length).fill({name: "", value: "", unit: ""});
        this.setState({processedOutputProperties: processedOutputProperties, assignedGridData: assignedGridData});

        let jsons = {
            inputObjectData: this.state.processedInputObject,
            outputObjectData: this.state.processedOutputProperties,
        };

        const responseMatchingSuggestions = await fetch("http://localhost:8080/json",{
            method:"PUT",
            headers:{
                "Accept":"application/json",
                "Content-Type":"application/json"
            },
            body:JSON.stringify(jsons)
        });

        this.props.matchingSuggestions(JSON.parse(await responseMatchingSuggestions.text()));
        this.setState({matchingSuggestionsNotReady: false});
        this.outputGrid.api.refreshCells({force: true});
    }

    /**
     * Searches inside the unassigned data (left Table) for target name.
     * If target name is inside, name and value got added to assigned data and removed from unassigned data.
     * The index where it is assigned, is the index of the output property you search an matching suggestion for.
     *
     * @param {Object[]} unassignedData contains all input properties which are not assigned to output properties (in left table)
     * @param {String} targetName name of input property that should be assigned to output property
     * @param {Object[]} assignedData contains all input properties which are assigned to output properties (in left table)
     * @returns {boolean} if target name was in unassigned data, its true
     */
    searchTargetInUnassigned(unassignedData, targetName, assignedData) {
        let property = {};
        let foundInUnassignedData = false;

        for (let i = 0; i < unassignedData.length; i++) {
            if (unassignedData[i].name === targetName) {
                property = unassignedData[i];
                unassignedData[i] = assignedData[this.props.outputRowIndex];
                assignedData[this.props.outputRowIndex] = property;

                foundInUnassignedData = true;
                break;
            }
        }
        return foundInUnassignedData;
    }

    /**
     * Searches inside the unassigned data (left Table) for target name.
     * If target name is inside, name and value changes just the index.
     * If on the index is already an property, the old property moves to unassigned data and the new changes index.
     *
     * @param {boolean} foundInUnassignedData is true if target name is already in unassigned data
     * @param {Object[]} assignedData contains all input properties which are assigned to output properties (in left table)
     * @param {String} targetName name of input property that should be assigned to output property
     * @param {Object[]} unassignedData contains all input properties which are not assigned to output properties (in left table)
     */
    searchTargetInAssigned(foundInUnassignedData, assignedData, targetName, unassignedData) {
        let property = {};

        if (!foundInUnassignedData) {
            for (let i = 0; i < assignedData.length; i++) {
                if (assignedData[i].name === targetName) {
                    property = assignedData[i];
                    assignedData[i] = {name: "", value: ""};

                    for (let i = 0; i < unassignedData.length; i++) {
                        if (unassignedData[i].name === "") {
                            unassignedData[i] = assignedData[this.props.outputRowIndex];
                            break;
                        }
                    }
                    assignedData[this.props.outputRowIndex] = property;

                    break;
                }
            }
        }
    }

    /**
     * Reorders the properties to the top of the grid.
     *
     * @param gridData contains the properties of a Grid/Table
     */
    reorderGridToTop(gridData){
        for (let i = 0; i < gridData.length; i++) {
            if (gridData[i].name === "") {
                for (let j = i; j < gridData.length; j++) {
                    if (gridData[j].name !== "") {
                        gridData[i] = gridData[j];
                        gridData[j] = {name: "", value: ""};
                        break;
                    }
                }
            }
        }
    }

    /**
     * Calls if suggestion {@link PopUp} is selected
     * Searches for target name in unassigned data and/or assigned data.
     * Adds property with the target name to chosen index in assigned data (assigned to a output property).
     * Calls {@link reorderGridToTop}.
     * Refreshing data of {@link unassignedGrid}  and "assignedGrid" and resize them.
     * {@link this.props.resetSuggestions} resets the selected matching suggestion.
     *
     * @param {String} targetName name of input property that should be assigned to output property
     */
    handleSuggestionClick(targetName){
        let unassignedData = this.state.unassignedGridData;
        let assignedData = this.state.assignedGridData;

        let foundInUnassignedData = this.searchTargetInUnassigned(unassignedData, targetName, assignedData);

        this.searchTargetInAssigned(foundInUnassignedData, assignedData, targetName, unassignedData);

        this.reorderGridToTop(this.state.unassignedGridData);

        this.unassignedGrid.api.setRowData(unassignedData);
        this.assignedGrid.api.setRowData(assignedData);

        this.unassignedGrid.api.refreshCells({force: true});
        this.assignedGrid.api.refreshCells({force: true});

        this.unassignedGrid.columnApi.autoSizeAllColumns();
        this.assignedGrid.columnApi.autoSizeAllColumns();

        this.props.resetSuggestions();
    }

    /**
     * If props changes and input object data not set, calls {@link processApiData}.
     * If props changes and in {@link PopUp} suggestion ist selected, calls {@link handleSuggestionClick}.
     * Calls {@link dataToBeMatched} when {@link saveButtonClicked} changed.
     * If all three grids are available, the get resize to there data.
     *
     * @param prevProps like in definition
     * @param prevState like in definition
     * @param snapshot like in definition
     */
    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if(prevProps !== this.props) {
            if(this.state.processedInputObject.length === 0){
                this.processApiData();
            }
            if(this.props.selectedSuggestionName !== ""){
                this.handleSuggestionClick(this.props.selectedSuggestionName);
            }
        }

        if(this.props.saveButtonClicked !== prevProps.saveButtonClicked){
            this.props.dataToBeMatched(this.state.assignedGridData, this.state.processedOutputProperties)
        }

        if(this.unassignedGrid && this.assignedGrid && this.outputGrid){
            this.unassignedGrid.columnApi.autoSizeAllColumns();
            this.assignedGrid.columnApi.autoSizeAllColumns();
            this.outputGrid.columnApi.autoSizeAllColumns();
            this.unassignedGrid.api.addRowDropZone(this.assignedGrid.api.getRowDropZoneParams());
            this.assignedGrid.api.addRowDropZone(this.unassignedGrid.api.getRowDropZoneParams());
        }
    }

    /**
     * Removes dragged property from origGrid and add to the dropped row in destGrid.
     * Than reorder the unassignedGrid data to top.
     *
     * @param {Object} args contains information about the drag and drop event
     * @param origGrid reference to Grid component where the property is dragged from
     * @param destGrid  reference to Grid component where the property is dropped in
     */
    transferRowProperty(args, origGrid, destGrid) {
        let dataSourceName = {unassignedGrid: "unassignedGridData", assignedGrid: "assignedGridData"};
        let origData = this.state[dataSourceName[origGrid.props.id]], destData = this.state[dataSourceName[destGrid.props.id]];
        let closestRowIndex = args.overIndex;
        const unassignedGridDataName = "unassignedGridData";

        if (destData[closestRowIndex].name === "") {
            destData[closestRowIndex] = origData[args.node.id];
            origData[args.node.id] = {name: "", value: ""};
        } else {
            let rowData = destData[closestRowIndex];
            destData[closestRowIndex] = origData[args.node.id];
            origData[args.node.id] = rowData;
        }

        if (dataSourceName[origGrid.props.id] === unassignedGridDataName) {
            this.reorderGridToTop(origData);
        } else if (dataSourceName[destGrid.props.id] === unassignedGridDataName) {
            this.reorderGridToTop(destData);
        }

        if(origGrid !== destGrid){
            origGrid.api.setRowData(origData);
            destGrid.api.setRowData(destData);
        }
        else {
            destGrid.api.setRowData(destData);
        }
    }

    /**
     * Transfer with {@link transferRowProperty} property from dragged row to dropped row.
     * Refreshing data of unassignedGrid and assignedGrid and resize them.
     *
     * @param {Object} args contains information about the drag and drop event
     * @param origGrid reference to Grid component where the property is dragged from
     * @param destGrid reference to Grid component where the property is dropped in
     */
    processRowDragAndDrop(args, origGrid, destGrid){
        this.transferRowProperty(args, origGrid, destGrid);

        origGrid.api.refreshCells({force: true});
        destGrid.api.refreshCells({force: true});

        origGrid.columnApi.autoSizeAllColumns();
        destGrid.columnApi.autoSizeAllColumns();
    }

    /**
     * Event handler.
     * Check if its drag and drop from extern or the same grid.
     * Calls {@link processRowDragAndDrop} with references to the grid components, first is origin and second is destination.
     *
     * @param {Object} args contains information about the drag and drop event
     */
    handleRowDropToAssignedGrid(args){
        if(this.unassignedGrid.api === args.node.gridApi){
            this.processRowDragAndDrop(args, this.unassignedGrid, this.assignedGrid);
        }
        else {
            this.processRowDragAndDrop(args, this.assignedGrid, this.assignedGrid);
        }
    }

    /**
     * Event handler
     * Check if its drag and drop from extern or the same grid.
     * Calls {@link processRowDragAndDrop} with references to the grid components, first is origin and second is destination.
     *
     * @param {Object} args contains information about the drag and drop event
     */
    handleRowDropToUnassignedGrid(args){
        if(this.assignedGrid.api === args.node.gridApi){
            this.processRowDragAndDrop(args, this.assignedGrid, this.unassignedGrid);
        }
        else {
            this.processRowDragAndDrop(args, this.unassignedGrid, this.unassignedGrid);
        }
    }

    /**
     * Event handler
     * Removes property from the row of the clicked button back to unassigned Grid.
     * Refreshes unassigned and assigned Grid and resize them.
     *
     * @param {Object} args contains information about the row where the button was pressed.
     */
    async returnClick(args){
        if(args.data.name === "") {
            return;
        }

        let unassignedData = this.state.unassignedGridData;
        let assignedData = this.state.assignedGridData;
        let closestRowIndex = args.rowIndex;

        for (let i = 0; i < unassignedData.length; i++) {
            if (unassignedData[i].name === "") {
                unassignedData[i] = args.data;
                break;
            }
        }

        assignedData[closestRowIndex] = {name: "", value: ""};

        this.unassignedGrid.api.setRowData(unassignedData);
        this.assignedGrid.api.setRowData(assignedData);

        this.unassignedGrid.api.refreshCells({force: true});
        this.assignedGrid.api.refreshCells({force: true});

        this.unassignedGrid.columnApi.autoSizeAllColumns();
        this.assignedGrid.columnApi.autoSizeAllColumns();
    }

    /**
     * Event handler.
     * Synchronize the scrollbars of assignedGrid and outputGrid, if one of them moves.
     */
    handleScrollAssignedAndOutput(){
        let hoverComponent = document.querySelectorAll(":hover");

        if(hoverComponent[14] === this.assignedGrid.eGridDiv.querySelector(".ag-body-viewport")){
            this.outputGrid.eGridDiv.querySelector(".ag-body-viewport").scrollTop = this.assignedGrid.eGridDiv.querySelector(".ag-body-viewport").scrollTop
        }
        else if(hoverComponent[14] === this.outputGrid.eGridDiv.querySelector(".ag-body-viewport")){
            this.assignedGrid.eGridDiv.querySelector(".ag-body-viewport").scrollTop = this.outputGrid.eGridDiv.querySelector(".ag-body-viewport").scrollTop
        }
    }

    /**
     * Contains three Grid/Table components.
     * First table (left table) shows all properties of input object, which are unassigned to properties of output object.
     * Second table (middle table) is like first table, but only all assigned properties.
     * Third table (right table) shows all properties of output object.
     */
    render() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const gridStyle = {
            height: screenHeight*0.85,
            width: screenWidth*0.325,
        }
        const insideGridStyle = {
            overflowX: "scroll",
            overflowY: "scroll",
        }
        const buttonStyle = {
            height: screenHeight*0.04,
            display: "flex",
            alignItems: "center",
        }

        const gridOptionAssigned = {
            alignedGrids: []
        }
        const gridOptionOutput = {
            alignedGrids: []
        }
        gridOptionAssigned.alignedGrids.push(gridOptionOutput);
        gridOptionOutput.alignedGrids.push(gridOptionAssigned);

        return(
            <div>
                <Grid container spacing={1} alignItems={"center"}>
                    <Grid item style={gridStyle} className="ag-theme-alpine">
                        <AgGridReact id={"unassignedGrid"} ref={ref => this.unassignedGrid = ref} style={insideGridStyle} key={this.state.unassignedGridData} rowDragManaged={true}
                                     rowData={this.state.processedInputObject.properties} onRowDragEnd={this.handleRowDropToUnassignedGrid} suppressMoveWhenRowDragging={true}
                        suppressScrollOnNewData={true}>
                            <AgGridColumn headerName={"Parameter name"} field={"name"} rowDrag={true}/>
                            <AgGridColumn headerName={"Value"} field={"value"}/>
                            <AgGridColumn headerName={"Unit"} field={"unit"}/>
                        </AgGridReact>
                    </Grid>
                    <Grid item style={gridStyle} className="ag-theme-alpine">
                        <AgGridReact class={"hallo"} id={"assignedGrid"} style={insideGridStyle} ref={ref => this.assignedGrid = ref} key={this.state.assignedGridData} rowDragManaged={true}
                                     rowData={this.state.assignedGridData} onRowDragEnd={this.handleRowDropToAssignedGrid} suppressMoveWhenRowDragging={true}
                                     gridOptions={gridOptionAssigned} onBodyScroll={(params) => this.handleScrollAssignedAndOutput(params)}
                                     suppressScrollOnNewData={true}>
                            <AgGridColumn headerName={"Parameter name"} field={"name"} rowDrag={true}/>
                            <AgGridColumn headerName={"Value"} field={"value"}/>
                            <AgGridColumn headerName={"Unit"} field={"unit"}/>
                            <AgGridColumn headerName={"Delete"} cellRendererFramework={(args) => (<button style={buttonStyle} onClick={ () => this.returnClick(args)}><CloseOutlined/></button>)}/>
                        </AgGridReact>
                    </Grid>
                    <Grid item style={gridStyle} className="ag-theme-alpine">
                        <AgGridReact id={"outputGrid"} ref={ref => this.outputGrid = ref} style={insideGridStyle} rowData={this.state.processedOutputProperties} gridOptions={gridOptionOutput}
                                     onBodyScroll={(params) => this.handleScrollAssignedAndOutput(params)} suppressScrollOnNewData={true} suppressCellSelection={true}>
                            <AgGridColumn headerName={"Parameter name"} field={"name"}/>
                            <AgGridColumn headerName={"Value"} field={"value"}/>
                            <AgGridColumn headerName={"Unit"} field={"unit"}/>
                            <AgGridColumn headerName={"Delete"} cellRendererFramework={(args) => (<button style={buttonStyle} disabled={this.state.matchingSuggestionsNotReady}
                                                                                                          onClick={ () => this.props.suggestionClick(args, this.state.assignedGridData)}><QuestionOutlined/></button>)}/>
                        </AgGridReact>
                    </Grid>
                </Grid>
            </div>
        );
    }
}