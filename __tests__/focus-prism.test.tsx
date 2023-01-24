import React, { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { expectTypeOf } from 'expect-type'
import { atom, useAtom } from 'jotai'
import type { SetStateAction, WritableAtom } from 'jotai'
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

type BillingData = {
  id: string
}

type CustomerData = {
  id: string
  billing: BillingData[]
  someDynamicData?: string
}

it('typescript should work well with nested arrays containing optional values', async () => {
  const customerListAtom = atom<CustomerData[]>([])

  const foundCustomerAtom = focusAtom(customerListAtom, (optic) =>
    optic.find((el) => el.id === 'some-invalid-id')
  )

  const derivedAtom = focusAtom(foundCustomerAtom, (optic) => {
    const result = optic
      .valueOr({ billing: [] } as unknown as CustomerData)
      .prop('billing')
      .find((el) => el.id === 'some-invalid-id')

    return result
  })

  expectTypeOf(derivedAtom).toMatchTypeOf<
    WritableAtom<BillingData | undefined, SetStateAction<BillingData>, void>
  >()
})

it('should work with promise based atoms with "undefined" value', async () => {
  const customerBaseAtom = atom<CustomerData | undefined>(undefined)

  const asyncCustomerDataAtom = atom(
    async (get) => get(customerBaseAtom),
    (_, set, nextValue: CustomerData) => {
      set(customerBaseAtom, nextValue)
    }
  )

  const focusedPromiseAtom = focusAtom(asyncCustomerDataAtom, (optic) =>
    optic.optional()
  )

  expectTypeOf(focusedPromiseAtom).toMatchTypeOf<
    WritableAtom<Promise<string | undefined>, SetStateAction<CustomerData>>
  >
})
