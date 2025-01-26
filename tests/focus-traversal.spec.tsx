import { afterEach, test } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expectType } from 'ts-expect';
import { useAtom } from 'jotai/react';
import { atom } from 'jotai/vanilla';
import type { SetStateAction, WritableAtom } from 'jotai/vanilla';
import * as O from 'optics-ts';
import { focusAtom } from 'jotai-optics';

afterEach(cleanup);

test('updates traversals', async () => {
  const bigAtom = atom<{ a?: number }[]>([{ a: 5 }, {}, { a: 6 }]);
  const focusFunction = (optic: O.OpticFor_<{ a?: number }[]>) =>
    optic.elems().prop('a').optional();

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction));
    const [bigAtomValue] = useAtom(bigAtom);
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count.join(',')}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    );
  };

  render(
    <StrictMode>
      <Counter />
    </StrictMode>,
  );

  await screen.findByText('count: 5,6');
  await screen.findByText('bigAtom: [{"a":5},{},{"a":6}]');

  fireEvent.click(screen.getByText('button'));
  await screen.findByText('count: 6,7');
  await screen.findByText('bigAtom: [{"a":6},{},{"a":7}]');
});

type BillingData = {
  id: string;
};

type CustomerData = {
  id: string;
  billing: BillingData[];
  someOtherData: string;
};

test('typescript should accept "undefined" as valid value for traversals', async () => {
  const customerListListAtom = atom<CustomerData[][]>([]);

  const nonEmptyCustomerListAtom = focusAtom(customerListListAtom, (optic) =>
    optic.find((el) => el.length > 0),
  );

  const focusedPromiseAtom = focusAtom(nonEmptyCustomerListAtom, (optic) => {
    const result = optic.valueOr([]).elems();
    return result;
  });

  expectType<
    WritableAtom<CustomerData[], [SetStateAction<CustomerData>], void>
  >(focusedPromiseAtom);
});

test('should work with promise based atoms with "undefined" value', async () => {
  const customerBaseAtom = atom<CustomerData[] | undefined>(undefined);

  const asyncCustomerDataAtom = atom(
    async (get) => get(customerBaseAtom),
    async (_, set, nextValue: Promise<CustomerData[]>) => {
      set(customerBaseAtom, await nextValue);
    },
  );

  const focusedPromiseAtom = focusAtom(asyncCustomerDataAtom, (optic) => {
    const result = optic.valueOr([]).elems();
    return result;
  });

  expectType<
    WritableAtom<
      Promise<CustomerData[]>,
      [SetStateAction<CustomerData>],
      Promise<void>
    >
  >(focusedPromiseAtom);
});
