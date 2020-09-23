import { atomFamily } from 'jotai/utils.cjs'
import * as jotai from 'jotai'
import { SetStateAction } from 'jotai/types'
import * as O from 'optics-ts'
import React from 'react'

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
  return jotai.atom(
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
          const typeCastedUpdater = update as (a: A) => A
          return O.modify(focus)(typeCastedUpdater)(superState)
        } else {
          return O.set(focus)(update)(superState)
        }
      })
    },
  )
}

export type RWAtom<T> = jotai.WritableAtom<T, SetStateAction<T>>

export const useAtomArrayFamily = <Element extends any>(
  atom: RWAtom<Array<Element>>,
): Array<RWAtom<Element>> => {
  const atomFamilyGetter = React.useMemo(() => {
    const optic = (i: number) => O.optic<Array<Element>>().index(i)

    return atomFamily<number, Element, SetStateAction<Element>>(
      param => get => {
        // Kindly coercing this from `Element | undefined` to `Element`
        return O.preview(optic(param))(get(atom)) as Element
      },
      param => (_, set, update) => {
        set(atom, superState => {
          if (update instanceof Function) {
            const typeCastedUpdater = update
            return O.modify(optic(param))(typeCastedUpdater)(superState)
          } else {
            return O.set(optic(param))(update)(superState)
          }
        })
      },
    )
  }, [atom])
  const keysAtom = React.useMemo(
    () =>
      jotai.atom(get => {
        return get(atom).length
      }),
    [atom],
  )
  const [elements] = jotai.useAtom(keysAtom)
  const atoms: Array<RWAtom<Element>> = React.useMemo(
    () => [...new Array(elements)].map((_, key) => atomFamilyGetter(key)),
    [elements, atomFamilyGetter],
  ) as Array<RWAtom<Element>>
  return atoms
}
