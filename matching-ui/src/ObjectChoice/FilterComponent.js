import React from 'react';
import Grid from "@material-ui/core/Grid";
import {Select, Table} from "antd";
import {DeleteOutlined} from "@ant-design/icons";
import {AgGridColumn, AgGridReact} from "ag-grid-react";

/**
 * Creates Filter component with (DropDown, Input, Button and Grid/Table).
 * Allows filtering of data from "Part Database API".
 */
export default class FilterComponent extends React.Component{
    /**
     * {Object[]} filterProperties contains all property names (for filtering) from "Part Database"
     * {Object[]} filterList contains currently used filter
     * {Integer} longestFilterNameLength the length of longest property name for width of DropDown component
     * {String} filterPropertyIdentifier contains the name of the filter to be added
     * {String} filterPropertyValue contains the value of the filter to be added
     * {String} filterPropertyGroup contains the group of the filter to be added
     * {boolean} dropDownPropertyChanged is true if in DropDown a new property is selected
     */
    constructor(props) {
        super(props);
        this.state = {
            filterProperties: [], filterList: [],
            longestFilterNameLength: 0,
            filterPropertyIdentifier: "", filterPropertyValue: "", filterPropertyGroup: "",
            dropDownPropertyChanged: false,
        };

        this.handleFilter = this.handleFilter.bind(this);
        this.handleDeletion = this.handleDeletion.bind(this);
        this.handleInputFilter = this.handleInputFilter.bind(this);
    }

    /**
     * Creates with properties and categories a list of filter.
     * Goes through the category list and add the elements to filter property list.
     * Goes through the property list and add the elements to filter property list.
     * Also determine length of longest filter name.
     *
     * @param {Object[]} categoryList contains all object categories
     * @param {Object[]} propertyList contains all properties from "Part Database"
     * @param {Object[]} filterProperties contains all filter in right format for DropDown component
     * @param {String} longestWordLength the length of longest filter name
     */
    calculateFilterList(categoryList, propertyList, filterProperties, longestWordLength) {
        const CategoryId = "Category", PropertyId = "Property";

        categoryList.map((item, index) => {
            filterProperties[index] = {group: CategoryId, name: item.name, identifier: item.identifier};

            if (longestWordLength < item.name.length) {
                longestWordLength = item.name.length;
            }
        })

        let categoryIndex = categoryList.length;

        propertyList.map((item, index) => {
            filterProperties[index + categoryIndex] = {group: PropertyId, name: item.name, identifier: item.identifier};

            if (longestWordLength < item.name.length) {
                longestWordLength = item.name.length;
            }
        });

        this.setState({filterProperties: filterProperties, longestFilterNameLength: longestWordLength});
    }

    /**
     * Fetches all properties and categories from API.
     * Calculate list of filter for DropDown.
     */
    async componentDidMount() {
        let propertyList = [], categoryList = [], filterProperties = [];
        let iterator = 0, longestWordLength = 0;
        const allPartDatPropertiesURL = "http://localhost:9000/api/properties/";
        const allPartDatCategoriesURL = "http://localhost:9000/api/categories/";
        const childrenProperty = "children";

        const responsePropertiesPartDat = await fetch(allPartDatPropertiesURL);
        const propertyJson = await responsePropertiesPartDat.json();

        propertyJson.map((item) =>{
            if(!item.hasOwnProperty(childrenProperty)){
                propertyList[iterator] = item;
                ++iterator;
            }
        })

        const responseCategoriesPartDat = await fetch(allPartDatCategoriesURL);
        const categoryJson = await responseCategoriesPartDat.json();

        categoryJson.map((item, index) =>{
            categoryList[index] = item;
        })

        await this.calculateFilterList(categoryList, propertyList, filterProperties, longestWordLength);
    }

    /**
     * If component {@link filterGrid} available, resizes its columns.
     * {@link dropDownPropertyChanged} is true,borderColor of {@link filterInput} changes to black.
     *
     * @param prevProps
     * @param prevState
     * @param snapshot
     */
    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        const CategoryId = "Category", colorBlack = "black";

        if(this.filterGrid){
            this.filterGrid.columnApi.autoSizeAllColumns();
        }

        if(this.state.filterPropertyIdentifier !== prevProps.filterPropertyIdentifier
            || this.state.filterPropertyValue !== prevProps.filterPropertyValue){
            this.filterInput.style.borderColor = colorBlack;
        }

        if(this.state.dropDownPropertyChanged){
            this.setState({filterPropertyValue: "", dropDownPropertyChanged: false});
        }
    }

    /**
     * New filter get added to list of filter.
     * If filter already in use, only the value changes.
     */
    addFilter() {
        let filterList = this.state.filterList;
        let filterNameAlreadyInUse = false;

        for (let i = 0; i < filterList.length; i++) {
            if (filterList[i].name === this.state.filterPropertyIdentifier) {
                filterList[i].value = this.state.filterPropertyValue;
                filterNameAlreadyInUse = true;
            }
        }

        if (!filterNameAlreadyInUse) {
            filterList.push({key: this.state.filterPropertyIdentifier, name: this.state.filterPropertyIdentifier, value: this.state.filterPropertyValue});

            this.setState({filterList: filterList});
        }
    }

    /**
     * Event handler.
     * RegEx only accept in string: first a number in any length, than the char ":" and than a number of any length.
     * If new filter property is a category or not matches the regEx, borderColor of {@link filterInput} gets red and function returns.
     * If try to add a category filter property twice without change it, also returns (shows if new filter is a category and the identifier is also category).
     * Calculate and add new filter with given name, value and group of the new filter.
     * Callback to {@link ObjectChoiceView.handleFilterListChanged} with the {@link filterList}.
     */
    async handleFilter(){
        const filterValueRegEx = new RegExp("^([-+]?[0-9]+):([-+]?[0-9]+)$");
        const matches = filterValueRegEx.exec(this.state.filterPropertyValue);
        const CategoryGroupIdentifier = "Category", colorRed = "red", categoryId = "category";

        if(this.state.filterPropertyGroup !== CategoryGroupIdentifier && (matches === null || parseInt(matches[1]) > parseInt(matches[2]))){
            this.filterInput.style.borderColor = colorRed;
            return;
        }

        if(this.state.filterPropertyGroup === CategoryGroupIdentifier){
            if(this.state.filterPropertyIdentifier === categoryId){
                return
            }

            let newValue = this.state.filterPropertyIdentifier;

            await this.setState({filterPropertyValue: newValue, filterPropertyIdentifier: categoryId})
        }

        await this.addFilter();
        this.filterGrid.api.refreshCells({force: true});

        this.setState({filterPropertyValue: ""});

        this.props.filterListChange(this.state.filterList);
    }

    /**
     * Event handler.
     * Deletes the active filter that's in same row as the pressed button.
     * Callback to {@link ObjectChoiceView.handleFilterListChanged} with the {@link filterList}.
     *
     * @param {Object} args contains the active filter
     */
    async handleDeletion(args){
        let filterList = this.state.filterList;

        for (let i = 0; i < filterList.length; i++) {
            if(args.data.name === filterList[i].name){
                filterList.splice(i, 1);
            }
        }

        this.props.filterListChange(filterList);

        await this.setState({filterList: filterList});
        this.filterGrid.api.refreshCells({force: true});
    }

    /**
     * Event handler.
     * Sets value for new filter.
     *
     * @param {Object} args the value of the Input component
     */
    handleInputFilter(args){
        this.setState({filterPropertyValue: args.target.value});
    }

    /**
     * Disables filter input if category is selected.
     * Transforms {@link filterProperties} into right form, to show in DropDown component.
     * Contains DropDown component to select a filter name for new filter.
     * Contains Input component to enter value for new filter.
     * Contains Button component to accept filter name and value as new filter.
     * Contains GridComponent to show currently used filter (deletion of filter possible).
     */
    render(){
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        let filterInputDisable = true;
        let filterProperties = this.state.filterProperties;
        let categories = [], properties = [];
        let groupedFilterProperties = [];

        const {Option, OptGroup} = Select;

        const dropDownStyle = {
            width: this.state.longestFilterNameLength * 8,
            minWidth: screenWidth * 0.1,
            maxWidth: screenWidth * 0.25
        }

        const gridStyle = {
            height: screenHeight*0.192,
            width: screenWidth*0.325,
        }

        const buttonStyle = {
            height: screenHeight*0.04,
            display: "flex",
            alignItems: "center",
        }

        if(this.state.filterPropertyGroup === "Property"){
            filterInputDisable = false;
        }

        filterProperties.map((property) => {
            if(property.group === "Category"){
                categories.push(<Option key={property.identifier} group={property.group}>{property.name}</Option>);
            }
            else {
                properties.push(<Option key={property.identifier} group={property.group}>{property.name}</Option>);
            }
        });

        groupedFilterProperties.push(<OptGroup key={"category"} label={"Category"}>{categories}</OptGroup>);
        groupedFilterProperties.push(<OptGroup key={"property"} label={"Property"}>{properties}</OptGroup>);

        return(
            <div>
                <Grid container spacing={1} alignItems={"center"}>
                    <Grid item>
                        <Select style={dropDownStyle} placeholder="Select or search property" showSearch={true}
                        onSelect={(value, option) => this.setState({filterPropertyIdentifier: option.key, filterPropertyGroup: option.group, dropDownPropertyChanged: true})}>
                            {groupedFilterProperties}
                        </Select>
                    </Grid>
                    <Grid item>
                        <input ref={ref => this.filterInput = ref} placeholder={"e.g. 1:10"} disabled={filterInputDisable} value={this.state.filterPropertyValue} onChange={this.handleInputFilter}/>
                    </Grid>
                    <Grid item xs={8}>
                        <button onClick={this.handleFilter}>Save filter</button>
                    </Grid>
                </Grid>
                <Grid container spacing={1} alignItems={"center"}>
                    <Grid item style={gridStyle} className="ag-theme-alpine">
                        <AgGridReact id={"filterGrid"} ref={ref => this.filterGrid = ref} key={this.state.filterList}
                                     rowData={this.state.filterList}>
                            <AgGridColumn headerName={"Filter name"} field={"name"}/>
                            <AgGridColumn headerName={"Value"} field={"value"}/>
                            <AgGridColumn cellRendererFramework={(args) => (<button style={buttonStyle} onClick={ () => this.handleDeletion(args)}><DeleteOutlined/></button>)}/>
                        </AgGridReact>
                    </Grid>
                </Grid>
            </div>
        );
    }
}