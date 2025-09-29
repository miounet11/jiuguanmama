<template>
  <div class="sillytavern-import">
    <!-- Header -->
    <div class="import-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="page-title">{{ $t('config.sillyTavern.title') }}</h2>
          <p class="page-description">{{ $t('config.sillyTavern.description') }}</p>
        </div>

        <div class="header-actions">
          <el-button @click="openDocumentation" type="text">
            <el-icon><QuestionFilled /></el-icon>
            {{ $t('config.sillyTavern.documentation') }}
          </el-button>

          <el-button @click="resetImport" :disabled="importing">
            <el-icon><Refresh /></el-icon>
            {{ $t('common.reset') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Import Steps -->
    <div class="import-steps">
      <el-steps :active="currentStep" align-center class="steps-navigation">
        <el-step
          :title="$t('config.sillyTavern.steps.source')"
          :icon="FolderOpened"
        />
        <el-step
          :title="$t('config.sillyTavern.steps.analysis')"
          :icon="Search"
        />
        <el-step
          :title="$t('config.sillyTavern.steps.compatibility')"
          :icon="Shield"
        />
        <el-step
          :title="$t('config.sillyTavern.steps.mapping')"
          :icon="Connection"
        />
        <el-step
          :title="$t('config.sillyTavern.steps.import')"
          :icon="Download"
        />
      </el-steps>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 0: Source Selection -->
      <div v-if="currentStep === 0" class="step-source">
        <div class="step-header">
          <h3 class="step-title">{{ $t('config.sillyTavern.source.title') }}</h3>
          <p class="step-description">{{ $t('config.sillyTavern.source.description') }}</p>
        </div>

        <el-tabs v-model="sourceMethod" class="source-tabs">
          <el-tab-pane label="Upload Files" name="upload">
            <div class="upload-section">
              <el-alert
                :title="$t('config.sillyTavern.source.uploadInfo')"
                type="info"
                :description="$t('config.sillyTavern.source.uploadDescription')"
                show-icon
                :closable="false"
                class="mb-4"
              />

              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :show-file-list="true"
                :limit="50"
                accept=".json,.yaml,.yml,.txt,.js,.csv"
                @change="handleFileUpload"
                multiple
                drag
                class="upload-area"
              >
                <div class="upload-content">
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="upload-text">
                    {{ $t('config.sillyTavern.source.dragFiles') }}
                  </div>
                  <div class="upload-hint">
                    {{ $t('config.sillyTavern.source.supportedFiles') }}
                  </div>
                </div>
              </el-upload>

              <div v-if="uploadedFiles.length > 0" class="file-list">
                <h4>{{ $t('config.sillyTavern.source.uploadedFiles') }} ({{ uploadedFiles.length }})</h4>
                <div class="file-items">
                  <div
                    v-for="(file, index) in uploadedFiles"
                    :key="index"
                    class="file-item"
                  >
                    <div class="file-info">
                      <el-icon class="file-icon"><Document /></el-icon>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      <el-tag
                        :type="getFileTypeTag(file.name).type"
                        size="small"
                        class="file-type"
                      >
                        {{ getFileTypeTag(file.name).label }}
                      </el-tag>
                    </div>
                    <el-button
                      type="text"
                      size="small"
                      @click="removeFile(index)"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Folder Path" name="folder">
            <div class="folder-section">
              <el-alert
                :title="$t('config.sillyTavern.source.folderInfo')"
                type="info"
                :description="$t('config.sillyTavern.source.folderDescription')"
                show-icon
                :closable="false"
                class="mb-4"
              />

              <el-input
                v-model="folderPath"
                :placeholder="$t('config.sillyTavern.source.folderPlaceholder')"
                size="large"
                class="folder-input"
              >
                <template #append>
                  <el-button @click="browseFolderPath" :loading="browsing">
                    {{ $t('config.sillyTavern.source.browse') }}
                  </el-button>
                </template>
              </el-input>

              <div v-if="folderPath" class="folder-info">
                <h4>{{ $t('config.sillyTavern.source.folderPreview') }}</h4>
                <div v-if="folderContents.length > 0" class="folder-contents">
                  <div
                    v-for="(item, index) in folderContents.slice(0, 10)"
                    :key="index"
                    class="folder-item"
                  >
                    <el-icon class="item-icon">
                      <FolderOpened v-if="item.isDirectory" />
                      <Document v-else />
                    </el-icon>
                    <span class="item-name">{{ item.name }}</span>
                    <span v-if="!item.isDirectory" class="item-size">{{ formatFileSize(item.size) }}</span>
                  </div>
                  <div v-if="folderContents.length > 10" class="more-items">
                    {{ $t('config.sillyTavern.source.moreItems', { count: folderContents.length - 10 }) }}
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Direct URL" name="url">
            <div class="url-section">
              <el-alert
                :title="$t('config.sillyTavern.source.urlInfo')"
                type="info"
                :description="$t('config.sillyTavern.source.urlDescription')"
                show-icon
                :closable="false"
                class="mb-4"
              />

              <el-input
                v-model="configUrl"
                :placeholder="$t('config.sillyTavern.source.urlPlaceholder')"
                size="large"
                class="url-input"
              >
                <template #append>
                  <el-button @click="fetchConfigFromUrl" :loading="fetching">
                    {{ $t('config.sillyTavern.source.fetch') }}
                  </el-button>
                </template>
              </el-input>

              <div v-if="fetchedConfig" class="fetched-preview">
                <h4>{{ $t('config.sillyTavern.source.fetchedPreview') }}</h4>
                <pre class="config-preview">{{ formatJSON(fetchedConfig).slice(0, 500) }}...</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Step 1: Analysis -->
      <div v-else-if="currentStep === 1" class="step-analysis">
        <div class="step-header">
          <h3 class="step-title">{{ $t('config.sillyTavern.analysis.title') }}</h3>
          <p class="step-description">{{ $t('config.sillyTavern.analysis.description') }}</p>
        </div>

        <div v-if="analyzing" class="analysis-loading">
          <el-skeleton :rows="6" animated />
          <div class="analysis-status">
            <el-progress :percentage="analysisProgress" />
            <p class="status-text">{{ analysisStatus }}</p>
          </div>
        </div>

        <div v-else-if="analysisResults" class="analysis-results">
          <!-- File Analysis -->
          <div class="analysis-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.analysis.fileAnalysis') }}</h4>
            <div class="analysis-grid">
              <div class="analysis-card">
                <div class="card-header">
                  <el-icon class="card-icon"><Document /></el-icon>
                  <span class="card-title">{{ $t('config.sillyTavern.analysis.totalFiles') }}</span>
                </div>
                <div class="card-value">{{ analysisResults.fileCount }}</div>
              </div>

              <div class="analysis-card">
                <div class="card-header">
                  <el-icon class="card-icon"><Collection /></el-icon>
                  <span class="card-title">{{ $t('config.sillyTavern.analysis.configFiles') }}</span>
                </div>
                <div class="card-value">{{ analysisResults.configFiles.length }}</div>
              </div>

              <div class="analysis-card">
                <div class="card-header">
                  <el-icon class="card-icon"><User /></el-icon>
                  <span class="card-title">{{ $t('config.sillyTavern.analysis.characters') }}</span>
                </div>
                <div class="card-value">{{ analysisResults.characters.length }}</div>
              </div>

              <div class="analysis-card">
                <div class="card-header">
                  <el-icon class="card-icon"><ChatDotSquare /></el-icon>
                  <span class="card-title">{{ $t('config.sillyTavern.analysis.chats') }}</span>
                </div>
                <div class="card-value">{{ analysisResults.chats.length }}</div>
              </div>
            </div>
          </div>

          <!-- Detected Configurations -->
          <div class="analysis-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.analysis.detectedConfigs') }}</h4>
            <div class="config-list">
              <div
                v-for="config in analysisResults.configFiles"
                :key="config.path"
                class="config-item"
              >
                <div class="config-info">
                  <el-icon class="config-icon"><Setting /></el-icon>
                  <div class="config-details">
                    <span class="config-name">{{ config.name }}</span>
                    <span class="config-path">{{ config.path }}</span>
                  </div>
                  <el-tag
                    :type="config.valid ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ config.valid ? $t('common.valid') : $t('common.invalid') }}
                  </el-tag>
                </div>
                <el-checkbox v-model="config.selected" />
              </div>
            </div>
          </div>

          <!-- Characters Preview -->
          <div v-if="analysisResults.characters.length > 0" class="analysis-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.analysis.charactersPreview') }}</h4>
            <div class="characters-grid">
              <div
                v-for="character in analysisResults.characters.slice(0, 6)"
                :key="character.id"
                class="character-card"
              >
                <div class="character-avatar">
                  <img
                    v-if="character.avatar"
                    :src="character.avatar"
                    :alt="character.name"
                    class="avatar-image"
                  />
                  <el-icon v-else class="avatar-placeholder"><User /></el-icon>
                </div>
                <div class="character-info">
                  <span class="character-name">{{ character.name }}</span>
                  <span class="character-description">{{ character.description?.slice(0, 60) }}...</span>
                </div>
                <el-checkbox v-model="character.selected" />
              </div>
            </div>
            <div v-if="analysisResults.characters.length > 6" class="more-characters">
              {{ $t('config.sillyTavern.analysis.moreCharacters', {
                count: analysisResults.characters.length - 6
              }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Compatibility Check -->
      <div v-else-if="currentStep === 2" class="step-compatibility">
        <div class="step-header">
          <h3 class="step-title">{{ $t('config.sillyTavern.compatibility.title') }}</h3>
          <p class="step-description">{{ $t('config.sillyTavern.compatibility.description') }}</p>
        </div>

        <div v-if="checkingCompatibility" class="compatibility-loading">
          <el-skeleton :rows="4" animated />
          <div class="compatibility-status">
            <el-progress :percentage="compatibilityProgress" />
            <p class="status-text">{{ compatibilityStatus }}</p>
          </div>
        </div>

        <div v-else-if="compatibilityResults" class="compatibility-results">
          <!-- Overall Compatibility -->
          <div class="compatibility-summary">
            <div class="summary-card">
              <div class="summary-icon">
                <el-icon
                  :class="[
                    'status-icon',
                    compatibilityResults.overallCompatible ? 'success' : 'warning'
                  ]"
                >
                  <CircleCheckFilled v-if="compatibilityResults.overallCompatible" />
                  <WarningFilled v-else />
                </el-icon>
              </div>
              <div class="summary-content">
                <h4 class="summary-title">
                  {{ compatibilityResults.overallCompatible
                    ? $t('config.sillyTavern.compatibility.compatible')
                    : $t('config.sillyTavern.compatibility.partiallyCompatible')
                  }}
                </h4>
                <p class="summary-description">
                  {{ $t('config.sillyTavern.compatibility.compatibilityScore', {
                    score: Math.round(compatibilityResults.score * 100)
                  }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Feature Support -->
          <div class="compatibility-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.compatibility.featureSupport') }}</h4>
            <div class="feature-list">
              <div
                v-for="feature in compatibilityResults.features"
                :key="feature.name"
                class="feature-item"
                :class="{ 'feature-unsupported': !feature.supported }"
              >
                <el-icon
                  :class="[
                    'feature-icon',
                    feature.supported ? 'supported' : 'unsupported'
                  ]"
                >
                  <Check v-if="feature.supported" />
                  <Close v-else />
                </el-icon>
                <div class="feature-content">
                  <span class="feature-name">{{ feature.displayName }}</span>
                  <span class="feature-description">{{ feature.description }}</span>
                  <div v-if="feature.migrationNote" class="migration-note">
                    <el-icon><InfoFilled /></el-icon>
                    <span>{{ feature.migrationNote }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Issues and Warnings -->
          <div v-if="compatibilityResults.issues.length > 0" class="compatibility-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.compatibility.issuesAndWarnings') }}</h4>
            <div class="issues-list">
              <el-alert
                v-for="issue in compatibilityResults.issues"
                :key="issue.id"
                :title="issue.title"
                :type="issue.severity"
                :description="issue.description"
                show-icon
                :closable="false"
                class="issue-item"
              >
                <div v-if="issue.solution" class="issue-solution">
                  <strong>{{ $t('config.sillyTavern.compatibility.solution') }}:</strong>
                  {{ issue.solution }}
                </div>
              </el-alert>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Mapping Configuration -->
      <div v-else-if="currentStep === 3" class="step-mapping">
        <div class="step-header">
          <h3 class="step-title">{{ $t('config.sillyTavern.mapping.title') }}</h3>
          <p class="step-description">{{ $t('config.sillyTavern.mapping.description') }}</p>
        </div>

        <div class="mapping-content">
          <!-- Import Options -->
          <div class="mapping-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.mapping.importOptions') }}</h4>
            <div class="options-grid">
              <el-card class="option-card">
                <el-checkbox v-model="importOptions.includeSettings">
                  {{ $t('config.sillyTavern.mapping.includeSettings') }}
                </el-checkbox>
                <p class="option-description">{{ $t('config.sillyTavern.mapping.includeSettingsDesc') }}</p>
              </el-card>

              <el-card class="option-card">
                <el-checkbox v-model="importOptions.includeCharacters">
                  {{ $t('config.sillyTavern.mapping.includeCharacters') }}
                </el-checkbox>
                <p class="option-description">{{ $t('config.sillyTavern.mapping.includeCharactersDesc') }}</p>
              </el-card>

              <el-card class="option-card">
                <el-checkbox v-model="importOptions.includeChats">
                  {{ $t('config.sillyTavern.mapping.includeChats') }}
                </el-checkbox>
                <p class="option-description">{{ $t('config.sillyTavern.mapping.includeChatDesc') }}</p>
              </el-card>

              <el-card class="option-card">
                <el-checkbox v-model="importOptions.includePresets">
                  {{ $t('config.sillyTavern.mapping.includePresets') }}
                </el-checkbox>
                <p class="option-description">{{ $t('config.sillyTavern.mapping.includePresetsDesc') }}</p>
              </el-card>
            </div>
          </div>

          <!-- Advanced Options -->
          <div class="mapping-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.mapping.advancedOptions') }}</h4>
            <div class="advanced-options">
              <el-form :model="importOptions" label-width="200px">
                <el-form-item :label="$t('config.sillyTavern.mapping.overwriteExisting')">
                  <el-switch v-model="importOptions.overwriteExisting" />
                  <p class="option-note">{{ $t('config.sillyTavern.mapping.overwriteExistingNote') }}</p>
                </el-form-item>

                <el-form-item :label="$t('config.sillyTavern.mapping.createBackup')">
                  <el-switch v-model="importOptions.createBackup" />
                  <p class="option-note">{{ $t('config.sillyTavern.mapping.createBackupNote') }}</p>
                </el-form-item>

                <el-form-item :label="$t('config.sillyTavern.mapping.validateData')">
                  <el-switch v-model="importOptions.validateData" />
                  <p class="option-note">{{ $t('config.sillyTavern.mapping.validateDataNote') }}</p>
                </el-form-item>

                <el-form-item :label="$t('config.sillyTavern.mapping.preserveIds')">
                  <el-switch v-model="importOptions.preserveIds" />
                  <p class="option-note">{{ $t('config.sillyTavern.mapping.preserveIdsNote') }}</p>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- Field Mapping -->
          <div v-if="mappingFields.length > 0" class="mapping-section">
            <h4 class="section-title">{{ $t('config.sillyTavern.mapping.fieldMapping') }}</h4>
            <div class="mapping-table">
              <div class="mapping-header">
                <span class="header-cell">{{ $t('config.sillyTavern.mapping.sillyTavernField') }}</span>
                <span class="header-cell">{{ $t('config.sillyTavern.mapping.tavernAiField') }}</span>
                <span class="header-cell">{{ $t('config.sillyTavern.mapping.action') }}</span>
              </div>
              <div
                v-for="field in mappingFields"
                :key="field.sourcePath"
                class="mapping-row"
              >
                <span class="mapping-cell source-field">{{ field.sourcePath }}</span>
                <el-select
                  v-model="field.targetPath"
                  :placeholder="$t('config.sillyTavern.mapping.selectTarget')"
                  class="mapping-cell target-field"
                  clearable
                >
                  <el-option
                    v-for="target in field.availableTargets"
                    :key="target.path"
                    :label="target.displayName"
                    :value="target.path"
                  />
                </el-select>
                <div class="mapping-cell action-field">
                  <el-button
                    size="small"
                    type="text"
                    @click="autoMapField(field)"
                    :disabled="!field.suggestedTarget"
                  >
                    {{ $t('config.sillyTavern.mapping.autoMap') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Import Execution -->
      <div v-else-if="currentStep === 4" class="step-import">
        <div class="step-header">
          <h3 class="step-title">{{ $t('config.sillyTavern.import.title') }}</h3>
          <p class="step-description">{{ $t('config.sillyTavern.import.description') }}</p>
        </div>

        <div v-if="!importStarted" class="import-summary">
          <div class="summary-section">
            <h4>{{ $t('config.sillyTavern.import.importSummary') }}</h4>
            <div class="summary-stats">
              <div class="stat-item">
                <strong>{{ $t('config.sillyTavern.import.totalItems') }}:</strong>
                {{ getImportItemCount() }}
              </div>
              <div v-if="importOptions.includeSettings" class="stat-item">
                <strong>{{ $t('config.sillyTavern.import.settings') }}:</strong>
                {{ analysisResults?.configFiles.filter(c => c.selected).length || 0 }}
              </div>
              <div v-if="importOptions.includeCharacters" class="stat-item">
                <strong>{{ $t('config.sillyTavern.import.characters') }}:</strong>
                {{ analysisResults?.characters.filter(c => c.selected).length || 0 }}
              </div>
              <div v-if="importOptions.includeChats" class="stat-item">
                <strong>{{ $t('config.sillyTavern.import.chats') }}:</strong>
                {{ analysisResults?.chats.filter(c => c.selected).length || 0 }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="import-progress">
          <div class="progress-section">
            <el-progress
              :percentage="importProgress"
              :status="importStatus"
              :stroke-width="8"
            />
            <div class="progress-message">{{ importMessage }}</div>
          </div>

          <div v-if="importLogs.length" class="import-logs">
            <h5>{{ $t('config.sillyTavern.import.importLogs') }}</h5>
            <div class="logs-container">
              <div
                v-for="(log, index) in importLogs"
                :key="index"
                class="log-entry"
                :class="`log-${log.level}`"
              >
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>

          <div v-if="importComplete && importResults" class="import-results">
            <div class="results-summary">
              <h4>{{ $t('config.sillyTavern.import.importComplete') }}</h4>
              <div class="results-stats">
                <div class="stat-item success">
                  <el-icon><CircleCheckFilled /></el-icon>
                  <span>{{ $t('config.sillyTavern.import.imported') }}: {{ importResults.imported }}</span>
                </div>
                <div class="stat-item warning" v-if="importResults.skipped > 0">
                  <el-icon><WarningFilled /></el-icon>
                  <span>{{ $t('config.sillyTavern.import.skipped') }}: {{ importResults.skipped }}</span>
                </div>
                <div class="stat-item error" v-if="importResults.errors > 0">
                  <el-icon><CircleCloseFilled /></el-icon>
                  <span>{{ $t('config.sillyTavern.import.errors') }}: {{ importResults.errors }}</span>
                </div>
              </div>
            </div>

            <div v-if="importResults.errorDetails.length > 0" class="error-details">
              <h5>{{ $t('config.sillyTavern.import.errorDetails') }}</h5>
              <div class="error-list">
                <el-alert
                  v-for="(error, index) in importResults.errorDetails"
                  :key="index"
                  :title="error.item"
                  type="error"
                  :description="error.message"
                  show-icon
                  :closable="false"
                  class="error-item"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Footer -->
    <div class="import-footer">
      <div class="footer-content">
        <div class="footer-info">
          <span v-if="currentStep < 4" class="step-indicator">
            {{ $t('config.sillyTavern.stepIndicator', { current: currentStep + 1, total: 5 }) }}
          </span>
        </div>

        <div class="footer-actions">
          <el-button
            v-if="currentStep > 0 && !importStarted"
            @click="handlePrevious"
          >
            {{ $t('common.previous') }}
          </el-button>

          <el-button
            v-if="currentStep < 4"
            type="primary"
            :disabled="!canProceed"
            :loading="isProcessing"
            @click="handleNext"
          >
            {{ $t('common.next') }}
          </el-button>

          <el-button
            v-else-if="!importStarted"
            type="primary"
            @click="startImport"
            :disabled="!canStartImport"
          >
            {{ $t('config.sillyTavern.import.startImport') }}
          </el-button>

          <el-button
            v-else-if="importComplete"
            type="primary"
            @click="handleFinish"
          >
            {{ $t('common.finish') }}
          </el-button>

          <el-button @click="$emit('close')">
            {{ importStarted ? $t('common.close') : $t('common.cancel') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FolderOpened, Search, Shield, Connection, Download, QuestionFilled,
  Refresh, UploadFilled, Document, Close, Collection, User, ChatDotSquare,
  Setting, CircleCheckFilled, WarningFilled, Check, InfoFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'

interface AnalysisResults {
  fileCount: number
  configFiles: Array<{
    name: string
    path: string
    type: string
    valid: boolean
    selected: boolean
  }>
  characters: Array<{
    id: string
    name: string
    description: string
    avatar?: string
    selected: boolean
  }>
  chats: Array<{
    id: string
    character: string
    name: string
    messageCount: number
    selected: boolean
  }>
}

interface CompatibilityResults {
  overallCompatible: boolean
  score: number
  features: Array<{
    name: string
    displayName: string
    description: string
    supported: boolean
    migrationNote?: string
  }>
  issues: Array<{
    id: string
    title: string
    description: string
    severity: 'error' | 'warning' | 'info'
    solution?: string
  }>
}

interface MappingField {
  sourcePath: string
  targetPath: string
  sourceType: string
  suggestedTarget?: string
  availableTargets: Array<{
    path: string
    displayName: string
    type: string
  }>
}

interface ImportResults {
  imported: number
  skipped: number
  errors: number
  errorDetails: Array<{
    item: string
    message: string
  }>
}

interface ImportLog {
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: Date
}

const { t } = useI18n()
const configStore = useConfigStore()

// Reactive state
const currentStep = ref(0)
const sourceMethod = ref('upload')
const importing = ref(false)
const analyzing = ref(false)
const checkingCompatibility = ref(false)
const browsing = ref(false)
const fetching = ref(false)

// Step 0: Source
const uploadRef = ref()
const uploadedFiles = ref<File[]>([])
const folderPath = ref('')
const folderContents = ref<Array<{ name: string; size: number; isDirectory: boolean }>>([])
const configUrl = ref('')
const fetchedConfig = ref<any>(null)

// Step 1: Analysis
const analysisProgress = ref(0)
const analysisStatus = ref('')
const analysisResults = ref<AnalysisResults | null>(null)

// Step 2: Compatibility
const compatibilityProgress = ref(0)
const compatibilityStatus = ref('')
const compatibilityResults = ref<CompatibilityResults | null>(null)

// Step 3: Mapping
const importOptions = ref({
  includeSettings: true,
  includeCharacters: true,
  includeChats: false,
  includePresets: true,
  overwriteExisting: false,
  createBackup: true,
  validateData: true,
  preserveIds: false
})

const mappingFields = ref<MappingField[]>([])

// Step 4: Import
const importStarted = ref(false)
const importComplete = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'exception' | undefined>()
const importMessage = ref('')
const importLogs = ref<ImportLog[]>([])
const importResults = ref<ImportResults | null>(null)

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return hasValidSource.value
    case 1:
      return !!analysisResults.value
    case 2:
      return !!compatibilityResults.value
    case 3:
      return true // Mapping is optional
    default:
      return false
  }
})

const hasValidSource = computed(() => {
  switch (sourceMethod.value) {
    case 'upload':
      return uploadedFiles.value.length > 0
    case 'folder':
      return folderPath.value.trim() !== ''
    case 'url':
      return configUrl.value.trim() !== '' && !!fetchedConfig.value
    default:
      return false
  }
})

const isProcessing = computed(() => {
  return analyzing.value || checkingCompatibility.value || browsing.value || fetching.value
})

const canStartImport = computed(() => {
  return !!(analysisResults.value && compatibilityResults.value)
})

// Methods
const handleFileUpload = (file: any, fileList: any[]) => {
  uploadedFiles.value = fileList.map(f => f.raw)
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
  uploadRef.value?.handleRemove(uploadRef.value.uploadFiles[index])
}

const browseFolderPath = async () => {
  try {
    browsing.value = true

    // This would typically use an Electron API to browse folders
    // For web implementation, we might use a folder picker API
    const result = await (window as any).electronAPI?.selectFolder?.()

    if (result && !result.canceled) {
      folderPath.value = result.filePaths[0]
      await loadFolderContents()
    }
  } catch (err) {
    console.error('Failed to browse folder:', err)
    ElMessage.error(t('config.sillyTavern.source.browseFolderError'))
  } finally {
    browsing.value = false
  }
}

const loadFolderContents = async () => {
  if (!folderPath.value) return

  try {
    // This would typically use filesystem APIs
    const contents = await (window as any).electronAPI?.readFolder?.(folderPath.value)
    folderContents.value = contents || []
  } catch (err) {
    console.error('Failed to load folder contents:', err)
    ElMessage.error(t('config.sillyTavern.source.loadFolderError'))
  }
}

const fetchConfigFromUrl = async () => {
  if (!configUrl.value.trim()) return

  try {
    fetching.value = true

    const response = await fetch(configUrl.value)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    let config: any

    if (contentType?.includes('application/json')) {
      config = await response.json()
    } else {
      const text = await response.text()
      try {
        config = JSON.parse(text)
      } catch {
        // Try to parse as YAML or other formats
        config = { rawContent: text }
      }
    }

    fetchedConfig.value = config
    ElMessage.success(t('config.sillyTavern.source.fetchSuccess'))

  } catch (err) {
    console.error('Failed to fetch config:', err)
    ElMessage.error(t('config.sillyTavern.source.fetchError', {
      error: err instanceof Error ? err.message : 'Unknown error'
    }))
  } finally {
    fetching.value = false
  }
}

const handleNext = async () => {
  try {
    switch (currentStep.value) {
      case 0:
        await analyzeSource()
        break
      case 1:
        await checkCompatibility()
        break
      case 2:
        await setupMapping()
        break
      case 3:
        currentStep.value = 4
        break
    }
  } catch (err) {
    console.error('Failed to proceed to next step:', err)
    ElMessage.error(t('config.sillyTavern.stepError'))
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const analyzeSource = async () => {
  try {
    analyzing.value = true
    analysisProgress.value = 0
    analysisStatus.value = t('config.sillyTavern.analysis.startingAnalysis')

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      if (analysisProgress.value < 80) {
        analysisProgress.value += Math.random() * 10
        if (analysisProgress.value > 80) {
          analysisProgress.value = 80
        }
      }
    }, 500)

    // Perform actual analysis
    const analysisData = await configStore.analyzeSillyTavernData({
      method: sourceMethod.value,
      files: uploadedFiles.value,
      folderPath: folderPath.value,
      configUrl: configUrl.value,
      fetchedConfig: fetchedConfig.value
    })

    clearInterval(progressInterval)
    analysisProgress.value = 100
    analysisStatus.value = t('config.sillyTavern.analysis.analysisComplete')

    analysisResults.value = {
      fileCount: analysisData.fileCount || 0,
      configFiles: (analysisData.configFiles || []).map((f: any) => ({
        ...f,
        selected: true // Default to selected
      })),
      characters: (analysisData.characters || []).map((c: any) => ({
        ...c,
        selected: true // Default to selected
      })),
      chats: (analysisData.chats || []).map((c: any) => ({
        ...c,
        selected: false // Default to not selected for chats
      }))
    }

    currentStep.value = 1

  } catch (err) {
    console.error('Analysis failed:', err)
    ElMessage.error(t('config.sillyTavern.analysis.analysisError'))
  } finally {
    analyzing.value = false
  }
}

const checkCompatibility = async () => {
  if (!analysisResults.value) return

  try {
    checkingCompatibility.value = true
    compatibilityProgress.value = 0
    compatibilityStatus.value = t('config.sillyTavern.compatibility.checkingCompatibility')

    // Simulate compatibility check progress
    const progressInterval = setInterval(() => {
      if (compatibilityProgress.value < 80) {
        compatibilityProgress.value += Math.random() * 15
        if (compatibilityProgress.value > 80) {
          compatibilityProgress.value = 80
        }
      }
    }, 300)

    const compatibilityData = await configStore.checkSillyTavernCompatibility(analysisResults.value)

    clearInterval(progressInterval)
    compatibilityProgress.value = 100
    compatibilityStatus.value = t('config.sillyTavern.compatibility.compatibilityCheckComplete')

    compatibilityResults.value = compatibilityData
    currentStep.value = 2

  } catch (err) {
    console.error('Compatibility check failed:', err)
    ElMessage.error(t('config.sillyTavern.compatibility.compatibilityError'))
  } finally {
    checkingCompatibility.value = false
  }
}

const setupMapping = async () => {
  try {
    if (!analysisResults.value || !compatibilityResults.value) return

    // Generate field mappings based on analysis results
    const mappings = await configStore.generateFieldMappings(
      analysisResults.value,
      compatibilityResults.value
    )

    mappingFields.value = mappings
    currentStep.value = 3

  } catch (err) {
    console.error('Failed to setup mapping:', err)
    ElMessage.error(t('config.sillyTavern.mapping.mappingError'))
  }
}

const autoMapField = (field: MappingField) => {
  if (field.suggestedTarget) {
    field.targetPath = field.suggestedTarget
  }
}

const startImport = async () => {
  try {
    importStarted.value = true
    importProgress.value = 0
    importMessage.value = t('config.sillyTavern.import.startingImport')

    // Simulate import progress
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += Math.random() * 5
        if (importProgress.value > 90) {
          importProgress.value = 90
        }
      }
    }, 1000)

    // Perform actual import
    const results = await configStore.importSillyTavernConfig({
      analysisResults: analysisResults.value!,
      compatibilityResults: compatibilityResults.value!,
      mappingFields: mappingFields.value,
      options: importOptions.value,
      onProgress: (progress: number, message: string) => {
        importProgress.value = progress
        importMessage.value = message
        importLogs.value.push({
          level: 'info',
          message,
          timestamp: new Date()
        })
      }
    })

    clearInterval(progressInterval)
    importProgress.value = 100
    importStatus.value = results.errors > 0 ? 'exception' : 'success'
    importMessage.value = t('config.sillyTavern.import.importComplete')
    importComplete.value = true
    importResults.value = results

    if (results.errors === 0) {
      ElMessage.success(t('config.sillyTavern.import.importSuccess'))
    } else {
      ElMessage.warning(t('config.sillyTavern.import.importWithErrors'))
    }

  } catch (err) {
    console.error('Import failed:', err)
    importStatus.value = 'exception'
    importMessage.value = t('config.sillyTavern.import.importFailed')
    importLogs.value.push({
      level: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date()
    })
    ElMessage.error(t('config.sillyTavern.import.importError'))
  }
}

const handleFinish = () => {
  resetImport()
}

const resetImport = () => {
  currentStep.value = 0
  uploadedFiles.value = []
  folderPath.value = ''
  folderContents.value = []
  configUrl.value = ''
  fetchedConfig.value = null
  analysisResults.value = null
  compatibilityResults.value = null
  mappingFields.value = []
  importStarted.value = false
  importComplete.value = false
  importProgress.value = 0
  importLogs.value = []
  importResults.value = null

  uploadRef.value?.clearFiles()
}

const openDocumentation = () => {
  window.open('https://docs.tavernai.com/sillytavern-migration', '_blank')
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileTypeTag = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json':
      return { type: 'success', label: 'JSON' }
    case 'yaml':
    case 'yml':
      return { type: 'info', label: 'YAML' }
    case 'js':
      return { type: 'warning', label: 'JavaScript' }
    case 'txt':
      return { type: '', label: 'Text' }
    default:
      return { type: 'info', label: 'Other' }
  }
}

const formatJSON = (obj: any): string => {
  return JSON.stringify(obj, null, 2)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString()
}

const getImportItemCount = (): number => {
  if (!analysisResults.value) return 0

  let count = 0
  if (importOptions.value.includeSettings) {
    count += analysisResults.value.configFiles.filter(c => c.selected).length
  }
  if (importOptions.value.includeCharacters) {
    count += analysisResults.value.characters.filter(c => c.selected).length
  }
  if (importOptions.value.includeChats) {
    count += analysisResults.value.chats.filter(c => c.selected).length
  }
  return count
}

// Emit events
defineEmits<{
  close: []
}>()
</script>

<style scoped lang="scss">
.sillytavern-import {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.import-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .header-content {
    @apply max-w-7xl mx-auto px-4 py-6 flex items-center justify-between;

    .title-section {
      .page-title {
        @apply text-2xl font-bold text-gray-900 dark:text-white mb-1;
      }

      .page-description {
        @apply text-gray-600 dark:text-gray-400 text-sm;
      }
    }

    .header-actions {
      @apply flex items-center gap-3;
    }
  }
}

.import-steps {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;

  .steps-navigation {
    @apply max-w-4xl mx-auto px-4 py-6;

    :deep(.el-step__title) {
      @apply text-sm;
    }
  }
}

.step-content {
  @apply max-w-7xl mx-auto px-4 py-6;

  .step-header {
    @apply mb-6;

    .step-title {
      @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
    }

    .step-description {
      @apply text-gray-600 dark:text-gray-400;
    }
  }
}

// Step 0: Source Selection
.step-source {
  .source-tabs {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
  }

  .upload-area {
    @apply mb-6;

    .upload-content {
      @apply text-center py-12;

      .upload-icon {
        @apply text-6xl text-gray-400 mb-4;
      }

      .upload-text {
        @apply text-lg text-gray-700 dark:text-gray-300 mb-2;
      }

      .upload-hint {
        @apply text-sm text-gray-500 dark:text-gray-400;
      }
    }
  }

  .file-list {
    h4 {
      @apply font-semibold text-gray-900 dark:text-white mb-3;
    }

    .file-items {
      @apply space-y-2;

      .file-item {
        @apply flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;

        .file-info {
          @apply flex items-center gap-3;

          .file-icon {
            @apply text-blue-500;
          }

          .file-name {
            @apply font-medium text-gray-900 dark:text-white;
          }

          .file-size {
            @apply text-sm text-gray-500 dark:text-gray-400;
          }

          .file-type {
            @apply ml-2;
          }
        }
      }
    }
  }

  .folder-input,
  .url-input {
    @apply mb-4;
  }

  .folder-info,
  .fetched-preview {
    h4 {
      @apply font-semibold text-gray-900 dark:text-white mb-3;
    }

    .folder-contents {
      @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4;

      .folder-item {
        @apply flex items-center gap-3 py-2;

        .item-icon {
          @apply text-blue-500;
        }

        .item-name {
          @apply flex-1 text-gray-900 dark:text-white;
        }

        .item-size {
          @apply text-sm text-gray-500 dark:text-gray-400;
        }
      }

      .more-items {
        @apply text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600 mt-2;
      }
    }

    .config-preview {
      @apply bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-40;
    }
  }
}

// Step 1: Analysis
.step-analysis {
  .analysis-loading {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;

    .analysis-status {
      @apply mt-6 text-center;

      .status-text {
        @apply mt-3 text-gray-600 dark:text-gray-400;
      }
    }
  }

  .analysis-results {
    .analysis-section {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6;

      .section-title {
        @apply font-semibold text-gray-900 dark:text-white mb-4;
      }
    }

    .analysis-grid {
      @apply grid grid-cols-2 md:grid-cols-4 gap-4;

      .analysis-card {
        @apply text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;

        .card-header {
          @apply flex items-center justify-center gap-2 mb-2;

          .card-icon {
            @apply text-blue-500;
          }

          .card-title {
            @apply text-sm text-gray-600 dark:text-gray-400;
          }
        }

        .card-value {
          @apply text-2xl font-bold text-gray-900 dark:text-white;
        }
      }
    }

    .config-list,
    .characters-grid {
      @apply space-y-3;

      .config-item {
        @apply flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;

        .config-info {
          @apply flex items-center gap-3 flex-1;

          .config-icon {
            @apply text-blue-500;
          }

          .config-details {
            @apply flex flex-col;

            .config-name {
              @apply font-medium text-gray-900 dark:text-white;
            }

            .config-path {
              @apply text-sm text-gray-500 dark:text-gray-400;
            }
          }
        }
      }
    }

    .characters-grid {
      @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;

      .character-card {
        @apply flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;

        .character-avatar {
          @apply w-12 h-12 flex-shrink-0;

          .avatar-image {
            @apply w-full h-full object-cover rounded-full;
          }

          .avatar-placeholder {
            @apply w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-500;
          }
        }

        .character-info {
          @apply flex-1;

          .character-name {
            @apply block font-medium text-gray-900 dark:text-white mb-1;
          }

          .character-description {
            @apply text-sm text-gray-600 dark:text-gray-400;
          }
        }
      }
    }

    .more-characters {
      @apply text-center text-gray-500 dark:text-gray-400 py-4 bg-gray-50 dark:bg-gray-700 rounded-lg;
    }
  }
}

// Step 2: Compatibility
.step-compatibility {
  .compatibility-loading {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;

    .compatibility-status {
      @apply mt-6 text-center;

      .status-text {
        @apply mt-3 text-gray-600 dark:text-gray-400;
      }
    }
  }

  .compatibility-results {
    .compatibility-summary {
      @apply mb-6;

      .summary-card {
        @apply flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm;

        .summary-icon {
          .status-icon {
            @apply text-4xl;

            &.success {
              @apply text-green-500;
            }

            &.warning {
              @apply text-yellow-500;
            }
          }
        }

        .summary-content {
          .summary-title {
            @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
          }

          .summary-description {
            @apply text-gray-600 dark:text-gray-400;
          }
        }
      }
    }

    .compatibility-section {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6;

      .section-title {
        @apply font-semibold text-gray-900 dark:text-white mb-4;
      }
    }

    .feature-list {
      @apply space-y-3;

      .feature-item {
        @apply flex items-start gap-3 p-3 rounded-lg transition-colors;

        &.feature-unsupported {
          @apply bg-red-50 dark:bg-red-900/20;
        }

        .feature-icon {
          @apply w-5 h-5 flex-shrink-0 mt-0.5;

          &.supported {
            @apply text-green-500;
          }

          &.unsupported {
            @apply text-red-500;
          }
        }

        .feature-content {
          @apply flex-1;

          .feature-name {
            @apply block font-medium text-gray-900 dark:text-white mb-1;
          }

          .feature-description {
            @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
          }

          .migration-note {
            @apply flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2;
          }
        }
      }
    }

    .issues-list {
      @apply space-y-3;

      .issue-item {
        .issue-solution {
          @apply mt-2 text-sm;
        }
      }
    }
  }
}

// Step 3: Mapping
.step-mapping {
  .mapping-content {
    @apply space-y-6;

    .mapping-section {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;

      .section-title {
        @apply font-semibold text-gray-900 dark:text-white mb-4;
      }
    }

    .options-grid {
      @apply grid grid-cols-1 md:grid-cols-2 gap-4;

      .option-card {
        @apply p-4;

        .option-description {
          @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
        }
      }
    }

    .advanced-options {
      .option-note {
        @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
      }
    }

    .mapping-table {
      .mapping-header {
        @apply grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg font-medium text-gray-900 dark:text-white;

        .header-cell {
          @apply text-sm;
        }
      }

      .mapping-row {
        @apply grid grid-cols-3 gap-4 p-3 border-b border-gray-200 dark:border-gray-700;

        .mapping-cell {
          @apply flex items-center;

          &.source-field {
            @apply font-mono text-sm text-gray-700 dark:text-gray-300;
          }

          &.target-field {
            @apply w-full;
          }

          &.action-field {
            @apply justify-end;
          }
        }
      }
    }
  }
}

// Step 4: Import
.step-import {
  .import-summary {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6;

    h4 {
      @apply font-semibold text-gray-900 dark:text-white mb-4;
    }

    .summary-stats {
      @apply space-y-2;

      .stat-item {
        @apply text-gray-700 dark:text-gray-300;

        strong {
          @apply text-gray-900 dark:text-white;
        }
      }
    }
  }

  .import-progress {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;

    .progress-section {
      @apply text-center mb-6;

      .progress-message {
        @apply mt-3 text-gray-600 dark:text-gray-400;
      }
    }

    .import-logs {
      h5 {
        @apply font-semibold text-gray-900 dark:text-white mb-3;
      }

      .logs-container {
        @apply bg-gray-900 text-green-400 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-sm;

        .log-entry {
          @apply flex gap-2 mb-1;

          &.log-error {
            @apply text-red-400;
          }

          &.log-warning {
            @apply text-yellow-400;
          }

          .log-time {
            @apply text-gray-500 flex-shrink-0;
          }

          .log-message {
            @apply flex-1;
          }
        }
      }
    }

    .import-results {
      @apply mt-6;

      .results-summary {
        h4 {
          @apply font-semibold text-gray-900 dark:text-white mb-4;
        }

        .results-stats {
          @apply flex flex-wrap gap-4 mb-6;

          .stat-item {
            @apply flex items-center gap-2;

            &.success {
              @apply text-green-600 dark:text-green-400;
            }

            &.warning {
              @apply text-yellow-600 dark:text-yellow-400;
            }

            &.error {
              @apply text-red-600 dark:text-red-400;
            }
          }
        }
      }

      .error-details {
        h5 {
          @apply font-semibold text-gray-900 dark:text-white mb-3;
        }

        .error-list {
          @apply space-y-3;

          .error-item {
            @apply text-sm;
          }
        }
      }
    }
  }
}

// Footer
.import-footer {
  @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;

  .footer-content {
    @apply max-w-7xl mx-auto px-4 py-4 flex items-center justify-between;

    .footer-info {
      .step-indicator {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
    }

    .footer-actions {
      @apply flex items-center gap-3;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .import-header .header-content {
    @apply flex-col items-start gap-4;
  }

  .step-content {
    @apply px-2;
  }

  .analysis-grid {
    @apply grid-cols-2;
  }

  .characters-grid {
    @apply grid-cols-1;
  }

  .options-grid {
    @apply grid-cols-1;
  }

  .mapping-table {
    .mapping-header,
    .mapping-row {
      @apply grid-cols-1 gap-2;
    }
  }

  .import-footer .footer-content {
    @apply flex-col items-stretch gap-4;

    .footer-actions {
      @apply justify-end;
    }
  }
}
</style>