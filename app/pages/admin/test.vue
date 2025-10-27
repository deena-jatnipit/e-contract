<template>
  <div class="pdf-form-builder">
    <div class="container">
      <div class="header">
        <h1>PDF Form Builder</h1>

        <div class="form-group">
          <label>Form Name</label>
          <input
            type="text"
            v-model="formName"
            placeholder="Enter form name"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label>Upload PDF</label>
          <div
            class="upload-box"
            :class="{ 'drag-over': isDragging }"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <input
              type="file"
              ref="fileInput"
              accept=".pdf"
              @change="handleFileSelect"
            />
            <div v-if="!pdfFile">
              <p class="mb-2">📄 Click to upload or drag and drop</p>
              <p class="text-muted">PDF files only</p>
            </div>
            <div v-else>
              <p class="text-success">✓ {{ pdfFile.name }}</p>
              <p class="text-muted mt-1">Click to change</p>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content" v-if="pdfLoaded">
        <div class="sidebar">
          <h2>Available Fields</h2>
          <div
            v-for="field in availableFields"
            :key="field.id"
            class="field-item"
            @click="addField(field)"
          >
            <span>{{ field.icon }}</span>
            <span>{{ field.name }}</span>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-controls">
            <div class="page-nav" v-if="totalPages > 1">
              <label>Page:</label>
              <select
                v-model.number="currentPage"
                @change="changePage"
                class="form-select"
              >
                <option v-for="p in totalPages" :key="p" :value="p">
                  Page {{ p }} of {{ totalPages }}
                </option>
              </select>
            </div>
            <button
              class="btn btn-primary"
              @click="saveForm"
              :disabled="placedFields.length === 0"
            >
              💾 Save Form
            </button>
          </div>

          <div class="canvas-wrapper">
            <div class="canvas-container">
              <canvas id="pdf-canvas" ref="pdfCanvas"></canvas>

              <div
                v-for="field in currentPageFields"
                :key="field.id"
                class="field-element"
                :class="{ selected: selectedField === field.id }"
                :style="{
                  left: field.x + 'px',
                  top: field.y + 'px',
                  width: field.width + 'px',
                  height: field.height + 'px',
                }"
                @mousedown="startDrag($event, field)"
                @click="selectField(field.id)"
              >
                {{ field.name }}

                <div class="field-delete" @click.stop="deleteField(field.id)">
                  ×
                </div>

                <template v-if="selectedField === field.id">
                  <div
                    class="resize-handle nw"
                    @mousedown.stop="startResize($event, field, 'nw')"
                  ></div>
                  <div
                    class="resize-handle ne"
                    @mousedown.stop="startResize($event, field, 'ne')"
                  ></div>
                  <div
                    class="resize-handle sw"
                    @mousedown.stop="startResize($event, field, 'sw')"
                  ></div>
                  <div
                    class="resize-handle se"
                    @mousedown.stop="startResize($event, field, 'se')"
                  ></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <p>📄 Upload a PDF file to start building your form</p>
      </div>

      <div class="save-output" v-if="savedData">
        <h3>📊 Database Values (Ready to Save)</h3>
        <pre>{{ savedData }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePdfFormBuilder } from "~/composables/usePdfFormBuilder";

const {
  formName,
  pdfFile,
  pdfLoaded,
  currentPage,
  totalPages,
  isDragging,
  availableFields,
  placedFields,
  selectedField,
  savedData,
  currentPageFields,
  fileInput,
  pdfCanvas,
  triggerFileInput,
  handleFileSelect,
  handleFileDrop,
  changePage,
  addField,
  selectField,
  deleteField,
  startDrag,
  startResize,
  saveForm,
} = usePdfFormBuilder();
</script>

<style scoped>
.pdf-form-builder {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  max-width: 400px;
}

.upload-box:hover {
  border-color: #4caf50;
  background: #f9f9f9;
}

.upload-box.drag-over {
  border-color: #4caf50;
  background: #e8f5e9;
}

.upload-box input {
  display: none;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-1 {
  margin-top: 4px;
}

.text-muted {
  font-size: 12px;
  color: #999;
}

.text-success {
  color: #4caf50;
  font-weight: 500;
}

.main-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 24px;
  margin-top: 24px;
}

.sidebar {
  background: #fafafa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.sidebar h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}

.field-item {
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-item:hover {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.preview-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
  padding: 16px;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.canvas-wrapper {
  position: relative;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: auto;
  max-height: 800px;
}

.canvas-container {
  position: relative;
  margin: 0 auto;
  display: inline-block;
}

#pdf-canvas {
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-element {
  position: absolute;
  border: 2px solid #4caf50;
  background: rgba(76, 175, 80, 0.1);
  cursor: move;
  min-width: 100px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.field-element.selected {
  border-color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  z-index: 100;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border: 1px solid white;
  border-radius: 50%;
}

.resize-handle.nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
.resize-handle.ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}
.resize-handle.sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
.resize-handle.se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.field-element.selected .resize-handle {
  background: #2196f3;
}

.save-output {
  margin-top: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.save-output h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #333;
}

.save-output pre {
  background: white;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  border: 1px solid #ddd;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #999;
}

.field-delete {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #f44336;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 101;
}

.field-element.selected .field-delete {
  display: flex;
}
</style>
