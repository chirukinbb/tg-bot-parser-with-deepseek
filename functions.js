import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'
import 'dotenv/config'
import * as fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

export const deepSeekRequest = async (prompt, index = 0) => {
  try {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-r1:free',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_KEY,
        'Content-Type': 'application/json'
      },
    })
    console.log(index, res.data.choices?.[0]?.message?.content, 25)
    if (res.data.choices?.[0]?.message?.content.length > 0) {
      console.log('free')
      return res.data.choices?.[0]?.message?.content
    }

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-reasoner',
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ` + process.env.DEEPSEEK_KEY
        }
      }
    )

    log(
      '-deepseek-\n' +
      response.data.choices[0].message.content +

      '\n-deepseek-'
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message)
  }

  // const models = [
  //   'deepseek/deepseek-r1:free',
  //   'deepseek/deepseek-r1',
  //   'deepseek/deepseek-r1-distill-qwen-70b',
  //   'deepseek/deepseek-r1-distill-qwen-32b'
  // ]
  //
  // while (index < models.length) {
  //   try {
  //     const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
  //       model: models[index],
  //       messages: [{ role: 'user', content: prompt }]
  //     }, {
  //       headers: {
  //         'Authorization': 'Bearer ' + process.env.OPENROUTER_KEY,
  //         'Content-Type': 'application/json'
  //       },
  //     })
  //     console.log(index, res.data.choices?.[0]?.message?.content, 25)
  //     if (res.data.choices?.[0]?.message?.content.length > 0) {
  //       return res.data.choices?.[0]?.message?.content ?? null
  //     }
  //   } catch (error) {
  //     console.error(`Ошибка при запросе к модели ${models[index]}:`, error.message)
  //   }
  //
  //   index++ // Переключаемся на следующую модель
  // }
  // return null // Если ни одна модель не вернула ответ
}

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_LINK)
    console.log('MongoDB connected')
    return connection.connection // Возвращаем connection для доступа к коллекциям
  } catch (err) {
    console.error('Ошибка подключения:', err.message)
    process.exit(1)
  }
}

export const post2TGg = async (post, token, username) => {
  try {
    await new Telegraf(token).telegram.sendPhoto(
      username, // Юзернейм канала
      post.image,
      {
        caption: post.caption,
        parse_mode: 'HTML'
      }
    )
  } catch (e) {

    console.log(e)
    log(e)
  }
}

export const log = text => {
  fs.appendFileSync(path.join(__dirname, './server.log'), String(text + '\n'))
}
export const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))