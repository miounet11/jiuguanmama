import Stripe from 'stripe'
import axios from 'axios'
import crypto from 'crypto'
import { prisma } from '../server'
import { emailService } from './email'

// 支付方式枚举
export enum PaymentMethod {
  STRIPE = 'stripe',        // 信用卡
  ALIPAY = 'alipay',       // 支付宝
  PAYPAL = 'paypal',       // PayPal
  WECHAT = 'wechat'        // 微信支付（预留）
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// 订阅套餐
export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  price: number          // 月付价格
  yearlyPrice?: number   // 年付价格
  credits: number        // 每月额度
  features: string[]
  limits: {
    dailyQuota: number
    modelAccess: string[]
    maxTokens: number
    concurrent: number
  }
}

// 预定义套餐
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: '免费版',
    price: 0,
    credits: 100,
    features: [
      '每月100次对话',
      '基础模型访问',
      '社区支持'
    ],
    limits: {
      dailyQuota: 10,
      modelAccess: ['gpt-3.5-turbo'],
      maxTokens: 1000,
      concurrent: 1
    }
  },
  plus: {
    id: 'plus',
    name: 'plus',
    displayName: '增强版',
    price: 9.99,
    yearlyPrice: 99.99,
    credits: 1000,
    features: [
      '每月1000次对话',
      '所有模型访问',
      '优先支持',
      '自定义角色',
      '历史记录云同步'
    ],
    limits: {
      dailyQuota: 50,
      modelAccess: ['gpt-3.5-turbo', 'gpt-4', 'claude-3', 'gemini-pro'],
      maxTokens: 4000,
      concurrent: 3
    }
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: '专业版',
    price: 29.99,
    yearlyPrice: 299.99,
    credits: 5000,
    features: [
      '每月5000次对话',
      '所有模型访问',
      'API访问',
      '优先队列',
      '专属客服',
      '批量处理',
      '高级分析'
    ],
    limits: {
      dailyQuota: 200,
      modelAccess: ['*'], // 所有模型
      maxTokens: 8000,
      concurrent: 10
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: '企业版',
    price: 99.99,
    yearlyPrice: 999.99,
    credits: 99999,
    features: [
      '无限对话',
      '所有功能',
      'SSO登录',
      '专属部署',
      'SLA保障',
      '定制开发'
    ],
    limits: {
      dailyQuota: 99999,
      modelAccess: ['*'],
      maxTokens: 32000,
      concurrent: 100
    }
  }
}

class PaymentService {
  private stripe: Stripe | null = null
  private paypalClient: any = null

  constructor() {
    this.initializePaymentProviders()
  }

  // 初始化支付提供商
  private initializePaymentProviders() {
    // 初始化 Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      })
      console.log('✅ Stripe 支付已初始化')
    }

    // PayPal 配置
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      // PayPal SDK 初始化逻辑
      console.log('✅ PayPal 支付已初始化')
    }

    // 支付宝配置在创建支付时动态处理
    if (process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY) {
      console.log('✅ 支付宝支付已配置')
    }
  }

  // 创建支付订单
  async createPayment(params: {
    userId: string
    amount: number
    currency: string
    method: PaymentMethod
    description: string
    planId?: string
    metadata?: Record<string, any>
  }) {
    const { userId, amount, currency, method, description, planId, metadata } = params

    try {
      // 创建交易记录
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: planId ? 'subscription' : 'credit',
          amount,
          currency,
          status: PaymentStatus.PENDING,
          method,
          description,
          metadata: JSON.stringify(metadata || {})
        }
      })

      // 根据支付方式处理
      switch (method) {
        case PaymentMethod.STRIPE:
          return await this.createStripePayment(transaction, amount, currency, description)
        case PaymentMethod.PAYPAL:
          return await this.createPayPalPayment(transaction, amount, currency, description)
        case PaymentMethod.ALIPAY:
          return await this.createAlipayPayment(transaction, amount, currency, description)
        default:
          throw new Error(`不支持的支付方式: ${method}`)
      }
    } catch (error) {
      console.error('创建支付失败:', error)
      throw error
    }
  }

  // Stripe 信用卡支付
  private async createStripePayment(
    transaction: any,
    amount: number,
    currency: string,
    description: string
  ) {
    if (!this.stripe) {
      throw new Error('Stripe 未配置')
    }

    try {
      // 创建支付意图
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe 使用分为单位
        currency: currency.toLowerCase(),
        description,
        metadata: {
          transactionId: transaction.id,
          userId: transaction.userId
        },
        automatic_payment_methods: {
          enabled: true
        }
      })

      // 更新交易记录
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          externalId: paymentIntent.id,
          metadata: {
            ...transaction.metadata,
            stripePaymentIntentId: paymentIntent.id
          }
        }
      })

      return {
        transactionId: transaction.id,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        currency,
        method: PaymentMethod.STRIPE
      }
    } catch (error) {
      console.error('Stripe 支付创建失败:', error)
      throw error
    }
  }

  // PayPal 支付
  private async createPayPalPayment(
    transaction: any,
    amount: number,
    currency: string,
    description: string
  ) {
    const paypalApiUrl = process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    try {
      // 获取 PayPal 访问令牌
      const authResponse = await axios.post(
        `${paypalApiUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: process.env.PAYPAL_CLIENT_ID!,
            password: process.env.PAYPAL_CLIENT_SECRET!
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      const accessToken = authResponse.data.access_token

      // 创建订单
      const orderResponse = await axios.post(
        `${paypalApiUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: transaction.id,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            },
            description
          }],
          application_context: {
            return_url: `${process.env.CORS_ORIGIN}/payment/success`,
            cancel_url: `${process.env.CORS_ORIGIN}/payment/cancel`,
            brand_name: 'TavernAI Plus',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const order = orderResponse.data

      // 更新交易记录
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          externalId: order.id,
          metadata: {
            ...transaction.metadata,
            paypalOrderId: order.id
          }
        }
      })

      // 获取审批链接
      const approveLink = order.links.find((link: any) => link.rel === 'approve')

      return {
        transactionId: transaction.id,
        paymentId: order.id,
        approvalUrl: approveLink?.href,
        amount,
        currency,
        method: PaymentMethod.PAYPAL
      }
    } catch (error) {
      console.error('PayPal 支付创建失败:', error)
      throw error
    }
  }

  // 支付宝支付
  private async createAlipayPayment(
    transaction: any,
    amount: number,
    currency: string,
    description: string
  ) {
    // 注意：支付宝的完整集成需要企业认证和签约
    // 这里提供基础实现框架

    const params: any = {
      app_id: process.env.ALIPAY_APP_ID,
      method: 'alipay.trade.page.pay',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00'),
      version: '1.0',
      notify_url: `${process.env.API_BASE_URL}/api/payment/alipay/notify`,
      return_url: `${process.env.CORS_ORIGIN}/payment/success`,
      biz_content: JSON.stringify({
        out_trade_no: transaction.id,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toFixed(2),
        subject: description,
        body: description
      })
    }

    // 签名逻辑（需要使用支付宝私钥）
    const sign = this.generateAlipaySign(params)
    params['sign'] = sign

    // 构建支付URL
    const payUrl = `https://openapi.alipay.com/gateway.do?${new URLSearchParams(params as any)}`

    // 更新交易记录
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        externalId: transaction.id,
        metadata: {
          ...transaction.metadata,
          alipayTradeNo: transaction.id
        }
      }
    })

    return {
      transactionId: transaction.id,
      paymentId: transaction.id,
      paymentUrl: payUrl,
      amount,
      currency,
      method: PaymentMethod.ALIPAY
    }
  }

  // 支付宝签名生成
  private generateAlipaySign(params: Record<string, any>): string {
    // 排序参数
    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys
      .filter(key => key !== 'sign' && params[key])
      .map(key => `${key}=${params[key]}`)
      .join('&')

    // 使用RSA2签名
    const sign = crypto
      .createSign('RSA-SHA256')
      .update(signStr)
      .sign(process.env.ALIPAY_PRIVATE_KEY || '', 'base64')

    return sign
  }

  // 处理支付回调
  async handlePaymentWebhook(
    method: PaymentMethod,
    payload: any,
    signature?: string
  ) {
    try {
      switch (method) {
        case PaymentMethod.STRIPE:
          return await this.handleStripeWebhook(payload, signature!)
        case PaymentMethod.PAYPAL:
          return await this.handlePayPalWebhook(payload)
        case PaymentMethod.ALIPAY:
          return await this.handleAlipayCallback(payload)
        default:
          throw new Error(`不支持的支付方式: ${method}`)
      }
    } catch (error) {
      console.error('处理支付回调失败:', error)
      throw error
    }
  }

  // Stripe Webhook 处理
  private async handleStripeWebhook(payload: any, signature: string) {
    if (!this.stripe) {
      throw new Error('Stripe 未配置')
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

    try {
      // 验证签名
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      )

      // 处理不同类型的事件
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await this.handlePaymentSuccess(
            paymentIntent.metadata.transactionId,
            paymentIntent.id,
            paymentIntent.amount / 100
          )
          break

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object as Stripe.PaymentIntent
          await this.handlePaymentFailure(
            failedIntent.metadata.transactionId,
            failedIntent.last_payment_error?.message || '支付失败'
          )
          break
      }

      return { received: true }
    } catch (error) {
      console.error('Stripe webhook 处理失败:', error)
      throw error
    }
  }

  // PayPal Webhook 处理
  private async handlePayPalWebhook(payload: any) {
    // 验证 PayPal webhook（需要验证签名）
    // 这里简化处理

    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = payload.resource
      const transactionId = capture.purchase_units[0].reference_id

      await this.handlePaymentSuccess(
        transactionId,
        capture.id,
        parseFloat(capture.amount.value)
      )
    }

    return { received: true }
  }

  // 支付宝回调处理
  private async handleAlipayCallback(params: any) {
    // 验证签名
    const sign = params.sign
    delete params.sign
    delete params.sign_type

    // 验证签名逻辑...

    if (params.trade_status === 'TRADE_SUCCESS') {
      await this.handlePaymentSuccess(
        params.out_trade_no,
        params.trade_no,
        parseFloat(params.total_amount)
      )
    }

    return 'success'
  }

  // 处理支付成功
  private async handlePaymentSuccess(
    transactionId: string,
    externalId: string,
    amount: number
  ) {
    try {
      // 更新交易状态
      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: PaymentStatus.SUCCESS,
          externalId,
          completedAt: new Date()
        },
        include: {
          user: true
        }
      })

      // 根据交易类型处理
      if (transaction.type === 'subscription') {
        // 更新用户订阅
        const metadata = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : transaction.metadata || {}
        const planId = metadata.planId as string
        const plan = SUBSCRIPTION_PLANS[planId]

        if (plan) {
          await prisma.user.update({
            where: { id: transaction.userId },
            data: {
              subscriptionTier: plan.name,
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
              credits: plan.credits
            }
          })
        }
      } else if (transaction.type === 'credit') {
        // 充值积分
        const credits = Math.floor(amount * 100) // 1美元 = 100积分
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            credits: {
              increment: credits
            }
          }
        })
      }

      // 发送支付成功邮件
      await emailService.sendInvoiceEmail(
        transaction.user.email,
        transaction.user.username,
        amount,
        transaction.description,
        transactionId
      )

      console.log(`支付成功: ${transactionId}`)
    } catch (error) {
      console.error('处理支付成功失败:', error)
      throw error
    }
  }

  // 处理支付失败
  private async handlePaymentFailure(transactionId: string, reason: string) {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: PaymentStatus.FAILED,
          metadata: JSON.stringify({
            failureReason: reason
          })
        }
      })

      console.log(`支付失败: ${transactionId}, 原因: ${reason}`)
    } catch (error) {
      console.error('处理支付失败错误:', error)
      throw error
    }
  }

  // 获取用户订阅信息
  async getUserSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        credits: true
      }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    const plan = SUBSCRIPTION_PLANS[user.subscriptionTier]
    const isActive = user.subscriptionExpiresAt ? user.subscriptionExpiresAt > new Date() : false

    return {
      plan,
      isActive,
      expiresAt: user.subscriptionExpiresAt,
      credits: user.credits,
      canUpgrade: user.subscriptionTier !== 'enterprise'
    }
  }

  // 取消订阅
  async cancelSubscription(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'free',
        subscriptionExpiresAt: null
      }
    })

    return { success: true }
  }
}

export const paymentService = new PaymentService()
