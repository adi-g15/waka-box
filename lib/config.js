const fs = require("fs");

function readConfigFile(filename) {
    const text = fs.readFileSync(filename, "utf-8");
    return text.trim().replace(/\r?\n/g, " ");
}

module.exports = {
    readConfigFile,
};
