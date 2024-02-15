import { useEffect, useState } from "react"
import MainWindow from "./common/MainWindow"
import allApps from "./register-apps"
import { useAppSelector } from "./redux/hooks/hooks"
import { selectFileSystem } from "./redux/reducers/fileSystemSlice"

const App = () => {
    const [apps, setApps] = useState(allApps)
    const fileSystem = useAppSelector(selectFileSystem)

    useEffect(() => {
        localStorage.setItem('fileSystem', JSON.stringify(fileSystem))
    }, [fileSystem])
    return (
        <MainWindow apps={apps} setApps={setApps} />
    )
}

export default App
