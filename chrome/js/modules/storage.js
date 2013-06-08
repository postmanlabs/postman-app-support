pm.storage = {
    get: function(key, callback) {
        if (pm.target === pm.targets.CHROME_LEGACY_APP) {
            //Implementation here
        }
        else if (pm.target === pm.targets.CHROME_PACKAGED_APP) {            
            chrome.storage.local.get(key, function(result) {                     
                callback(result[key]); 
            });
        }
    },

    set: function(kvpair, callback) {
        if (pm.target === pm.targets.CHROME_LEGACY_APP) {
            //Implementation here
        }
        else if (pm.target === pm.targets.CHROME_PACKAGED_APP) {            
            chrome.storage.local.set(kvpair, function() {
                console.log("Finished setting the values");
            });
        }
    }
};