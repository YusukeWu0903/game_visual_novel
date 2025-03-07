import React, { useState } from 'react'
import HomePage from './components/HomePage'
import DialogueScene from './components/DialogueScene'
import dialogueData from './dialogue.json'

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0)

  const handleStartGame = () => {
    setIsGameStarted(true)
  }

  const currentDialogue = dialogueData[currentDialogueIndex]

  return (
    <div>
      {!isGameStarted ? (
        <HomePage onStartGame={handleStartGame} />
      ) : (
        <DialogueScene dialogueData={currentDialogue} />
      )}
    </div>
  )
}

export default App
