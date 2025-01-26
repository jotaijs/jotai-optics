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

test('updates prisms', async () => {
  const bigAtom = atom<{ a?: number }>({ a: 5 });
  const focusFunction = (optic: O.OpticFor_<{ a?: number }>) =>
    optic.prop('a').optional();

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction));
    const [bigAtomValue] = useAtom(bigAtom);
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    );
  };

  render(
    <StrictMode>
      <Counter />
    </StrictMode>,
  );

  await screen.findByText('count: 5');
  await screen.findByText('bigAtom: {"a":5}');

  fireEvent.click(screen.getByText('button'));
  await screen.findByText('count: 6');
  await screen.findByText('bigAtom: {"a":6}');
});

test('atoms that focus on no values are not updated', async () => {
  const bigAtom = atom<{ a?: number }>({});
  const focusFunction = (optic: O.OpticFor_<{ a?: number }>) =>
    optic.prop('a').optional();

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction));
    const [bigAtomValue] = useAtom(bigAtom);
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {JSON.stringify(count)}</div>
        <button onClick={() => setCount((c) => c + 1)}>button</button>
      </>
    );
  };

  render(
    <StrictMode>
      <Counter />
    </StrictMode>,
  );

  await screen.findByText('count:');
  await screen.findByText('bigAtom: {}');

  fireEvent.click(screen.getByText('button'));
  await screen.findByText('count:');
  await screen.findByText('bigAtom: {}');
});

type BillingData = {
  id: string;
};

type CustomerData = {
  id: string;
  billing: BillingData[];
  someDynamicData?: string;
};

test('typescript should work well with nested arrays containing optional values', async () => {
  const customerListAtom = atom<CustomerData[]>([]);

  const foundCustomerAtom = focusAtom(customerListAtom, (optic) =>
    optic.find((el) => el.id === 'some-invalid-id'),
  );

  const derivedAtom = focusAtom(foundCustomerAtom, (optic) => {
    const result = optic
      .valueOr({ billing: [] } as unknown as CustomerData)
      .prop('billing')
      .find((el) => el.id === 'some-invalid-id');

    return result;
  });

  expectType<
    WritableAtom<BillingData | undefined, [SetStateAction<BillingData>], void>
  >(derivedAtom);
});

test('should work with promise based atoms with "undefined" value', async () => {
  const customerBaseAtom = atom<CustomerData | undefined>(undefined);

  const asyncCustomerDataAtom = atom(
    async (get) => get(customerBaseAtom),
    async (_, set, nextValue: Promise<CustomerData>) => {
      set(customerBaseAtom, await nextValue);
    },
  );

  const focusedPromiseAtom = focusAtom(asyncCustomerDataAtom, (optic) =>
    optic.optional(),
  );

  expectType<
    WritableAtom<
      Promise<CustomerData | undefined>,
      [SetStateAction<CustomerData>],
      Promise<void>
    >
  >(focusedPromiseAtom);
});
