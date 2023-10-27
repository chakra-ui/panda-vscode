import { parseToRgba } from 'color2k'
// import type { PandaVSCodeSettings } from '@pandacss/extension-shared'

// taken from https://github.com/nderscore/tamagui-typescript-plugin/blob/eb4dbd4ea9a60cbfff2ffd9ae8992ec2e54c0b02/src/metadata.ts

const squirclePath = `M 0,12 C 0,0 0,0 12,0 24,0 24,0 24,12 24,24 24,24 12,24 0, 24 0,24 0,12`

const svgCheckerboard = `<defs>
<pattern id="pattern-checker" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
<rect x="0" y="0" width="4" height="4" fill="#fff" />
<rect x="4" y="0" width="4" height="4" fill="#000" />
<rect x="0" y="4" width="4" height="4" fill="#000" />
<rect x="4" y="4" width="4" height="4" fill="#fff" />
</pattern>
</defs>
<path d="${squirclePath}" fill="url(#pattern-checker)" />`

export const makeColorTile = (value: string, size: number = 18) => {
  try {
    const [_r, _g, _b, alpha] = parseToRgba(value)
    const hasAlphaTransparency = alpha !== 1
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${
      hasAlphaTransparency ? svgCheckerboard : ''
    }<path d="${squirclePath}" fill="${value}" /></svg>`
    const image = `![Image](data:image/svg+xml;base64,${btoa(svg)})`
    return image
  } catch {
    return ''
  }
}

export const makeTable = (rows: Record<string, string>[]) => {
  const header = rows[0]!
  const keys = Object.keys(header)
  const renderRow = (row: Record<string, string>) => {
    return `| ${keys.map((key) => row[key]).join(' | ')} |`
  }
  const renderSplitter = () => {
    return `| ${keys.map(() => '---').join(' | ')} |`
  }

  return `${renderRow(header)}\n${renderSplitter()}\n${rows.slice(1).map(renderRow).join('\n')}`
}
