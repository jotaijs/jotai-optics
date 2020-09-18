import { atom, Provider, useAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { focus } from '../src/index'

it('focus on an atom works', async () => {
  const bigAtom = atom({ a: 0 })
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

it('double-focus on an atom works', async () => {
  const bigAtom = atom({ a: { b: 0 } })
  const atomA = focus(bigAtom, optic => optic.prop('a'))
  const atomB = focus(atomA, optic => optic.prop('b'))

  const Counter: React.FC = () => {
    const [bigAtomValue, setBigAtom] = useAtom(bigAtom)
    const [atomAValue, setAtomA] = useAtom(atomA)
    const [atomBValue, setAtomB] = useAtom(atomB)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>atomA: {JSON.stringify(atomAValue)}</div>
        <div>atomB: {JSON.stringify(atomBValue)}</div>
        <button onClick={() => setBigAtom(v => ({ a: { b: v.a.b + 1 } }))}>
          inc bigAtom
        </button>
        <button onClick={() => setAtomA(v => ({ b: v.b + 2 }))}>
          inc atomA
        </button>
        <button onClick={() => setAtomB(v => v + 3)}>inc atomB</button>
      </>
    )
  }

  const { getByText, findByText } = rtl.render(
    <Provider>
      <Counter />
    </Provider>,
  )

  await findByText('bigAtom: {"a":{"b":0}}')
  await findByText('atomA: {"b":0}')
  await findByText('atomB: 0')

  rtl.fireEvent.click(getByText('inc bigAtom'))
  await findByText('bigAtom: {"a":{"b":1}}')
  await findByText('atomA: {"b":1}')
  await findByText('atomB: 1')

  rtl.fireEvent.click(getByText('inc atomA'))
  await findByText('bigAtom: {"a":{"b":3}}')
  await findByText('atomA: {"b":3}')
  await findByText('atomB: 3')

  rtl.fireEvent.click(getByText('inc atomB'))
  await findByText('bigAtom: {"a":{"b":6}}')
  await findByText('atomA: {"b":6}')
  await findByText('atomB: 6')
})
