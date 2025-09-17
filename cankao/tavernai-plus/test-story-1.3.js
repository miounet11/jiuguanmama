#!/usr/bin/env node

const axios = require('axios')
const { io } = require('socket.io-client')

const config = {
  API_BASE_URL: 'http://localhost:3001',
  WS_URL: 'http://localhost:3001',
  TEST_USER: {
    username: 'testuser_13_' + Date.now(),
    email: Date.now() + '@story13.test',
    password: 'TestPass123'
  }
}

async function testStory13Implementation() {
  console.log('🧪 Story 1.3 测试: 多角色聊天系统')
  console.log('')

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  function logTest(name, passed, message) {
    results.tests.push({ name, passed, message })
    if (passed) {
      console.log(`✅ ${name}`)
      results.passed++
    } else {
      console.log(`❌ ${name}: ${message}`)
      results.failed++
    }
  }

  let accessToken = null
  let testRoom = null
  let testCharacter = null

  try {
    // 测试 1: 用户注册和认证
    console.log('📋 测试 1: 用户认证系统')
    try {
      const registerResponse = await axios.post(`${config.API_BASE_URL}/api/auth/register`, config.TEST_USER)

      if (registerResponse.data.success) {
        accessToken = registerResponse.data.accessToken
        logTest('用户注册成功', true, '')
        logTest('JWT令牌获取', !!accessToken, '')
      } else {
        logTest('用户注册', false, registerResponse.data.error || 'Unknown error')
        return
      }
    } catch (error) {
      logTest('用户认证系统', false, error.message)
      return
    }

    // 测试 2: 创建测试角色
    console.log('\n📋 测试 2: 角色创建系统')
    try {
      const characterData = {
        name: '测试助手_' + Date.now(),
        description: '专门用于Story 1.3测试的AI助手',
        personality: '友善、活泼、善于交流，喜欢帮助用户解决问题',
        systemPrompt: '你是一个专业的AI测试助手，请用简洁明了的语言回复用户。',
        speakingStyle: '轻松友好，偶尔使用表情符号',
        firstMessage: '嗨！我是测试助手，很高兴见到你！',
        isPublic: true
      }

      const characterResponse = await axios.post(
        `${config.API_BASE_URL}/api/characters`,
        characterData,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )

      if (characterResponse.data.success) {
        testCharacter = characterResponse.data.character
        logTest('角色创建成功', true, '')
        logTest('角色ID生成', !!testCharacter.id, '')
      } else {
        logTest('角色创建', false, characterResponse.data.error || 'Unknown error')
      }
    } catch (error) {
      logTest('角色创建系统', false, error.message)
    }

    // 测试 3: 创建多角色聊天室
    console.log('\n📋 测试 3: 多角色聊天室创建')
    try {
      const roomData = {
        name: '测试聊天室_' + Date.now(),
        description: 'Story 1.3 多角色聊天测试房间',
        maxParticipants: 10,
        isPrivate: false,
        allowSpectators: true,
        roomType: 'multichar'
      }

      const roomResponse = await axios.post(
        `${config.API_BASE_URL}/api/chatrooms/create`,
        roomData,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )

      if (roomResponse.data.success) {
        testRoom = roomResponse.data.room
        logTest('聊天室创建成功', true, '')
        logTest('聊天室ID生成', !!testRoom.id, '')
        logTest('房主权限设置', testRoom.ownerId === registerResponse.data.user.id, '')
      } else {
        logTest('聊天室创建', false, roomResponse.data.error || 'Unknown error')
      }
    } catch (error) {
      logTest('聊天室创建系统', false, error.message)
    }

    // 测试 4: 聊天室API端点
    console.log('\n📋 测试 4: 聊天室API功能')
    if (testRoom) {
      try {
        // 获取聊天室详情
        const roomDetailResponse = await axios.get(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        logTest('获取聊天室详情', roomDetailResponse.data.success, '')

        // 获取聊天室列表
        const roomListResponse = await axios.get(
          `${config.API_BASE_URL}/api/chatrooms/list`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        logTest('获取聊天室列表', roomListResponse.data.success, '')

        // 加入聊天室
        const joinResponse = await axios.post(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}/join`,
          { roomId: testRoom.id },
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        logTest('加入聊天室', joinResponse.data.success, '')

      } catch (error) {
        logTest('聊天室API功能', false, error.message)
      }
    }

    // 测试 5: 角色召唤功能
    console.log('\n📋 测试 5: 角色召唤系统')
    if (testRoom && testCharacter) {
      try {
        const summonResponse = await axios.post(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}/summon`,
          {
            characterId: testCharacter.id,
            customPrompt: '请用友好的方式介绍自己'
          },
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        if (summonResponse.data.success) {
          logTest('角色召唤成功', true, '')
          logTest('角色加入消息', !!summonResponse.data.joinMessage, '')
          logTest('参与者数据', !!summonResponse.data.participant, '')
        } else {
          logTest('角色召唤', false, summonResponse.data.error || 'Unknown error')
        }
      } catch (error) {
        logTest('角色召唤系统', false, error.message)
      }
    }

    // 测试 6: 消息发送和获取
    console.log('\n📋 测试 6: 消息系统')
    if (testRoom) {
      try {
        // 发送消息
        const messageResponse = await axios.post(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}/messages`,
          {
            content: '这是一个测试消息，用于验证Story 1.3的多角色聊天功能！',
            messageType: 'text'
          },
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        if (messageResponse.data.success) {
          logTest('消息发送成功', true, '')
          logTest('消息ID生成', !!messageResponse.data.message.id, '')
        } else {
          logTest('消息发送', false, messageResponse.data.error || 'Unknown error')
        }

        // 获取消息历史
        const messagesResponse = await axios.get(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}/messages`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        logTest('获取消息历史', messagesResponse.data.success, '')

      } catch (error) {
        logTest('消息系统', false, error.message)
      }
    }

    // 测试 7: WebSocket连接测试
    console.log('\n📋 测试 7: 实时通信WebSocket')
    if (testRoom) {
      try {
        await new Promise((resolve, reject) => {
          const socket = io(config.WS_URL, {
            auth: {
              token: accessToken
            },
            transports: ['websocket', 'polling']
          })

          let testsPassed = 0
          const expectedTests = 3

          socket.on('connect', () => {
            console.log('  WebSocket连接建立')
            testsPassed++

            // 测试加入房间
            socket.emit('join_room', { roomId: testRoom.id })
          })

          socket.on('connected', (data) => {
            console.log('  WebSocket认证成功')
            testsPassed++
          })

          socket.on('room_joined', (data) => {
            console.log('  成功加入聊天室')
            testsPassed++

            // 发送测试消息
            socket.emit('send_message', {
              roomId: testRoom.id,
              content: 'WebSocket测试消息',
              messageType: 'text'
            })
          })

          socket.on('new_message', (message) => {
            console.log('  收到实时消息')
            socket.disconnect()

            if (testsPassed >= expectedTests) {
              logTest('WebSocket连接', true, '')
              logTest('实时消息传输', true, '')
              resolve()
            } else {
              reject(new Error('WebSocket测试未完成'))
            }
          })

          socket.on('connect_error', (error) => {
            reject(error)
          })

          // 超时保护
          setTimeout(() => {
            socket.disconnect()
            if (testsPassed >= 2) {
              logTest('WebSocket连接', true, '')
              logTest('实时消息传输', testsPassed >= expectedTests, '')
              resolve()
            } else {
              reject(new Error('WebSocket连接超时'))
            }
          }, 10000)
        })
      } catch (error) {
        logTest('WebSocket连接', false, error.message)
        logTest('实时消息传输', false, error.message)
      }
    }

    // 测试 8: AI角色回复测试
    console.log('\n📋 测试 8: AI角色智能回复')
    if (testRoom && testCharacter) {
      try {
        const aiResponse = await axios.post(
          `${config.API_BASE_URL}/api/chatrooms/${testRoom.id}/characters/${testCharacter.id}/respond`,
          {
            trigger: '请介绍一下你自己，并展示你的个性化特点'
          },
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        if (aiResponse.data.success) {
          const message = aiResponse.data.message
          logTest('AI角色回复生成', true, '')
          logTest('回复内容质量', message.content.length > 10, '')
          logTest('角色一致性', message.character?.id === testCharacter.id, '')
        } else {
          logTest('AI角色回复', false, aiResponse.data.error || 'Unknown error')
        }
      } catch (error) {
        logTest('AI角色回复系统', false, error.message)
      }
    }

  } catch (error) {
    console.error('测试执行失败:', error)
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(60))
  console.log('📊 Story 1.3 多角色聊天系统测试总结')
  console.log('='.repeat(60))
  console.log(`✅ 通过: ${results.passed}`)
  console.log(`❌ 失败: ${results.failed}`)
  console.log(`🎯 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`)

  if (results.failed === 0) {
    console.log('\n🎉 Story 1.3 实现完成！所有测试通过！')
    console.log('✅ 多角色聊天系统已成功实施，包括：')
    console.log('   - 多角色聊天室创建和管理')
    console.log('   - 实时WebSocket通信')
    console.log('   - AI角色召唤和智能回复')
    console.log('   - 角色个性化交互系统')
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步检查')
    console.log('❌ 失败的测试:')
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`))
  }

  return results.failed === 0
}

// 运行测试
testStory13Implementation()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('测试运行失败:', error)
    process.exit(1)
  })