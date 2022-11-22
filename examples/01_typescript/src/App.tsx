import React, { useCallback } from 'react'
import { focusAtom } from 'jotai-optics'
import { useAtomValue, useSetAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { splitAtom } from 'jotai/vanilla/utils'
import { OpticFor } from 'optics-ts'

// Use splitAtom and focusAtom to interactive with fast food price
const basicFoodList = [
  {
    id: 1,
    name: 'cheese burger',
    amount: '1',
    price: 4.89,
    labels: ['meal', 'cheese'],
  },
  {
    id: 2,
    name: 'french fries',
    amount: '1',
    price: 1.79,
    labels: ['snacks'],
  },
  {
    id: 3,
    name: 'southwest salad',
    amount: '1',
    price: 4.79,
    labels: ['appetizer', 'diet'],
  },
]

interface Food {
  id: number
  name: string
  amount: string
  price: number
  labels: string[]
}

const basicFoodListAtom = atom(basicFoodList)

const useFocusAtom = (anAtom: PrimitiveAtom<Food>) => {
  /* 
    focusAtom is all about settting a specific state attribute's value,
    that's why we use `useSetAtom`, the `get` value can obtain
    by `foodAtom` below
  */
  return useSetAtom(
    focusAtom(
      anAtom,
      useCallback((optic: OpticFor<Food>) => optic.prop('amount'), [])
    )
  )
}

const ItemDetail = ({ foodAtom }: { foodAtom: PrimitiveAtom<Food> }) => {
  const food: Food = useAtomValue(foodAtom)
  const setAmount = useFocusAtom(foodAtom)

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event?.target.value)
  }

  return (
    <div
      className="
      w-60 transition bg-gray-600 
      hover:bg-gray-700 max-w-sm rounded 
      overflow-hidden shadow-lg m-5">
      <div className="px-6 py-1 md:py-2">
        <div className="font-bold text-xl capitalize mb-2">{food.name}</div>
        <h3
          className="
          w-full font-bold text-xl text-base inline-block bg-gray-200 rounded-full
          text-sm font-semibold text-gray-600
          ">
          price: ${food.price}
        </h3>
      </div>
      <div className="px-4 py-1 md:py-2">
        <div className="bg-amber-400 rounded">
          <span className="inline-block mt-2 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
            amount
          </span>
          <input
            type="number"
            className="w-10 h-5 rounded text-gray-700 text-center"
            name={food.name}
            placeholder={food.amount}
            value={food.amount}
            min="1"
            max="100"
            onChange={onChangeHandler}
          />
        </div>
      </div>
    </div>
  )
}

const ItemList = ({
  foodListAtom,
}: {
  foodListAtom: PrimitiveAtom<Food[]>
}) => {
  /* 
    use splitAtom instead of split to single object
    inorder to track the atom values
  */
  const foodListAtomAtoms = splitAtom(foodListAtom)
  const foodListAtoms = useAtomValue(foodListAtomAtoms)

  return (
    <div className="flex place-content-center">
      {foodListAtoms.map((foodAtom, id) => {
        /* pass atom as argument to keep tracking values */
        return <ItemDetail key={id} foodAtom={foodAtom} />
      })}
    </div>
  )
}

const Summary = ({ foodListAtom }: { foodListAtom: PrimitiveAtom<Food[]> }) => {
  const initialValue = 0
  const foodList: Array<Food> = useAtomValue(foodListAtom)

  return (
    <div className="h-52 lg:h-40 sm:h-60 bg-gray-300 text-gray-700 flex-initial mx-3 rounded">
      <div className="px-6 lg:py-6">
        <div className="font-bold text-3xl pb-1 mb-2">Summary</div>
        <p className="text-base mb-5">
          <strong>Total Price</strong> :
          {foodList
            .reduce((total, cur) => {
              return total + parseInt(cur.amount, 10) * cur.price
            }, initialValue)
            .toFixed(2)}
        </p>
        <ul className="my-5 flex">
          {foodList.map((food: Food) => {
            return (
              <p
                key={food.id}
                className="bg-gray-700 text-zinc-200 flex-1 inline-block rounded-tr-md rounded-bl-md lg:rounded-full md:h-10 md:py-2 mx-2">
                <strong>{food.name}</strong> : $
                {(parseInt(food.amount, 10) * food.price).toFixed(2)}
              </p>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="App text-zinc-100">
      <ItemList foodListAtom={basicFoodListAtom} />
      <Summary foodListAtom={basicFoodListAtom} />
    </div>
  )
}
