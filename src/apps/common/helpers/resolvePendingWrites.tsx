import { CurrentlyServicingPayload } from "../../../apis/disk"

export const resolvePendingWrites = (
    pendingWrites: React.MutableRefObject<
        {
            tasks: {
                id: string
                cb?: () => void
            }[]
            finalCb?: (() => void) | undefined
        }[]
    >,
    currentlyServicing: CurrentlyServicingPayload,
) => {
    const taskGroups = pendingWrites.current
    const taskGroupsToKeep = []
    let tasksToKeep = []
    for (const taskGroup of taskGroups) {
        for (const task of taskGroup.tasks) {
            if (task.id === currentlyServicing.requestId) {
                if (task.cb) {
                    task.cb()
                }
            } else {
                tasksToKeep.push(task)
            }
        }
        if (tasksToKeep.length > 0) {
            taskGroup.tasks = tasksToKeep
            taskGroupsToKeep.push(taskGroup)
            tasksToKeep = []
        } else {
            if (taskGroup.finalCb) {
                taskGroup.finalCb()
            }
        }
    }
    pendingWrites.current = taskGroups
}
