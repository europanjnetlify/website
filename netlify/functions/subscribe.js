// Dynamically import node-fetch (ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async function(event, context) {
    try {
        const data = JSON.parse(event.body);
        console.log('Form Data:', data); // Check what data is being received

        // If the email is missing, send a clear error
        if (!data.email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Email is required' }),
            };
        }

        // Your Brevo API call
        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SENDINBLUE_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                email: data.email,
                listIds: [4],
                updateEnabled: true,
            }),
        });

        if (!response.ok) {
            console.log('API Error:', await response.text()); // Log API error response
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: 'Error: ' + response.statusText }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success!' }),
        };
    } catch (error) {
        console.error('Error:', error); // Log unexpected errors
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error: ' + error.message }),
        };
    }
};
