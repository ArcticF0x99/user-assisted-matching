package com.matching.MatchingAPI.Matching;

/**
 * Contains the Index for the different compositional similarity methods.
 */
public enum CompSimEnum {
    jaroWinkler(0),
    jaccard(1),
    normLevenshtein(2),
    min(3),
    max(4),
    average(5),
    weighted(6);

    public final int index;

    private CompSimEnum(int index){
        this.index = index;
    }
}
