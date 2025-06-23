import { DockerContainers } from "./screens/DockerContainers";
import "./App.css";
import Navbar from "./components/navbar";

function App() {
  return (
    <div className="min-h-screen">
      <main>
        <Navbar />
        <DockerContainers />
      </main>
    </div>
  );
}

export default App;
