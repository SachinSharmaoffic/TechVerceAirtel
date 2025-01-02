// api/submit.js

const { google } = require('googleapis');
const axios = require('axios');

// Load service account credentials from environment variables
const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

// Set up Google Sheets API client
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const RANGE = 'Sheet1!A:B';

// Vercel serverless function handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { upiAddress } = req.body;

            // Capture the IP address using a third-party API
            const ipResponse = await axios.get('https://api.ipify.org?format=json');
            const userIP = ipResponse.data.ip;

            // Get current time in IST
            const istDate = new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });
            const timestampDate = new Date(istDate);
            const timestamp = timestampDate.toISOString();

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
                redirectUrl: 'https://mdeal.in/c_phNFCX686WfF5Vp'
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'An error occurred. Please try again.' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};
