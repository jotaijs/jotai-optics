import { atom, PrimitiveAtom, Provider, useAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { useAtomArraySlice } from '../src/index'

type TodoItem = { task: string; checked?: boolean }

it('no unneccesary updates when updating atoms', async () => {
  const todosAtom = atom<Array<TodoItem>>([
    { task: 'get cat food', checked: false },
    { task: 'get dragon food', checked: false },
  ])

  const TaskList = ({ atom }: { atom: typeof todosAtom }) => {
    const atoms = useAtomArraySlice(atom)
    return (
      <>
        {atoms.map(([atom, remove], index) => (
          <TaskItem key={index} onRemove={remove} atom={atom} />
        ))}
      </>
    )
  }

  const TaskItem = ({
    atom,
  }: {
    atom: PrimitiveAtom<TodoItem>
    onRemove: () => void
  }) => {
    const [value, onChange] = useAtom(atom)
    const toggle = () =>
      onChange(value => ({ ...value, checked: !value.checked }))
    return (
      <li>
        <input
          data-testid={`${value.task}-checkbox`}
          type="checkbox"
          checked={value.checked || false}
          onChange={toggle}
        />
      </li>
    )
  }

  const { findByTestId } = rtl.render(
    <Provider>
      <TaskList atom={todosAtom} />
    </Provider>,
  )

  const catBox = async () =>
    (await findByTestId('get cat food-checkbox')) as HTMLInputElement
  const dragonBox = async () =>
    (await findByTestId('get dragon food-checkbox')) as HTMLInputElement

  expect((await catBox()).checked).toBe(false)
  expect((await dragonBox()).checked).toBe(false)

  rtl.fireEvent.click(await catBox())

  expect((await catBox()).checked).toBe(true)
  expect((await dragonBox()).checked).toBe(false)

  rtl.fireEvent.click(await dragonBox())

  expect((await catBox()).checked).toBe(true)
  expect((await dragonBox()).checked).toBe(true)
})
