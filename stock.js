const fs = require('fs');
const Directory_Path = "./data";

const saveToFile = (data) => {

    if (!fs.existsSync(Directory_Path)) {
        fs.mkdirSync(Directory_Path);
    }
    // Save data as JSON file with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filePath = `${Directory_Path}/${currentDate}-companies.json`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { saveToFile };