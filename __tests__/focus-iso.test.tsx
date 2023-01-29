import { expectTypeOf } from 'expect-type'
import { SetStateAction, WritableAtom, atom } from 'jotai'
import { focusAtom } from '../src'

type BillingData = {
  id: string
}

type CustomerData = {
  id: string
  billing: BillingData[]
  someOtherData: string
}

const defaultMockCustomer: CustomerData = {
  id: '123',
  billing: [],
  someOtherData: '',
}

it('typescript should accept "undefined" as valid value for iso', async () => {
  const customerListAtom = atom<CustomerData[]>([])

  const foundCustomerAtom = focusAtom(customerListAtom, (optic) =>
    optic.find((el) => el.id === 'some-invalid-id')
  )

  const derivedIso = focusAtom(foundCustomerAtom, (optic) => {
    // Shape object from and to other types
    const result = optic.iso(
      (o) => o?.billing,
      () => defaultMockCustomer
    )
    return result
  })

  expectTypeOf(derivedIso).toMatchTypeOf<
    WritableAtom<
      BillingData[] | undefined,
      SetStateAction<BillingData[] | undefined>,
      void
    >
  >()
})
