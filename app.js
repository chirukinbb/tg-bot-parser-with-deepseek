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

// const connection = await connectDB()
//
// const resources = await connection.collection('resources').find().toArray()
//
// for (const resource of resources) {
//   console.log(resource.path)
//   const model = (await import('./resources/uapoker.js')).default
//   const { data } = await axios.get(model.home)
//   fs.writeFileSync(path.join(__dirname, './server.html'), data)
//   const dom = new JSDOM(data)
//
//   const link = Array.from(dom.window.document.querySelectorAll(model.selectors.link))[1].getAttribute('href')
//   console.log(link)
//   if (!resource.slugs.includes(link)) {
//     console.log(734444444444)
//     try {
//       await delay(5000)
//       console.log(734444444444)
//       const data2 = await axios.get(link)
//       const page = new JSDOM(data2.data)
//       console.log(page.window.document.querySelector(model.selectors.content).textContent.trim()
//         , page.window.document.querySelector(model.selectors.image).getAttribute('src')
//         , 73)
//       // await connection.collection('sources').updateOne(
//       //   { _id: resource._id },  // Фильтр для поиска нужного ресурса
//       //   { $addToSet: { urls: link } }  // Добавляем значение в массив, если его нет
//       // )
//       //
//       // const page = new JSDOM(data2.data)
//       // if (page.window.document.querySelector(model.selectors.content).textContent.trim().length > 100) {
//       //   const prompt = fs.readFileSync(path.join(__dirname, './prompt.txt')).toString().replace('{link}', link).replace('{content}', page.window.document.querySelector(model.selectors.content.trim()).textContent)
//       //   const content = await deepSeekRequest(prompt)
//       //   const caption = content.split('-telegram-').filter(p => p.includes('-/telegram-')).pop().split('-/telegram-')[0]
//       //   console.log(caption.length, 74)
//       //
//       //   if (caption.length) {
//       //     await post2TGg({
//       //       caption,
//       //       image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src')
//       //     }, process.env.BOT_TOKEN_POST, process.env.BOT_USERNAME_POST)
//       //   } else console.log('caption is empty 73')
//       //
//       //   const text = content.split('-facebook-').filter(p => p.includes('-/facebook-')).pop().split('-/facebook-')[0]
//       //   console.log(text.length, 83)
//       //   if (text.length) {
//       //     await new FbService().posting({
//       //       image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src'),
//       //       content: text
//       //     }, process.env.FB_POST_PAGE_ID, 1)
//       //   } else console.log('content is empty 86')
//       // }
//     } catch (e) {
//       console.log(e)
//     }
//   }
// }
// const resources = await connection.collection('resources').find().toArray()
//
// for (const resource of resources) {
//   try {
//     const model = (await import('./resources/' + resource.path + '.js')).default
//
//     const { data } = await axios.get(model.home)
//     const dom = new JSDOM(data)
//
//     let href = dom.window.document.querySelector(model.selectors.link).getAttribute('href'),
//       slug = href.split('/').filter(p => p.length).pop()//.splice(0, -1);
//
//     if (resource.slugs.includes(slug)) {
//       const { data } = await axios.get(model.prefix + href)
//       const page = new JSDOM(data)
//       const caption = await deepSeekRequest(
//         'используй Telegram HTML для выделления главного и сократи до 900 символов сохранив главное в тексте(' +
//         'перед ппервым HTML тегом и после в конце текста сообщения поставь группу символов !@!):' + page.window.document.querySelector(model.selectors.content).textContent
//       )
//
//       if (caption.length) {
//         await post2TGg({
//           caption: caption.split('!@!').filter(p => p.length).pop(),
//           image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src')
//         }, process.env.BOT_TOKEN, process.env.CHAT_USERNAME)
//       } else console.log('caption is empty 37')
//
//       await new FbService().posting({
//         image: model.prefix + page.window.document.querySelector(model.selectors.image).getAttribute('src'),
//         content: page.window.document.querySelector(model.selectors.content).textContent
//       }, process.env.FB_PAGE_ID, 0)
//       resource.slugs.push(slug)
//       await connection.collection('resources').updateOne(
//         { _id: resource._id },  // Фильтр для поиска нужного ресурса
//         { $addToSet: { slugs: slug } }  // Добавляем значение в массив, если его нет
//       )
//     }
//   } catch (error) {
//     console.error('Ошибка парсинга:', error)
//   }
// }
// cron.schedule('0 */6 * * *', async () => {
//   const articles = (await dwArticles())
//     .concat(await politicoArticles())
//
//   console.log(await dwArticles())
//   console.log(await politicoArticles())
//   console.log(articles.map(a => a.title + '(' + a.source + ')').join('\n'))
// })
//