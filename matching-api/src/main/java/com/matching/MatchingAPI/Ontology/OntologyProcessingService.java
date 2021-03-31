package com.matching.MatchingAPI.Ontology;

import org.apache.jena.ontology.Individual;
import org.apache.jena.ontology.OntClass;
import org.apache.jena.ontology.OntModel;
import org.apache.jena.rdf.model.NodeIterator;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.util.iterator.ExtendedIterator;
import org.apache.jena.vocabulary.RDFS;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Contains functions to process ontologies.
 */
public class OntologyProcessingService {
    final static String unitclassName = "Unit", prefixedUnitClassName = "PrefixedUnit", namespace = "http://www.ontology-of-units-of-measure.org/resource/om-2/",
            ontSymbolName = "symbol", ontDimensionName = "hasDimension";

    /**
     * Takes labels, symbol and dimension of a unit and saves them in an object of "OntologyUnit".
     *
     * @param unitLabels contains the synonyms of a unit
     * @param unitSymbol contains the symbol of a unit
     * @param unitDimension contains the dimension of a unit
     * @return OntologyUnit object
     */
    public static OntologyUnit calculateListOfUnitsEntry(NodeIterator unitLabels, NodeIterator unitSymbol, NodeIterator unitDimension){
        List<String> labels = new ArrayList<>();
        String symbol, dimension;

        while(unitLabels.hasNext()){
            labels.add(unitLabels.next().asLiteral().getLexicalForm());
        }

        if(unitSymbol.hasNext()){
            symbol = unitSymbol.next().asLiteral().getLexicalForm();
        }
        else{
            symbol = "";
        }

        if(unitDimension.hasNext()){
            dimension = unitDimension.next().toString();
        }
        else{
            dimension = "";
        }

        return new OntologyUnit(labels, symbol, dimension);
    }

    /**
     * Takes all classes from ontology and select only "Unit" and "PrefixedUnit" class.
     * Than takes all instances of both classes and filter labels, symbols and dimension.
     * Than saves labels, symbol and dimension for every instance with "calculateListOfUnitsEntry" in object of "OntologyUnit".
     * All unit object are saved in a "listOfUnits".
     *
     * @param unitOntology contains the read in ontology "om-2.0.rdf"
     * @return "listOfUnits"
     */
    public static List<OntologyUnit> getListOfOntologyUnits(OntModel unitOntology){
        ExtendedIterator ontClasses = unitOntology.listClasses();
        List<OntologyUnit> listOfUnits = new ArrayList<>();

        while(ontClasses.hasNext()){
            OntClass ontClass = (OntClass) ontClasses.next();

            ExtendedIterator ontUnits;
            if(ontClass.getLocalName() != null && (ontClass.getLocalName().equals(unitclassName) || ontClass.getLocalName().equals(prefixedUnitClassName))){
                ontUnits = ontClass.listInstances();

                Individual ontUnit;
                while(ontUnits.hasNext()){
                    ontUnit = (Individual) ontUnits.next();

                    NodeIterator unitLabels = ontUnit.listPropertyValues(RDFS.label);
                    NodeIterator unitSymbol = ontUnit.listPropertyValues(ResourceFactory.createProperty(namespace, ontSymbolName));
                    NodeIterator unitDimension = ontUnit.listPropertyValues(ResourceFactory.createProperty(namespace, ontDimensionName));

                    listOfUnits.add(calculateListOfUnitsEntry(unitLabels, unitSymbol, unitDimension));
                }
            }
        }
        return listOfUnits;
    }

    /**
     * Goes through all classes of ontology and saves the name of class and its labels in a list.
     * Every list of every class are saved in "classesWithLabels".
     *
     * @param ontology contains the read in ontology
     * @return "classesWithLabels"
     */
    public static List<List<String>> getListOfClassesWithLabels(OntModel ontology){
        ExtendedIterator ontClasses = ontology.listClasses();
        List<List<String>> classesWithLabels = new ArrayList<>();

        while(ontClasses.hasNext()){
            OntClass ontClass = (OntClass) ontClasses.next();
            List<String> classAndLabels = new ArrayList<>();
            classAndLabels.add(ontClass.getLocalName());

            NodeIterator ontLabels = ontClass.listPropertyValues(RDFS.label);

            while(ontLabels.hasNext()){
                classAndLabels.add(ontLabels.next().asLiteral().getLexicalForm());
            }

            classesWithLabels.add(classAndLabels);
        }

        return classesWithLabels;
    }

    /**
     * Searches for both input units if there labels or symbol are connect to a unit in "listOfUnits".
     * If there is a connection, the dimension are saved and than are than compared with each other.
     * Than tests if both units have the same unit dimension.
     *
     * @param inUnit the unit of the value of an object
     * @param outUnit the unit of the value of the another object
     * @param listOfUnits list of all Units in "om-2.0.rdf"
     * @return if dimensions the same its true, else its false
     */
    public static boolean testUnitsForSimilarity(String inUnit, String outUnit, List<OntologyUnit> listOfUnits){
        String inDimension = "", outDimension = "";

        if(inUnit.equals(outUnit)){
            return true;
        }
        else{
            for (OntologyUnit ontologyUnit : listOfUnits) {
                for(String label : ontologyUnit.getLabels()){
                    if(label.toLowerCase(Locale.ROOT).equals(inUnit.toLowerCase())){
                        inDimension = ontologyUnit.getDimension();
                    }
                    else if(label.toLowerCase(Locale.ROOT).equals(outUnit.toLowerCase())){
                        outDimension = ontologyUnit.getDimension();
                    }
                }

                if(ontologyUnit.getSymbol().equals(inUnit)){
                    inDimension = ontologyUnit.getDimension();
                }
                else if(ontologyUnit.getSymbol().equals(outUnit)){
                    outDimension = ontologyUnit.getDimension();
                }
            }
        }

        if(!inDimension.equals("") || !outDimension.equals("")){
            if(inDimension.equals(outDimension)){
                return true;
            }
        }
        return false;
    }
}
