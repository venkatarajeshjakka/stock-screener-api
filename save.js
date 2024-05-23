const fs = require('fs');
const Directory_Path = "./data";

const saveToFile = (data) => {

    if (!fs.existsSync(Directory_Path)) {
        fs.mkdirSync(Directory_Path);
    }
    // Save data as JSON file with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filePath = `${Directory_Path}/${currentDate}-companies.json`;
    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        // File exists, so read its contents
        let existingData = fs.readFileSync(filePath, 'utf-8');
        existingData = existingData ? JSON.parse(existingData) : [];

        // Append new data to existing data array
        existingData.push(...data);

        // Write updated data back to the file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    } else {
        // File doesn't exist, write new data to the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}

module.exports = { saveToFile };