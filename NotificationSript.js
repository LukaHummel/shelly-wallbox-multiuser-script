let webhookUrl = yourWebhookUrl; // Replace with your webhook URL
let scriptId = Script.id
Shelly.call("KVS.Get", {key: "powerUsageBlue"}, function(getBlueWallbox) {
    console.log(getBlueWallbox.value)})
Shelly.call("KVS.Get", {key: "powerUsageRed"}, function(getRedWallbox) {
    console.log(getRedWallbox.value)})
Shelly.call("HTTP.GET", {url: webhookUrl+"?bluePower=0&amp;redPower=0"}, function(response) {
    console.log("Test")
});
Shelly.call("KVS.Set", { key: "powerUsageBlue", value: 0 });
Shelly.call("KVS.Set", { key: "powerUsageRed", value: 0 });
Shelly.call("Script.Stop", {id: scriptId}, function(stop) {
    console.log("Script stopped");
});