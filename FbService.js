import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { __dirname, log } from './functions.js'

export default class FbService {
  appId
  appSecret

  constructor () {
    this.appId = process.env.FB_APP_ID
    this.appSecret = process.env.FB_APP_SECRET
  }

  async getLongLivedUserToken (shortLivedToken) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken
        }
      })

      console.log('Long-Lived User Token:', response.data.access_token)
      return response.data.access_token
    } catch (error) {
      console.error('Ошибка при получении Long-Lived User Token:', error.response.data)
    }
  }

  async getPageAccessToken (longLivedUserToken, pageId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/` + pageId, {
        params: {
          fields: 'access_token',
          access_token: longLivedUserToken
        }
      })

      console.log('Page Access Token:', response.data.access_token)
      return response.data.access_token
    } catch (error) {
      console.error('Ошибка при получении Page Access Token:', error.response.data)
    }
  }

  async refreshLongLivedUserToken (longLivedUserToken) {
    console.log('🔄 Обновление токенов...')

    try {
      // Обновляем User Access Token
      const userResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: longLivedUserToken
        }
      })

      return userResponse.data.access_token
    } catch (error) {
      console.error('❌ Ошибка при обновлении токенов:', error.response.data)
    }
  }

  async posting (post, pageId, token) {
    const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, './fb.json')).toString())

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/` + pageId + `/photos`,
        {
          url: post.image, // Ссылка на изображение
          message: post.content, // Текст поста
          access_token: token === 0 ? tokens.pokerPageAccessToken : tokens.postPageAccessToken // Токен доступа
        }
      )

      console.log(new Date(), ' fb')
      console.log('Пост опубликован:', response.data)
      return true
    } catch (error) {
      console.log(new Date(), ' fb')
      console.log(error)
      log('Ошибка при публикации ФБ' +
        '')
      return false
    }
  }

  async refresh () {
    const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, './fb.json')).toString())

    if (!tokens.longLivedUserToken) {
      tokens.longLivedUserToken = await this.getLongLivedUserToken(tokens.shortLivedToken)
    } else tokens.longLivedUserToken = await this.refreshLongLivedUserToken(tokens.longLivedUserToken)

    tokens.pokerPageAccessToken = await this.getPageAccessToken(tokens.longLivedUserToken, process.env.FB_PAGE_ID)
    tokens.postPageAccessToken = await this.getPageAccessToken(tokens.longLivedUserToken, process.env.FB_POST_PAGE_ID)

    fs.writeFileSync(path.join(__dirname, './fb.json'), JSON.stringify(tokens))
  }
}