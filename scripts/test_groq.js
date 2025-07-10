require('groq-sdk/shims/node');
const { Groq } = require('groq-sdk');

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY');
    process.exit(1);
  }
  const client = new Groq({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.3-70b-versatile'
    });
    console.log('Response:', completion.choices[0].message.content);
  } catch (err) {
    console.error('Error:', err.message || err.toString());
    process.exit(1);
  }
}

main();
