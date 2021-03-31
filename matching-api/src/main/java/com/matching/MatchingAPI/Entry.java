package com.matching.MatchingAPI;

/**
 * Generic pair class.
 * To create pair object with every types you want.
 *
 * @param <T> first type to add
 * @param <V> second type to add
 */
public class Entry<T,V>{
    private T key;
    private V value;

    public Entry(T key, V value) {
        this.key = key;
        this.value = value;
    }

    public V getValue() {
        return value;
    }

    public T getKey() {
        return key;
    }
}