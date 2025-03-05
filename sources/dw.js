import axios from 'axios'
import { JSDOM } from 'jsdom'

export default {
  links: async () => {
    const { data } = await axios.get('https://www.dw.com/uk/%D0%B3%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%B0/s-9874')

    const json = data.split('window.__APP_STATE__=')[1].split('}};')[0] + '}}'

    const news = JSON.parse(json)['/graph-api/uk/content/navigation/9874'].data.content.contentComposition.informationSpaces[0].news[0].contents
    const articles = []
    news.filter(a => new Date(a.contentDate) > new Date(Date.now() - 6 * 60 * 60 * 1000)).forEach(a => articles.push({
      title: a.title,
      source: 'https://www.dw.com' + a.namedUrl
    }))
    return articles
  },

  page: async (url) => {
    const { data } = await axios.get(url)
    const dom = new JSDOM(data)
    return {
      content: dom.window.document.querySelector('.cc0m0op.s1ebneao.rich-text.t1it8i9i.r1wgtjne.wgx1hx2.b1ho1h07').textContent,
      image: Array.from(dom.window.document.querySelectorAll('source')).map(s => s.getAttribute('srcset')).filter(l => l).pop().split(',').pop().split(' ').filter(l => l.includes('https'))[0]
    }
  }
}