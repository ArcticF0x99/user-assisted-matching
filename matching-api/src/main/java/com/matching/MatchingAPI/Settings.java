package com.matching.MatchingAPI;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.Properties;

/**
 * Reads "application.properties" (settings file).
 * Create an instance of "Settings" and save inside all variables of the settings file.
 * Initializes this instance, for directly use of the variables, so that there is no need to create new Instance in every class.
 */
public class Settings {
    static Settings Instance;
    private String synonymsOntology;
    private String unitOntology;
    private int suggestionSize;
    private double minSimilarityValue;

    static void initialize()
    {
        final String configFile = "./src/main/resources/application.properties", synonymsOntology = "synonymsOntology",
                unitOntology = "unitOntology", suggestionSize = "suggestionSize", minSimilarityValue = "minSimilarityValue";
        FileReader reader;
        Properties props = new Properties();
        String intValue, doubleValue;


        try {
            reader = new FileReader(configFile);
            props.load(reader);
            Instance = new Settings();

            Instance.synonymsOntology = props.getProperty(synonymsOntology);
            Instance.unitOntology = props.getProperty(unitOntology);
            intValue = props.getProperty(suggestionSize);
            Instance.suggestionSize = Integer.parseInt(intValue);
            doubleValue = props.getProperty(minSimilarityValue);
            Instance.minSimilarityValue = Double.parseDouble(doubleValue);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static Settings getInstance() {
        return Instance;
    }

    public String getSynonymsOntology() {
        return synonymsOntology;
    }

    public String getUnitOntology() {
        return unitOntology;
    }

    public Integer getSuggestionSize() {
        return suggestionSize;
    }

    public double getMinSimilarityValue() {
        return minSimilarityValue;
    }

    static {
        initialize();
    }
}
