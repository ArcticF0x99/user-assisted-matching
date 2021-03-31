package com.matching.MatchingAPI.DataConversion;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.matching.MatchingAPI.Matching.MatchingProperty;
import com.matching.MatchingAPI.StringProcessingService;

import java.util.*;

/**
 * {@link DataConverter} for Part Database.
 * Converts "Part Database" objects to internal data format ({@link MatchingProperty}).
 */
public class PartDatabaseConverter implements DataConverter {
    final static String unitIdentifier = "unit", stringAsUnit = "String", inputObjectIdentifier = "inputObjectData",
            nameIdentifier = "name", valueIdentifier = "value", nullString = "null";

    /**
     * Converts "json" (list of properties) to Stack with all properties in same order as before.
     *
     * @param json contains all properties of an object
     * @return "propertyStack"
     */
    private static Stack<Map.Entry<String, JsonElement>> jsonToPropertyStack(JsonElement json){
        Set<Map.Entry<String, JsonElement>> jsonSet = json.getAsJsonObject().entrySet();
        Stack<Map.Entry<String, JsonElement>> reversePropertyStack = new Stack<>();
        reversePropertyStack.addAll(jsonSet);

        Stack<Map.Entry<String, JsonElement>> propertyStack = new Stack<>();

        while(!reversePropertyStack.isEmpty()){
            propertyStack.add(reversePropertyStack.pop());
        }

        return propertyStack;
    }

    /**
     * Add every property of "propertyList" as {@link MatchingProperty} to "partDatList".
     * If value of property is null, add for the value instead a empty string.
     *
     * @param propertyList sub properties of an property (like size: width, height)
     * @param partDatList list where properties are saved as {@link MatchingProperty}
     */
    private static void jsonElementToListProperties(JsonArray propertyList, List<MatchingProperty> partDatList){
        for (JsonElement property : propertyList) {
            String name = property.getAsJsonObject().get(nameIdentifier).toString(), value = property.getAsJsonObject().get(valueIdentifier).toString();
            String unit = property.getAsJsonObject().get(unitIdentifier).toString();
            name = StringProcessingService.removeQuotationMarks(name);
            value = StringProcessingService.removeQuotationMarks(value);
            unit = StringProcessingService.removeQuotationMarks(unit);

            if(value.equals(nullString)){
                partDatList.add(new MatchingProperty(name, "", unit));
            }
            else {
                partDatList.add(new MatchingProperty(name, value, unit));
            }
        }
    }

    /**
     * Implementation of the {@link DataConverter#jsonToMatchingPropertyList(String)} method.
     * Takes json of an object with the key name "inputObjectData" out of "jsonString".
     * Creates a Stack with all properties of the object.
     * Goes through the Stack and adds every property as {@link MatchingProperty} to "partDatList".
     * If value of a property is null, only add the name and rest is empty.
     * If value is a JsonArray, than call "jsonElementToListProperties" with the JsonArray.
     * Else just add name, value and "String" as unit of the property.
     *
     * @param jsonString contains the objects that need to be matched
     * @return "partDatList"
     */
    public List<MatchingProperty> jsonToMatchingPropertyList(String jsonString) {
        Gson gson = new Gson();
        JsonElement jsonElements = gson.fromJson(jsonString, JsonElement.class);
        JsonElement jsonPD = gson.fromJson(jsonElements.getAsJsonObject().get(inputObjectIdentifier), JsonElement.class);

        Stack<Map.Entry<String, JsonElement>> propertyStack = jsonToPropertyStack(jsonPD);
        List<MatchingProperty> partDatList = new ArrayList<>();

        while(!propertyStack.isEmpty()){
            Map.Entry<String, JsonElement> property = propertyStack.pop();


            if(property.getValue().isJsonNull()){
                partDatList.add(new MatchingProperty(property.getKey(), "", ""));
            }
            else if(property.getValue().isJsonArray()){
                jsonElementToListProperties(property.getValue().getAsJsonArray(), partDatList);
            }
            else{
                partDatList.add(new MatchingProperty(property.getKey(), StringProcessingService.removeQuotationMarks(property.getValue().toString()), stringAsUnit));
            }
        }

        return partDatList;
    }
}
