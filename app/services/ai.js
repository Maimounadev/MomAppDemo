document.querySelector('.sendMessage').addEventListener(click, getMessage)
require("dotenv").config();
const { Configuration, OpenAIApi } = require('openai');

async function openAI() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY // Retrieving API key from environment variable
  });

  const openai = new OpenAIApi(configuration);
  let prompt = 'Give me a quick recipe for a baby eating solids:';
  // Update the foods array or remove this part if not needed
  const foods = ['food1', 'food2', 'food3'];
  foods.forEach(food => prompt += food + ',');

  console.log(prompt);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    console.log(completion.data.choices[0].message);
  } catch (error) {
    console.error("Error generating response:", error);
  }
}

openAI();
