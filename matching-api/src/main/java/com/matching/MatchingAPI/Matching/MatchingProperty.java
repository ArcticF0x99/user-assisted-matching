package com.matching.MatchingAPI.Matching;

/**
 * Internal data format.
 * To save the the name, value and unit of every property of a object.
 * Used to ensure that every object from "jsonString" from UI has same format.
 */
public class MatchingProperty {
    private String name, value, unit;

    public MatchingProperty(String name, String value, String unit){
        this.name = name;
        this.value = value;
        this.unit = unit;
    }

    public String getName() {
        return name;
    }

    public String getValue() {
        return value;
    }

    public String getUnit() {
        return unit;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
