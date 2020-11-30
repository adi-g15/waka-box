const fs = require("fs");

function readMappingFile(filename) {
    const text = fs.readFileSync(filename, "utf-8");
    return text.trim().split(/\r?\n/g)
        .map(line => line.split("\t"))
        .reduce((cum, [key, val]) => ({
            ...cum,
            [key]: val,
        }), {});
}

module.exports = {
    readMappingFile,
};
