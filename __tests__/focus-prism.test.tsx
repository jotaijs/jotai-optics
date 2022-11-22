import React, { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import * as O from 'optics-ts'
import { focusAtom } from '../src/index'

it('updates prisms', async () => {
  const bigAtom = atom<{ a?: number }>({ a: 5 })
  const focusFunction = (optic: O.OpticFor<{ a?: number }>) =>
    optic.prop('a').optional()

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction))
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  await findByText('count: 5')
  await findByText('bigAtom: {"a":5}')

  fireEvent.click(getByText('button'))
  await findByText('count: 6')
  await findByText('bigAtom: {"a":6}')
})

it('atoms that focus on no values are not updated', async () => {
  const bigAtom = atom<{ a?: number }>({})
  const focusFunction = (optic: O.OpticFor<{ a?: number }>) =>
    optic.prop('a').optional()

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction))
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {JSON.stringify(count)}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  await findByText('count:')
  await findByText('bigAtom: {}')

  fireEvent.click(getByText('button'))
  await findByText('count:')
  await findByText('bigAtom: {}')
})
