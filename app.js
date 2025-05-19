import { __dirname, connectDB, deepSeekRequest, delay, post2TGg } from './functions.js'
import * as fs from 'fs'
import path from 'path'
import FbService from './FbService.js'
import axios from 'axios'
import { JSDOM } from 'jsdom'

const connection = await connectDB()

const server = async () => {
  console.log(new Date(), ' server')

  const articles = []

  const { data } = await axios.get('https://www.pokernews.com/news/')
  const dom = new JSDOM(data)

  Array.from(dom.window.document.querySelectorAll('.articles li')).forEach(a => articles.push({
    title: a.querySelector('a').textContent.replace(/\s+/g, ' ').trim(),
    source: a.querySelector('a').getAttribute('href')
  }))

  let list = articles.map(a => a.source)
  const posts = []
  const images = []

  async function fetchPosts () {
    for (const item of list) {
      const { data } = await axios.get('https://www.pokernews.com' + item)
      const page = new JSDOM(data)

      if (Date.parse(page.window.document.querySelector('time').getAttribute('datetime')) > new Date() - 12 * 3600000) {
        try {
          const content = `-article-\n${item} - ссылка на источник\n${page.window.document.querySelector('article').textContent.trim()}\n-/article-`
          posts.push(content)
          images.push(page.window.document.querySelector('.article__photo img').getAttribute('src'))
          await delay(5000)
        } catch (error) {
          console.error(`Ошибка при загрузке ${item}:`, error)
        }
      } else break
    }
  }

  await fetchPosts()

  const prompt2 = fs.readFileSync(path.join(__dirname, './prompt-poker.txt')).toString().replace('{content}', posts.join('\n')).replace('{date}', String(new Date()))

  const result = (await deepSeekRequest(prompt2))

  const articles1 = result.split('*статьи*').pop().split('*/статьи*')[0].split('*статьи*\n').pop().split('*/статьи*')[0]
    .split('*статья*').filter(a => a.length > 100)

  for (let i = 0; i < articles1.length; i++) {
    let a = articles1[i].split('*/статья*')[0]
    await connection.collection('poker_articles').insertOne({ content: a, image: images[i] })
  }
}

const queue = async () => {
  console.log(new Date(), ' queue')
  const a = await connection.collection('poker_articles').findOne()

  if (a) {
    console.log(' queue')
    const caption = a.content.split('-telegram-').filter(p => p.includes('-/telegram-')).pop()?.split('-/telegram-')[0]
    const text = a.content.split('-facebook-').filter(p => p.includes('-/facebook-')).pop()?.split('-/facebook-')[0]

    await connection.collection('articles').deleteOne({ _id: a._id })
    if (caption.length) {
      await post2TGg(
        {
          caption,
          image: a.image,
        },
        process.env.BOT_TOKEN,
        process.env.CHAT_USERNAME
      )
    } else {
      console.log('caption is empty 73')
    }

    if (text.length) {
      await new FbService().posting(
        {
          image: a.image,
          content: text,
        },
        process.env.FB_PAGE_ID,
        0
      )
    } else {
      console.log('content is empty 86')
    }
  }
}

// cron.schedule('0 */4 * * *', () => queue())
//
// cron.schedule('0 0,12 * * *', () => server())
//
// cron.schedule('0 10 1 * *', () => new FbService().refresh())
//
console.log(new Date())