const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');

const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')  // Ensure proper line breaks in private key
};

// Set up Google Sheets API client
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '131pPi-WIuwbifJGwBUMeV-fiEtf_DsxvxafieaCCr_U'; // replace with your Google Sheet ID
const RANGE = 'Sheet1!A:C'; // Updated range to store both IP addresses (IPv4, IPv6)

// Enable CORS
const corsOptions = {
    origin: '*', // Allow all origins
};

module.exports = async (req, res) => {
    // Apply CORS middleware
    cors(corsOptions)(req, res, async () => {
        if (req.method === 'POST') {
            try {
                const { upiAddress } = req.body;

                // Get the actual client IP from the request headers (X-Forwarded-For)
                const forwardedIP = req.headers['x-forwarded-for']; 
                const userIP = req.connection.remoteAddress;

                // Extract IPv4 and IPv6 addresses from the forwarded IP
                let ipv4Address = '';
                let ipv6Address = '';
                
                if (forwardedIP) {
                    const ipAddresses = forwardedIP.split(','); // Split in case of multiple forwarded IPs
                    // Check for IPv6 and IPv4 addresses
                    ipAddresses.forEach(ip => {
                        if (ip.includes(':')) {
                            ipv6Address = ip.trim(); // This is an IPv6 address
                        } else {
                            ipv4Address = ip.trim(); // This is an IPv4 address
                        }
                    });
                }

                // Fallback to user IP if forwarded IP is not available
                if (!ipv4Address && !ipv6Address) {
                    if (userIP.includes(':')) {
                        ipv6Address = userIP; // IPv6 fallback
                    } else {
                        ipv4Address = userIP; // IPv4 fallback
                    }
                }

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

                // Append both IPs, UPI address, and timestamp to Google Sheets
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: RANGE,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [[ipv4Address, ipv6Address, upiAddress, timestamp]],
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
        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    });
};
