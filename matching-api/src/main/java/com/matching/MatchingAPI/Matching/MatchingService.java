package com.matching.MatchingAPI.Matching;

import com.google.gson.*;
import com.matching.MatchingAPI.ComparableEntry;
import com.matching.MatchingAPI.DataConversion.DataConverter;
import com.matching.MatchingAPI.Ontology.OntologyProcessingService;
import com.matching.MatchingAPI.Ontology.OntologyUnit;
import com.matching.MatchingAPI.Settings;
import org.apache.jena.ontology.OntModel;
import org.apache.jena.rdf.model.ModelFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Does the matching for the objects (convert to internal format, calculate matching, output matching suggestions)
 */
@Component
public class MatchingService {
    final static int firstElement = 0, classNameIndex = 0;
    final static String noSimilarity = "noSimilarity";

    //the maximum number of matching suggestion for every property of an object
    final static int suggestionSize = Settings.getInstance().getSuggestionSize();
    //contains the minimum value that a matching needs to be good
    final static double minSimilarityValue = Settings.getInstance().getMinSimilarityValue();

    static List<List<String>> synonymClassesWithLabels;
    static List<OntologyUnit> listOfUnits;
    static ReentrantLock initializationLock = new ReentrantLock();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeOnStart(){
        initializationLock.lock();
        try {
            OntModel synonyms = ModelFactory.createOntologyModel();
            synonyms.read(Settings.getInstance().getSynonymsOntology());
            synonymClassesWithLabels = OntologyProcessingService.getListOfClassesWithLabels(synonyms);

            OntModel units = ModelFactory.createOntologyModel();
            units.read(Settings.getInstance().getUnitOntology());
            listOfUnits = OntologyProcessingService.getListOfOntologyUnits(units);
        }
        finally {
            initializationLock.unlock();
        }
    }

    /**
     * Calculate for every input property and its synonym names the similarity values with every output property and saves the highest in "maxSimilarityValue".
     * If there are no synonyms, only calculation with input property.
     * Saves in "minHeaps" for the different compositional methods, the input property name with highest similarity to a output property.
     * But "suggestionSize" says how many entries only get saved in every "minHeaps" and only the properties with the highest values.
     *
     * @param inObjectPropertyList contains all properties of "inObject" in internal format
     * @param outProperty contains one property of "outObject" in internal format
     * @param synonymClassesWithLabels contains the synonym names for all possible "inObject" properties
     * @param listOfUnits contains all units from "om-2.0.rdf"
     * @return "minHeaps"
     */
    private static PriorityQueue<ComparableEntry<String, Double>>[] bestMatchingsForOutProperties(List<MatchingProperty> inObjectPropertyList, MatchingProperty outProperty,
                                                                                                  List<List<String>> synonymClassesWithLabels, List<OntologyUnit> listOfUnits){
        PriorityQueue<ComparableEntry<String, Double>> minHeaps[] = new PriorityQueue[CompSimEnum.values().length];
        String text = "";
        for (int i = 0; i < minHeaps.length; i++) {
            minHeaps[i] = new PriorityQueue<>();
        }

        for(MatchingProperty inProperty : inObjectPropertyList){
            List<String> classWithInPropertyName = null;

            int dotAfterParentsIndex = inProperty.getName().lastIndexOf(".");
            String propertyNameWithoutParents = inProperty.getName();

            if(dotAfterParentsIndex != -1) {
                propertyNameWithoutParents = propertyNameWithoutParents.substring(dotAfterParentsIndex+1);
            }

            for(List<String> classWithLabel : synonymClassesWithLabels){
                if(propertyNameWithoutParents.equals(classWithLabel.get(classNameIndex))){
                    classWithInPropertyName = classWithLabel;
                }
            }

            Double[] maxSimilarityValue = new Double[7];
            Arrays.fill(maxSimilarityValue, 0.0);

            if(classWithInPropertyName != null){
                for(String label : classWithInPropertyName){
                    Double[] similarityValue = StringSimilarityService.compareStrings(label, outProperty.getName());

                    for (int i = 0; i < maxSimilarityValue.length; i++) {
                        if(maxSimilarityValue[i] < similarityValue[i]){
                            maxSimilarityValue[i] = similarityValue[i];
                        }
                    }
                }
            }
            else {
                maxSimilarityValue = StringSimilarityService.compareStrings(inProperty.getName(), outProperty.getName());
            }

            for (int i = 0; i < minHeaps.length; i++) {
                if(OntologyProcessingService.testUnitsForSimilarity(inProperty.getUnit(), outProperty.getUnit(), listOfUnits)){
                    minHeaps[i].add(new ComparableEntry<String, Double>(inProperty.getName(), maxSimilarityValue[i]));
                }

                if(minHeaps[i].size() > suggestionSize){
                    minHeaps[i].remove();
                }
            }
        }

        return minHeaps;
    }

    /**
     * Goes though "MinHeap" and saves input property name and the similarity value to an output property
     * in "similarityNames", if the corresponding value is minimum "minSimilarityValue".
     *
     * @param minHeap contains the input property names with the highest corresponding similarity values to a output property (number is limited to suggestionSize)
     * @return if "similarityAvailable" is not empty, its "similarityNames" (matching suggestions and values), else its the string "noSimilarity" with similarity 0.0
     */
    private static ComparableEntry<String, Double>[] calculateMatchSuggestionListEntry(PriorityQueue<ComparableEntry<String, Double>> minHeap){
        ComparableEntry<String, Double>[] similarityNames = new ComparableEntry[suggestionSize];
        boolean similarityAvailable = false;

        for (int i = suggestionSize-1; !minHeap.isEmpty(); --i) {
            if(minHeap.peek().getValue() >= minSimilarityValue){
                similarityNames[i] = minHeap.peek();
                similarityAvailable = true;
            }
            minHeap.poll();
        }

        if(similarityAvailable){
            return similarityNames;
        }
        else {
            ComparableEntry<String, Double> comparableEntry = new ComparableEntry("noSimilarity", 0.0);

            return new ComparableEntry[]{comparableEntry};
        }
    }

    /**
     * Calculate matching suggestions of "outObject" for "inObject".
     *
     * Read in ontologies of the synonyms for the properties and of the units and process them into lists.
     * Read in the "SuggestionSize" (number of max suggestions for every property) and "MinSimilarityValue" (the similarity value that is needed to be a good suggestion).
     * Goes through every property of output object, calculate with "bestMatchingsForOutProperties" best matching properties of input object and saves them into "minHeaps".
     * Than "calculateMatchSuggestionListEntry" calculates the best matching suggestions and saves them into "matchSuggestionList"
     *
     * @param inObjectPropertyList contains the properties of one object in internal format
     * @param outObjectPropertyList contains the properties of the other object in internal format
     * @return "matchSuggestionList" (lists of all properties of output object and the corresponding matching suggestions)
     */
    private static List<ComparableEntry<String, Double>[]>[] calculateMatchingSuggestions(List<MatchingProperty> inObjectPropertyList, List<MatchingProperty> outObjectPropertyList) {
        initializationLock.lock();
        initializationLock.unlock();

        List<ComparableEntry<String, Double>[]> matchSuggestionList[] = new ArrayList[CompSimEnum.values().length];
        for (int i = 0; i < matchSuggestionList.length; i++) {
            matchSuggestionList[i] = new ArrayList<>();
        }

        for(MatchingProperty outProperty : outObjectPropertyList){
            PriorityQueue<ComparableEntry<String, Double>>[] minHeaps = bestMatchingsForOutProperties(inObjectPropertyList, outProperty, synonymClassesWithLabels, listOfUnits);

            for (int i = 0; i < matchSuggestionList.length; i++) {
                matchSuggestionList[i].add(calculateMatchSuggestionListEntry(minHeaps[i]));
            }
        }

        return matchSuggestionList;
    }

    /**
     * Saves all not empty matching suggestions to an array.
     *
     * @param suggestions matching suggestions for a property of output object
     * @return "suggestionArray"
     */
    private static JsonArray getNonEmptySuggestions(ComparableEntry<String, Double>[] suggestions) {
        JsonArray suggestionArray = new JsonArray();

        for (ComparableEntry<String, Double> suggestion : suggestions){
            if(suggestion != null){
                if(suggestion.getKey().equals("noSimilarity")){
                    suggestionArray.add(suggestion.getKey());
                }
                else {
                    suggestionArray.add(suggestion.getKey() + "|" + suggestion.getValue());
                }
            }
        }
        return suggestionArray;
    }

    /**
     * Creates a json were every property of "outputObjectPropertyList" got saved with its matching suggestions from "matchingSuggestionList".
     *
     * Goes through every property of the output object.
     * Creates with "getNonEmptySuggestions" an array with all not empty matching suggestions for every output property.
     * Adds to "matchingSuggestionJson" the every output property name with the "suggestionArray".
     *
     * @param outputObjectPropertyList list of properties of the output object
     * @param matchingSuggestionList list of matching suggestions for every property of the output object
     * @return "matchingSuggestionJson" as String
     */
    private static JsonElement createOutput(List<MatchingProperty> outputObjectPropertyList, List<ComparableEntry<String, Double>[]> matchingSuggestionList){
        JsonElement matchingSuggestionJson = new JsonObject();
        JsonArray suggestionArray;

        for (int i = 0; i < outputObjectPropertyList.size(); i++) {
            suggestionArray = getNonEmptySuggestions(matchingSuggestionList.get(i));

            String outPropertyName = outputObjectPropertyList.get(i).getName();

            if(suggestionArray.size() == 1){
                matchingSuggestionJson.getAsJsonObject().add(outPropertyName, suggestionArray.get(firstElement));
            }
            else {
                matchingSuggestionJson.getAsJsonObject().add(outPropertyName, suggestionArray);
            }

        }
        return matchingSuggestionJson;
    }

    /**
     * Converts the objects in "jsonString" to internal format {@link MatchingProperty}.
     *
     * @param jsonString contains the objects that need to be matched
     * @param inputDataConverter contains the converter to internal format for the input object
     * @param outputDataConverter contains the converter to internal format for the output object
     * @return the json string from "createOutput"
     */
    public static String generateMatchingSuggestions(String jsonString, DataConverter inputDataConverter, DataConverter outputDataConverter) {
        List<MatchingProperty> inputObjectPropertyList = inputDataConverter.jsonToMatchingPropertyList(jsonString);
        List<MatchingProperty> outputObjectPropertyList = outputDataConverter.jsonToMatchingPropertyList(jsonString);

        return generateMatchingSuggestions(inputObjectPropertyList, outputObjectPropertyList);
    }

    /**
     * Generates matching suggestions between the inputProperties and outputProperties.
     * Processes matching suggestions from different compositional methods to output string.
     *
     * @param inputObjectPropertyList contains the input object in the internal format
     * @param outputObjectPropertyList contains the output object in the internal format
     * @return matching suggestions in json format
     */
    public static String generateMatchingSuggestions(List<MatchingProperty> inputObjectPropertyList, List<MatchingProperty> outputObjectPropertyList) {
        JsonElement allSuggestionsLists = new JsonObject();

        List<ComparableEntry<String, Double>[]>[] matchingSuggestionList = calculateMatchingSuggestions(inputObjectPropertyList, outputObjectPropertyList);

        for (int i = 0; i < matchingSuggestionList.length; i++) {
            allSuggestionsLists.getAsJsonObject().add(CompSimEnum.values()[i].toString(), createOutput(outputObjectPropertyList, matchingSuggestionList[i]));
        }

        return allSuggestionsLists.toString();
    }

    /**
     * Adds "inPropertyName" to the values of the output property with "outPropertyName" inside "updatedMatchingPairsJson".
     *
     * @param matchingPairsJson the converted file with correct matched pairs
     * @param updatedMatchingPairsJson contains the updated data of "matchingPairsJson"
     * @param outPropertyName contains the name of a output property
     * @param inPropertyName contains the name of a input property
     */
    private static void updateMatchingPairsJson(JsonElement matchingPairsJson, JsonElement updatedMatchingPairsJson, String outPropertyName, JsonElement inPropertyName) {
        for(Map.Entry<String, JsonElement> entry : matchingPairsJson.getAsJsonObject().entrySet()){
            if(outPropertyName.equals(entry.getKey())){
                JsonArray entryValues = (JsonArray) entry.getValue();
                boolean valueAlreadyInside = false;

                for (int j = 0; j < entryValues.size(); j++) {
                    if(entryValues.get(j).toString().equals(inPropertyName.toString())){
                        valueAlreadyInside = true;
                        break;
                    }
                }

                if(!valueAlreadyInside){
                    entryValues.add(inPropertyName);
                    updatedMatchingPairsJson.getAsJsonObject().remove(entry.getKey());
                    updatedMatchingPairsJson.getAsJsonObject().add(entry.getKey(), entryValues);
                }
            }
        }
    }

    /**
     * Converts file with "outputApiName" to "matchingPairsJson".
     * Adds new matched pairs, if they are not already inside the "matchingPairsJson".
     * Converts updated "matchingPairsJson" back to file.
     *
     * @param gson need to convert a file into a JsonElement
     * @param outputApiName contains the name of the output api
     * @param newMatchingPairsArray contains the new correct matched pairs
     */
    private static void addOrUpdateMatchingPairs(Gson gson, String outputApiName, JsonArray newMatchingPairsArray) {
        try {
            FileReader fr = new FileReader("./matchedWordsAPIs/" + outputApiName);
            BufferedReader br = new BufferedReader(fr);
            String matchedPairsString = br.readLine();
            JsonElement matchingPairsJson = gson.fromJson(matchedPairsString, JsonElement.class);

            JsonElement updatedMatchingPairsJson = matchingPairsJson.deepCopy();

            for (int i = 0; i < newMatchingPairsArray.size(); i++) {
                    JsonObject pair = newMatchingPairsArray.get(i).getAsJsonObject();
                    String outPropertyName = pair.get("outPropertyName").getAsString();
                    JsonElement inPropertyName = pair.get("inPropertyName");

                if(matchingPairsJson.getAsJsonObject().get(outPropertyName) != null){
                    updateMatchingPairsJson(matchingPairsJson, updatedMatchingPairsJson, outPropertyName, inPropertyName);
                }
                else{
                    JsonArray newMatchingWords = new JsonArray();

                    newMatchingWords.add(inPropertyName);

                    updatedMatchingPairsJson.getAsJsonObject().add(outPropertyName, newMatchingWords);
                }
            }

            FileWriter matchingPairFileWriter = new FileWriter("./matchedWordsAPIs/" + outputApiName);

            matchingPairFileWriter.write(updatedMatchingPairsJson.toString());
            matchingPairFileWriter.close();
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Converts "jsonString" into array of the matched pairs.
     * Creates file with the "outputApiName".
     * Adds the matched pairs to the file with addAndUpdateMatchingPairs.
     *
     * @param jsonString contain the correct matched pairs
     * @return
     */
    public static String addCorrectMatchingPairs(String jsonString){
        Gson gson = new Gson();
        JsonElement jsonElement = gson.fromJson(jsonString, JsonElement.class);

        String outputApiName = jsonElement.getAsJsonObject().keySet().iterator().next();
        JsonArray newMatchingPairsArray = gson.fromJson(jsonElement.getAsJsonObject().get(outputApiName), JsonArray.class);

        File matchingPairFile = new File("./matchedWordsAPIs/" + outputApiName);

        if(!matchingPairFile.isFile()){
            try {
                FileWriter matchingPairFileWriter = new FileWriter("./matchedWordsAPIs/" + outputApiName);

                matchingPairFileWriter.write("{}");
                matchingPairFileWriter.close();
            }
            catch (IOException e) {
                e.printStackTrace();
            }
        }

        addOrUpdateMatchingPairs(gson, outputApiName, newMatchingPairsArray);

        return "angekommen";
    }
}
