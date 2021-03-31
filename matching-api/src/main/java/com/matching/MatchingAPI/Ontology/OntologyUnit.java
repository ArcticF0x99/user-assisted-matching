package com.matching.MatchingAPI.Ontology;

import java.util.List;

/**
 * To create object with different labels, a symbol and a dimension.
 * Actually to save important properties of the units from "Ontology of Units of Measure" (./ontologies/om-2.0.rdf).
 *
 * @labels contains alternative synonyms for unit name
 * @symbol contains the symbol of a unit
 * @dimension contains the dimension where a unit its located (like length dimension contains all length units)
 */
public class OntologyUnit {
    private List<String> labels;
    private String symbol, dimension;

    public OntologyUnit(List<String> labels, String symbol, String dimension){
        this.labels = labels;
        this.symbol = symbol;
        this.dimension = dimension;
    }

    public List<String> getLabels() {
        return labels;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getDimension() {
        return dimension;
    }
}
