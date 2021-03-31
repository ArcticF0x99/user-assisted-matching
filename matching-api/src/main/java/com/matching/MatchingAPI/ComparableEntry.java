package com.matching.MatchingAPI;

/**
 * Implementation of "Entry".
 * Adds comparability to the pair objects (compares only the value parameter).
 *
 * @param <T> first type to add (every type)
 * @param <V> second type to add (every type that is comparable)
 */
public class ComparableEntry<T,V extends Comparable<V>> extends Entry<T,V> implements Comparable<Entry<T,V>>{
    public ComparableEntry(T key, V value) {
        super(key, value);
    }


    @Override
    public int compareTo(Entry<T,V> other) {
        return this.getValue().compareTo(other.getValue());
    }
}
