import React, { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { expectTypeOf } from 'expect-type'
import { atom, useAtom } from 'jotai'
import type { SetStateAction, WritableAtom } from 'jotai'
import * as O from 'optics-ts'
import { focusAtom } from '../src/index'

it('updates traversals', async () => {
  const bigAtom = atom<{ a?: number }[]>([{ a: 5 }, {}, { a: 6 }])
  const focusFunction = (optic: O.OpticFor<{ a?: number }[]>) =>
    optic.elems().prop('a').optional()

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction))
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count.join(',')}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  await findByText('count: 5,6')
  await findByText('bigAtom: [{"a":5},{},{"a":6}]')

  fireEvent.click(getByText('button'))
  await findByText('count: 6,7')
  await findByText('bigAtom: [{"a":6},{},{"a":7}]')
})

type BillingData = {
  id: string
}

type CustomerData = {
  id: string
  billing: BillingData[]
  someOtherData: string
}

it('typescript should accept "undefined" as valid value for traversals', async () => {
  const customerListListAtom = atom<CustomerData[][]>([])

  const nonEmptyCustomerListAtom = focusAtom(customerListListAtom, (optic) =>
    optic.find((el) => el.length > 0)
  )

  const focusedPromiseAtom = focusAtom(nonEmptyCustomerListAtom, (optic) => {
    const result = optic.valueOr([]).elems()
    return result
  })

  expectTypeOf(focusedPromiseAtom).toMatchTypeOf<
    WritableAtom<CustomerData[], SetStateAction<CustomerData>, void>
  >()
})

it('should work with promise based atoms with "undefined" value', async () => {
  const customerBaseAtom = atom<CustomerData[] | undefined>(undefined)

  const asyncCustomerDataAtom = atom(
    async (get) => get(customerBaseAtom),
    (_, set, nextValue: CustomerData[]) => {
      set(customerBaseAtom, nextValue)
    }
  )

  const focusedPromiseAtom = focusAtom(asyncCustomerDataAtom, (optic) => {
    const result = optic.valueOr([]).elems()
    return result
  })

  expectTypeOf(focusedPromiseAtom).toMatchTypeOf<
    WritableAtom<CustomerData[], SetStateAction<CustomerData>, void>
  >()
})
