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
import { __dirname, deepSeekRequest, log, post2TGg } from './functions.js'
import { politicoArticles } from './politico.js'
import { dwArticles } from './dw.js'
import * as fs from 'fs'
import path from 'path'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import FbService from './FbService.js'
import cron from 'node-cron'

const server = async () => {
  log(new Date())

  const articles = (await dwArticles())
    .concat(await politicoArticles())
  console.log('-------------------------------')

  let list
  if (articles.length > 3) {
    const prompt = fs.readFileSync(path.join(__dirname, './prompt0.txt')).toString().replace('*список*', articles.map(a => a.title + '(' + a.source + ')').join('\n'))
    console.log(prompt)
    list = (await deepSeekRequest(prompt)).split('-list-').pop().split('-/list-')[0].split('\n')
    console.log(list)
  } else list = articles.map(a => a.source)

  const posts = []
  const images = []

  async function fetchPosts () {
    for (const item of list) {
      try {
        console.log(item)
        const { data } = await axios.get(item)
        const dom = new JSDOM(data)
        let src

        let selector = ''
        if (item.includes('dw.com')) {
          src = Array.from(dom.window.document.querySelectorAll('source')).map(s => s.getAttribute('srcset')).pop().split(',').pop().split(' ')[1]
          selector = '.cc0m0op.s1ebneao.rich-text.t1it8i9i.r1wgtjne.wgx1hx2.b1ho1h07'
        } else {
          selector = '.article'
          src = dom.window.document.querySelector('.sidebar-grid__container img').getAttribute('src')
        }

        const element = dom.window.document.querySelector(selector)
        images.push(src)

        if (!element) {
          console.error(`Селектор не найден: ${selector} на ${item}`)
          continue
        }

        const content = `-article-\n${item} - ссылка на источник\n${element.textContent.trim()}\n-/article-`
        posts.push(content)
      } catch (error) {
        console.error(`Ошибка при загрузке ${item}:`, error)
      }
    }
  }

  console.log('++++++++++++++++++++++++++++++++++++++++')
  await fetchPosts()
  console.log(posts, 160)
  console.log('++++++++++++++++++++++++++++++++++++++++')
  const prompt2 = fs.readFileSync(path.join(__dirname, './prompt5.txt')).toString().replace('{content}', posts.join('\n')).replace('{date}', String(new Date()))

  const result = (await deepSeekRequest(prompt2)).split('*статьи*').pop().split('*/статьи*')[0]
  console.log(result, 165)

  const articles1 = result.split('*статьи*\n').pop().split('*/статьи*')[0].split('*статья*\n').filter(a => a.length)

  for (let i = 0; i < articles1.length; i++) {
    console.log(articles1[i].split('*/статья*'))
    let a = articles1[i].split('*/статья*\n')[0]
    console.log(a, 333)

    const caption = a.split('-telegram-').filter(p => p.includes('-/telegram-')).pop()?.split('-/telegram-')[0]
    const text = a.split('-facebook-').filter(p => p.includes('-/facebook-')).pop()?.split('-/facebook-')[0]

    console.log(caption.length, text.length, 242, i)

    setTimeout(async () => {
      console.log(caption.length, text.length, 309, i)
      if (caption.length) {
        await post2TGg(
          {
            caption,
            image: images[i],
          },
          process.env.BOT_TOKEN_POST,
          process.env.BOT_USERNAME_POST
        )
      } else {
        console.log('caption is empty 73')
      }

      console.log(text.length, 83)
      if (text.length) {
        await new FbService().posting(
          {
            image: images[i],
            content: text,
          },
          process.env.FB_POST_PAGE_ID,
          1
        )
      } else {
        console.log('content is empty 86')
      }
    }, i * 7200000)
  }
}

cron.schedule('0 3,9,15,21 * * *', () => server())
