import { atom, Provider, useAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { focus } from '../src/index'

it('updates prisms', async () => {
  const bigAtom = atom<{ a: number | undefined }>({ a: 5 })
  const aAtom = focus(bigAtom, optic => optic.prop('a'))

  const Counter: React.FC = () => {
    const [count, setCount] = useAtom(aAtom)
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount(c => c + 1)}>button</button>
      </>
    )
  }

  const { getByText, findByText } = rtl.render(
    <Provider>
      <Counter />
    </Provider>,
  )

  await findByText('count: 0')
  await findByText('bigAtom: {"a":0}')

  rtl.fireEvent.click(getByText('button'))
  await findByText('count: 1')
  await findByText('bigAtom: {"a":1}')
})
