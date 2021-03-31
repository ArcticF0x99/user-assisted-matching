import React from 'react';
import {Tree} from "antd";
import {CaretRightOutlined} from '@ant-design/icons';

/**
 * Creates TreeView component to show input API.
 * Implementation of TreeView for "Virtual Satellite API".
 */
export default class RightTreeView extends React.Component{
    /**
     * {Object} {@link rightTreeViewData} containing processed API data in right format for showing in TreeView
     *
     * @param {Object} props containing information given by {@link ObjectChoiceView}
     */
    constructor(props) {
        super(props);
        this.state = {
            rightTreeViewData: [],
        };

        this.handleSelectedNode = this.handleSelectedNode.bind(this);
    }

    /**
     * Iterate recursively through all elements in categoryAssignments and/or children in a "SEI" (structural element instance).
     * Add name, uuid, type (if type is available) and depth (for TreeView depth) for every element in list.
     * If data also contains categoryAssignments and/or children, "iterateSeiData" is called recursively.
     *
     * @param {Object[]} seiData containing all elements of a "Sei" (project can contain multiple Seis)
     * @param {Object[]} processedProjectData list of all elements inside a project with its depth for TreeView (similar to indentation)
     * @param {Integer} depth of an element inside the TreeView (similar to indentation)
     */
    iterateSeiData(seiData, processedProjectData, depth){
        for (let item of seiData) {
            let newProjectData = {name: item.name, uuid: item.uuid, depth: depth};
            if (item.type !== undefined) {
                newProjectData.type = item.type;
            }
            processedProjectData.push(newProjectData);

            if (item.categoryAssignments !== undefined) {
                this.iterateSeiData(item.categoryAssignments, processedProjectData, depth + 1);
            }
            if (item.children !== undefined) {
                this.iterateSeiData(item.children, processedProjectData, depth + 1);
            }
        }
    }

    /**
     * Iterate through all elements in a "Sei".
     * add name, uuid, type and depth (for TreeView depth) for every element in list.
     * If data contains categoryAssignments and/or children, goes inside them with "iterateSeiData".
     *
     * @param {Object[]} projectData containing all elements of a "Sei" (project can contain multiple Seis)
     * @param {Object[]} processedProjectData list of all elements inside a project with its depth for TreeView
     * @param {Integer} depth of an element inside the TreeView (similar to indentation)
     */
    async processProjectData(projectData, processedProjectData, depth) {
        await Promise.all(projectData.map(async (item) => {
            const seiDataURL = "http://localhost:8000/rest/model/v0.0.1/repository/KatSatCEF/sei/" + item.uuid;

            const responseSei = await fetch(seiDataURL);
            let seiData = await responseSei.json();

            processedProjectData.push({name: seiData.name, uuid: seiData.uuid, type: seiData.type, depth: depth});

            if (seiData.categoryAssignments !== undefined) {
                this.iterateSeiData(seiData.categoryAssignments, processedProjectData, depth + 1);
            }
            if (seiData.children !== undefined) {
                this.iterateSeiData(seiData.children, processedProjectData, depth + 1);
            }
        }));
    }

    /**
     * Converts a project from flat list representation into tree representation using the saved depth. Utilizes a stack.
     *
     * @param {Object[]} processedProjectData list of all elements inside a project with its depth for TreeView
     */
    iterateProjectData(processedProjectData){
        let treeViewDataList = [];
        let stack = [];

        // for each element in processedProjectData:
        for (let currProjData of processedProjectData) {
            // pop all elements in stack with lower or equal depth from stack
            while (stack.length > 0 && currProjData.depth <= stack.length - 1) {
                stack.pop();
            }

            let treeObjectWithChildren = {
                key: currProjData.uuid, children: [],
                title: currProjData.type === undefined ? currProjData.name : currProjData.type + ": " + currProjData.name
            };

            if (stack.length === 0) {
                // if new element is a root element, add it to treeViewDataList
                treeViewDataList.push(treeObjectWithChildren);
            }
            else {
                // if new element is not a root element, push it to parent elements children (currently last item in stack)
                stack[stack.length - 1].children.push(treeObjectWithChildren);
            }

            // push every element to stack
            stack.push(treeObjectWithChildren);
        }
        while(stack.length > 0){
            stack.pop();
        }

        return treeViewDataList;
    }

    /**
     * Creates the datasource for TreeView with project data.
     *
     * @param {Object[]} processedProjectData list of all elements inside a project with its depth for TreeView
     */
    calculateTreeViewDatasource(processedProjectData){
        if(processedProjectData.length === 0){
            return [];
        }

        return this.iterateProjectData(processedProjectData);
    }

    /**
     * Fetches all product/objects from API.
     * Processes the data to usable format for TreeView.
     */
    async componentDidMount() {
        let processedProjectData = [];
        let depth = 0;
        const virSatProjectURL = "http://localhost:8000/rest/model/v0.0.1/repository/KatSatCEF/seis"

        const responseVirSat = await fetch(virSatProjectURL);
        let projectData = await responseVirSat.json();

        await this.processProjectData(projectData, processedProjectData, depth);

        this.setState({rightTreeViewData: this.calculateTreeViewDatasource(processedProjectData)})
    }

    /**
     * Event handler.
     * Provides the callback {@link onSelection}.
     *
     * @param {String[]} value contains the identifier of the selected node
     * @param {Object} args contains information of selected object in TreeView component
     */
    handleSelectedNode(value, args){
        this.props.onSelection(args);
    }

    /**
     * Contains TreeView component which shows processed API data.
     */
    render(){
        const screenHeight = window.innerHeight;
        const screenWidth = window.innerWidth;

        const treeStyle = {
            border: '0.06cm solid #A9A6AD',
            minHeight: screenHeight*0.7,
            maxHeight: screenHeight*0.7,
            minWidth: screenWidth * 0.25,
            maxWidth: screenWidth * 0.25,
            overflow: 'auto'
        }

        return(
            <Tree treeData={this.state.rightTreeViewData} style={treeStyle} showLine switcherIcon={<CaretRightOutlined/>} onSelect={this.handleSelectedNode}/>
        );
    }
}