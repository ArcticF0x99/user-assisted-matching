package com.matching.MatchingAPI.Matching;

import com.matching.MatchingAPI.DataConversion.DataConverter;
import com.matching.MatchingAPI.DataConversion.PartDatabaseConverter;
import com.matching.MatchingAPI.DataConversion.VirtualSatelliteConverter;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * The API that process the matching requests.
 * Takes the to be matched objects in one string and transfer them to "MatchingService" with the corresponding converters (converts the objects to internal format).
 */
@RestController
public class MatchingAPI {
    @RequestMapping(method = RequestMethod.PUT, path = "/json")
    public String returnJson(@RequestBody String jsonString) {
        DataConverter inputConverter = new PartDatabaseConverter();
        DataConverter outputConverter = new VirtualSatelliteConverter();
        return new MatchingService().generateMatchingSuggestions(jsonString, inputConverter, outputConverter);
    }

    @RequestMapping(method = RequestMethod.PUT, path = "/matchingWords")
    public String saveMatchingWords(@RequestBody String jsonString) {
        return MatchingService.addCorrectMatchingPairs(jsonString);
    }
}