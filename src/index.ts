import { atomFamily } from 'jotai/utils.cjs'
import * as jotai from 'jotai'
import * as O from 'optics-ts'
import React from 'react'
import { SetStateAction } from 'jotai/core/types'

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (optic: O.OpticFor<S>) => O.Prism<S, any, A>,
): jotai.WritableAtom<A | undefined, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (optic: O.OpticFor<S>) => O.Traversal<S, any, A>,
): jotai.WritableAtom<Array<A>, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (
    optic: O.OpticFor<S>,
  ) => O.Lens<S, any, A> | O.Equivalence<S, any, A> | O.Iso<S, any, A>,
): jotai.WritableAtom<A, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (
    optic: O.OpticFor<S>,
  ) =>
    | O.Lens<S, any, A>
    | O.Equivalence<S, any, A>
    | O.Iso<S, any, A>
    | O.Prism<S, any, A>
    | O.Traversal<S, any, A>,
): any {
  const focus = callback(O.optic<S>())
  return jotai.atom<A, SetStateAction<A>>(
    atomGetter => {
      if (focus._tag === 'Traversal') {
        const values = O.collect(focus)(atomGetter(atom))
        return values
      } else if (focus._tag === 'Prism') {
        const value = O.preview(focus)(atomGetter(atom))
        return value
      } else {
        const value = O.get(focus)(atomGetter(atom))
        return value
      }
    },
    (_, set, update) => {
      set(atom, superState => {
        if (update instanceof Function) {
          return O.modify(focus)(update)(superState)
        } else {
          return O.set(focus)(update)(superState)
        }
      })
    },
  )
}

export type RWAtom<T> = jotai.WritableAtom<T, SetStateAction<T>>

export const useAtomArrayFamily = <Element>(atom: RWAtom<Array<Element>>) => {
  const optic = React.useCallback(
    (i: number) => O.optic<Array<Element>>().index(i),
    [],
  )

  const atomFamilyGetter = React.useMemo(() => {
    return atomFamily<number, Element, SetStateAction<Element>>(
      param => get => {
        // Kindly coercing this from `Element | undefined` to `Element`
        return O.preview(optic(param))(get(atom)) as Element
      },
      param => (_, set, update) => {
        set(atom, superState => {
          const newValue =
            update instanceof Function
              ? O.modify(optic(param))(update)(superState)
              : O.set(optic(param))(update)(superState)
          return newValue
        })
      },
    )
  }, [atom, optic])

  const keysAtom = React.useMemo(
    () =>
      jotai.atom(get => {
        return get(atom).length
      }),
    [atom],
  )

  const removeItemAtom = React.useMemo(
    () =>
      jotai.atom<undefined, number>(undefined, (get, set, arg): void => {
        const currState = get(atom)
        const newState = O.remove(optic(arg))(currState)
        set(atom, newState)
      }),
    [atom, optic],
  )

  const [, removeItem] = jotai.useAtom(removeItemAtom)

  const [elements] = jotai.useAtom(keysAtom)
  const atoms = React.useMemo(
    () =>
      Array.from(new Array(elements)).map(
        (_, key) => [atomFamilyGetter(key), () => removeItem(key)] as const,
      ),
    [elements, atomFamilyGetter, removeItem],
  )
  return atoms
}
