import React from 'react'
import { Play, Download, Settings, Upload } from 'lucide-react'

const HomePage: React.FC = () => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      console.log('Uploaded files:', files)
      alert(`檔案已選取，請查看控制台 (Uploaded files: ${files[0].name})`) // Simulate upload feedback
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center space-y-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">遊戲標題</h1>
      <div className="flex flex-col space-y-4">
        <button className="button-primary" onClick={() => alert('開始新遊戲')}>
          <Play className="mr-2 h-5 w-5" />
          開始新遊戲
        </button>
        <button className="button-secondary" onClick={() => alert('讀取進度')}>
          <Download className="mr-2 h-5 w-5" />
          讀取進度
        </button>
        <button className="button-secondary" onClick={() => alert('選項設定')}>
          <Settings className="mr-2 h-5 w-5" />
          選項設定
        </button>
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button className="button-secondary" onClick={() => document.getElementById('fileUpload')?.click()}>
          <Upload className="mr-2 h-5 w-5" />
          上傳檔案
        </button>
      </div>
    </div>
  )
}

export default HomePage
