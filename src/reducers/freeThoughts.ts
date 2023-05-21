import State from '../@types/State'
import ThoughtId from '../@types/ThoughtId'
import { ABSOLUTE_TOKEN, EM_TOKEN, HOME_TOKEN, MAX_THOUGHTS, MAX_THOUGHTS_MARGIN } from '../constants'
import globals from '../globals'
import { getAllChildren } from '../selectors/getChildren'
import getDescendantThoughtIds from '../selectors/getDescendantThoughtIds'
import thoughtToPath from '../selectors/thoughtToPath'
import head from '../util/head'
import isAttribute from '../util/isAttribute'
import deleteThought from './deleteThought'

/** Efficiently creates a union set of one or more iterables. */
// See: https://stackoverflow.com/a/41328397/480608
const union = <T>(...iterables: Iterable<T>[]): Set<T> => {
  const set = new Set<T>()
  // eslint-disable-next-line fp/no-loops
  for (const iterable of iterables) {
    // eslint-disable-next-line fp/no-loops
    for (const item of iterable) {
      set.add(item)
    }
  }
  return set
}

/** Frees invisible thoughts from memory when the memory limit is exceeded. Note: May not free any thoughts if all thoughts are expanded. */
const freeThoughts = (state: State) => {
  const expandedIds = Object.values(state.expanded).map(head)
  const preserveSet = union<ThoughtId>(
    [ABSOLUTE_TOKEN, EM_TOKEN, HOME_TOKEN],
    // prevent the last imported thought from being deallocated, as the thought or one of its ancestors needs to stay in memory for the next imported thought
    expandedIds.flatMap(id => [id, ...getAllChildren(state, id)]),
    [...globals.importingPaths.values()].flat(),
    getDescendantThoughtIds(state, EM_TOKEN),
  )

  // iterate over the entire thoughtIndex, deleting thoughts that are no longer visible
  let stateNew = state

  // all thoughts will be updated after each deletion
  let allThoughts = Object.values(state.thoughts.thoughtIndex)

  // eslint-disable-next-line fp/no-loops
  while (allThoughts.length > MAX_THOUGHTS - MAX_THOUGHTS_MARGIN) {
    // find a thought that can be deleted
    const deletableThought = allThoughts.find(
      thought =>
        // do not delete any thought or child of a thought in the preserve set
        !preserveSet.has(thought.id) &&
        !preserveSet.has(thought.parentId) &&
        // do not delete a thought with a missing parent
        state.thoughts.thoughtIndex[thought.parentId] &&
        // do not delete meta attributes, or their descendants
        !isAttribute(thought.value) &&
        !thoughtToPath(state, thought.parentId).some(id => isAttribute(state.thoughts.thoughtIndex[id]?.value)),
    )

    // If all thoughts are preserved, we should bail.
    // This is unlikely to happen, as MAX_THOUGHT_INDEX should usually exceed the number of visible thoughts.
    // In the worst case, this results in continuous attempts until the user collapses some thoughts, but will be throttled by the freeThoughts middleware.
    if (!deletableThought) break

    // delete the thought and all descendants to ensure thoughtIndex is still in integrity
    stateNew = deleteThought(stateNew, {
      thoughtId: deletableThought.id,
      pathParent: thoughtToPath(state, deletableThought.parentId),
      // do not persist deletions; just delete from state
      local: false,
      remote: false,
      // prevent thought from being removed from parent
      orphaned: true,
    })

    // set parent to pending to allow thoughts to be reloaded if they become visible again
    const parentThought = stateNew.thoughts.thoughtIndex[deletableThought.parentId]
    if (parentThought) {
      stateNew = {
        ...stateNew,
        thoughts: {
          ...stateNew.thoughts,
          thoughtIndex: {
            ...stateNew.thoughts.thoughtIndex,
            [deletableThought.parentId]: {
              ...parentThought,
              pending: true,
            },
          },
        },
      }
    }

    // TODO: Why is parent missing?
    // else {
    //   console.warn(
    //     `Deallocated thought ${deletableThought.value} (${deletableThought.id}) parent is missing: ${deletableThought.parentId}`,
    //   )
    // }

    // we do not know how many thoughts were deleted
    allThoughts = Object.values(stateNew.thoughts.thoughtIndex)
  }

  return stateNew
}

export default freeThoughts