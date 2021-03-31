import React from 'react';
import { Tree } from 'antd';
import { DownOutlined } from '@ant-design/icons';

/**
 * Creates TreeView component to show output API.
 * Implementation of TreeView for "Part Database API".
 */
export default class LeftTreeView extends React.Component{
    /**
     * {Object} leftTreeViewData contains processed API data in right format for showing in TreeView
     *
     * @param props contains information given by {@link ObjectChoiceView}
     */
    constructor(props) {
        super(props);
        this.state = {
            leftTreeViewData: [], filterList: []
        };

        this.handleSelectedNode = this.handleSelectedNode.bind(this);
    }

    /**
     * Fetches the pre-filtered objects from API.
     * Processes the data into a usable format for TreeView.
     */
    async updateTreeViewContent(newFilterList) {
        let urlFilterExtension = "";
        const title = "Products", key = "products";

        if(newFilterList !== []){
            for (let filter of newFilterList)
            {
                if(urlFilterExtension === ""){
                    urlFilterExtension = "?" + filter.name + "=" + filter.value;
                }
                else{
                    urlFilterExtension += "&" + filter.name + "=" + filter.value;
                }
            }
        }

        const partDatFilteredObjectsURL = "http://localhost:9000/api/parts/" + urlFilterExtension;

        const responsePartDat = await fetch(partDatFilteredObjectsURL);

        const projectData = await responsePartDat.json()

        const dataList = projectData.map((item) => ({title: item.name, key: item.identifier, children: []}));

        const productDataList = [{title: title, key: key, children: dataList}];

        this.setState({leftTreeViewData: productDataList, filterList: newFilterList});
    }

    /**
     * Calls {@link updateTreeViewContent}.
     */
    componentDidMount() {
        this.updateTreeViewContent([]).then();
    }

    /**
     * Event handler.
     * Provides the callback {@link onSelection}.
     *
     * @param {String[]} value containing the identifier of the selected node (not used)
     * @param {Object} args containing information of selected object in TreeView component
     */
    handleSelectedNode(value, args){
        this.props.onSelection(args);
    }

    /**
     * Contains TreeView component which shows processed API data.
     */
    render(){
        const screenHeight = window.innerHeight;
        let screenWidth = window.innerWidth;

        const treeStyle = {
            border: '0.06cm solid #A9A6AD',
            minHeight: screenHeight*0.7,
            maxHeight: screenHeight*0.7,
            minWidth: screenWidth * 0.25,
            maxWidth: screenWidth * 0.25,
        }

        return(
            <Tree treeData={this.state.leftTreeViewData} style={treeStyle} showLine switcherIcon={<DownOutlined/>} onSelect={this.handleSelectedNode}/>
        );
    }
}