import { useState } from "react"
import MainWindow from "./apps/common/components/MainWindow"
import allApps from "./register-apps"
import Alert from "./apps/common/components/Alert"

const App = () => {
    const [apps, setApps] = useState(allApps)

    return (
        <>
            <Alert />
            <MainWindow apps={apps} setApps={setApps} />
        </>
    )
}

export default App
