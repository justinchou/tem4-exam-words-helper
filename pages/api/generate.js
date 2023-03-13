import _ from "lodash";
import { Configuration, OpenAIApi } from "openai";

import words from "./tem4-words.json";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const withVPN = process.env.WITH_VPN == "true";
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  let newWords = parseInt(req.body.newWords) || 20;
  if (newWords < 1) {
    newWords = 20;
  }

  try {
    const picks = generateTEM4(newWords);
    const question = `Write a short passage around ${
      newWords * 25 > 600 ? newWords * 25 : 600
    } words with the following vocabularies: ${picks.join(", ")}`;
    console.log(question);

    const options = {
      timeout: 10000,
    };
    if (withVPN) {
      options.proxy = {
        host: "127.0.0.1",
        port: "7890",
        // auth: {
        //   username: "",
        //   password: "",
        // },
        protocol: "http",
      };
    }
    console.log("chat-gpt-options %j", options);

    const completion = await openai.createChatCompletion(
      {
        // model: "text-davinci-003",
        model: "gpt-3.5-turbo",
        // prompt: generatePrompt(animal),
        messages: [{ role: "user", content: question }],
        temperature: 0.6,
      },
      options
    );

    const dicts = {};
    for (let i = 0; i < picks.length; i++) {
      dicts[picks[i]] = words[picks[i]];
    }

    res.status(200).json({ result: completion.data.choices[0].message.content, picks, dicts });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}

function generatePrompt(animal) {
  const capitalizedAnimal = animal[0].toUpperCase() + animal.slice(1).toLowerCase();
  return `Suggest three names for an animal that is a superhero.

Animal: Cat
Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
Animal: Dog
Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
Animal: ${capitalizedAnimal}
Names:`;
}

function generateTEM4(len) {
  let picks = _.shuffle(Object.keys(words));
  picks = picks.slice(0, len);

  return picks;
}
