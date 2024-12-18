import click from '../helpers/click'
import clickThought from '../helpers/clickThought'
import getEditingText from '../helpers/getEditingText'
import paste from '../helpers/paste'
import waitForEditable from '../helpers/waitForEditable'

vi.setConfig({ testTimeout: 60000, hookTimeout: 60000 })

/**
 * Extract the Style of html string.
 */
const extractStyleProperty = (html: string) => {
  const colorMatch = html.match(/color=['"]?(#[0-9a-fA-F]{6}|[a-zA-Z]+)['"]?/)
  const backgroundColorMatch = html.match(/background-color:\s*([^;]+)/)

  const color = colorMatch ? colorMatch[1] : null
  const backgroundColor = backgroundColorMatch ? backgroundColorMatch[1].trim() : null
  return { color, backgroundColor }
}

it('Set the text color of the text', async () => {
  const importText = `
  - Labrador
  - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')

  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="text color swatches"] [aria-label="blue"]')

  const cursorText = await getEditingText()
  const result = extractStyleProperty(cursorText!)
  expect(result?.color).toBe('#00c7e6')
  expect(result?.backgroundColor).toBe(null)
})

it('Set the background color of the text', async () => {
  const importText = `
    - Labrador
    - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')
  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="background color swatches"] [aria-label="green"]')

  const cursorText = await getEditingText()
  const result = extractStyleProperty(cursorText!)
  expect(result?.backgroundColor).toBe('rgb(0, 214, 136)')
})

it('Clear the background color when selecting text color', async () => {
  const importText = `
    - Labrador
    - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')
  let cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.backgroundColor).toBe(null)

  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="background color swatches"] [aria-label="green"]')
  cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.backgroundColor).toBe('rgb(0, 214, 136)')
  expect(extractStyleProperty(cursorText!)?.color).toBe('#000000')

  await click('[aria-label="text color swatches"] [aria-label="purple"]')
  cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.color).toBe('#aa80ff')
  expect(extractStyleProperty(cursorText!)?.backgroundColor).toBe(null)
})

it('Clear the text color when setting background color', async () => {
  const importText = `
    - Labrador
    - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')
  let cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.color).toBe(null)

  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="text color swatches"] [aria-label="green"]')
  cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.color).toBe('#00d688')

  await click('[aria-label="background color swatches"] [aria-label="purple"]')
  cursorText = await getEditingText()
  expect(extractStyleProperty(cursorText!)?.backgroundColor).toBe('rgb(170, 128, 255)')
  expect(extractStyleProperty(cursorText!)?.color).toBe('#000000')
})

it('Empty <font> element will be removed after setting color to default.', async () => {
  const importText = `
  - Labrador
  - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')

  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="background color swatches"] [aria-label="blue"]')

  await click('[aria-label="text color swatches"] [aria-label="default"]')
  const result = await getEditingText()
  expect(result).toBe('Golden Retriever')
})

it('Empty <span> element will be removed after setting color to default.', async () => {
  const importText = `
  - Labrador
  - Golden Retriever`

  await paste(importText)

  await waitForEditable('Golden Retriever')
  await clickThought('Golden Retriever')

  await click('[data-testid="toolbar-icon"][aria-label="Text Color"]')
  await click('[aria-label="text color swatches"] [aria-label="blue"]')

  await click('[aria-label="text color swatches"] [aria-label="default"]')

  const result = await getEditingText()
  expect(result).toBe('Golden Retriever')
})
