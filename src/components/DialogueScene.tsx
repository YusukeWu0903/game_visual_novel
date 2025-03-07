import React from 'react'

interface DialogueSceneProps {
  dialogueData: {
    speaker: string
    text: string
    portraitLeft?: string
    portraitRight?: string
  }
}

const DialogueScene: React.FC<DialogueSceneProps> = ({ dialogueData }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex justify-between items-end p-10">
        {dialogueData.portraitLeft && (
          <div className="w-1/4">
            <img src={dialogueData.portraitLeft} alt="Character Left" className="max-w-full h-auto" />
          </div>
        )}
        {dialogueData.portraitRight && (
          <div className="w-1/4">
            <img src={dialogueData.portraitRight} alt="Character Right" className="max-w-full h-auto" />
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md text-lg">
        <p className="font-semibold">{dialogueData.speaker}</p>
        <p>{dialogueData.text}</p>
      </div>
    </div>
  )
}

export default DialogueScene
