package com.matching.MatchingAPI.Matching;


/**
 * To create object for a similarity pair.
 * Saves the name of both strings and the similarity value.
 */
public class SimilarityPairs implements Comparable<SimilarityPairs> {
    private String firstString, secondString;
    private double similarityValue;

    public SimilarityPairs(String firstString, String secondString, double similarityValue){
        this.firstString = firstString;
        this.secondString = secondString;
        this.similarityValue = similarityValue;
    }

    public String getFirstString() {
        return firstString;
    }

    public String getSecondString() {
        return secondString;
    }

    public Double getSimilarityValue() {
        return similarityValue;
    }

    public void setFirstString(String firstString) {
        this.firstString = firstString;
    }

    public void setSecondString(String secondString) {
        this.secondString = secondString;
    }

    public void setSimilarityValue(double similarityValue) {
        this.similarityValue = similarityValue;
    }

    @Override
    public int compareTo(SimilarityPairs otherPair) {
        return this.getSimilarityValue().compareTo(otherPair.getSimilarityValue());
    }
}
