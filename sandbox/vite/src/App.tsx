import { css } from '../styled-system/css'
import './App.css'

function App() {
  return (
    <>
      <div
        className={css({
          color: 'amber.400',
          outlineColor: 'bg',
          backgroundColor: 'bg.text',
          bgColor: 'bg',
          border: '1px solid token(colors.amber.400)',
          margin: '2rem',
          padding: '4',
          fontSize: '2xl',
        })}
      >
        Hello from Panda !
      </div>
    </>
  )
}

export default App
