import { css, sva } from '../styled-system/css'
import { button } from '../styled-system/recipes'
import { flex } from '../styled-system/patterns'
import './App.css'

const card = sva({
  slots: ['label', 'icon'],
  base: {
    label: {
      color: 'red.200',
    },
    icon: {
      fontSize: '3xl',
    },
  },
})

card()
button({ size: 'sm' })
flex({ direction: 'column', gap: 'initial', color: 'teal.300' })

function App() {
  return (
    <>
      <div
        className={css({
          color: 'blue',
          outlineColor: 'bg',
          backgroundColor: 'bg.text',
          bgColor: 'bg',
          border: '1px solid token(colors.amber.400)',
          margin: '2rem',
          padding: '4',
          fontSize: '2xl',
          lineHeight: 'normal'
        })}
      >
        Hello from Panda !
      </div>
    </>
  )
}

export default App
