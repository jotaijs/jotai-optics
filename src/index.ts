import { atomFamily, useAtomCallback, useSelector } from 'jotai/utils.cjs'
import * as jotai from 'jotai'
import * as O from 'optics-ts'
import React from 'react'
import { SetStateAction } from 'jotai/core/types'

export function focus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (optic: O.OpticFor<S>) => O.Prism<S, any, A>,
): jotai.WritableAtom<A | undefined, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (optic: O.OpticFor<S>) => O.Traversal<S, any, A>,
): jotai.WritableAtom<Array<A>, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (
    optic: O.OpticFor<S>,
  ) => O.Lens<S, any, A> | O.Equivalence<S, any, A> | O.Iso<S, any, A>,
): jotai.PrimitiveAtom<A>

export function focus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
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
export const useAtomArrayFamily = <Element>(
  atom: jotai.PrimitiveAtom<Array<Element>>,
) => {
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

  const removeItem = useAtomCallback<void, number>(
    React.useCallback(
      (_get, set, arg) => {
        set(atom, O.remove(optic(arg)))
      },
      [atom, optic],
    ),
  )

  return useSelector(
    atom,
    React.useCallback(
      elements => {
        const length = elements.length
        return Array.from(new Array(length)).map(
          (_, key) => [atomFamilyGetter(key), () => removeItem(key)] as const,
        )
      },
      [atomFamilyGetter, removeItem],
    ),
  )
}
