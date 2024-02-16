import { useEffect, useState } from "react"
import MainWindow from "./common/MainWindow"
import allApps from "./register-apps"
import { useAppSelector } from "./redux/hooks/hooks"
import { selectFileSystem } from "./redux/reducers/fileSystemSlice"
import { selectDisk } from "./redux/reducers/diskSlice"

const App = () => {
    const [apps, setApps] = useState(allApps)
    const fileSystem = useAppSelector(selectFileSystem)
    const disk = useAppSelector(selectDisk)

    useEffect(() => {
        localStorage?.setItem('fileSystem', JSON.stringify(fileSystem))
    }, [fileSystem])

    useEffect(() => {
        localStorage?.setItem('disk', JSON.stringify(disk))
    }, [disk])
    return (
        <MainWindow apps={apps} setApps={setApps} />
    )
}

export default App
