import { useState } from "react"
import {
    decrement,
    increment,
    incrementByAmount,
    incrementAsync,
    selectCount,
} from "../../redux/reducers/counterSlice"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"

export function Counter() {
    const count = useAppSelector(selectCount)
    const dispatch = useAppDispatch()
    const [incrementAmount, setIncrementAmount] = useState<number>(2)

    return (
        <div>
            <div>
                <button
                    aria-label="Increment value"
                    onClick={() => dispatch(increment())}
                >
                    +
                </button>
                <span>{count}</span>
                <button
                    aria-label="Decrement value"
                    onClick={() => dispatch(decrement())}
                >
                    -
                </button>
                <input
                    aria-label="Set increment amount"
                    value={incrementAmount}
                    onChange={(e) => setIncrementAmount(+e.target.value)}
                />
                <button
                    onClick={() =>
                        dispatch(
                            incrementByAmount(incrementAmount),
                        )
                    }
                >
                    Add Amount
                </button>
                <button
                    onClick={() =>
                        dispatch(incrementAsync(incrementAmount))
                    }
                >
                    Add Async
                </button>
            </div>
        </div>
    )
}
