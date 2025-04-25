const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.SENDINBLUE_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      listIds: [4],
      updateEnabled: true
    })
  });

  const data = await response.json();

  if (response.ok) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success" })
    };
  } else {
    return {
      statusCode: response.status,
      body: JSON.stringify({ message: data.message || "An error occurred." })
    };
  }
};
