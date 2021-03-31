package com.matching.MatchingAPI.Matching;

import com.matching.MatchingAPI.Entry;
import info.debatty.java.stringsimilarity.Jaccard;
import info.debatty.java.stringsimilarity.JaroWinkler;
import info.debatty.java.stringsimilarity.NormalizedLevenshtein;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.math.NumberUtils;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Calculate string similarity.
 */
public class StringSimilarityService {
    final static Pattern minOneBigCharacter = Pattern.compile(".*[A-Z].*"), minOneSpecialCharacter = Pattern.compile(".*[`~!@#$%^&*()\\-_=+\\\\|\\[{\\]};:'\",<.>/?].*");
    final static String RegExLookAheadAllSpecialCharacters = "(?=[`~!@#$%^&*()\\-_=+\\\\|\\[{\\]};:'\",<.>/?])",
            RegExAllSpecialCharacters = "[`~!@#$%^&*()\\-_=+\\\\|\\[{\\]};:'\",<.>/?]", RegExAllBigCharacters = "(?=[A-Z])";

    static JaroWinkler jw = new JaroWinkler();
    static NormalizedLevenshtein nl = new NormalizedLevenshtein();
    static Jaccard jc = new Jaccard();

    /**
     * Check if a string contains big characters.
     *
     * @param string a word, sentence,...
     * @return if string contains big characters its true, else its false
     */
    private static boolean checkForBigCharacters(String string){
        if(minOneBigCharacter.matcher(string).find()){
            return true;
        }
        return false;
    }

    /**
     * Check if a string contains special characters.
     *
     * @param string a word, sentence,...
     * @return if string contains special characters its true, else its false
     */
    private static boolean checkForSpecialCharacters(String string){
        if(minOneSpecialCharacter.matcher(string).find()){
            return true;
        }
        return false;
    }

    /**
     * If in "words" is the same string two times or more, the duplicate strings are deleted.
     *
     * @param words contains the single words of a string
     * @return array "words" with every string inside only one times
     */
    private static String[] deleteDoubleWords(String[] words){
        for (int i = 0; i < words.length; i++) {
            String word = words[i];

            for (int j = 0; j < words.length; j++) {
                if(i != j && words[j].equals(word)){
                    words = ArrayUtils.remove(words, j);
                }
            }
        }

        return words;
    }

    /**
     * Checks if input string contains special characters or big characters.
     * If string contains special characters, big characters or spaces, the string is split at these positions into its single words.
     * Additionally unnecessary special characters and spaces get removed.
     *
     * @param string a word, sentence,...
     * @return the string as array of its single words (but every word only one times)
     */
    private static String[] makeUniformStringArray(String string){
        boolean containsBigCharacters = checkForBigCharacters(string);
        boolean containsSpecialCharacters = checkForSpecialCharacters(string);
        String[] words = null;

        if(containsSpecialCharacters){
            words = string.split(RegExLookAheadAllSpecialCharacters);

            for(int i = 0; i < words.length;++i){
                words[i] = words[i].replaceAll(RegExAllSpecialCharacters, "");
            }
        }
        else if(containsBigCharacters){
            words = string.split(RegExAllBigCharacters);
        }
        else words = string.split(" ");

        for(int i = 0; i < words.length;++i){
            words[i] = words[i].toLowerCase();
            words[i] = words[i].replaceAll(" ", "");
        }

        return deleteDoubleWords(words);
    }

    /**
     * Fills "smallerString" and "biggerString" with the words of first and second string.
     * But fills the words into same index, that have highest similarity to each other.
     * If bigger String has more words, words of it remain.
     *
     * @param lessWordNumber number of words of the smaller string of first and second string
     * @param smallerString contains from first and second string, the string with less words in another order
     * @param biggerString contains from first and second string, the string with more words in another order
     * @param wordsAlreadyInBiggerString contains all words that are already written in "biggerString"
     * @param maxHeap contains all combination of words in first and second string with its similarity to each other
     */
    private static void arrangeWordsBySimilarityPairs(int lessWordNumber, StringBuilder smallerString, StringBuilder biggerString, List<String> wordsAlreadyInBiggerString, PriorityQueue<SimilarityPairs> maxHeap) {
        List<String> wordsAlreadyInSmallerString = new ArrayList<>();

        while (wordsAlreadyInSmallerString.size() < lessWordNumber){
            boolean wordAlreadyInString = false;

            SimilarityPairs similarityPair = maxHeap.poll();

            for (String word : wordsAlreadyInSmallerString) {
                if (word.equals(similarityPair.getFirstString())) {
                    wordAlreadyInString = true;
                    break;
                }
            }
            for (String word : wordsAlreadyInBiggerString) {
                if (word.equals(similarityPair.getSecondString())) {
                    wordAlreadyInString = true;
                    break;
                }
            }

            if(!wordAlreadyInString){
                smallerString.append(similarityPair.getFirstString());
                biggerString.append(similarityPair.getSecondString());
                wordsAlreadyInSmallerString.add(similarityPair.getFirstString());
                wordsAlreadyInBiggerString.add(similarityPair.getSecondString());
            }
        }
    }

    /**
     * Fills in "biggerString" the remaining words of "ArrayWithMoreWords".
     *
     * @param ArrayWithMoreWords contains from first and second string, the words of the string with more words
     * @param biggerString contains from first and second string, the string with more words in another order
     * @param wordsAlreadyInBiggerString contains all words that are already written in "biggerString"
     */
    private static void fillInLeftWords(String[] ArrayWithMoreWords, StringBuilder biggerString, List<String> wordsAlreadyInBiggerString) {
        for (String moreWord : ArrayWithMoreWords) {
            boolean wordFound = false;

            for (String word : wordsAlreadyInBiggerString) {
                if (moreWord.equals(word)) {
                    wordFound = true;
                    break;
                }
            }

            if (!wordFound) {
                biggerString.append(moreWord);
            }
        }
    }

    /**
     * Calculates best order of the words in first and second string to each other.
     * (best order means, for highest possible similarity value)
     *
     * Sort both input word arrays by number of words.
     * Calculates similarity between every word of both strings and save them as pairs in "maxHeap".
     * Change with "arrangeWordsBySimilarityPairs" the order of the words in first and second string.
     * Fill with "fillInLeftWords" the left words of the bigger string into the new bigger string.
     *
     * @param firstWords contain the words that make up the first String
     * @param secondWords contain the words that make up the second String
     * @return first and second string in another word order, for better similarity calculation
     */
    private static Entry<String, String> changeWordOrder(String[] firstWords, String[] secondWords){
        String[] ArrayWithMoreWords, ArrayWithLessWords;
        StringBuilder smallerString  = new StringBuilder();
        StringBuilder biggerString = new StringBuilder();
        List<String> wordsAlreadyInBiggerString = new ArrayList<>();
        PriorityQueue<SimilarityPairs> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

        if(firstWords.length > secondWords.length){
            ArrayWithMoreWords = firstWords;
            ArrayWithLessWords = secondWords;
        }
        else{
            ArrayWithMoreWords = secondWords;
            ArrayWithLessWords = firstWords;
        }

        for (String lessWord : ArrayWithLessWords) {
            for (String moreWord : ArrayWithMoreWords) {
                double averageSimilarity = (calculateJaroSimilarity(lessWord, moreWord)+
                        calculateJaccardSimilarity(lessWord, moreWord)+calculateNormLevenshteinSimilarity(lessWord, moreWord)) / 3;

                maxHeap.add(new SimilarityPairs(lessWord, moreWord, averageSimilarity));
            }
        }

        arrangeWordsBySimilarityPairs(ArrayWithLessWords.length, smallerString, biggerString, wordsAlreadyInBiggerString, maxHeap);

        if(ArrayWithLessWords.length != ArrayWithMoreWords.length) {
            fillInLeftWords(ArrayWithMoreWords, biggerString, wordsAlreadyInBiggerString);
        }

        return(new Entry<>(smallerString.toString(), biggerString.toString()));
    }

    /**
     * Calculate the similarity of two strings with the "Jaro Winkler Algorithm".
     *
     * @param first contains a string
     * @param second contains another string
     * @return the similarity value of both strings (value is a float value between 0 and 1 (0 = not similar, 1 = identical))
     */
    private static double calculateJaroSimilarity(String first, String second){
        return jw.similarity(first, second);
    }

    /**
     * Calculate the similarity of two strings with the "Normalized Levenshtein Algorithm".
     *
     * @param first contains a string
     * @param second contains another string
     * @return the similarity value of both strings (value is a float value between 0 and 1 (0 = not similar, 1 = identical))
     */
    private static double calculateNormLevenshteinSimilarity(String first, String second){
        return nl.similarity(first, second);
    }

    /**
     * Calculate the similarity of two strings with the "Jaccard Algorithm".
     *
     * @param first contains a string
     * @param second contains another string
     * @return the similarity value of both strings (value is a float value between 0 and 1 (0 = not similar, 1 = identical))
     */
    private static double calculateJaccardSimilarity(String first, String second){
        return jc.similarity(first, second);
    }

    /**
     * If no Strings is a single words, splits both strings into its single words and save them into Array.
     * Creates best order of both equivalent to each other (best order means, for highest possible similarity value).
     * Calculates similarity values of both ordered strings with the different compositional methods.
     *
     * @param first contains a string
     * @param second contains another string
     * @return the highest similarity value of these two strings
     */
    public static Double[] compareStrings(String first, String second){
        final int numAlgorithms = 3;

        String[] firstWords = makeUniformStringArray(first);
        String[] secondWords = makeUniformStringArray(second);
        Double[] compositionalSimilarities = new Double[CompSimEnum.values().length];
        double[] similarities = new double[3];

        Entry<String, String> orderedStrings = changeWordOrder(firstWords, secondWords);

        similarities[0] = calculateJaroSimilarity(orderedStrings.getKey(), orderedStrings.getValue());
        similarities[1] = calculateJaccardSimilarity(orderedStrings.getKey(), orderedStrings.getValue());
        similarities[2] = calculateNormLevenshteinSimilarity(orderedStrings.getKey(), orderedStrings.getValue());

        compositionalSimilarities[CompSimEnum.jaroWinkler.index] = similarities[0];
        compositionalSimilarities[CompSimEnum.jaccard.index] = similarities[1];
        compositionalSimilarities[CompSimEnum.normLevenshtein.index] = similarities[2];
        compositionalSimilarities[CompSimEnum.min.index] = NumberUtils.min(similarities);
        compositionalSimilarities[CompSimEnum.max.index] = NumberUtils.max(similarities);
        compositionalSimilarities[CompSimEnum.average.index] = (similarities[0]+similarities[1]+similarities[2]) / numAlgorithms;
        //not yet realized
        compositionalSimilarities[CompSimEnum.weighted.index] = 0.0;

        return compositionalSimilarities;
    }
}