import { useState } from "react"
import MainWindow from "./common/MainWindow"
import allApps from "./register-apps"

const App = () => {
    const [apps, setApps] = useState(allApps)

    return (
        <MainWindow apps={apps} setApps={setApps} />
    )
}

export default App
