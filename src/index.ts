import { Context, HTTP, Schema } from 'koishi'
import Assets from '@koishijs/assets'
import { } from '@koishijs/plugin-http'

import { createHash } from 'node:crypto'

export const name = 'assets-copyparty'

class CopypartyAssets extends Assets<CopypartyAssets.Config> {
  types = ['image', 'img', 'audio', 'video', 'file'] // 支持所有类型
  http: HTTP

  constructor(ctx: Context, config: CopypartyAssets.Config) {
    super(ctx, config)
    this.http = ctx.http.extend({
      headers: { accept: 'application/json' },
    })
    this.logInfo(`初始化完成 - 基础地址: ${config.endpoint}, 上传地址： ${config.bin}`)
  }

  private logInfo(...args: any[]) {
    if (this.config.loggerinfo) {
      const logger = this.ctx.logger('assets-copyparty')
        ; (logger.info as (...args: any[]) => void)(...args)
    }
  }

  async upload(url: string, file: string) {
    const { buffer, filename, type } = await this.analyze(url, file)
    const logger = this.ctx.logger('assets-copyparty')

    try {
      const uploadUrl = `${this.config.endpoint}/${this.config.bin}/${filename}`

      this.logInfo(`开始上传文件: ${filename}, 类型: ${type}, 目标URL: ${uploadUrl}`)

      // 上传文件
      const response = await this.http.put(uploadUrl, buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          // 'Accept': 'url',
          'CK': 'no', // thank you.
          'PW': this.config.password,
        },
      })

      this.logInfo(`文件上传完成，获取访问链接...`)

      // this.logInfo(response.fileurl)

      var finalUrl = response.fileurl
      this.logInfo(`上传成功: ${finalUrl}`)

      if (this.config.replace != null){
        finalUrl = finalUrl.replace(this.config.endpoint, this.config.replace)
        this.logInfo(`replace: ${finalUrl}`)
      }

      return finalUrl
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`上传失败: ${err.message}`)
      throw err
    }
  }

  async stats() {
    // copyparty 的stats我不会写！
    return {}
  }
}

namespace CopypartyAssets {
  export interface Config extends Assets.Config {
    endpoint: string
    bin: string
    password: string
    replace: string
    loggerinfo: boolean
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      endpoint: Schema.string()
        .role('link')
        .description('copyparty 服务地址')
        .required(),
      bin: Schema.string()
        .description('上传至文件夹')
        .required(),
      password: Schema.string()
        .description('copyparty 密码（可不填）')
        .experimental(),
      replace: Schema.string()
        .description('endpoint replace')
        .hidden(),
      loggerinfo: Schema.boolean()
        .default(false)
        .description('日志调试：一般输出<br>提issue时，请开启此功能 并且提供BUG复现日志')
        .experimental(),
    }),
    Assets.Config,
  ])

  export const usage = `
  ---
  
  要使用本插件提供的 assets 服务，你需要先关闭默认开启的 assets-local 插件，然后开启本插件。

  ---

  本插件使用 copyparty 实现服务，支持图片、音频、视频和其他文件的上传和存储。

  ---

  本插件后端服务来自: <a href="https://filebin.net" target="_blank">https://filebin.net</a>

  ---  
  `
}

export interface Config extends CopypartyAssets.Config { }

export const Config = CopypartyAssets.Config

export function apply(ctx: Context, config: Config) {
  ctx.plugin(CopypartyAssets, config)
}

export default CopypartyAssets
