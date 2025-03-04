import { __dirname, connectDB, deepSeekRequest, delay, post2TGg } from './functions.js'
import { politicoArticles } from './politico.js'
import { dwArticles } from './dw.js'
import * as fs from 'fs'
import path from 'path'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import FbService from './FbService.js'
import cron from 'node-cron'

const connection = await connectDB()

const server = async () => {
  console.log(new Date())

  const articles = (await dwArticles())
    .concat(await politicoArticles())
  console.log('-------------------------------')

  let list
  if (articles.length > 3) {
    const prompt = fs.readFileSync(path.join(__dirname, './prompt0.txt')).toString().replace('*список*', articles.map(a => a.title + '(' + a.source + ')').join('\n'))
    console.log(prompt)
    list = (await deepSeekRequest(prompt)).split('-list-').pop().split('-/list-')[0].split('\n').filter(l => l.length)
    console.log(list, 'links array')
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
          src = Array.from(dom.window.document.querySelectorAll('source')).map(s => s.getAttribute('srcset')).filter(l => l).pop().split(',').pop().split(' ').filter(l => l.includes('https'))[0]
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
  await delay(10000)
  console.log('++++++++++++++POSTS++++++++++++++++')
  console.log(posts, 160)
  console.log('++++++++++++++++POSTS++++++++++++++++++++++++')
  const prompt2 = fs.readFileSync(path.join(__dirname, './prompt5.txt')).toString().replace('{content}', posts.join('\n')).replace('{date}', String(new Date()))

  const result = (await deepSeekRequest(prompt2))
  console.log(result, 165)

  const articles1 = result.split('*статьи*').pop().split('*/статьи*')[0].split('*статьи*\n').pop().split('*/статьи*')[0]
    .split('*статья*').filter(a => a.length > 100)

  for (let i = 0; i < articles1.length; i++) {
    console.log(articles1[i].split('*/статья*'))
    let a = articles1[i].split('*/статья*')[0]
    await connection.collection('articles').insertOne({ content: a, image: images[i] })
  }
}

const queue = async () => {
  const a = await connection.collection('articles').findOne()

  if (a) {
    await connection.collection('articles').deleteOne({ _id: a._id })
    const caption = a.content.split('-telegram-').filter(p => p.includes('-/telegram-')).pop()?.split('-/telegram-')[0]
    const text = a.content.split('-facebook-').filter(p => p.includes('-/facebook-')).pop()?.split('-/facebook-')[0]

    if (caption.length) {
      await post2TGg(
        {
          caption,
          image: a.image,
        },
        process.env.BOT_TOKEN_POST,
        process.env.BOT_USERNAME_POST
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
        process.env.FB_POST_PAGE_ID,
        1
      )
    } else {
      console.log('content is empty 86')
    }
  }
}

cron.schedule('0 */2 * * *', () => queue())

cron.schedule('0 3,9,15,21 * * *', () => server())