const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Load service account credentials
const credentials = JSON.parse(fs.readFileSync('./steel-aria-446606-r3-aa32625c39f2.json'));

// Set up Google Sheets API client
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '131pPi-WIuwbifJGwBUMeV-fiEtf_DsxvxafieaCCr_U'; // replace with your Google Sheet ID
const RANGE = 'Sheet1!A:B'; // replace with your desired range

// Capture user's IP and UPI Address
app.post('/submit', async (req, res) => {
    try {
        const { upiAddress } = req.body;

        // Capture the IP address using a third-party API
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const userIP = ipResponse.data.ip;

        // Get current time in IST using toLocaleString with timeZone option
        const istDate = new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });

        // Convert to a Date object to format it in ISO style with milliseconds
        const timestampDate = new Date(istDate);
        const year = timestampDate.getFullYear();
        const month = (timestampDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const day = timestampDate.getDate().toString().padStart(2, '0');
        const hours = timestampDate.getHours().toString().padStart(2, '0');
        const minutes = timestampDate.getMinutes().toString().padStart(2, '0');
        const seconds = timestampDate.getSeconds().toString().padStart(2, '0');
        const milliseconds = timestampDate.getMilliseconds().toString().padStart(3, '0');

        // Final formatted timestamp in IST with milliseconds
        const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+05:30`;

        // Append IP, UPI address, and timestamp to Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
            valueInputOption: 'RAW',
            resource: {
                values: [[userIP, upiAddress, timestamp]],
            },
        });

        // Respond with success message and redirect URL
        res.status(200).json({
            message: 'Data submitted successfully',
            redirectUrl: 'https://mdeal.in/c_phNFCX686WfF5Vp'  // Send the URL to redirect to
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
