package com.matching.MatchingAPI.DataConversion;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.matching.MatchingAPI.Matching.MatchingProperty;
import com.matching.MatchingAPI.StringProcessingService;

import java.util.*;

/**
 * {@link DataConverter} for Virtual Satellite.
 * Converts "Virtual Satellite" objects to internal data format ({@link MatchingProperty}).
 */
public class VirtualSatelliteConverter implements DataConverter {
    final static String nameIdentifier = "name", valueIdentifier = "value", unitIdentifier = "unit",
            outputObjectIdentifier = "outputObjectData";

    /**
     * Implementation of the {@link DataConverter#jsonToMatchingPropertyList(String)} method.
     * Takes json of an object with the key name "outputObjectData" out of "jsonString".
     * Converts object of jsonString with name "outputObjectData" in JsonArray.
     * Add every property as {@link MatchingProperty} to "virSatList".
     *
     * @param jsonString contains the objects that need to be matched
     * @return list of {@link MatchingProperty} ("virSatList")
     */
    @Override
    public List<MatchingProperty> jsonToMatchingPropertyList(String jsonString) {
        Gson gson = new Gson();
        JsonElement jsonElements = gson.fromJson(jsonString, JsonElement.class);
        JsonArray jsonVS = gson.fromJson(jsonElements.getAsJsonObject().get(outputObjectIdentifier), JsonArray.class);

        List<MatchingProperty> virSatList = new ArrayList<>();

        for (JsonElement property : jsonVS) {
            String name = property.getAsJsonObject().get(nameIdentifier).toString(), value = property.getAsJsonObject().get(valueIdentifier).toString(), unit = "";
            JsonElement unitJson = property.getAsJsonObject().get(unitIdentifier);

            if(unitJson != null){
                unit = unitJson.toString();
            }
            name = StringProcessingService.removeQuotationMarks(name);
            value = StringProcessingService.removeQuotationMarks(value);
            unit = StringProcessingService.removeQuotationMarks(unit);

            virSatList.add(new MatchingProperty(name, value, unit));
        }

        return virSatList;
    }
}
