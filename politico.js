import axios from 'axios'
import { JSDOM } from 'jsdom'

const toDateObj = (dateString) => {
  dateString = dateString.replace(/\s+/g, ' ').trim()
// Создаем объект для преобразования названий месяцев в числовой формат (0-11)
  const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  }

// Разбиваем строку на части
  const parts = dateString.split(' ').map(p => p.trim())
// Результат: ["February", "28", "2025", "10:58", "am", "CET"]

// Извлекаем компоненты даты
  const monthName = parts[0].toLowerCase() // "february"
  const day = parts[1] // "28"
  const year = parts[2] // "2025"
  const time = parts[3].split(':') // ["10", "58"]
  const period = parts[4].toLowerCase() // "am"
  const timezone = parts[5] // "CET"

// Преобразуем время в 24-часовой формат
  let hours = parseInt(time[0])
  const minutes = time[1]
  if (period === 'pm' && hours !== 12) {
    hours += 12
  } else if (period === 'am' && hours === 12) {
    hours = 0
  }

// Создаем строку в формате ISO 8601 с учетом часового пояса (CET = UTC+1)
  const isoString = year + '-' + monthName + '-' + parts[1] + hours + ':' + minutes + ':00+01:00'

// Создаем объект Date
  return new Date(isoString)
}

export const politicoArticles = async () => {
  const { data } = await axios.get('https://www.politico.eu/section/policy/')
  const dom = new JSDOM(data)
  const articles = []
  Array.from(dom.window.document.querySelectorAll('.article-card')).filter(a => a.querySelector('a').getAttribute('href').includes('/article/') && toDateObj(a.querySelector('.date-time').textContent) > new Date(Date.now() - 6 * 60 * 60 * 1000)).forEach(a => articles.push({
    title: a.querySelector('a').textContent.replace(/\s+/g, ' ').trim(),
    source: a.querySelector('a').getAttribute('href')
  }))
  return articles
}
