import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'
import 'dotenv/config'
import * as fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

console.log(process.env.MONGO_LINK)
//process.exit()
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
    console.log('ptg published', new Date())
  } catch (e) {

    console.log(new Date(), ' tg')
    console.log(e)
    log(e)
  }
}

export const log = text => {
  fs.appendFileSync(path.join(__dirname, './server.log'), String(text + '\n'))
}
export const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const scanDir = async (dir) => {
  try {
    const items = await fs.promises.readdir(dir)
    const files = []

    for (const item of items) {
      const itemPath = path.join(dir, item)
      const stat = await fs.promises.stat(itemPath)
      if (stat.isFile()) {
        files.push(item)
      }
    }
    return files
  } catch (err) {
    console.error('Ошибка:', err)
  }
}

export const getSecondLevelDomain = (url) => {
  try {
    // Преобразуем в URL-объект (если передан полный URL)
    const hostname = new URL(url.includes('://') ? url : `https://${url}`).hostname

    // Разбиваем хост на части
    const parts = hostname.split('.')

    // Домен второго уровня — это предпоследний элемент
    if (parts.length >= 2) {
      return parts[parts.length - 2]
    }

    return null
  } catch (error) {
    console.error('Ошибка обработки URL:', error)
    return null
  }
}
