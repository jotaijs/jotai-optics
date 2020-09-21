import { atom, Provider, useAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { RWAtom, useAtomArrayFamily } from '../src/index'

type TodoItem = { task: string; checked?: boolean }
it('creating an atom family from an atom of array of items', async () => {
  const todosAtom = atom<Array<TodoItem>>([
    { task: 'get cat food' },
    { task: 'get dragon food' },
  ])

  const TaskList = () => {
    const atoms = useAtomArrayFamily(todosAtom)
    return (
      <>
        {atoms.map((atom, index) => (
          <TaskItem key={index} atom={atom} />
        ))}
      </>
    )
  }

  const TaskItem = ({ atom }: { atom: RWAtom<TodoItem> }) => {
    const [value, onChange] = useAtom(atom)
    const toggle = () =>
      onChange(value => ({ ...value, checked: !value.checked }))
    return (
      <li data-testid={value.task}>
        {value.task}
        <input
          data-testid={`${value.task}-checkbox`}
          type="checkbox"
          checked={value.checked}
          onChange={toggle}
        />
      </li>
    )
  }

  const { findByTestId } = rtl.render(
    <Provider>
      <TaskList />
    </Provider>,
  )

  await findByTestId('get cat food')
  await findByTestId('get dragon food')

  const catBox = (await findByTestId(
    'get cat food-checkbox',
  )) as HTMLInputElement
  const dragonBox = (await findByTestId(
    'get dragon food-checkbox',
  )) as HTMLInputElement

  expect(catBox.checked).toBe(false)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(catBox)

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(dragonBox)

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(true)
})
