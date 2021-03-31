package com.matching.MatchingAPI;

/**
 * Contains functions to process strings.
 */
public class StringProcessingService {
    /**
     * Remove all quotation marks in a string, like additionally at the beginning and end of a string.
     *
     * @param string the word with the quotation marks
     * @return the word without any quotation marks
     */
    public static String removeQuotationMarks(String string){
        return string.replace("\"", "");
    }
}