import { atomFamily, useAtomCallback, useSelector } from 'jotai/utils.cjs'
import * as jotai from 'jotai'
import * as O from 'optics-ts'
import React, { useMemo } from 'react'
import { SetStateAction } from 'jotai/core/types'

export function useFocus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (optic: O.OpticFor<S>) => O.Prism<S, any, A>,
): jotai.WritableAtom<A | undefined, SetStateAction<A>>

export function useFocus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (optic: O.OpticFor<S>) => O.Traversal<S, any, A>,
): jotai.WritableAtom<Array<A>, SetStateAction<A>>

export function useFocus<S, A>(
  atom: jotai.PrimitiveAtom<S>,
  callback: (
    optic: O.OpticFor<S>,
  ) => O.Lens<S, any, A> | O.Equivalence<S, any, A> | O.Iso<S, any, A>,
): jotai.PrimitiveAtom<A>

export function useFocus<S, A>(
  baseAtom: jotai.PrimitiveAtom<S>,
  callback: (
    optic: O.OpticFor<S>,
  ) =>
    | O.Lens<S, any, A>
    | O.Equivalence<S, any, A>
    | O.Iso<S, any, A>
    | O.Prism<S, any, A>
    | O.Traversal<S, any, A>,
): any {
  return useMemo(() => {
    const focus = callback(O.optic<S>())
    return jotai.atom<A, SetStateAction<A>>(
      atomGetter => {
        const newValue = getValueUsingOptic(focus, atomGetter(baseAtom))
        return newValue
      },
      (_, set, update) => {
        const newValueProducer =
          update instanceof Function
            ? O.modify(focus)(update)
            : O.set(focus)(update)

        set(baseAtom, oldBaseValue => {
          const newValue = newValueProducer(oldBaseValue)
          return newValue
        })
      },
    )
  }, [baseAtom, callback])
}
const getValueUsingOptic = <S, A>(
  focus:
    | O.Lens<S, any, A>
    | O.Equivalence<S, any, A>
    | O.Iso<S, any, A>
    | O.Prism<S, any, A>
    | O.Traversal<S, any, A>,
  bigValue: S,
) => {
  if (focus._tag === 'Traversal') {
    const values = O.collect(focus)(bigValue)
    return values
  } else if (focus._tag === 'Prism') {
    const value = O.preview(focus)(bigValue)
    return value
  } else {
    const value = O.get(focus)(bigValue)
    return value
  }
}

export const useAtomArraySlice = <Element>(
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
        return get(atom)[param]
      },
      param => (_, set, update) => {
        set(atom, superState =>
          update instanceof Function
            ? O.modify(optic(param))(update)(superState)
            : O.set(optic(param))(update)(superState),
        )
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
    React.useMemo(() => {
      return elements => {
        const length = elements.length
        return Array.from(new Array(length)).map(
          (_, key) => [atomFamilyGetter(key), () => removeItem(key)] as const,
        )
      }
    }, [atomFamilyGetter, removeItem]),
    (left, right) => left && left.length === right.length,
  )
}
