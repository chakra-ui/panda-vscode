import { css } from '../styled-system/css'
import './App.css'

function App() {
  return (
    <>
      <div
        className={css({
          color: 'red.300',
          backgroundColor: 'app.background',
          border: '1px solid (colors.app.text)',
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
