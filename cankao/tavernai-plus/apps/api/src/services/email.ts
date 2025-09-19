import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { prisma } from '../server'

// 邮件配置接口
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

// 验证码存储
interface VerificationCode {
  code: string
  email: string
  purpose: 'email_verification' | 'password_reset' | 'two_factor'
  expiresAt: Date
  attempts: number
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private verificationCodes = new Map<string, VerificationCode>()
  private readonly MAX_ATTEMPTS = 3
  private readonly CODE_LENGTH = 6
  private readonly EXPIRY_MINUTES = 10

  constructor() {
    this.initializeTransporter()
    // 定期清理过期的验证码
    setInterval(() => this.cleanupExpiredCodes(), 60000) // 每分钟清理一次
  }

  // 初始化邮件发送器
  private initializeTransporter() {
    const config = this.getEmailConfig()
    if (!config) {
      console.warn('邮件服务未配置')
      return
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false // 开发环境可以设置为false
        }
      })

      // 验证配置
      this.transporter.verify((error: any, success: any) => {
        if (error) {
          console.error('邮件服务配置错误:', error)
          this.transporter = null
        } else {
          console.log('✅ 邮件服务已就绪')
        }
      })
    } catch (error) {
      console.error('初始化邮件服务失败:', error)
    }
  }

  // 获取邮件配置
  private getEmailConfig(): EmailConfig | null {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587')
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.EMAIL_FROM || user

    if (!host || !user || !pass) {
      return null
    }

    return {
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      from: from || user || 'noreply@example.com'
    }
  }

  // 生成验证码
  generateVerificationCode(length: number = this.CODE_LENGTH): string {
    const digits = '0123456789'
    let code = ''
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)]
    }
    return code
  }

  // 生成唯一标识符
  private generateKey(email: string, purpose: string): string {
    return `${purpose}:${email.toLowerCase()}`
  }

  // 存储验证码
  storeVerificationCode(
    email: string,
    code: string,
    purpose: VerificationCode['purpose'] = 'email_verification'
  ): void {
    const key = this.generateKey(email, purpose)
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000)

    this.verificationCodes.set(key, {
      code,
      email,
      purpose,
      expiresAt,
      attempts: 0
    })
  }

  // 验证码验证
  verifyCode(
    email: string,
    code: string,
    purpose: VerificationCode['purpose'] = 'email_verification'
  ): boolean {
    const key = this.generateKey(email, purpose)
    const stored = this.verificationCodes.get(key)

    if (!stored) {
      return false
    }

    // 检查是否过期
    if (stored.expiresAt < new Date()) {
      this.verificationCodes.delete(key)
      return false
    }

    // 检查尝试次数
    if (stored.attempts >= this.MAX_ATTEMPTS) {
      this.verificationCodes.delete(key)
      return false
    }

    // 验证码不匹配
    if (stored.code !== code) {
      stored.attempts++
      return false
    }

    // 验证成功，删除验证码
    this.verificationCodes.delete(key)
    return true
  }

  // 清理过期的验证码
  private cleanupExpiredCodes(): void {
    const now = new Date()
    for (const [key, value] of this.verificationCodes.entries()) {
      if (value.expiresAt < now) {
        this.verificationCodes.delete(key)
      }
    }
  }

  // 发送验证邮件
  async sendVerificationEmail(email: string, username: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('邮件服务不可用')
      return false
    }

    const code = this.generateVerificationCode()
    this.storeVerificationCode(email, code, 'email_verification')

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">TavernAI Plus</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">邮箱验证</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            亲爱的 ${username}，
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            感谢您注册 TavernAI Plus！请使用以下验证码完成邮箱验证：
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            验证码有效期为 ${this.EXPIRY_MINUTES} 分钟。如果这不是您的操作，请忽略此邮件。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿直接回复
          </p>
        </div>
      </div>
    `

    try {
      const config = this.getEmailConfig()
      await this.transporter.sendMail({
        from: `"TavernAI Plus" <${config?.from}>`,
        to: email,
        subject: '【TavernAI Plus】邮箱验证码',
        html
      })

      console.log(`验证邮件已发送至 ${email}`)
      return true
    } catch (error) {
      console.error('发送验证邮件失败:', error)
      return false
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email: string, username: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('邮件服务不可用')
      return false
    }

    const code = this.generateVerificationCode()
    this.storeVerificationCode(email, code, 'password_reset')

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">TavernAI Plus</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">密码重置</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            亲爱的 ${username}，
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            您请求重置您的账户密码。请使用以下验证码：
          </p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            验证码有效期为 ${this.EXPIRY_MINUTES} 分钟。如果您没有请求重置密码，请立即联系我们。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿直接回复
          </p>
        </div>
      </div>
    `

    try {
      const config = this.getEmailConfig()
      await this.transporter.sendMail({
        from: `"TavernAI Plus" <${config?.from}>`,
        to: email,
        subject: '【TavernAI Plus】密码重置验证码',
        html
      })

      console.log(`密码重置邮件已发送至 ${email}`)
      return true
    } catch (error) {
      console.error('发送密码重置邮件失败:', error)
      return false
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('邮件服务不可用')
      return false
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">欢迎加入 TavernAI Plus</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${username}! 🎉</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.8;">
            欢迎成为 TavernAI Plus 的一员！您已经成功完成注册，现在可以开始体验我们提供的各种精彩功能：
          </p>
          <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
            <li>🤖 与各种AI角色进行对话</li>
            <li>🎨 创建自己独特的角色</li>
            <li>💬 参与社区讨论</li>
            <li>🌟 探索角色市场</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CORS_ORIGIN || 'http://localhost:3000'}"
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px;
                      font-weight: bold; font-size: 16px;">
              开始使用
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            如果您有任何问题或建议，请随时联系我们的支持团队。
          </p>
        </div>
      </div>
    `

    try {
      const config = this.getEmailConfig()
      await this.transporter.sendMail({
        from: `"TavernAI Plus" <${config?.from}>`,
        to: email,
        subject: '【TavernAI Plus】欢迎加入我们！',
        html
      })

      console.log(`欢迎邮件已发送至 ${email}`)
      return true
    } catch (error) {
      console.error('发送欢迎邮件失败:', error)
      return false
    }
  }

  // 发送账单通知
  async sendInvoiceEmail(
    email: string,
    username: string,
    amount: number,
    description: string,
    transactionId: string
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('邮件服务不可用')
      return false
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">支付成功</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">交易详情</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">交易编号：</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: bold;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">用户名：</td>
                <td style="padding: 10px 0; color: #1f2937;">${username}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">描述：</td>
                <td style="padding: 10px 0; color: #1f2937;">${description}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">金额：</td>
                <td style="padding: 10px 0; color: #10b981; font-size: 20px; font-weight: bold;">
                  $${amount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">时间：</td>
                <td style="padding: 10px 0; color: #1f2937;">${new Date().toLocaleString('zh-CN')}</td>
              </tr>
            </table>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            感谢您的支持！如有任何问题，请联系客服。
          </p>
        </div>
      </div>
    `

    try {
      const config = this.getEmailConfig()
      await this.transporter.sendMail({
        from: `"TavernAI Plus" <${config?.from}>`,
        to: email,
        subject: `【TavernAI Plus】支付成功通知 - $${amount.toFixed(2)}`,
        html
      })

      console.log(`账单邮件已发送至 ${email}`)
      return true
    } catch (error) {
      console.error('发送账单邮件失败:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
