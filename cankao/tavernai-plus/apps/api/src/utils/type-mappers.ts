/**
 * 类型转换工具
 * 处理数据库类型到API类型的安全转换，确保敏感信息不泄露
 */

import {
  DbUser,
  DbCharacter,
  DbChatSession,
  DbMessage,
  DbChatRoom,
  DbChatParticipant,
  DbChatMessage,
  CharacterWithCreator,
  CharacterWithStats,
  ChatSessionWithCharacter,
  MessageWithRelations,
  ChatRoomWithParticipants,
  SafeUser,
  parseCharacterTags,
  parseCharacterExampleDialogs,
  parseCharacterMetadata,
  parseChatSessionMetadata
} from '../types/database'

import {
  ApiUser,
  ApiUserProfile,
  ApiCharacter,
  ApiCharacterDetail,
  ApiChatSession,
  ApiMessage,
  ApiChatRoom,
  ApiChatParticipant,
  ApiChatMessage
} from '../types/api'

/**
 * 用户类型转换器
 */
export class UserMapper {
  /**
   * 转换为公开用户信息（隐藏敏感信息）
   */
  static toApiUser(user: DbUser, currentUserId?: string): ApiUser {
    const isOwnerOrAdmin = currentUserId === user.id ||
                          (currentUserId && this.isAdmin(currentUserId))

    return {
      id: user.id,
      username: user.username,
      email: isOwnerOrAdmin ? user.email : undefined,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      credits: isOwnerOrAdmin ? user.credits : undefined,
      subscriptionTier: isOwnerOrAdmin ? user.subscriptionTier : undefined,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }
  }

  /**
   * 转换为用户资料（包含完整信息，仅限本人或管理员）
   */
  static toApiUserProfile(user: DbUser): ApiUserProfile {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      credits: user.credits,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }
  }

  /**
   * 转换为安全用户信息（仅基本信息）
   */
  static toSafeUser(user: DbUser): SafeUser {
    const { passwordHash, verificationToken, resetPasswordToken, ...safeUser } = user
    return safeUser
  }

  /**
   * 检查是否为管理员（这里应该调用实际的权限检查逻辑）
   */
  private static isAdmin(userId: string): boolean {
    // TODO: 实现实际的管理员检查逻辑
    return false
  }
}

/**
 * 角色类型转换器
 */
export class CharacterMapper {
  /**
   * 转换为API角色信息
   */
  static toApiCharacter(
    character: CharacterWithCreator | CharacterWithStats,
    currentUserId?: string
  ): ApiCharacter {
    const creator = UserMapper.toSafeUser(character.creator)
    const canEdit = currentUserId === character.creatorId

    // 处理统计信息
    const stats = 'isFavorited' in character ? character : undefined

    return {
      id: character.id,
      name: character.name,
      description: character.description,
      fullDescription: character.fullDescription,
      personality: character.personality,
      backstory: character.backstory,
      speakingStyle: character.speakingStyle,
      scenario: character.scenario,
      firstMessage: character.firstMessage,
      systemPrompt: character.systemPrompt,
      exampleDialogs: parseCharacterExampleDialogs(character.exampleDialogs),
      avatar: character.avatar,
      coverImage: character.coverImage,
      category: character.category,
      tags: parseCharacterTags(character.tags),
      language: character.language,
      model: character.model,
      temperature: character.temperature,
      maxTokens: character.maxTokens,
      isPublic: character.isPublic,
      isNSFW: character.isNSFW,
      isFeatured: character.isFeatured,
      rating: character.rating,
      ratingCount: character.ratingCount,
      chatCount: character.chatCount,
      favoriteCount: character.favoriteCount,
      version: character.version,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
      creator: {
        id: creator.id,
        username: creator.username,
        avatar: creator.avatar
      },
      isFavorited: stats?.isFavorited,
      isNew: stats?.isNew,
      canEdit
    }
  }

  /**
   * 转换为详细的API角色信息
   */
  static toApiCharacterDetail(
    character: CharacterWithCreator,
    currentUserId?: string
  ): ApiCharacterDetail {
    const apiCharacter = this.toApiCharacter(character, currentUserId)

    return {
      ...apiCharacter,
      metadata: parseCharacterMetadata(character.metadata),
      importedFrom: character.importedFrom
    }
  }

  /**
   * 转换为角色基本信息（用于列表显示）
   */
  static toCharacterSummary(character: DbCharacter) {
    return {
      id: character.id,
      name: character.name,
      avatar: character.avatar,
      description: character.description,
      category: character.category,
      rating: character.rating,
      isNSFW: character.isNSFW
    }
  }
}

/**
 * 聊天会话类型转换器
 */
export class ChatSessionMapper {
  /**
   * 转换为API聊天会话
   */
  static toApiChatSession(
    session: ChatSessionWithCharacter,
    currentUserId?: string
  ): ApiChatSession {
    return {
      id: session.id,
      title: session.title,
      model: session.model,
      lastMessageAt: session.lastMessageAt,
      messageCount: session.messageCount,
      totalTokens: session.totalTokens,
      isArchived: session.isArchived,
      isPinned: session.isPinned,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      character: {
        id: session.character.id,
        name: session.character.name,
        avatar: session.character.avatar,
        description: session.character.description
      },
      user: {
        id: session.user.id,
        username: session.user.username,
        avatar: session.user.avatar
      },
      metadata: parseChatSessionMetadata(session.metadata)
    }
  }
}

/**
 * 消息类型转换器
 */
export class MessageMapper {
  /**
   * 转换为API消息
   */
  static toApiMessage(message: MessageWithRelations): ApiMessage {
    return {
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      tokens: message.tokens,
      edited: message.edited,
      deleted: message.deleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      user: message.user ? {
        id: message.user.id,
        username: message.user.username,
        avatar: message.user.avatar
      } : null,
      character: message.character ? {
        id: message.character.id,
        name: message.character.name,
        avatar: message.character.avatar
      } : null
    }
  }
}

/**
 * 聊天室类型转换器
 */
export class ChatRoomMapper {
  /**
   * 转换为API聊天室
   */
  static toApiChatRoom(
    room: ChatRoomWithParticipants,
    currentUserId?: string
  ): ApiChatRoom {
    const canJoin = this.canUserJoinRoom(room, currentUserId)
    const canManage = this.canUserManageRoom(room, currentUserId)

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      maxParticipants: room.maxParticipants,
      isPrivate: room.isPrivate,
      allowSpectators: room.allowSpectators,
      roomType: room.roomType,
      lastMessageAt: room.lastMessageAt,
      messageCount: room.messageCount,
      totalTokens: room.totalTokens,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      owner: {
        id: room.owner.id,
        username: room.owner.username,
        avatar: room.owner.avatar
      },
      participants: room.participants.map(p => this.toApiChatParticipant(p)),
      canJoin,
      canManage
    }
  }

  /**
   * 转换为API聊天参与者
   */
  static toApiChatParticipant(participant: DbChatParticipant & {
    user?: SafeUser
    character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>
  }): ApiChatParticipant {
    return {
      id: participant.id,
      role: participant.role,
      permissions: JSON.parse(participant.permissions || '{}'),
      joinedAt: participant.joinedAt,
      lastSeenAt: participant.lastSeenAt,
      isActive: participant.isActive,
      isMuted: participant.isMuted,
      user: participant.user ? {
        id: participant.user.id,
        username: participant.user.username,
        avatar: participant.user.avatar
      } : null,
      character: participant.character ? {
        id: participant.character.id,
        name: participant.character.name,
        avatar: participant.character.avatar
      } : null
    }
  }

  /**
   * 转换为API聊天消息
   */
  static toApiChatMessage(message: DbChatMessage & {
    sender?: SafeUser
    character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>
    replyTo?: DbChatMessage
  }): ApiChatMessage {
    return {
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      tokens: message.tokens,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender ? {
        id: message.sender.id,
        username: message.sender.username,
        avatar: message.sender.avatar
      } : null,
      character: message.character ? {
        id: message.character.id,
        name: message.character.name,
        avatar: message.character.avatar
      } : null,
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        sender: message.replyTo.senderId
      } : null
    }
  }

  /**
   * 检查用户是否可以加入聊天室
   */
  private static canUserJoinRoom(room: ChatRoomWithParticipants, userId?: string): boolean {
    if (!userId) return false
    if (!room.isActive) return false
    if (room.participants.length >= room.maxParticipants) return false

    // 检查用户是否已经在房间中
    const isParticipant = room.participants.some(p => p.userId === userId)
    if (isParticipant) return false

    // 私有房间需要邀请
    if (room.isPrivate) return false

    return true
  }

  /**
   * 检查用户是否可以管理聊天室
   */
  private static canUserManageRoom(room: ChatRoomWithParticipants, userId?: string): boolean {
    if (!userId) return false

    // 房主可以管理
    if (room.ownerId === userId) return true

    // 管理员可以管理
    const participant = room.participants.find(p => p.userId === userId)
    if (participant && participant.role === 'admin') return true

    return false
  }
}

/**
 * 数据过滤工具
 */
export class DataFilter {
  /**
   * 过滤敏感用户信息
   */
  static filterUserData(user: DbUser, viewerId?: string): Partial<DbUser> {
    const isOwnerOrAdmin = viewerId === user.id // TODO: 添加管理员检查

    if (isOwnerOrAdmin) {
      return user
    }

    // 移除敏感信息
    const {
      email,
      passwordHash,
      credits,
      subscriptionTier,
      subscriptionExpiresAt,
      verificationToken,
      resetPasswordToken,
      resetPasswordExpires,
      ...publicData
    } = user

    return publicData
  }

  /**
   * 过滤角色敏感信息
   */
  static filterCharacterData(character: DbCharacter, viewerId?: string): DbCharacter {
    // 如果是私有角色且不是创建者，返回基本信息
    if (!character.isPublic && viewerId !== character.creatorId) {
      return {
        ...character,
        systemPrompt: null,
        exampleDialogs: null,
        fullDescription: null,
        metadata: null
      }
    }

    return character
  }
}

/**
 * 批量转换工具
 */
export class BatchMapper {
  /**
   * 批量转换用户
   */
  static toApiUsers(users: DbUser[], currentUserId?: string): ApiUser[] {
    return users.map(user => UserMapper.toApiUser(user, currentUserId))
  }

  /**
   * 批量转换角色
   */
  static toApiCharacters(
    characters: CharacterWithCreator[],
    currentUserId?: string
  ): ApiCharacter[] {
    return characters.map(character =>
      CharacterMapper.toApiCharacter(character, currentUserId)
    )
  }

  /**
   * 批量转换聊天会话
   */
  static toApiChatSessions(
    sessions: ChatSessionWithCharacter[],
    currentUserId?: string
  ): ApiChatSession[] {
    return sessions.map(session =>
      ChatSessionMapper.toApiChatSession(session, currentUserId)
    )
  }

  /**
   * 批量转换消息
   */
  static toApiMessages(messages: MessageWithRelations[]): ApiMessage[] {
    return messages.map(message => MessageMapper.toApiMessage(message))
  }
}
