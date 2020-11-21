const fs = require("fs");

function readConfigFile(filename) {
    const text = fs.readFileSync(filename, "utf-8");
    return text.trim().split(/\r?\n/g);
}

module.exports = {
    readConfigFile,
};
