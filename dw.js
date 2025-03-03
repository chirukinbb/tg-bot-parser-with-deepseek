import axios from 'axios'

export const dwArticles = async () => {
  const { data } = await axios.get('https://www.dw.com/uk/%D0%B3%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%B0/s-9874')

  const json = data.split('window.__APP_STATE__=')[1].split('}};')[0] + '}}'

  const news = JSON.parse(json)['/graph-api/uk/content/navigation/9874'].data.content.contentComposition.informationSpaces[0].news[0].contents
  const articles = []
  news.filter(a => new Date(a.contentDate) > new Date(Date.now() - 6 * 60 * 60 * 1000)).forEach(a => articles.push({
    title: a.title,
    source: 'https://www.dw.com' + a.namedUrl
  }))

  return articles
}