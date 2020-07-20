import { RANKED_ROOT } from '../constants'
import { setCursor } from '../reducers'
import { firstVisibleChild } from '../selectors'
import { pathToContext, unroot } from '../util'
import { State } from '../util/initialState'

/** Moves the cursor forward in the cursorHistory. */
const cursorForward = (state: State) => {

  // pop from cursor history
  if (state.cursorHistory.length > 0) {
    const cursorNew = state.cursorHistory[state.cursorHistory.length - 1]
    return setCursor(state, { thoughtsRanked: cursorNew, cursorHistoryPop: true })
  }
  // otherwise move cursor to first child
  else {
    const cursor = state.cursor || RANKED_ROOT

    const firstChild = firstVisibleChild(state, pathToContext(cursor))
    if (!firstChild) return state

    const cursorNew = unroot([...cursor, firstChild])
    return setCursor(state, { thoughtsRanked: cursorNew })
  }
}

export default cursorForward
