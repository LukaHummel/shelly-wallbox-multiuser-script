let notificationScriptId = 2; // Replace with your script ID
let blueButton = "bthomesensor:201";
let redButton = "bthomesensor:203";
// Debug: Log script start
console.log("Wallbox script started");
// Monitor Switch state changes
Shelly.addEventHandler(function(ev) {
    // Unlock Wallbox if blue or red button is pressed
    if (ev.component === blueButton || ev.component === redButton) {
        let startTime = ev.now;
        Shelly.call("Switch.Set", { id: 100, on: true });
        // Check every 900000ms (15min) if the power is still used
        // Set to 900ms for testing purposes
        let timerHandle = Timer.set(900, true, function() {
            let currentPower = Shelly.getComponentStatus("em:0").total_act_power
            console.log("Current power:", currentPower); // Debug log
            // Check if power is still used
            if (currentPower > 10) {
                console.log("Power is still used, not locking");
            }
            else {
                // Add handler to listen for lock event
                let getTimeHandler = Shelly.addEventHandler(function(getLockTime) {
                    if (getLockTime.component === "switch:100" && getLockTime.info.state === false) {
                        let endTime = getLockTime.now
                        // Stop the timer
                        Timer.clear(timerHandle);
                        // Remove the handler
                        Shelly.removeEventHandler(getTimeHandler);
                        console.log("Handler removed");
                        // Get the power usage for the time the wallbox was unlocked
                        Shelly.call("EMData.GetData", {id: 0, ts: startTime, ts_end: endTime}, function(getPowerUsage) {
                            if (getPowerUsage) {
                                // Sum all values in the response
                                let json = getPowerUsage;
                                let total = 0;
                                for (let i = 0; i < json.data.length; i++) {
                                    let values = json.data[i].values;
                                    for (let j = 0; j < values.length; j++) {
                                        for (let k = 0; k < values[j].length; k++) {
                                            total += values[j][k];
                                        }
                                    }
                                }
                                // Add the total to the correct KVS
                                if (ev.component === blueButton) {
                                    Shelly.call("KVS.Get", {key: "powerUsageBlue"}, function(getBlueWallbox) {
                                        let storedPower = getBlueWallbox.value;
                                        Shelly.call("KVS.Set", { key: "powerUsageBlue", value: total + storedPower });
                                        console.log("Blue wallbox unlocked, power usage:", total)
                                    });
                                }
                                else if (ev.component === redButton) {
                                    Shelly.call("KVS.Get", {key: "powerUsageRed"}, function(getRedWallbox) {
                                        let storedPower = getRedWallbox.value;
                                        Shelly.call("KVS.Set", { key: "powerUsageRed", value: total + storedPower });
                                        console.log("Red wallbox unlocked, power usage:", total);
                                    });
                                }
                                else {
                                    console.log("Unknown button pressed");
                                }
                            }
                        });
                    }
                });
            // Lock the wallbox
            Shelly.call("Switch.Set", { id: 100, on: false });
            console.log("Wallbox locked");
            }
        });
    }
}, null);
// Add schedule to send the yearly power usage and reset the KVS values via seperate script (https://shelly-api-docs.shelly.cloud/gen2/0.14/ComponentsAndServices/Schedule#schedulecreate)
let schedule = Shelly.call("Schedule.Create", {enable: true, timespec: "0 0 1 1 *", calls: [
    {"method": "Script.Start", "params": {"id": notificationScriptId}}
]
});