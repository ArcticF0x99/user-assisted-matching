package com.matching.MatchingAPI.DataConversion;

import com.matching.MatchingAPI.Matching.MatchingProperty;

import java.util.List;

/**
 * Specify method that must be implemented.
 * The converter should convert external data format of properties to internal data format ({@link MatchingProperty}).
 */
public interface DataConverter{
    /**
     * Converts objects to list of properties as {@link MatchingProperty}.
     *
     * @param input contains the objects that need to be merged as json strings
     * @return the list of {@link MatchingProperty}
     */
    List<MatchingProperty> jsonToMatchingPropertyList(String input);
}
