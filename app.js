import { __dirname, connectDB, deepSeekRequest, delay, log, post2TGg } from './functions.js'
import cron from 'node-cron'
import FbService from './FbService.js'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import * as fs from 'fs'
import path from 'path'

cron.schedule('0 0 1 * *', () => new FbService().refresh())

const connection = await connectDB()

cron.schedule('*/15 * * * *', async () => {
  log(new Date())
  console.log(new Date())
  let posted = false
  const sources = await connection.collection('sources').find().toArray()

  for (const resource of sources) {
    if (posted) break
    console.log(resource.path)
    const model = (await import('./sources/' + resource.path + '.js')).default

    const { data } = await axios.get(model.home)
    const dom = new JSDOM(data)
    const link = dom.window.document.querySelector(model.selectors.link).getAttribute('href')
    console.log(resource.urls.includes(link), link, 67)

    if (!resource.urls.includes(link)) {
      console.log(734444444444)
      try {
        await delay(5000)
        console.log(734444444444)
        const data2 = await axios.get(link)
        console.log(73)
        await connection.collection('sources').updateOne(
          { _id: resource._id },  // Фильтр для поиска нужного ресурса
          { $addToSet: { urls: link } }  // Добавляем значение в массив, если его нет
        )

        const page = new JSDOM(data2.data)
        if (page.window.document.querySelector(model.selectors.content).textContent.trim().length > 100) {
          const prompt = fs.readFileSync(path.join(__dirname, './prompt.txt')).toString().replace('{link}', link).replace('{content}', page.window.document.querySelector(model.selectors.content.trim()).textContent).replace('{date}', String(new Date()))
          const content = await deepSeekRequest(prompt)
          const caption = content.split('-telegram-').filter(p => p.includes('-/telegram-')).pop().split('-/telegram-')[0]
          console.log(caption.length, 74)

          if (caption.length) {
            await post2TGg({
              caption,
              image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src')
            }, process.env.BOT_TOKEN_POST, process.env.BOT_USERNAME_POST)
          } else console.log('caption is empty 73')

          const text = content.split('-facebook-').filter(p => p.includes('-/facebook-')).pop().split('-/facebook-')[0]
          console.log(text.length, 83)
          if (text.length) {
            posted = await new FbService().posting({
              image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src'),
              content: text
            }, process.env.FB_POST_PAGE_ID, 1)
          } else console.log('content is empty 86')
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
})