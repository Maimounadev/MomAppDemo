require("dotenv").config();
const apiUrl = 'https://api.openai.com/v1/models/text-davinci-003';


const { Configuration, OpenAIApi } = require('openai')

async function openAI() {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const foods = ['apples', 'orange', 'sugar', 'flour']
    let prompt = 'Give me a recipe using only these ingredients:'
    foods.forEach(food => prompt += food + ',')
    console.log(prompt)
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt}],
      });
      console.log(completion.data.choices[0].message);
}

openAI()


// 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